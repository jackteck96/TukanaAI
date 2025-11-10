import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import InternalSignatureManager from './InternalSignatureManager';

interface PendingDocument {
  id: string;
  document_name: string;
  client_name: string;
  signature_status: string;
  company_signed_at: string | null;
  signature_deadline: string | null;
  created_at: string;
}

export const PendingSignatureDocuments = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<PendingDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<PendingDocument | null>(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, [user]);

  const loadDocuments = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Cliente: buscar documentos pendentes pelo email
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
          .eq('signature_status', 'company_signed')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setDocuments(data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar documentos pendentes:', error);
      toast.error('Falha ao carregar documentos pendentes');
    } finally {
      setLoading(false);
    }
  };

  const handleSignDocument = (doc: PendingDocument) => {
    setSelectedDocument(doc);
    setShowSignatureModal(true);
  };

  const handleSignatureComplete = () => {
    toast.success('Documento assinado com sucesso!');
    setShowSignatureModal(false);
    setSelectedDocument(null);
    loadDocuments();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Documentos Aguardando Assinatura
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
    return null;
  }

  return (
    <>
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
            <AlertCircle className="h-5 w-5" />
            Documentos Aguardando Sua Assinatura ({documents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 bg-white dark:bg-background border border-amber-200 rounded-lg"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-medium">{doc.document_name}</h4>
                    <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                      <Clock className="h-3 w-3 mr-1" />
                      Aguardando Assinatura
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>
                      Enviado em: {format(new Date(doc.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                    {doc.signature_deadline && (
                      <p className="text-amber-700 dark:text-amber-400">
                        Prazo: {format(new Date(doc.signature_deadline), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  onClick={() => handleSignDocument(doc)}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  Assinar Agora
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modal de assinatura */}
      {showSignatureModal && selectedDocument && (
        <InternalSignatureManager
          documentId={selectedDocument.id}
          documentName={selectedDocument.document_name}
          isStandalone={true}
          onSuccess={handleSignatureComplete}
          onClose={() => {
            setShowSignatureModal(false);
            setSelectedDocument(null);
          }}
        />
      )}
    </>
  );
};
