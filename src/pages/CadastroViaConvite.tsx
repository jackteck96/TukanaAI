import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function CadastroViaConvite() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [inviteDetails, setInviteDetails] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isCollaborator, setIsCollaborator] = useState(false);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

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

        // Verificar se é convite de administrador da plataforma
        if (data.invite?.role === 'admin' && !data.invite?.company_id) {
          setIsPlatformAdmin(true);
          setFullName(data.invite?.full_name || "");
        } else if (data.invite?.isCollaboratorInvite) {
          // Verificar se é convite de colaborador
          setIsCollaborator(true);
          setFullName(data.invite?.full_name || "");
        }

        // Garantir que as tasks virem solicitações visíveis para o cliente (apenas para clientes)
        if (data.process?.id) {
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
      if (isPlatformAdmin) {
        navigate('/admin');
      } else if (isCollaborator) {
        navigate('/empresa');
      } else {
        const processId = inviteDetails.process?.id;
        if (processId) {
          navigate(`/area-cliente?id=${processId}`);
        }
      }
    }
  }, [user, inviteDetails, navigate, isCollaborator, isPlatformAdmin]);

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
      if (isPlatformAdmin) {
        // Criar conta de administrador da plataforma usando a edge function
        const { data, error } = await supabase.functions.invoke('complete-admin-signup', {
          body: {
            token,
            email: inviteDetails.invite.email,
            password,
            full_name: fullName.trim()
          }
        });

        if (error || !data?.success) {
          console.error('Erro ao criar administrador:', error);
          toast.error("Erro ao criar conta", {
            description: data?.error || error?.message || "Tente novamente mais tarde"
          });
          return;
        }

        toast.success("Conta de administrador criada com sucesso!", {
          description: "Faça login para acessar o painel administrativo"
        });

        // Redirecionar para login
        setTimeout(() => {
          navigate('/login');
        }, 1500);

      } else if (isCollaborator) {
        // Criar conta de colaborador
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: inviteDetails.invite.email,
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              phone: phone.trim(),
              role: inviteDetails.invite.role || 'staff'
            }
          }
        });

        if (signUpError) {
          console.error('Erro ao criar colaborador:', signUpError);
          toast.error("Erro ao criar conta", {
            description: signUpError.message || "Tente novamente mais tarde"
          });
          return;
        }

        // Atualizar o perfil com company_id e telefone
        if (signUpData.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              company_id: inviteDetails.invite.company_id,
              role: inviteDetails.invite.role || 'staff',
              phone: phone.trim()
            })
            .eq('id', signUpData.user.id);

          if (profileError) {
            console.warn('Erro ao atualizar perfil:', profileError);
          }

          // Processar aceitação do convite e configurar permissões
          const { data: permissionData, error: permissionError } = await supabase
            .rpc('process_collaborator_invite_acceptance', {
              p_user_id: signUpData.user.id,
              p_token: token
            });

          if (permissionError) {
            console.error('Erro ao configurar permissões:', permissionError);
            toast.warning('Conta criada, mas as permissões podem estar incompletas');
          } else if (permissionData && typeof permissionData === 'object' && 'success' in permissionData && !permissionData.success) {
            console.warn('Falha ao processar permissões:', permissionData);
            toast.warning('Conta criada, mas as permissões podem estar incompletas');
          } else {
            console.log('Permissões configuradas com sucesso:', permissionData);
          }
        }

        // Mostrar mensagem de sucesso e instruções
        setShowSuccessMessage(true);

        // Redirecionar para landing page após 5 segundos
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 5000);

      } else {
        // Criar conta de cliente (fluxo existente)
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
          description: "Fazendo login automático..."
        });

        // Fazer login automático após cadastro
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: inviteDetails.invite.email,
          password,
        });

        if (signInError) {
          console.error('Erro ao fazer login automático:', signInError);
          toast.error("Conta criada com sucesso", {
            description: "Por favor, faça login manualmente"
          });
          setTimeout(() => {
            navigate('/login');
          }, 1500);
          return;
        }

        // Redirecionar para área do cliente
        const processId = inviteDetails.process?.id;
        if (processId) {
          navigate(`/area-cliente?id=${processId}`);
        } else {
          navigate('/area-cliente');
        }
      }

    } catch (err: any) {
      console.error('Erro inesperado ao criar conta:', err);
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

  if (showSuccessMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-accent p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <CardTitle className="text-2xl">Cadastro Realizado!</CardTitle>
            <CardDescription className="text-base mt-4">
              Enviamos um email de confirmação para <strong>{inviteDetails.invite?.email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-200 mb-2">
                📧 Verifique sua caixa de entrada
              </p>
              <p className="text-blue-700 dark:text-blue-300">
                Para concluir seu cadastro, clique no link de confirmação que enviamos para o seu email.
              </p>
            </div>
            
            <div className="text-center text-sm text-muted-foreground">
              Você será redirecionado em alguns segundos...
            </div>

            <Button 
              className="w-full" 
              onClick={() => navigate('/')}
            >
              Ir para a página inicial
            </Button>
          </CardContent>
        </Card>
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
            <CardTitle className="text-2xl">
              {isPlatformAdmin ? 'Cadastro de Administrador' : isCollaborator ? 'Cadastro de Colaborador' : 'Cadastro de Cliente'}
            </CardTitle>
            <CardDescription>
              {isPlatformAdmin 
                ? 'Você foi convidado para ser um Administrador da Plataforma'
                : `Você foi convidado${isCollaborator ? ' para integrar a equipe de' : ' por'} `}
              {!isPlatformAdmin && <strong>{companyName}</strong>}
            </CardDescription>
            <CardDescription className="text-sm text-muted-foreground mt-2">
              Email: {inviteEmail}
            </CardDescription>
            {isPlatformAdmin && (
              <CardDescription className="text-sm font-medium mt-1 text-primary">
                🔐 Você terá acesso total ao painel administrativo da plataforma
              </CardDescription>
            )}
            {isCollaborator && inviteDetails.invite?.role && (
              <CardDescription className="text-sm font-medium mt-1">
                Função: {inviteDetails.invite.role === 'staff' ? 'Funcionário' : inviteDetails.invite.role}
              </CardDescription>
            )}
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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={inviteEmail}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
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

    </div>
  );
}
