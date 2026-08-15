import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle, Shield, FileText, ArrowLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const SignatureCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(true);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    signature_data?: any;
    error?: string;
  } | null>(null);

  useEffect(() => {
    processSignatureCallback();
  }, []);

  const processSignatureCallback = async () => {
    try {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        throw new Error(`Erro na autenticação gov.br: ${error}`);
      }

      if (!code) {
        throw new Error('Código de autorização não recebido');
      }

      // Recuperar dados da sessão (documento_id, process_id, etc.)
      const sessionData = sessionStorage.getItem('signature_session');
      if (!sessionData) {
        throw new Error('Sessão de assinatura não encontrada');
      }

      const { document_id, process_id, signer_email } = JSON.parse(sessionData);

      // Chamar edge function para processar assinatura
      const { data, error: functionError } = await supabase.functions.invoke('gov-br-signature', {
        body: {
          code,
          document_id,
          process_id,
          signer_email
        }
      });

      if (functionError) {
        throw functionError;
      }

      setResult(data);
      
      if (data.success) {
        toast({
          title: "Assinatura Concluída",
          description: "Documento assinado digitalmente com sucesso",
        });
        
        // Limpar dados da sessão
        sessionStorage.removeItem('signature_session');
      }

    } catch (error) {
      console.error('Erro no callback de assinatura:', error);
      setResult({
        success: false,
        message: 'Falha no processo de assinatura',
        error: error.message
      });
      
      toast({
        title: "Erro na Assinatura",
        description: error.message || "Falha no processo de assinatura",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReturn = () => {
    // Tentar voltar para a página anterior ou redirecionar para dashboard
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/cliente');
    }
  };

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-6 w-6 text-primary animate-pulse" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Processando Assinatura</h2>
            <p className="text-muted-foreground">
              Validando certificado digital e registrando assinatura...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <FileText className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold text-foreground">Tukana AI</span>
              </div>
              <div className="hidden md:block">
                <span className="text-sm text-muted-foreground">
                  Assinatura Digital gov.br
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-2xl mx-auto">
          {result?.success ? (
            /* Sucesso */
            <div className="space-y-6">
              <Card className="border-green-200">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <CardTitle className="text-2xl text-green-800">
                    Documento Assinado com Sucesso!
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert className="border-green-200 bg-green-50">
                    <Shield className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <strong>Assinatura Digital Válida</strong>
                      <br />
                      Documento assinado digitalmente com certificado ICP-Brasil através do gov.br
                    </AlertDescription>
                  </Alert>

                  {result.signature_data && (
                    <div className="space-y-3">
                      <h4 className="font-medium">Dados da Assinatura:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Signatário</p>
                          <p className="font-medium">{result.signature_data.signer_name}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">CPF</p>
                          <p className="font-medium">{result.signature_data.signer_cpf}</p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-sm font-medium text-muted-foreground">Data/Hora</p>
                          <p className="font-medium">
                            {new Date(result.signature_data.timestamp).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-center space-x-3 pt-4">
                    <Badge variant="outline" className="border-green-300 text-green-700">
                      <Shield className="h-3 w-3 mr-1" />
                      ICP-Brasil
                    </Badge>
                    <Badge variant="outline" className="border-blue-300 text-blue-700">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      gov.br
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Erro */
            <div className="space-y-6">
              <Card className="border-red-200">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                  </div>
                  <CardTitle className="text-2xl text-red-800">
                    Falha na Assinatura
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      <strong>Erro no Processo de Assinatura</strong>
                      <br />
                      {result?.error || result?.message || 'Erro desconhecido'}
                    </AlertDescription>
                  </Alert>

                  <div className="text-center">
                    <p className="text-muted-foreground mb-4">
                      Por favor, tente novamente ou entre em contato com o suporte.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Botão de Retorno */}
          <div className="flex justify-center mt-8">
            <Button onClick={handleReturn} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SignatureCallback;