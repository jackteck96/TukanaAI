import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import ClientDocumentRequests from "@/components/ClientDocumentRequests";

export default function CadastroViaConvite() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [inviteDetails, setInviteDetails] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    async function fetchInviteDetails() {
      try {
        const urlToken = new URLSearchParams(window.location.search).get("token");
        if (!urlToken) {
          toast.error("Token inválido", {
            description: "O link de convite não é válido.",
          });
          setLoading(false);
          return;
        }

        setToken(urlToken);

        const { data, error } = await supabase.functions.invoke('get-invite-details', {
          body: { token: urlToken }
        });

        if (error || !data || data.error) {
          console.error('Erro ao buscar convite:', error || data?.error);
          toast.error("Convite não encontrado", {
            description: data?.error || "Não foi possível carregar os detalhes do convite.",
          });
          setLoading(false);
          return;
        }

        setInviteDetails(data);

        // Garantir que as tasks virem solicitações visíveis para o cliente
        try {
          const { data: ensureData, error: ensureError } = await supabase.functions.invoke('ensure-requests-for-process', {
            body: { processId: data.process.id }
          });
          if (ensureError || !ensureData?.success) {
            console.warn('[CadastroViaConvite] ensure-requests-for-process falhou:', ensureError || ensureData?.error);
          } else {
            console.log('[CadastroViaConvite] ensure-requests-for-process ok. Criados:', ensureData.created);
          }
        } catch (e) {
          console.warn('[CadastroViaConvite] ensure-requests-for-process erro inesperado:', e);
        }

      } catch (err: any) {
        console.error('Erro ao buscar convite:', err);
        toast.error("Erro", {
          description: err.message || "Erro ao carregar o convite.",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchInviteDetails();
  }, []);

  // Se o usuário já está logado e o email corresponde ao convite, redirecionar para o dashboard
  useEffect(() => {
    if (user && inviteDetails?.invite?.email && user.email === inviteDetails.invite.email) {
      const processId = inviteDetails.process?.id;
      if (processId) {
        navigate(`/area-cliente?id=${processId}`);
      }
    }
  }, [user, inviteDetails, navigate]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName.trim()) {
      toast.error("Nome completo é obrigatório");
      return;
    }

    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (!token) {
      toast.error("Token de convite não encontrado");
      return;
    }

    setIsRegistering(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-client-from-invite', {
        body: {
          token,
          password,
          fullName: fullName.trim()
        }
      });

      if (error || !data?.success) {
        console.error('Erro ao criar cliente:', error);
        toast.error("Erro ao criar conta", {
          description: data?.error || error?.message || "Tente novamente mais tarde"
        });
        return;
      }

      toast.success("Cadastro realizado com sucesso!", {
        description: "Faça login para acessar seus documentos"
      });

      // Redirecionar para login
      setTimeout(() => {
        navigate('/login');
      }, 1500);

    } catch (err: any) {
      console.error('Erro inesperado ao criar cliente:', err);
      toast.error("Erro inesperado", {
        description: err.message || "Tente novamente mais tarde"
      });
    } finally {
      setIsRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-accent">
        <p className="text-lg">Carregando...</p>
      </div>
    );
  }

  if (!inviteDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-accent">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Convite Inválido</h1>
          <p className="text-muted-foreground">O link de convite não é válido ou expirou.</p>
        </div>
      </div>
    );
  }

  const inviteEmail = inviteDetails.invite?.email || "";
  const companyName = inviteDetails.company?.name || "Empresa";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent py-12 px-4">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Cadastro de Cliente</CardTitle>
            <CardDescription>
              Você foi convidado por <strong>{companyName}</strong>
            </CardDescription>
            <CardDescription className="text-sm text-muted-foreground mt-2">
              Email: {inviteEmail}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Digite seu nome completo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={isRegistering}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={isRegistering}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Digite a senha novamente"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={isRegistering}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isRegistering}
              >
                {isRegistering ? "Criando conta..." : "Criar Conta"}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Já tem uma conta?{" "}
                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto"
                  onClick={() => navigate('/login')}
                >
                  Faça login
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {inviteDetails?.process && (
        <div className="max-w-3xl mx-auto mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Documentação do Processo</CardTitle>
              <CardDescription>
                {(inviteDetails.process.project_name || 'Processo')} — {(inviteDetails.company?.name || 'Empresa')}
              </CardDescription>
              {inviteDetails.process.description && (
                <p className="text-sm text-muted-foreground mt-1">{inviteDetails.process.description}</p>
              )}
            </CardHeader>
            <CardContent>
              <ClientDocumentRequests
                processId={inviteDetails.process.id}
                companyName={inviteDetails.company?.name}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
