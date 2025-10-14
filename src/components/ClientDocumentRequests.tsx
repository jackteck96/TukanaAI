import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Upload, FileText, CheckCircle, Clock, AlertCircle, MessageSquare, Info, XCircle } from "lucide-react";

interface DocumentUpload {
  id: string;
  file_path: string;
  file_type: string;
  status: string;
  created_at: string;
}

interface DocumentFromTable {
  id: string;
  file_name: string;
  status: string;
  rejection_reason?: string;
  adjustment_comments?: string;
  created_at: string;
}

interface DocumentRequest {
  id: string;
  document_name: string;
  instructions: string | null;
  required: boolean;
  current_status: string;
  document_uploads?: DocumentUpload[];
  related_documents?: DocumentFromTable[];
}

interface ClientDocumentRequestsProps {
  processId: string;
  companyName?: string;
}

export default function ClientDocumentRequests({ processId, companyName }: ClientDocumentRequestsProps) {
  const [documentRequests, setDocumentRequests] = useState<DocumentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [selectedDocForComments, setSelectedDocForComments] = useState<DocumentFromTable | null>(null);
  const [isCommentsDialogOpen, setIsCommentsDialogOpen] = useState(false);

  useEffect(() => {
    console.log('[ClientDocumentRequests] Montando com processId:', processId);
    loadDocumentRequests();
  }, [processId]);

  const loadDocumentRequests = async () => {
    try {
      setLoading(true);
      
      // Tentar materializar solicitações antes de buscar
      try {
        const { data: preEnsure } = await supabase.functions.invoke('ensure-requests-for-process', {
          body: { processId }
        });
        console.log('[ClientDocumentRequests] Pre-ensure executed. Criados:', preEnsure?.created);
      } catch (e) {
        console.warn('[ClientDocumentRequests] Pre-ensure falhou:', e);
      }
      
      // Buscar documentos da tabela documents para correlacionar status
      const { data: documentsData } = await supabase
        .from('documents')
        .select('id, file_name, document_type, status, rejection_reason, adjustment_comments, created_at')
        .eq('process_id', processId);
      
      console.log('[ClientDocumentRequests] Documentos da tabela documents:', documentsData);
      // Se houver token no link (acesso via convite)
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      if (token) {
        console.log('[ClientDocumentRequests] Usando caminho via token', { token });
        const { data, error } = await supabase.functions.invoke('get-invite-details', {
          body: { token }
        });

        if (error || !data?.success) {
          console.error('Erro ao carregar via convite:', error || data?.error);
          toast.error("Erro ao carregar documentos solicitados");
          return;
        }

        const fromFunction = (data.documentRequests || []).map((req: any) => {
          const relatedDocs = (documentsData || []).filter(
            (doc: any) => doc.document_type === req.document_name
          );
          
          return {
            id: req.id,
            document_name: req.document_name,
            instructions: req.instructions,
            required: req.required,
            current_status: req.current_status,
            document_uploads: (req.document_uploads || []).map((u: any) => ({
              id: u.id,
              file_path: u.file_path,
              file_type: u.file_type,
              status: u.status,
              created_at: u.created_at,
            })),
            related_documents: relatedDocs
          };
        });
        console.log('[ClientDocumentRequests] Carregado via convite, total:', fromFunction.length);

        if (fromFunction.length === 0) {
          console.log('[ClientDocumentRequests] Convite sem document_requests, sincronizando...');
          const { data: ensureData, error: ensureError } = await supabase.functions.invoke('ensure-requests-for-process', {
            body: { processId }
          });
          if (!ensureError && ensureData?.success) {
            const ensured = (ensureData.documentRequests || []).map((req: any) => {
              const relatedDocs = (documentsData || []).filter(
                (doc: any) => doc.document_type === req.document_name
              );
              
              return {
                id: req.id,
                document_name: req.document_name,
                instructions: req.instructions,
                required: req.required,
                current_status: req.current_status,
                document_uploads: (req.document_uploads || []).map((u: any) => ({
                  id: u.id,
                  file_path: u.file_path,
                  file_type: u.file_type,
                  status: u.status,
                  created_at: u.created_at,
                })),
                related_documents: relatedDocs
              };
            });
            setDocumentRequests(ensured as any);
          } else {
            setDocumentRequests(fromFunction as any);
          }
        } else {
          setDocumentRequests(fromFunction as any);
        }
        return;
      }
      
      // Fluxo autenticado
      const { data: fnData, error: fnError } = await supabase.functions.invoke('get-process-requests', {
        body: { processId }
      });

      if (!fnError && fnData?.success) {
        const mapped = (fnData.documentRequests || []).map((req: any) => {
          const relatedDocs = (documentsData || []).filter(
            (doc: any) => doc.document_type === req.document_name
          );
          
          return {
            id: req.id,
            document_name: req.document_name,
            instructions: req.instructions,
            required: req.required,
            current_status: req.current_status,
            document_uploads: (req.document_uploads || []).map((u: any) => ({
              id: u.id,
              file_path: u.file_path,
              file_type: u.file_type,
              status: u.status,
              created_at: u.created_at,
            })),
            related_documents: relatedDocs
          };
        });
        
        console.log('[ClientDocumentRequests] Total via Edge Function:', mapped.length);
        
        if (mapped.length === 0) {
          const { data: ensureData, error: ensureError } = await supabase.functions.invoke('ensure-requests-for-process', {
            body: { processId }
          });
          if (!ensureError && ensureData?.success) {
            const ensured = (ensureData.documentRequests || []).map((req: any) => {
              const relatedDocs = (documentsData || []).filter(
                (doc: any) => doc.document_type === req.document_name
              );
              
              return {
                id: req.id,
                document_name: req.document_name,
                instructions: req.instructions,
                required: req.required,
                current_status: req.current_status,
                document_uploads: (req.document_uploads || []).map((u: any) => ({
                  id: u.id,
                  file_path: u.file_path,
                  file_type: u.file_type,
                  status: u.status,
                  created_at: u.created_at,
                })),
                related_documents: relatedDocs
              };
            });
            setDocumentRequests(ensured as any);
          } else {
            setDocumentRequests(mapped as any);
          }
        } else {
          setDocumentRequests(mapped as any);
        }
      } else {
        // Fallback direto
        const { data, error } = await supabase
          .from('document_requests')
          .select(`
            id,
            document_name,
            instructions,
            required,
            current_status,
            document_uploads!document_uploads_document_request_id_fkey (
              id,
              file_path,
              file_type,
              status,
              created_at
            )
          `)
          .eq('process_id', processId)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Erro ao carregar solicitações (fallback):', error);
          toast.error('Erro ao carregar documentos solicitados');
          return;
        }

        const formattedData = (data || []).map((req: any) => {
          const relatedDocs = (documentsData || []).filter(
            (doc: any) => doc.document_type === req.document_name
          );
          
          return {
            ...req,
            document_uploads: req.document_uploads || [],
            related_documents: relatedDocs
          };
        });

        if (formattedData.length === 0) {
          console.log('[ClientDocumentRequests] Fallback: buscando tasks...');
          const { data: tasksData, error: tasksError } = await supabase
            .from('tasks')
            .select('*')
            .eq('process_id', processId)
            .order('created_at', { ascending: true });

          if (!tasksError && tasksData && tasksData.length > 0) {
            const tasksAsDocs = tasksData.map((task: any) => {
              const relatedDocs = (documentsData || []).filter(
                (doc: any) => doc.document_type === (task.document_type || task.title)
              );
              
              return {
                id: task.id,
                document_name: task.document_type || task.title,
                instructions: task.description,
                required: true,
                current_status: task.status === 'completed' ? 'aprovado' : 'pendente',
                document_uploads: [],
                related_documents: relatedDocs
              };
            });
            setDocumentRequests(tasksAsDocs as any);
          } else {
            setDocumentRequests(formattedData as any);
          }
        } else {
          setDocumentRequests(formattedData as any);
        }
      }

    } catch (err) {
      console.error('Erro inesperado:', err);
      toast.error("Erro ao carregar documentos");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (request: DocumentRequest, file: File) => {
    try {
      setUploadingDocId(request.id);

      // Antes de tudo, garantir que exista um document_request real para este documento
      try {
        const { data: ensureData, error: ensureError } = await supabase.functions.invoke('ensure-requests-for-process', {
          body: { processId }
        });
        if (ensureError) {
          console.warn('[ClientDocumentRequests] ensure-requests-for-process falhou antes do upload:', ensureError);
        } else {
          console.log('[ClientDocumentRequests] ensure-requests-for-process OK antes do upload:', ensureData?.created);
        }
      } catch (e) {
        console.warn('[ClientDocumentRequests] ensure-requests-for-process erro inesperado:', e);
      }

      // Resolver o ID do document_request: se o ID atual não existir, buscar por nome
      let documentRequestId = request.id;
      const { data: existingReq } = await supabase
        .from('document_requests')
        .select('id')
        .eq('id', request.id)
        .maybeSingle();

      if (!existingReq) {
        const { data: byName } = await supabase
          .from('document_requests')
          .select('id')
          .eq('process_id', processId)
          .eq('document_name', request.document_name)
          .maybeSingle();
        if (byName?.id) {
          documentRequestId = byName.id as string;
        }
      }

      // Upload para o storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${processId}/${documentRequestId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Erro no upload:', uploadError);
        toast.error("Erro ao fazer upload do arquivo");
        return;
      }

      // Obter dados do perfil para company_id e client info
      const { data: profileData } = await supabase
        .from('profiles')
        .select('company_id, email')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      const { data: processData } = await supabase
        .from('processes')
        .select('company_id, client_email')
        .eq('id', processId)
        .single();

      // Registrar upload no banco
      const { error: dbError } = await supabase
        .from('document_uploads')
        .insert({
          process_id: processId,
          document_request_id: documentRequestId,
          company_id: processData?.company_id || profileData?.company_id,
          client_email: processData?.client_email || profileData?.email,
          file_path: fileName,
          file_type: file.type,
          file_size: file.size,
          status: 'enviado'
        });

      if (dbError) {
        console.error('Erro ao registrar upload:', dbError);
        toast.error("Erro ao registrar documento");
        return;
      }

      toast.success("Documento enviado com sucesso!");
      loadDocumentRequests(); // Recarregar lista
    } catch (err) {
      console.error('Erro inesperado no upload:', err);
      toast.error("Erro ao enviar documento");
    } finally {
      setUploadingDocId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'aprovado':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'enviado':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'pendente':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      default:
        return <FileText className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pendente: "outline",
      enviado: "secondary",
      aprovado: "default",
      rejeitado: "destructive",
    };
    
    return (
      <Badge variant={variants[status.toLowerCase()] || "outline"}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Carregando documentos solicitados...</p>
        </CardContent>
      </Card>
    );
  }

  if (documentRequests.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Nenhum documento solicitado ainda.</p>
        </CardContent>
      </Card>
    );
  }

  const allRequiredUploaded = documentRequests
    .filter(req => req.required)
    .every(req => req.document_uploads && req.document_uploads.length > 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Documentos Solicitados</CardTitle>
          <CardDescription>
            {companyName ? `Solicitados por ${companyName}` : 'Faça upload dos documentos necessários'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {documentRequests.map((request) => (
            <Card key={request.id} className="border-l-4 border-l-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(request.current_status)}
                      <h3 className="font-semibold">{request.document_name}</h3>
                      {request.required && (
                        <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
                      )}
                      {getStatusBadge(request.current_status)}
                    </div>
                    
                    {request.instructions && (
                      <p className="text-sm text-muted-foreground">{request.instructions}</p>
                    )}

                    {request.related_documents && request.related_documents.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm font-medium">Documentos enviados:</p>
                        {request.related_documents.map((doc) => (
                          <div key={doc.id} className="bg-muted/30 p-3 rounded-lg space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 text-sm flex-1 min-w-0">
                                <FileText className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{doc.file_name}</span>
                              </div>
                              <Badge 
                                variant="outline"
                                className={
                                  doc.status === 'Aprovado' ? 'border-green-500 text-green-700 dark:text-green-400 flex-shrink-0' :
                                  doc.status === 'Recusado' ? 'border-red-500 text-red-700 dark:text-red-400 flex-shrink-0' :
                                  doc.status === 'Ajuste Necessário' ? 'border-yellow-500 text-yellow-700 dark:text-yellow-400 flex-shrink-0' :
                                  'border-blue-500 text-blue-700 dark:text-blue-400 flex-shrink-0'
                                }
                              >
                                {doc.status}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Enviado em {new Date(doc.created_at).toLocaleDateString('pt-BR', { 
                                day: '2-digit', 
                                month: '2-digit', 
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                            
                            {(doc.status === 'Recusado' || doc.status === 'Ajuste Necessário') && 
                             (doc.rejection_reason || doc.adjustment_comments) && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full mt-2 border-orange-500 text-orange-700 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-950/50"
                                onClick={() => {
                                  setSelectedDocForComments(doc);
                                  setIsCommentsDialogOpen(true);
                                }}
                              >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Ver o que foi solicitado
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {request.document_uploads && request.document_uploads.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Histórico de envios:</p>
                        {request.document_uploads.map((upload) => (
                          <div key={upload.id} className="flex items-center gap-2 text-xs bg-muted/20 p-2 rounded">
                            <Clock className="w-3 h-3" />
                            <span className="flex-1">
                              {new Date(upload.created_at).toLocaleDateString('pt-BR')}
                            </span>
                            <Badge variant="outline" className="text-xs">{upload.status}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor={`file-${request.id}`} className="cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          disabled={uploadingDocId === request.id}
                          asChild
                        >
                          <span>
                            <Upload className="w-4 h-4 mr-2" />
                            {request.document_uploads && request.document_uploads.length > 0 ? 'Reenviar' : 'Enviar'}
                          </span>
                        </Button>
                      </div>
                    </Label>
                    <Input
                      id={`file-${request.id}`}
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 10 * 1024 * 1024) {
                            toast.error("Arquivo muito grande. Máximo de 10MB");
                            return;
                          }
                          handleFileUpload(request, file);
                        }
                      }}
                      disabled={uploadingDocId === request.id}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      {allRequiredUploaded && (
        <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-semibold text-green-900 dark:text-green-100">
                  Todos os documentos obrigatórios foram enviados!
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Aguarde a análise da empresa.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
    </div>
  );
}
