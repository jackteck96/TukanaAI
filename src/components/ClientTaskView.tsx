import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, Clock, AlertCircle, Upload, FileText, Loader2, XCircle, MessageSquare, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Task {
  id: string;
  title: string;
  description: string;
  document_type: string;
  status: string;
  due_date: string;
  created_at: string;
}

interface Document {
  id: string;
  document_type: string;
  status: string;
  file_name: string;
  created_at: string;
  rejection_reason?: string;
  adjustment_comments?: string;
}

interface ClientTaskViewProps {
  processId: string;
  companyId: string;
}

const documentTypes = [
  'RG',
  'CPF',
  'Comprovante de Residência',
  'Certidão de Nascimento',
  'Certidão de Casamento',
  'Procuração',
  'Contrato',
  'Laudo Médico',
  'Receita Médica',
  'Exame Médico',
  'Outros'
];

export default function ClientTaskView({ processId, companyId }: ClientTaskViewProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploaderName, setUploaderName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDocForComments, setSelectedDocForComments] = useState<Document | null>(null);
  const [isCommentsDialogOpen, setIsCommentsDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [processId]);

  const loadData = async () => {
    try {
      // Carregar tarefas
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('process_id', processId)
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;
      setTasks(tasksData || []);

      // Carregar documentos com informações adicionais
      const { data: docsData, error: docsError } = await supabase
        .from('documents')
        .select('id, document_type, status, file_name, created_at, rejection_reason, adjustment_comments')
        .eq('process_id', processId)
        .order('created_at', { ascending: false });

      if (docsError) throw docsError;
      setDocuments(docsData || []);
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar informações');
    } finally {
      setLoading(false);
    }
  };

  const getTaskStatus = (task: Task) => {
    const relatedDocs = documents.filter(doc => doc.document_type === task.document_type);
    
    if (relatedDocs.length === 0) {
      return { status: 'pending', label: 'Pendente', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400', icon: Clock };
    }

    const hasApproved = relatedDocs.some(doc => doc.status === 'Aprovado');
    const hasRejected = relatedDocs.some(doc => doc.status === 'Recusado');
    const hasAdjustment = relatedDocs.some(doc => doc.status === 'Ajuste Necessário');

    if (hasApproved) {
      return { status: 'approved', label: 'Aprovado', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400', icon: CheckCircle };
    }
    if (hasRejected) {
      return { status: 'rejected', label: 'Recusado', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', icon: XCircle };
    }
    if (hasAdjustment) {
      return { status: 'adjustment', label: 'Ajuste Necessário', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400', icon: AlertCircle };
    }

    return { status: 'review', label: 'Em Análise', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400', icon: Clock };
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Verificar se é PDF
      if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
        toast.error('Apenas arquivos PDF são permitidos');
        event.target.value = ''; // Limpar o input
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file || !uploaderName || !selectedTask) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    setIsUploading(true);

    try {
      const fileExtension = file.name.split('.').pop();
      const timestamp = Date.now();
      const sanitizedDocumentType = selectedTask.document_type.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
      const newFileName = `${sanitizedDocumentType}_${timestamp}.${fileExtension}`;
      const filePath = `${processId}/${newFileName}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          process_id: processId,
          company_id: companyId,
          file_name: newFileName,
          file_path: uploadData.path,
          file_type: file.type,
          file_size: file.size,
          document_type: selectedTask.document_type,
          uploaded_by: uploaderName,
          status: 'Pendente'
        });

      if (dbError) throw dbError;

      await supabase.rpc('generate_document_report', { 
        process_uuid: processId 
      });

      toast.success('Documento enviado com sucesso!');
      
      setFile(null);
      setUploaderName('');
      setIsUploadOpen(false);
      setSelectedTask(null);
      
      loadData();
    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error('Erro ao enviar documento. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  };

  const getRelatedDocuments = (documentType: string) => {
    return documents.filter(doc => doc.document_type === documentType);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-3">
            <Loader2 className="h-5 w-5 animate-spin" />
            <p className="text-muted-foreground">Carregando solicitações...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Documentos Solicitados pela Empresa</CardTitle>
          <CardDescription>
            Visualize os documentos que a empresa solicitou e envie-os quando estiver pronto
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                <FileText className="h-12 w-12 text-muted-foreground opacity-50" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Nenhum documento solicitado ainda</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                A empresa ainda não criou solicitações de documentos para este processo. 
                Quando houver documentos solicitados, eles aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => {
                const taskStatus = getTaskStatus(task);
                const StatusIcon = taskStatus.icon;
                const relatedDocs = getRelatedDocuments(task.document_type);

                return (
                  <Card key={task.id} className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground">{task.title}</h3>
                            <Badge className={taskStatus.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {taskStatus.label}
                            </Badge>
                          </div>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              Tipo: {task.document_type}
                            </span>
                            {task.due_date && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Prazo: {format(new Date(task.due_date), "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button 
                          size="sm"
                          onClick={() => {
                            setSelectedTask(task);
                            setIsUploadOpen(true);
                          }}
                          disabled={taskStatus.status === 'approved'}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {relatedDocs.length > 0 ? 'Reenviar' : 'Enviar'}
                        </Button>
                      </div>

                      {relatedDocs.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Documentos enviados:</p>
                          <div className="space-y-2">
                            {relatedDocs.map((doc) => (
                              <div key={doc.id} className="bg-muted/30 p-3 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <FileText className="h-3 w-3 flex-shrink-0" />
                                    <span className="text-xs truncate">{doc.file_name}</span>
                                  </div>
                                  <Badge 
                                    variant="outline" 
                                    className={
                                      doc.status === 'Aprovado' ? 'border-green-500 text-green-700 dark:text-green-400' :
                                      doc.status === 'Recusado' ? 'border-red-500 text-red-700 dark:text-red-400' :
                                      doc.status === 'Ajuste Necessário' ? 'border-yellow-500 text-yellow-700 dark:text-yellow-400' :
                                      'border-blue-500 text-blue-700 dark:text-blue-400'
                                    }
                                  >
                                    {doc.status}
                                  </Badge>
                                </div>
                                
                                {(doc.status === 'Recusado' || doc.status === 'Ajuste Necessário') && 
                                 (doc.rejection_reason || doc.adjustment_comments) && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full mt-2"
                                    onClick={() => {
                                      setSelectedDocForComments(doc);
                                      setIsCommentsDialogOpen(true);
                                    }}
                                  >
                                    <MessageSquare className="h-3 w-3 mr-2" />
                                    Ver observações da empresa
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Documento</DialogTitle>
            <DialogDescription>
              {selectedTask && `Envie o documento: ${selectedTask.document_type}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="uploader">Seu Nome</Label>
              <Input
                id="uploader"
                value={uploaderName}
                onChange={(e) => setUploaderName(e.target.value)}
                placeholder="Digite seu nome"
              />
            </div>

            <div>
              <Label htmlFor="file">Arquivo</Label>
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,application/pdf"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Apenas arquivos PDF são permitidos
              </p>
              {file && (
                <p className="text-sm text-muted-foreground mt-1">
                  <FileText className="h-4 w-4 inline mr-1" />
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleUpload} 
                disabled={!file || !uploaderName || isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Enviar
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Observações */}
      <Dialog open={isCommentsDialogOpen} onOpenChange={setIsCommentsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Observações da Empresa
            </DialogTitle>
            <DialogDescription>
              Arquivo: {selectedDocForComments?.file_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedDocForComments?.status === 'Recusado' && selectedDocForComments?.rejection_reason && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Documento Recusado</AlertTitle>
                <AlertDescription className="mt-2">
                  {selectedDocForComments.rejection_reason}
                </AlertDescription>
              </Alert>
            )}
            
            {selectedDocForComments?.status === 'Ajuste Necessário' && selectedDocForComments?.adjustment_comments && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Ajuste Necessário</AlertTitle>
                <AlertDescription className="mt-2">
                  {selectedDocForComments.adjustment_comments}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end">
              <Button onClick={() => setIsCommentsDialogOpen(false)}>
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
