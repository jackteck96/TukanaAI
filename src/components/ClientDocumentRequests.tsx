import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, FileText, CheckCircle, Clock, AlertCircle } from "lucide-react";

interface DocumentUpload {
  id: string;
  file_path: string;
  file_type: string;
  status: string;
  created_at: string;
}

interface DocumentRequest {
  id: string;
  document_name: string;
  instructions: string | null;
  required: boolean;
  current_status: string;
  document_uploads?: DocumentUpload[];
}

interface ClientDocumentRequestsProps {
  processId: string;
  companyName?: string;
}

export default function ClientDocumentRequests({ processId, companyName }: ClientDocumentRequestsProps) {
  const [documentRequests, setDocumentRequests] = useState<DocumentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);

  useEffect(() => {
    loadDocumentRequests();
  }, [processId]);

  const loadDocumentRequests = async () => {
    try {
      setLoading(true);
      
      // Se houver token no link (acesso via convite), usar a edge function pública
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      if (token) {
        const { data, error } = await supabase.functions.invoke('get-invite-details', {
          body: { token }
        });

        if (error || !data?.success) {
          console.error('Erro ao carregar via convite:', error || data?.error);
          toast.error("Erro ao carregar documentos solicitados");
        } else {
          const fromFunction = (data.documentRequests || []).map((req: any) => ({
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
            }))
          }));
          setDocumentRequests(fromFunction as any);
        }
        return;
      }
      
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
        console.error('Erro ao carregar solicitações:', error);
        toast.error("Erro ao carregar documentos solicitados");
        return;
      }

      const formattedData = (data || []).map((req: any) => ({
        ...req,
        document_uploads: req.document_uploads || []
      }));

      setDocumentRequests(formattedData as any);
    } catch (err) {
      console.error('Erro inesperado:', err);
      toast.error("Erro ao carregar documentos");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (documentRequestId: string, file: File) => {
    try {
      setUploadingDocId(documentRequestId);

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

                    {request.document_uploads && request.document_uploads.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm font-medium">Documentos enviados:</p>
                        {request.document_uploads.map((upload) => (
                          <div key={upload.id} className="flex items-center gap-2 text-sm bg-muted p-2 rounded">
                            <FileText className="w-4 h-4" />
                            <span className="flex-1">
                              Enviado em {new Date(upload.created_at).toLocaleDateString('pt-BR')}
                            </span>
                            {getStatusBadge(upload.status)}
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
                          handleFileUpload(request.id, file);
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
    </div>
  );
}
