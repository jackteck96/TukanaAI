import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ApproveAdmin = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const token = searchParams.get('token');

  const handleApproval = async (action: 'approve' | 'reject') => {
    if (!token) return;
    
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('approve-admin-invite', {
        body: { token, action }
      });

      if (error) throw error;

      setStatus('success');
      setMessage(data.message);
      
      toast({
        title: action === 'approve' ? "Aprovado!" : "Rejeitado",
        description: data.message,
      });

      // Redirecionar após 3 segundos
      setTimeout(() => navigate('/admin'), 3000);
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'Erro ao processar solicitação');
      toast({
        title: "Erro",
        description: error.message || 'Erro ao processar solicitação',
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-6 w-6 text-destructive" />
              Link Inválido
            </CardTitle>
            <CardDescription>
              O link de aprovação não é válido ou está incompleto.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-6 w-6 text-primary" />
              Aprovar Novo Administrador
            </CardTitle>
            <CardDescription>
              Um novo administrador foi convidado para a plataforma. Deseja aprovar?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button
                onClick={() => handleApproval('approve')}
                disabled={isProcessing}
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Aprovar
                  </>
                )}
              </Button>
              <Button
                onClick={() => handleApproval('reject')}
                disabled={isProcessing}
                variant="outline"
                className="flex-1"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Rejeitar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {status === 'success' ? (
              <>
                <CheckCircle className="h-6 w-6 text-green-500" />
                Sucesso!
              </>
            ) : (
              <>
                <XCircle className="h-6 w-6 text-destructive" />
                Erro
              </>
            )}
          </CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate('/admin')} className="w-full">
            Voltar ao Painel
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApproveAdmin;
