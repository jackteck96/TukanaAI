import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface InviteData {
  email: string;
  company_id: string;
  status: string;
  expires_at: string;
  // Optional fields depending on source table
  process_id?: string | null;
  full_name?: string | null;
  role?: 'staff' | 'client' | 'admin' | 'lawyer';
  source: 'client' | 'user';
}

export default function CadastroViaConvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [sessionConflict, setSessionConflict] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const token = searchParams.get("token");
  const [hashParams, setHashParams] = useState<Record<string, string> | null>(null);
  const isInvitedSession = !!inviteData && ((hashParams?.type === 'invite') || (!!user && (user as any).email === inviteData.email));

useEffect(() => {
  console.info('[CadastroViaConvite] mount', { token, hash: window.location.hash.slice(0, 60) + '...' });

  const inviteError = searchParams.get('invite_error');
  if (inviteError) {
    setErrorMsg(inviteError === 'otp_expired'
      ? 'O link de convite expirou. Peça um novo convite.'
      : 'Não foi possível validar seu convite. Peça um novo link.');
    return;
  }

  if (!token) {
    setErrorMsg('Link de convite inválido ou sem token. Peça um novo convite.');
    return;
  }
  setErrorMsg(null);
  checkInviteToken();
}, [token]);

useEffect(() => {
  if (window.location.hash) {
    const params = new URLSearchParams(window.location.hash.slice(1));
    if (params.get('type') === 'invite') {
      const entries: Record<string, string> = {};
      params.forEach((v, k) => (entries[k] = v));
      setHashParams(entries);
      console.info('[CadastroViaConvite] hash params detected', entries);

      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');
      if (access_token && refresh_token) {
        // Garante sessão mesmo se o handler global não processou ainda
        supabase.auth.setSession({ access_token, refresh_token })
          .then(() => console.info('[CadastroViaConvite] setSession ok'))
          .catch((e) => console.error('[CadastroViaConvite] setSession error', e));
      }
    } else {
      setHashParams(null);
    }
  } else {
    setHashParams(null);
  }
}, []);


const checkInviteToken = async () => {
  console.log('[CadastroViaConvite] Checking token:', token);
  try {
    const { data, error } = await supabase.functions.invoke('verify-invite', {
      body: { token }
    });

    console.log('[CadastroViaConvite] verify-invite response:', { data, error });

    if (error) {
      console.error('[CadastroViaConvite] Error from verify-invite:', error);
      throw error;
    }
    if (!data) {
      console.error('[CadastroViaConvite] No data returned from verify-invite');
      throw new Error('Sem dados de convite');
    }

    console.log('[CadastroViaConvite] Invite data received:', data);

    if (data.type === 'client') {
      setInviteData({
        email: data.email,
        company_id: data.company_id,
        process_id: data.process_id,
        status: 'pending',
        expires_at: data.expires_at,
        source: 'client'
      });
    } else {
      setInviteData({
        email: data.email,
        company_id: data.company_id,
        full_name: data.full_name,
        role: data.role,
        status: 'pending',
        expires_at: data.expires_at,
        source: 'user'
      });
    }
  } catch (error) {
    console.error('[CadastroViaConvite] checkInviteToken error:', error);
    setErrorMsg('Convite inválido, já usado ou expirado.');
  } finally {
    setLoading(false);
  }
};
// Conflito de sessão: usuário logado com e-mail diferente do convite
const handleSignOut = async () => {
  await supabase.auth.signOut();
  setSessionConflict(false);
  toast({
    title: 'Sessão encerrada',
    description: 'Agora você pode concluir o cadastro com o e-mail do convite.',
  });
};

