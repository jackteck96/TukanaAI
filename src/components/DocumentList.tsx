import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FileText, Download, Eye, Clock, CheckCircle, XCircle, Check, X, MessageSquare, Plus, Info, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import DocumentActionDialog from './DocumentActionDialog';
import { TemplateSelector } from './TemplateSelector';
import { TemplateEditor } from './TemplateEditor';
import DocumentUpload from './DocumentUpload';
import DocumentPreviewModal from './DocumentPreviewModal';
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
  rejection_reason?: string;
  adjustment_comments?: string;
}

interface DocumentListProps {
  processId: string;
  refreshKey?: number;
}

import { updateProcessProgress as updateProgress } from '@/utils/processProgressUpdater';

export default function DocumentList({ processId, refreshKey = 0 }: DocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [hasCompanyPermission, setHasCompanyPermission] = useState<boolean>(false);
  const [processData, setProcessData] = useState<any>(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
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
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [selectedDocForComments, setSelectedDocForComments] = useState<Document | null>(null);
  const [isCommentsDialogOpen, setIsCommentsDialogOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      await loadProcessData();
      await loadUserRole();
      loadDocuments();
    };
    loadData();
  }, [processId, refreshKey, user]);

  // Recalcular permissões quando os dados do processo mudarem
  useEffect(() => {
    if (user && processData) {
      console.log('[DocumentList] Recalculando permissões. ProcessData:', processData);
      loadUserRole();
    }
  }, [processData?.company_id, user?.id]);
  const loadProcessData = async () => {
    try {
      const { data, error } = await supabase
        .from('processes')
        .select('client_name, client_email, cpf_cnpj, project_name, company_id')
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
    console.log('[DocumentList] loadUserRole chamado. User:', user.id, 'ProcessData:', processData);
    try {
      const [profileRes, rolesRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('role, company_id')
          .eq('id', user.id)
          .maybeSingle(),
        supabase
          .from('user_roles')
          .select('role, company_id')
          .eq('user_id', user.id)
      ]);

      if (profileRes.error) throw profileRes.error;
      const profile = profileRes.data as { role: string | null; company_id: string | null } | null;
      console.log('[DocumentList] Profile data:', profile);
      setUserRole(profile?.role ?? null);
      setCompanyId(profile?.company_id ?? null);

      if (rolesRes.error) {
        console.warn('[DocumentList] Falha ao carregar user_roles:', rolesRes.error);
      }
      const roles = (rolesRes.data as Array<{ role: string; company_id: string | null }>) || [];
      console.log('[DocumentList] User roles:', roles);
      const procCompany = processData?.company_id ?? null;
      console.log('[DocumentList] Process company_id:', procCompany);
      let hasPerm = roles.some(r => (r.role === 'company_admin' || r.role === 'company_collaborator') && (
        procCompany ? r.company_id === procCompany : true
      ));
      console.log('[DocumentList] hasCompanyPermission (roles) calculado:', hasPerm);

      // Validação via RPC (fonte da verdade no banco)
      if (user && procCompany) {
        const rpcRes = await supabase.rpc('can_manage_company', { user_uuid: user.id, comp_id: procCompany });
        if (rpcRes.error) {
          console.warn('[DocumentList] RPC can_manage_company error:', rpcRes.error);
        } else {
          hasPerm = !!rpcRes.data;
          console.log('[DocumentList] hasCompanyPermission (rpc) calculado:', hasPerm);
        }
      }
      setHasCompanyPermission(hasPerm);
    } catch (error) {
      console.error('Erro ao carregar role do usuário:', error);
    }
  };

  const updateProcessProgress = async () => {
    try {
      await updateProgress(processId);
    } catch (error) {
      console.error('Erro ao atualizar progresso do processo:', error);
    }
  };

  const loadDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('id, file_name, file_path, file_type, file_size, document_type, uploaded_by, status, created_at, rejection_reason, adjustment_comments')
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

      console.debug('[DocumentList] Visualizar via Blob:', filePath);

      // Baixa o arquivo como Blob e abre em nova aba via URL local
      const { data, error } = await supabase.storage
        .from('documents')
        .download(filePath);

      if (error) throw error;
      if (!data) throw new Error('Arquivo não encontrado');

      const blobUrl = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.target = '_blank';
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch (error) {
      console.error('Erro ao visualizar:', error);
      toast.error('Erro ao visualizar arquivo. Verifique se o arquivo existe.');
    }
  };

  const updateDocumentStatus = async (documentId: string, newStatus: string) => {
    try {
      // Buscar informações completas do documento e processo antes de atualizar
      const { data: doc } = await supabase
        .from('documents')
        .select('document_type, file_name, process_id')
        .eq('id', documentId)
        .single();

      const { error } = await supabase
        .from('documents')
        .update({ status: newStatus })
        .eq('id', documentId);

      if (error) throw error;

      // Atualizar também o status da solicitação correspondente
      if (doc?.document_type) {
        const requestStatus = newStatus === 'Aprovado' ? 'aprovado' : 'enviado';
        await supabase
          .from('document_requests')
          .update({ current_status: requestStatus })
          .eq('process_id', processId)
          .eq('document_name', doc.document_type);
      }

      // Se aprovado, criar notificação para o cliente
      if (newStatus === 'Aprovado' && doc) {
        try {
          const { data: processData } = await supabase
            .from('processes')
            .select('client_email, company_id')
            .eq('id', processId)
            .single();

          if (processData) {
            await supabase
              .from('client_notifications')
              .insert({
                process_id: processId,
                document_id: documentId,
                client_email: processData.client_email,
                company_id: processData.company_id,
                notification_type: 'document_approved',
                title: `Documento aprovado: ${doc.file_name}`,
                message: `Seu documento "${doc.file_name}" foi aprovado pela empresa.`
              });
          }
        } catch (notifError) {
          console.error('Erro ao criar notificação:', notifError);
        }
      }

      toast.success(`Documento ${newStatus.toLowerCase()} com sucesso`);
      await updateProcessProgress();
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

  const handleDialogConfirm = async () => {
    await updateProcessProgress();
    loadDocuments(); // Recarregar lista após ação
  };

  // Verificar se o usuário pode gerenciar documentos
  const canManageDocuments = hasCompanyPermission || 
    ['admin', 'lawyer', 'staff'].includes(userRole || '');
  
  console.log('[DocumentList] Render - canManageDocuments:', canManageDocuments, 'hasCompanyPermission:', hasCompanyPermission, 'userRole:', userRole);

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

  const handleTemplateSelected = (template: any) => {
    setSelectedTemplate(template);
    setShowTemplateSelector(false);
    setShowTemplateEditor(true);
  };

  const handleDocumentCreated = () => {
    loadDocuments();
    setSelectedTemplate(null);
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
              className="flex items-center justify-between p-4 border rounded-lg bg-gradient-card gap-4"
            >
              <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3 mb-2">
                  <FileText className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium break-words line-clamp-2">{doc.file_name}</h4>
                    <p className="text-sm text-muted-foreground break-words line-clamp-1">
                      {doc.document_type} • {(doc.file_size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  {(['Ajustes Solicitados', 'Ajuste Necessário'].includes(doc.status)) ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-warning border-warning/30 hover:bg-warning/10 flex-shrink-0"
                      onClick={() => {
                        setSelectedDocForComments(doc);
                        setIsCommentsDialogOpen(true);
                      }}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Ajustes Solicitados
                    </Button>
                  ) : (
                    <Badge className={getStatusColor(doc.status)}>
                      {getStatusIcon(doc.status)}
                      {doc.status}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Enviado por: {doc.uploaded_by}</span>
                  <span>Em: {new Date(doc.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
                
                {/* Mostrar botão de observações quando há ajustes ou rejeição */}
                {(doc.status === 'Recusado' || doc.status === 'Ajuste Necessário') && 
                 (doc.rejection_reason || doc.adjustment_comments) && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 border-orange-500 text-orange-700 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-950/50"
                    onClick={() => {
                      setSelectedDocForComments(doc);
                      setIsCommentsDialogOpen(true);
                    }}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Ver ajustes solicitados
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPreviewDoc(doc)}
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
                {canManageDocuments && (
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

      {/* Template Editor */}
      {companyId && (
        <TemplateEditor
          open={showTemplateEditor}
          onOpenChange={setShowTemplateEditor}
          template={selectedTemplate}
          processId={processId}
          processData={processData}
          companyId={companyId}
          onDocumentCreated={handleDocumentCreated}
        />
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <DocumentPreviewModal
          open={!!previewDoc}
          onOpenChange={(open) => {
            if (!open) setPreviewDoc(null);
          }}
          document={{
            id: previewDoc.id,
            file_name: previewDoc.file_name,
            file_path: previewDoc.file_path,
            file_type: previewDoc.file_type,
          }}
          onApprove={(id) => {
            handleApprove(id);
            setPreviewDoc(null);
          }}
          onReject={(id, name) => {
            setPreviewDoc(null);
            handleReject(id, name);
          }}
          onRequestAdjustment={(id, name) => {
            setPreviewDoc(null);
            handleRequestAdjustment(id, name);
          }}
          onDownload={(path, name) => handleDownload(path, name)}
        />
      )}

      {/* Upload Dialog */}
      <DocumentUpload
        processId={processId}
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        onUploadComplete={loadDocuments}
      />

      {/* Dialog de Observações */}
      <Dialog open={isCommentsDialogOpen} onOpenChange={setIsCommentsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Observações do Documento
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
                <AlertTitle>Ajustes Solicitados</AlertTitle>
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