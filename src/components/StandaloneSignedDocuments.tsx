import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Download, FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface StandaloneDocument {
  id: string;
  document_name: string;
  client_name: string;
  client_email: string;
  signature_status: string;
  company_signed_at: string | null;
  client_signed_at: string | null;
  file_path: string;
  created_at: string;
}

export const StandaloneSignedDocuments = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<StandaloneDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, [user]);

  const loadDocuments = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Buscar company_id do usuário
      const { data: userData } = await supabase
        .from('user_roles')
        .select('company_id')
        .eq('user_id', user.id)
        .in('role', ['company_admin', 'company_collaborator'])
        .limit(1)
        .maybeSingle();

      if (userData?.company_id) {
        // Buscar documentos standalone da empresa que já foram totalmente assinados
        const { data, error } = await supabase
          .from('standalone_signature_documents')
          .select('*')
          .eq('company_id', userData.company_id)
          .eq('signature_status', 'fully_signed')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setDocuments(data || []);
      } else {
        // Cliente: buscar documentos pelo email
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', user.id)
          .single();

        if (profile?.email) {
          const { data, error } = await supabase
            .from('standalone_signature_documents')
            .select('*')
            .eq('client_email', profile.email)
            .eq('signature_status', 'fully_signed')
            .order('created_at', { ascending: false });

          if (error) throw error;
          setDocuments(data || []);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
      toast.error('Falha ao carregar documentos assinados');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (doc: StandaloneDocument) => {
    try {
      // Buscar URL assinada do storage
      const { data: urlData, error: urlError } = await supabase.storage
        .from('documents')
        .createSignedUrl(doc.file_path, 3600);

      if (urlError || !urlData?.signedUrl) {
        toast.error('Erro ao gerar link de download');
        return;
      }

      // Download do arquivo
      const response = await fetch(urlData.signedUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.document_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Download iniciado');
    } catch (error) {
      console.error('Erro ao baixar documento:', error);
      toast.error('Falha ao baixar documento');
    }
  };

  const getStatusBadge = (doc: StandaloneDocument) => {
    if (doc.company_signed_at && doc.client_signed_at) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Totalmente Assinado
        </Badge>
      );
    }
    if (doc.company_signed_at || doc.client_signed_at) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
          <Clock className="h-3 w-3 mr-1" />
          Parcialmente Assinado
        </Badge>
      );
    }
    return (
      <Badge className="bg-gray-100 text-gray-800 border-gray-200">
        <AlertCircle className="h-3 w-3 mr-1" />
        Pendente
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documentos Assinados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            Carregando documentos...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (documents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documentos Assinados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
            <div className="rounded-full bg-muted p-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">Nenhum documento assinado</p>
              <p className="text-sm text-muted-foreground">
                Documentos totalmente assinados aparecerão aqui
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Documentos Assinados ({documents.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <h4 className="font-medium break-words line-clamp-2 flex-1 min-w-0">{doc.document_name}</h4>
                  {getStatusBadge(doc)}
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Cliente: {doc.client_name}</p>
                  <div className="flex gap-4 mt-1">
                    {doc.company_signed_at && (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                        Empresa: {format(new Date(doc.company_signed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    )}
                    {doc.client_signed_at && (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                        Cliente: {format(new Date(doc.client_signed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(doc)}
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
