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

  const token = searchParams.get("token");

useEffect(() => {
  if (!token) {
    toast({
      title: "Token inválido",
      description: "Link de convite inválido ou expirado.",
      variant: "destructive",
    });
    navigate("/");
    return;
  }

  checkInviteToken();
}, [token]);

const checkInviteToken = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('verify-invite', {
      body: { token }
    });

    if (error) throw error;
    if (!data) throw new Error('Sem dados de convite');

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
    console.error('Erro ao verificar convite:', error);
    toast({
      title: 'Convite inválido',
      description: 'Este convite não existe, já foi usado ou expirou.',
      variant: 'destructive',
    });
    navigate('/');
  }
};
// Finaliza o vínculo do colaborador à empresa usando o token
const finalizeCollaboratorLink = async () => {
  if (!inviteData || inviteData.source !== 'user' || !user) return;
  setLoading(true);
  try {
    // 1) Vincula perfil à empresa e atualiza dados
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        company_id: inviteData.company_id,
        full_name: inviteData.full_name || undefined,
        role: inviteData.role || 'staff',
      })
      .eq('id', user.id);

    if (profileError) throw profileError;

    // 2) Marca convite como usado (agora RLS passa pois o perfil já tem company_id)
    const { error: inviteError } = await supabase
      .from('user_invites')
      .update({ status: 'used', used_at: new Date().toISOString() })
      .eq('token', token as string);

    if (inviteError) throw inviteError;

    toast({
      title: 'Convite aceito com sucesso',
      description: 'Sua conta foi vinculada à empresa.',
    });

    navigate('/empresa');
  } catch (err: any) {
    console.error('Erro ao finalizar convite de colaborador:', err);
    toast({
      title: 'Erro ao concluir convite',
      description: err.message || 'Tente novamente mais tarde.',
      variant: 'destructive',
    });
    navigate('/');
  } finally {
    setLoading(false);
  }
};

// Executa a finalização automática quando usuário já está autenticado e é convite de colaborador
useEffect(() => {
  if (inviteData?.source === 'user' && user) {
    finalizeCollaboratorLink();
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
        navigate('/login');
        return;
      }

      // Cadastro de cliente
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: inviteData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/cliente`,
          data: {
            full_name: formData.fullName,
            role: 'client',
          },
        },
      });

      if (signUpError) throw signUpError;

      if (authData?.user?.id) {
        await supabase
          .from('profiles')
          .update({
            full_name: formData.fullName,
            role: 'client',
            company_id: inviteData.company_id,
          })
          .eq('id', authData.user.id);
      }

      const { error: updateError } = await supabase
        .from('client_invites')
        .update({
          status: 'used',
          used_at: new Date().toISOString(),
        })
        .eq('token', token);
      if (updateError) {
        console.error('Erro ao atualizar convite:', updateError);
      }

      toast({
        title: 'Conta criada com sucesso!',
        description: 'Sua conta foi criada. Você pode fazer login agora.',
      });
      navigate('/login');
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