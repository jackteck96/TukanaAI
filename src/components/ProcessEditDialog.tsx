import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Trash2, 
  Plus, 
  FileText, 
  AlertTriangle,
  Calendar,
  User,
  Settings
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProcessEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  processId: string;
  onProcessUpdated: () => void;
  onProcessDeleted: () => void;
}

interface Document {
  id: string;
  file_name: string;
  document_type: string;
  status: string;
  created_at: string;
}

interface DocumentType {
  id: string;
  name: string;
}

const ProcessEditDialog = ({ 
  isOpen, 
  onClose, 
  processId, 
  onProcessUpdated,
  onProcessDeleted 
}: ProcessEditDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [processData, setProcessData] = useState<any>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [newDocumentType, setNewDocumentType] = useState('');
  const [showDeleteProcessDialog, setShowDeleteProcessDialog] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    project_name: '',
    client_name: '',
    client_email: '',
    cpf_cnpj: '',
    process_type: '',
    description: '',
    status: '',
    priority: '',
    due_date: ''
  });

  useEffect(() => {
    if (isOpen && processId) {
      fetchProcessData();
      fetchDocuments();
      fetchDocumentTypes();
    }
  }, [isOpen, processId]);

  const fetchProcessData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('processes')
        .select('*')
        .eq('id', processId)
        .single();

      if (error) throw error;

      setProcessData(data);
      setFormData({
        project_name: data.project_name || '',
        client_name: data.client_name || '',
        client_email: data.client_email || '',
        cpf_cnpj: data.cpf_cnpj || '',
        process_type: data.process_type || '',
        description: data.description || '',
        status: data.status || '',
        priority: data.priority || '',
        due_date: data.due_date ? data.due_date.split('T')[0] : ''
      });
    } catch (error) {
      console.error('Error fetching process:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do processo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('id, file_name, document_type, status, created_at')
        .eq('process_id', processId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const fetchDocumentTypes = async () => {
    try {
      // Buscar tipos de documento globais e da empresa
      const { data: globalTypes } = await supabase
        .from('global_document_types')
        .select('id, name');

      const { data: companyTypes } = await supabase
        .from('document_types')
        .select('id, name');

      const allTypes = [
        ...(globalTypes || []),
        ...(companyTypes || [])
      ];

      setDocumentTypes(allTypes);
    } catch (error) {
      console.error('Error fetching document types:', error);
    }
  };

  const handleUpdateProcess = async () => {
    if (!formData.client_name || !formData.client_email || !formData.process_type) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const updateData: any = {
        ...formData,
        due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('processes')
        .update(updateData)
        .eq('id', processId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Processo atualizado com sucesso",
      });

      onProcessUpdated();
    } catch (error) {
      console.error('Error updating process:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar processo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddDocumentRequest = async () => {
    if (!newDocumentType.trim()) {
      toast({
        title: "Erro",
        description: "Selecione um tipo de documento",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Criar um "documento" pendente para solicitar ao cliente
      const { error } = await supabase
        .from('documents')
        .insert({
          process_id: processId,
          company_id: processData.company_id,
          document_type: newDocumentType,
          file_name: `Solicitação: ${newDocumentType}`,
          file_path: '', // Vazio pois ainda não foi enviado
          file_size: 0,
          file_type: 'request',
          status: 'Pendente',
          uploaded_by: 'Sistema'
        });

      if (error) throw error;

      setNewDocumentType('');
      fetchDocuments();
      
      toast({
        title: "Sucesso",
        description: "Solicitação de documento adicionada",
      });

    } catch (error) {
      console.error('Error adding document request:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar solicitação de documento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;

      fetchDocuments();
      setDocumentToDelete(null);
      
      toast({
        title: "Sucesso",
        description: "Documento removido com sucesso",
      });

    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover documento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProcess = async () => {
    try {
      setLoading(true);
      
      // Primeiro, deletar todos os documentos relacionados
      await supabase
        .from('documents')
        .delete()
        .eq('process_id', processId);

      // Depois, deletar o processo
      const { error } = await supabase
        .from('processes')
        .delete()
        .eq('id', processId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Processo excluído com sucesso",
      });

      onProcessDeleted();
      onClose();
      
    } catch (error) {
      console.error('Error deleting process:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir processo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Aprovado":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "Pendente":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400";
      case "Rejeitado":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (loading && !processData) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center h-96">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Editar Processo
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Informações Básicas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Informações Básicas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="project_name">Nome do Projeto</Label>
                    <Input
                      id="project_name"
                      value={formData.project_name}
                      onChange={(e) => setFormData({...formData, project_name: e.target.value})}
                      placeholder="Digite o nome do projeto"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client_name">Nome do Cliente</Label>
                    <Input
                      id="client_name"
                      value={formData.client_name}
                      onChange={(e) => setFormData({...formData, client_name: e.target.value})}
                      placeholder="Digite o nome do cliente"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client_email">Email do Cliente</Label>
                    <Input
                      id="client_email"
                      type="email"
                      value={formData.client_email}
                      onChange={(e) => setFormData({...formData, client_email: e.target.value})}
                      placeholder="Digite o email do cliente"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpf_cnpj">CPF/CNPJ</Label>
                    <Input
                      id="cpf_cnpj"
                      value={formData.cpf_cnpj}
                      onChange={(e) => setFormData({...formData, cpf_cnpj: e.target.value})}
                      placeholder="Digite o CPF ou CNPJ"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="process_type">Tipo de Processo</Label>
                    <Select
                      value={formData.process_type}
                      onValueChange={(value) => setFormData({...formData, process_type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="abertura_empresa">Abertura de Empresa</SelectItem>
                        <SelectItem value="alteracao_contratual">Alteração Contratual</SelectItem>
                        <SelectItem value="due_diligence">Due Diligence</SelectItem>
                        <SelectItem value="consultoria_juridica">Consultoria Jurídica</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({...formData, status: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Em andamento">Em andamento</SelectItem>
                        <SelectItem value="Pendente">Pendente</SelectItem>
                        <SelectItem value="Concluído">Concluído</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Prioridade</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => setFormData({...formData, priority: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a prioridade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Alta">Alta</SelectItem>
                        <SelectItem value="Média">Média</SelectItem>
                        <SelectItem value="Baixa">Baixa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="due_date">Prazo</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Digite a descrição do processo"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Gerenciar Documentos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Gerenciar Documentos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Adicionar Nova Solicitação */}
                <div className="flex flex-col sm:flex-row items-end gap-2">
                  <div className="flex-1 w-full space-y-2">
                    <Label htmlFor="newDocType">Solicitar Novo Documento</Label>
                    <Select
                      value={newDocumentType}
                      onValueChange={setNewDocumentType}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um tipo de documento" />
                      </SelectTrigger>
                      <SelectContent>
                        {documentTypes.map((type) => (
                          <SelectItem key={type.id} value={type.name}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddDocumentRequest} disabled={loading}>
                    <Plus className="h-4 w-4 mr-2" />
                    Solicitar
                  </Button>
                </div>

                <Separator />

                {/* Lista de Documentos */}
                <div className="space-y-2">
                  <h4 className="font-medium">Documentos do Processo ({documents.length})</h4>
                  {documents.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      Nenhum documento encontrado
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium text-sm">{doc.document_type}</p>
                              <p className="text-xs text-muted-foreground">{doc.file_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(doc.status)}>
                              {doc.status}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDocumentToDelete(doc.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Zona de Perigo */}
            <Card className="border-red-200 dark:border-red-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  Zona de Perigo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Excluir Processo</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Esta ação excluirá permanentemente o processo e todos os documentos relacionados. 
                      Esta ação não pode ser desfeita.
                    </p>
                    <Button 
                      variant="destructive"
                      onClick={() => setShowDeleteProcessDialog(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir Processo
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateProcess} disabled={loading}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação - Excluir Processo */}
      <AlertDialog open={showDeleteProcessDialog} onOpenChange={setShowDeleteProcessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Processo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este processo? Esta ação excluirá permanentemente 
              o processo e todos os documentos relacionados. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProcess}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir Processo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Confirmação - Excluir Documento */}
      <AlertDialog open={!!documentToDelete} onOpenChange={() => setDocumentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Documento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este documento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => documentToDelete && handleDeleteDocument(documentToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir Documento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ProcessEditDialog;