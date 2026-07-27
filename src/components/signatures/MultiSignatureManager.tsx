import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Mail, CheckCircle, Clock, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MultiSignatureManagerProps {
  documentId: string;
  processId: string;
  documentName: string;
  onAllSigned?: () => void;
}

interface Signer {
  id?: string;
  name: string;
  email: string;
  status: 'pending' | 'signed';
  signedAt?: string;
}

const MultiSignatureManager: React.FC<MultiSignatureManagerProps> = ({
  documentId,
  processId,
  documentName,
  onAllSigned
}) => {
  const [signers, setSigners] = useState<Signer[]>([]);
  const [newSigner, setNewSigner] = useState({ name: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [allSigned, setAllSigned] = useState(false);

  useEffect(() => {
    loadSigners();
  }, [documentId]);

  const loadSigners = async () => {
    try {
      const { data, error } = await supabase
        .from('internal_signatures')
        .select('id, signer_name, signer_email, created_at')
        .eq('document_id', documentId)
        .order('signature_order', { ascending: true });

      if (error) throw error;

      const loadedSigners: Signer[] = (data || []).map(s => ({
        id: s.id,
        name: s.signer_name,
        email: s.signer_email,
        status: 'signed' as const,
        signedAt: s.created_at
      }));

      setSigners(loadedSigners);
      
      // Verificar se todos assinaram
      if (loadedSigners.length > 0) {
        const allCompleted = loadedSigners.every(s => s.status === 'signed');
        setAllSigned(allCompleted);
        if (allCompleted && onAllSigned) {
          onAllSigned();
        }
      }
    } catch (error) {
      console.error('Erro ao carregar signatários:', error);
    }
  };

  const addSigner = () => {
    if (!newSigner.name || !newSigner.email) {
      toast.error('Preencha nome e email do signatário');
      return;
    }

    const exists = signers.some(s => s.email === newSigner.email);
    if (exists) {
      toast.error('Este email já está na lista');
      return;
    }

    setSigners([...signers, { ...newSigner, status: 'pending' }]);
    setNewSigner({ name: '', email: '' });
    toast.success('Signatário adicionado');
  };

  const removeSigner = (index: number) => {
    const signer = signers[index];
    if (signer.status === 'signed') {
      toast.error('Não é possível remover signatário que já assinou');
      return;
    }
    setSigners(signers.filter((_, i) => i !== index));
  };

  const sendInvitations = async () => {
    if (signers.length === 0) {
      toast.error('Adicione pelo menos um signatário');
      return;
    }

    setLoading(true);
    try {
      const pendingSigners = signers.filter(s => s.status === 'pending');
      
      for (const signer of pendingSigners) {
        const { error } = await supabase.functions.invoke('send-unified-email', {
          body: {
            to: signer.email,
            subject: `Solicitação de Assinatura - ${documentName}`,
            template: 'signature_request',
            data: {
              signerName: signer.name,
              documentName: documentName,
              documentId: documentId,
              processId: processId
            }
          }
        });

        if (error) {
          console.error(`Erro ao enviar convite para ${signer.email}:`, error);
        }
      }

      toast.success('Convites enviados com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar convites:', error);
      toast.error('Erro ao enviar alguns convites');
    } finally {
      setLoading(false);
    }
  };

  const downloadSignedDocument = async () => {
    try {
      const { data: doc } = await supabase
        .from('documents')
        .select('file_path')
        .eq('id', documentId)
        .single();

      if (!doc?.file_path) {
        toast.error('Documento não encontrado');
        return;
      }

      const { data, error } = await supabase.storage
        .from('documents')
        .download(doc.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${documentName}_assinado.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Download iniciado');
    } catch (error) {
      console.error('Erro ao baixar documento:', error);
      toast.error('Erro ao baixar documento assinado');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Gerenciar Signatários</span>
          {allSigned && (
            <Badge variant="default" className="bg-green-600">
              <CheckCircle className="h-4 w-4 mr-1" />
              Todas assinaturas concluídas
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Lista de signatários */}
        {signers.length > 0 && (
          <div className="space-y-2">
            <Label>Signatários ({signers.length})</Label>
            {signers.map((signer, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {signer.status === 'signed' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <Clock className="h-5 w-5 text-orange-600" />
                  )}
                  <div>
                    <p className="font-medium">{signer.name}</p>
                    <p className="text-sm text-muted-foreground">{signer.email}</p>
                    {signer.signedAt && (
                      <p className="text-xs text-muted-foreground">
                        Assinado em {new Date(signer.signedAt).toLocaleString('pt-BR')}
                      </p>
                    )}
                  </div>
                </div>
                {signer.status === 'pending' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSigner(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Adicionar novo signatário */}
        {!allSigned && (
          <>
            <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
              <Label>Adicionar Signatário</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Nome completo"
                  value={newSigner.name}
                  onChange={(e) => setNewSigner(prev => ({ ...prev, name: e.target.value }))}
                />
                <Input
                  type="email"
                  placeholder="email@exemplo.com"
                  value={newSigner.email}
                  onChange={(e) => setNewSigner(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <Button onClick={addSigner} variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar à Lista
              </Button>
            </div>

            <Button 
              onClick={sendInvitations}
              disabled={loading || signers.filter(s => s.status === 'pending').length === 0}
              className="w-full"
            >
              <Mail className="h-4 w-4 mr-2" />
              {loading ? 'Enviando convites...' : 'Enviar Convites de Assinatura'}
            </Button>
          </>
        )}

        {/* Download do documento assinado */}
        {allSigned && (
          <Button 
            onClick={downloadSignedDocument}
            variant="default"
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            Baixar Documento Assinado
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default MultiSignatureManager;
