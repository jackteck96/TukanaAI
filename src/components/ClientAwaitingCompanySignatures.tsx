import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface StandaloneDocument {
  id: string;
  document_name: string;
  company_id: string;
  created_at: string;
}

export function ClientAwaitingCompanySignatures() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<StandaloneDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadDocs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const loadDocs = async () => {
    try {
      setLoading(true);
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user!.id)
        .single();

      if (!profile?.email) {
        setDocuments([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('standalone_signature_documents')
        .select('id, document_name, company_id, created_at')
        .eq('client_email', profile.email)
        .eq('signature_status', 'partially_signed')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (e) {
      console.error('[ClientAwaitingCompanySignatures] load error', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documentos aguardando assinatura da empresa</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {documents.length === 0 ? (
          <p className="text-muted-foreground">Nenhum documento aguardando assinatura da empresa.</p>
        ) : (
          documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between rounded-md border p-3">
              <div className="flex-1 min-w-0">
                <div className="font-medium break-words line-clamp-2">{doc.document_name}</div>
                <div className="mt-1"><Badge variant="secondary">Aguardando Empresa</Badge></div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
