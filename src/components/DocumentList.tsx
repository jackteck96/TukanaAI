import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Eye, Clock, CheckCircle, XCircle, Check, X, MessageSquare, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import DocumentActionDialog from './DocumentActionDialog';
import { TemplateSelector } from './TemplateSelector';
import DocumentUpload from './DocumentUpload';

interface Document {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  document_type: string;
  uploaded_by: string;
  status: string;
  created_at: string;
}

interface DocumentListProps {
  processId: string;
  refreshKey?: number;
}

export default function DocumentList({ processId, refreshKey = 0 }: DocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [processData, setProcessData] = useState<any>(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    action: 'reject' | 'request_adjustment';
    documentId: string;
    documentName: string;
  }>({
    isOpen: false,
    action: 'reject',
    documentId: '',
    documentName: ''
  });
  const { user } = useAuth();

  useEffect(() => {
    loadDocuments();
    loadUserRole();
    loadProcessData();
  }, [processId, refreshKey, user]);

  const loadProcessData = async () => {
    try {
      const { data, error } = await supabase
        .from('processes')
        .select('client_email, company_id')
        .eq('id', processId)
        .single();
      
      if (error) throw error;
      setProcessData(data);
    } catch (error) {
      console.error('Erro ao carregar dados do processo:', error);
    }
  };

  const loadUserRole = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, company_id')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      setUserRole(data.role);
      setCompanyId(data.company_id);
    } catch (error) {
      console.error('Erro ao carregar role do usuário:', error);
    }
  };

  const loadDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('process_id', processId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setDocuments(data || []);
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
      toast.error('Erro ao carregar documentos');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Aprovado':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'Rejeitado':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-warning" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Aprovado':
        return 'bg-success/10 text-success border-success/20';
      case 'Rejeitado':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'Ajustes Solicitados':
        return 'bg-warning/10 text-warning border-warning/20';
      default:
        return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(filePath);

      if (error) throw error;

      // Criar URL para download
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Download iniciado');
    } catch (error) {
      console.error('Erro no download:', error);
      toast.error('Erro ao fazer download do arquivo');
    }
  };

  const handleView = async (filePath: string) => {
    try {
      if (!filePath) {
        toast.error('Caminho do arquivo não encontrado');
        return;
      }

      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(filePath, 3600); // 1 hora de validade

      if (error) throw error;

      if (!data?.signedUrl) {
        toast.error('Não foi possível gerar URL do arquivo');
        return;
      }

      window.open(data.signedUrl, '_blank');
    } catch (error) {
      console.error('Erro ao visualizar:', error);
      toast.error('Erro ao visualizar arquivo. Verifique se o arquivo existe.');
    }
  };

  const updateDocumentStatus = async (documentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({ status: newStatus })
        .eq('id', documentId);

      if (error) throw error;

      toast.success(`Documento ${newStatus.toLowerCase()} com sucesso`);
      loadDocuments(); // Recarregar lista
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status do documento');
    }
  };

  const handleApprove = (documentId: string) => {
    updateDocumentStatus(documentId, 'Aprovado');
  };

  const handleReject = (documentId: string, documentName: string) => {
    setDialogState({
      isOpen: true,
      action: 'reject',
      documentId,
      documentName
    });
  };

  const handleRequestAdjustment = (documentId: string, documentName: string) => {
    setDialogState({
      isOpen: true,
      action: 'request_adjustment',
      documentId,
      documentName
    });
  };

  const closeDialog = () => {
    setDialogState({
      isOpen: false,
      action: 'reject',
      documentId: '',
      documentName: ''
    });
  };

  const handleDialogConfirm = () => {
    loadDocuments(); // Recarregar lista após ação
  };

  // Verificar se o usuário pode gerenciar documentos (não é cliente)
  const canManageDocuments = userRole && userRole !== 'client';

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Carregando documentos...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleTemplateSelected = async (template: any) => {
    // Generate document from template and upload
    toast.success(`Modelo "${template.title}" selecionado. Gerando documento...`);
    // Here you would generate the document with process data
    // and upload it to the process
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documentos do Processo
              </CardTitle>
              <CardDescription>
                {documents.length} documento(s) anexado(s)
              </CardDescription>
            </div>
            {canManageDocuments && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTemplateSelector(true)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Gerar de Modelo
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setShowUploadDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
      <CardContent className="space-y-4">
        {documents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum documento enviado ainda</p>
          </div>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-4 border rounded-lg bg-gradient-card"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <h4 className="font-medium">{doc.file_name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {doc.document_type} • {(doc.file_size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Enviado por: {doc.uploaded_by}</span>
                  <span>Em: {new Date(doc.created_at).toLocaleDateString('pt-BR')}</span>
                  <Badge className={getStatusColor(doc.status)}>
                    {getStatusIcon(doc.status)}
                    {doc.status}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleView(doc.file_path)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownload(doc.file_path, doc.file_name)}
                >
                  <Download className="h-4 w-4" />
                </Button>
                
                {/* Botões de aprovação/rejeição apenas para funcionários da empresa */}
                {canManageDocuments && doc.status === 'Pendente' && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleApprove(doc.id)}
                      className="text-success hover:bg-success/10"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(doc.id, doc.file_name)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRequestAdjustment(doc.id, doc.file_name)}
                      className="text-warning hover:bg-warning/10"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
      
        {/* Dialog para rejeição/ajustes */}
        {processData && companyId && (
          <DocumentActionDialog
            isOpen={dialogState.isOpen}
            onClose={closeDialog}
            onConfirm={handleDialogConfirm}
            documentId={dialogState.documentId}
            processId={processId}
            clientEmail={processData.client_email}
            companyId={companyId}
            action={dialogState.action}
            documentName={dialogState.documentName}
          />
        )}
      </Card>

      {/* Template Selector */}
      {companyId && (
        <TemplateSelector
          open={showTemplateSelector}
          onOpenChange={setShowTemplateSelector}
          processData={processData}
          companyId={companyId}
          onTemplateSelected={handleTemplateSelected}
        />
      )}

      {/* Upload Dialog */}
      {showUploadDialog && (
        <DocumentUpload
          processId={processId}
          onUploadComplete={() => {
            setShowUploadDialog(false);
            loadDocuments();
          }}
        />
      )}
    </>
  );
}