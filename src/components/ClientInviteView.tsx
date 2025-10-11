import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DocumentRequest {
  id: string;
  document_name: string;
  instructions: string | null;
  required: boolean;
  current_status: string;
  document_uploads?: any[];
}

interface ClientInviteViewProps {
  processData: any;
  companyData: any;
  documentRequests: DocumentRequest[];
  onUploadSuccess: () => void;
  inviteToken: string;
}

export default function ClientInviteView({
  processData,
  companyData,
  documentRequests,
  onUploadSuccess,
  inviteToken,
}: ClientInviteViewProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState<string | null>(null);

  const handleFileUpload = async (requestId: string, file: File) => {
    if (!file) return;

    setUploading(requestId);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const fileExt = file.name.split('.').pop();
      const fileName = `${processData.id}/${requestId}/${Date.now()}.${fileExt}`;

      // Upload para o storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Registrar o upload no banco
      const { error: dbError } = await supabase
        .from('document_uploads')
        .insert({
          process_id: processData.id,
          document_request_id: requestId,
          company_id: processData.company_id,
          client_id: user.id,
          client_email: user.email,
          file_path: fileName,
          file_size: file.size,
          file_type: file.type,
          status: 'enviado',
        });

      if (dbError) throw dbError;

      toast({
        title: "Documento enviado!",
        description: "O arquivo foi enviado com sucesso.",
      });

      onUploadSuccess();
    } catch (error: any) {
      console.error('Erro ao enviar documento:', error);
      toast({
        title: "Erro ao enviar",
        description: error.message || "Não foi possível enviar o arquivo.",
        variant: "destructive",
      });
    } finally {
      setUploading(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'enviado':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'aprovado':
        return <CheckCircle className="h-4 w-4 text-green-700" />;
      case 'reprovado':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pendente: "outline",
      enviado: "secondary",
      aprovado: "default",
      reprovado: "destructive",
    };
    return (
      <Badge variant={variants[status] || "outline"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const allRequiredUploaded = documentRequests
    .filter((r) => r.required)
    .every((r) => (r.document_uploads ?? []).length > 0);

  const handleFinish = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('complete-invite-submission', {
        body: { token: inviteToken }
      });
      if (error || !data?.success) {
        throw new Error(data?.error || 'Falha ao finalizar.');
      }
      toast({ title: 'Enviado!', description: 'Todos os documentos foram enviados e o processo foi marcado como Sent.' });
      onUploadSuccess();
    } catch (err: any) {
      toast({ title: 'Erro ao finalizar', description: err.message || 'Tente novamente.', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com informações do processo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{processData.project_name || processData.process_type}</CardTitle>
          <CardDescription>
            Empresa solicitante: <strong>{companyData?.name || "Não identificada"}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {processData.description || "Processo de documentação em andamento"}
          </p>
        </CardContent>
      </Card>

      {/* Lista de documentos solicitados */}
      <Card>
        <CardHeader>
          <CardTitle>Documentos Solicitados</CardTitle>
          <CardDescription>
            Envie os documentos abaixo para dar continuidade ao processo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {documentRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum documento solicitado ainda.
            </p>
          ) : (
            documentRequests.map((request) => {
              const lastUpload = request.document_uploads?.[0];
              return (
                <div
                  key={request.id}
                  className="flex items-start justify-between border rounded-lg p-4 hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <FileText className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{request.document_name}</h4>
                        {request.required && (
                          <Badge variant="outline" className="text-xs">
                            Obrigatório
                          </Badge>
                        )}
                      </div>
                      {request.instructions && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {request.instructions}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        {getStatusIcon(request.current_status)}
                        {getStatusBadge(request.current_status)}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 ml-4">
                    <Label htmlFor={`file-${request.id}`} className="cursor-pointer">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploading === request.id}
                        onClick={() => document.getElementById(`file-${request.id}`)?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {uploading === request.id ? "Enviando..." : lastUpload ? "Reenviar" : "Enviar"}
                      </Button>
                    </Label>
                    <Input
                      id={`file-${request.id}`}
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(request.id, file);
                      }}
                    />
                    {lastUpload && (
                      <p className="text-xs text-muted-foreground">
                        Enviado em {new Date(lastUpload.created_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleFinish} disabled={!allRequiredUploaded}>
          Finalizar e Enviar
        </Button>
      </div>
    </div>
  );
}
