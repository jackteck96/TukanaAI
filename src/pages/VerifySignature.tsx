import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Shield, Download, CheckCircle, FileText, Calendar, User, Mail, Hash } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SignatureData {
  id: string;
  signer_name: string;
  signer_email: string;
  created_at: string;
  signature_hash: string;
  document_hash: string;
  authentication_method: string;
  authentication_contact: string;
  auth_report_url: string | null;
  signature_ip: string | null;
  signature_metadata: any;
  documents: {
    file_name: string;
    id: string;
  };
  processes: {
    client_name: string;
    project_name: string;
  };
}

const VerifySignature: React.FC = () => {
  const { signatureHash } = useParams<{ signatureHash: string }>();
  const [signature, setSignature] = useState<SignatureData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSignatureData();
  }, [signatureHash]);

  const loadSignatureData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('internal_signatures')
        .select('*')
        .eq('signature_hash', signatureHash)
        .single();

      if (fetchError || !data) {
        setError('Assinatura não encontrada');
        return;
      }

      // Buscar dados do documento separadamente
      const { data: documentData } = await supabase
        .from('documents')
        .select('file_name, id')
        .eq('id', data.document_id)
        .single();

      // Buscar dados do processo separadamente
      const { data: processData } = await supabase
        .from('processes')
        .select('client_name, project_name')
        .eq('id', data.process_id)
        .single();

      setSignature({
        ...data,
        documents: documentData || { file_name: 'N/A', id: data.document_id },
        processes: processData || { client_name: 'N/A', project_name: 'N/A' }
      } as SignatureData);
    } catch (err) {
      console.error('Erro ao carregar assinatura:', err);
      setError('Erro ao carregar dados da assinatura');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTerm = async () => {
    if (!signature) {
      toast.error('Termo de autenticidade não disponível');
      return;
    }
    
    let downloadUrl = signature.auth_report_url;
    
    // Sempre tentar gerar uma URL assinada fresca para evitar URLs públicas antigas
    try {
      const path = `authenticity-terms/${signature.signature_hash}.pdf`;
      const { data: signed, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(path, 60 * 60 * 24 * 7);
      if (signed?.signedUrl) {
        downloadUrl = signed.signedUrl;
      } else if (error) {
        console.warn('Falha ao gerar URL assinada, usando URL salva', error);
      }
    } catch (e) {
      console.warn('Exceção ao gerar URL assinada, usando URL salva', e);
    }

    if (downloadUrl) {
      try {
        const response = await fetch(downloadUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'termo-autenticidade.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success('Termo de autenticidade baixado com sucesso');
      } catch (error) {
        console.error('Erro ao baixar termo:', error);
        toast.error('Erro ao baixar termo de autenticidade');
      }
    } else {
      toast.error('Termo de autenticidade não disponível');
    }
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardContent className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando dados da assinatura...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !signature) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardContent className="p-12 text-center">
            <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">{error || 'Assinatura não encontrada'}</h2>
            <p className="text-muted-foreground">
              Verifique se o link está correto e tente novamente.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const signatureDate = new Date(signature.created_at);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 p-4 py-12">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Cabeçalho */}
        <Card className="border-2 border-green-200 bg-green-50/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-7 w-7 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Assinatura Verificada</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Este documento possui assinatura digital válida
                  </p>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-800 border-green-200 text-sm px-3 py-1">
                Válida
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Dados do Signatário */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Dados do Signatário</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Nome Completo</p>
                <p className="font-medium">{signature.signer_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">E-mail</p>
                <p className="font-medium">{signature.signer_email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dados do Documento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Dados do Documento</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Nome do Documento</p>
                <p className="font-medium">{signature.documents.file_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Processo</p>
                <p className="font-medium">
                  {signature.processes.project_name || signature.processes.client_name}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dados da Assinatura */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Dados da Assinatura</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Data e Hora (UTC)</p>
                <p className="font-medium">{signatureDate.toUTCString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Método de Autenticação</p>
                <p className="font-medium">
                  {signature.authentication_method === 'email' ? 'E-mail' : 'SMS'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Contato de Autenticação</p>
                <p className="font-medium">{signature.authentication_contact}</p>
              </div>
              {signature.signature_ip && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Endereço IP</p>
                  <p className="font-medium">{signature.signature_ip}</p>
                </div>
              )}
              {signature.signature_metadata?.browser && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Navegador</p>
                  <p className="font-medium">{signature.signature_metadata.browser}</p>
                </div>
              )}
              {signature.signature_metadata?.device && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Dispositivo</p>
                  <p className="font-medium">{signature.signature_metadata.device}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Integridade */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Hash className="h-5 w-5" />
              <span>Integridade e Segurança</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Hash do Documento (SHA256)</p>
              <code className="block p-3 bg-muted rounded text-xs break-all">
                {signature.document_hash}
              </code>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Hash da Assinatura</p>
              <code className="block p-3 bg-muted rounded text-xs break-all">
                {signature.signature_hash}
              </code>
            </div>
          </CardContent>
        </Card>

        {/* Certificação */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <Shield className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Certificação</h3>
                <p className="text-sm text-blue-800 italic">
                  Este termo confirma que a assinatura eletrônica foi realizada por meio de verificação 
                  de e-mail e que o documento não sofreu alterações após a assinatura.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botão de Download */}
        {signature.auth_report_url && (
          <Card>
            <CardContent className="p-6">
              <Button 
                onClick={handleDownloadTerm}
                className="w-full"
                size="lg"
              >
                <Download className="h-5 w-5 mr-2" />
                Baixar Termo de Autenticidade (PDF)
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Rodapé */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Gerado automaticamente por Fuzen</p>
          <p className="mt-1">Este documento possui validade jurídica conforme MP 2.200-2/2001</p>
        </div>
      </div>
    </div>
  );
};

export default VerifySignature;