useEffect(() => {
  if (!inviteData) return;
  if (user && (user as any).email && (user as any).email !== inviteData.email) {
    setSessionConflict(true);
  } else {
    setSessionConflict(false);
  }
}, [inviteData, user]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteData) return;

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (isInvitedSession) {
        // Usuário chegou via link de convite do Supabase (#type=invite) e já está (ou ficará) logado
        // Garantir que a sessão esteja carregada
        await supabase.auth.getSession();

        // Define a senha do usuário convidado e salva metadados
        const { error: updateErr } = await supabase.auth.updateUser({
          password: formData.password,
          data: {
            full_name: formData.fullName,
            role: inviteData.source === 'user' ? 'staff' : 'client',
          },
        });
        if (updateErr) throw updateErr;

        // Atualiza o perfil
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;
        if (userId) {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              company_id: inviteData.company_id,
              full_name: formData.fullName,
              role: inviteData.source === 'user' ? 'staff' : 'client',
            })
            .eq('id', userId);
          if (profileError) throw profileError;
        }

        // Marca o convite como utilizado
        if (inviteData.source === 'user') {
          await supabase
            .from('user_invites')
            .update({ status: 'used', used_at: new Date().toISOString() })
            .eq('token', token);
        } else {
          await supabase
            .from('client_invites')
            .update({ status: 'used', used_at: new Date().toISOString() })
            .eq('token', token);
        }

        toast({
          title: 'Cadastro concluído!',
          description: 'Senha definida com sucesso.',
        });

        // Remove o fragmento da URL para evitar confusão futura
        if (window.location.hash) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }

        navigate(inviteData.source === 'user' ? '/empresa' : '/cliente');
        return;
      }

      // Fluxo antigo (sem hash do Supabase): criar conta normalmente
      if (inviteData.source === 'user') {
        // Cadastro de colaborador
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: inviteData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/empresa`,
            data: {
              full_name: formData.fullName,
              role: 'staff',
            },
          },
        });

        if (signUpError) throw signUpError;

        if (authData?.user?.id) {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              company_id: inviteData.company_id,
              full_name: formData.fullName,
              role: 'staff',
            })
            .eq('id', authData.user.id);
          if (profileError) throw profileError;
        }

        const { error: inviteUpdateErr } = await supabase
          .from('user_invites')
          .update({ status: 'used', used_at: new Date().toISOString() })
          .eq('token', token);
        if (inviteUpdateErr) throw inviteUpdateErr;

        toast({
          title: 'Conta de colaborador criada com sucesso!',
          description: 'Verifique seu e-mail e faça login para acessar a empresa.',
        });
        navigate(`/auth?prefill=${encodeURIComponent(inviteData.email)}`);
        return;
      }

      // Cadastro de cliente - usar função que já confirma automaticamente
      console.log('[CadastroViaConvite] Creating client with auto-confirm');
      const { data: clientData, error: clientError } = await supabase.functions.invoke('create-client-from-invite', {
        body: {
          token,
          password: formData.password,
          fullName: formData.fullName,
        }
      });

      if (clientError) {
        console.error('[CadastroViaConvite] Client creation error:', clientError);
        throw new Error(clientError.message || 'Erro ao criar conta do cliente');
      }

      if (!clientData?.success) {
        throw new Error('Falha ao criar conta do cliente');
      }

      console.log('[CadastroViaConvite] Client created successfully:', clientData);

      toast({
        title: 'Conta criada com sucesso!',
        description: 'Sua conta foi criada e confirmada. Você já pode fazer login.',
      });
      navigate(`/auth?prefill=${encodeURIComponent(inviteData.email)}`);
    } catch (error: any) {
      console.error('Erro ao criar conta:', error);
      toast({
        title: 'Erro ao criar conta',
        description: error.message || 'Erro interno do servidor.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (errorMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">Convite inválido</CardTitle>
            <CardDescription>{errorMsg}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate('/')}>Voltar para o início</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!inviteData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando convite...</p>
        </div>
      </div>
    );
  }

  if (sessionConflict) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">Trocar de conta para continuar</CardTitle>
            <CardDescription>
              Você está logado com um e-mail diferente do convite ({(user as any)?.email}). Encerre a sessão para criar a conta com {inviteData.email}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={handleSignOut} disabled={loading}>
              {loading ? 'Saindo...' : 'Sair e continuar cadastro'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            {inviteData.source === 'user' ? 'Cadastro de Colaborador' : 'Criar Conta'}
          </CardTitle>
          <CardDescription>
            {inviteData.source === 'user'
              ? 'Crie sua conta de colaborador para acessar a empresa'
              : 'Complete seu cadastro para acessar seu processo'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={inviteData.email}
                disabled
                className="bg-gray-50"
              />
            </div>

            <div>
              <Label htmlFor="fullName">Nome Completo</Label>
              <Input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                required={inviteData.source === 'client'}
              />
            </div>

            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Criando conta..." : "Criar Conta"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}