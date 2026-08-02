import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import InternalSignatureManager from './InternalSignatureManager';
import { PenTool } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StandaloneDocument {
  id: string;
  document_name: string;
  client_name: string;
  client_email: string;
  file_path: string;
  created_at: string;
}

export function CompanyPendingStandaloneSignatures() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<StandaloneDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<StandaloneDocument | null>(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadCompanyAndDocs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const loadCompanyAndDocs = async () => {
    try {
      setLoading(true);
      const { data: role, error: roleErr } = await supabase
        .from('user_roles')
        .select('company_id')
        .eq('user_id', user!.id)
        .in('role', ['company_admin', 'company_collaborator'])
        .limit(1)
        .maybeSingle();

      if (roleErr || !role?.company_id) {
        setCompanyId(null);
        setDocuments([]);
        setLoading(false);
        return;
      }

      setCompanyId(role.company_id);

      const { data, error } = await supabase
        .from('standalone_signature_documents')
        .select('id, document_name, client_name, client_email, file_path, created_at')
        .eq('company_id', role.company_id)
        .eq('signature_status', 'partially_signed')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (e) {
      console.error('[CompanyPendingStandaloneSignatures] load error', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSignNow = (doc: StandaloneDocument) => {
    setSelectedDoc(doc);
    setShowSignatureModal(true);
  };

  const handleSignatureComplete = () => {
    setShowSignatureModal(false);
    setSelectedDoc(null);
    toast({ title: 'Assinatura concluída', description: 'Documento assinado com sucesso.' });
    loadCompanyAndDocs();
  };

  if (loading) return null;
  if (!companyId) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documentos para Assinatura da Empresa</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {documents.length === 0 ? (
          <p className="text-muted-foreground">Nenhum documento aguardando assinatura da empresa.</p>
        ) : (
          documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between rounded-md border p-3">
              <div className="flex-1 min-w-0 mr-4">
                <div className="font-medium break-words line-clamp-2">{doc.document_name}</div>
                <div className="text-sm text-muted-foreground break-words">Cliente: {doc.client_name} ({doc.client_email})</div>
                <div className="mt-1"><Badge variant="secondary">Aguardando Empresa</Badge></div>
              </div>
              <div>
                <Button variant="default" onClick={() => handleSignNow(doc)}>
                  <PenTool className="h-4 w-4 mr-2" /> Assinar Agora
                </Button>
              </div>
            </div>
          ))
        )}

        {showSignatureModal && selectedDoc && (
          <div className="mt-2">
            <InternalSignatureManager
              documentId={selectedDoc.id}
              documentName={selectedDoc.document_name}
              isStandalone={true}
              onSuccess={handleSignatureComplete}
              onClose={() => setShowSignatureModal(false)}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
