import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Mail, Send, UserPlus, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface InviteFormData {
  email: string;
  role: 'staff' | 'client';
  full_name: string;
}

interface UserInviteSystemProps {
  onInviteSent?: () => void;
}

export default function UserInviteSystem({ onInviteSent }: UserInviteSystemProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [inviteData, setInviteData] = useState<InviteFormData>({
    email: '',
    role: 'staff',
    full_name: ''
  });

  const generateInviteLink = async () => {
    try {
      // Gerar um token único para o convite
      const { data: tokenData, error: tokenError } = await supabase
        .rpc('generate_invite_token');

      if (tokenError) throw tokenError;

      // Obter informações da empresa do usuário atual
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user?.id)
        .single();

      if (profileError) throw profileError;

      // Criar convite na tabela
      const { error: inviteError } = await supabase
        .from('user_invites')
        .insert({
          token: tokenData,
          email: inviteData.email,
          full_name: inviteData.full_name,
          role: inviteData.role,
          company_id: userProfile.company_id,
          invited_by: user?.id,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias
          status: 'pending'
        });

      if (inviteError) throw inviteError;

      return tokenData;
    } catch (error) {
      console.error('Erro ao gerar convite:', error);
      throw error;
    }
  };

  const sendInviteEmail = async (token: string) => {
    try {
      // Todos os convites agora usam o mesmo fluxo de cadastro via convite
      const inviteLink = `${window.location.origin}/cadastro-via-convite?token=${token}`;
      
      if (inviteData.role === 'staff') {
        // Para colaboradores usamos o mailer nativo do Supabase
        const { error } = await supabase.functions.invoke('invite-collaborator', {
          body: {
            email: inviteData.email,
            full_name: inviteData.full_name,
            inviteLink: inviteLink,
            inviterName: user?.user_metadata?.full_name || user?.email
          }
        });
        if (error) throw error;
        return;
      }

      // Para clientes continuamos usando o email de convite customizado
      const { error } = await supabase.functions.invoke('send-invite-email', {
        body: {
          to: inviteData.email,
          inviterName: user?.user_metadata?.full_name || user?.email,
          inviteLink: inviteLink,
          role: inviteData.role
        }
      });

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      throw error;
    }
  };

  const handleSendInvite = async () => {
    if (!inviteData.email || !inviteData.full_name) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setSending(true);

    try {
      // Verificar se o email já possui uma conta
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', inviteData.email)
        .single();

      if (existingUser) {
        toast.error('Este email já possui uma conta no sistema');
        return;
      }

      // Gerar token e link de convite
      const token = await generateInviteLink();
      
      // Enviar email de convite
      await sendInviteEmail(token);

      toast.success('Convite enviado com sucesso!');
      setIsOpen(false);
      setInviteData({ email: '', role: 'staff', full_name: '' });
      onInviteSent?.();
    } catch (error: any) {
      console.error('Erro ao enviar convite:', error);
      toast.error(error.message || 'Erro ao enviar convite');
    } finally {
      setSending(false);
    }
  };

  const copyInviteLink = async () => {
    try {
      const token = await generateInviteLink();
      const inviteLink = `${window.location.origin}/cadastro-via-convite?token=${token}`;
      
      await navigator.clipboard.writeText(inviteLink);
      toast.success('Link de convite copiado para a área de transferência!');
    } catch (error) {
      console.error('Erro ao copiar link:', error);
      toast.error('Erro ao gerar link de convite');
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'staff':
        return 'Funcionário';
      case 'client':
        return 'Cliente';
      default:
        return role;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Convidar Colaborador
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Convidar Novo Colaborador
          </DialogTitle>
          <DialogDescription>
            Envie um convite para adicionar um novo colaborador à sua empresa.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nome Completo</Label>
            <Input
              id="fullName"
              placeholder="Nome do colaborador"
              value={inviteData.full_name}
              onChange={(e) => setInviteData({ ...inviteData, full_name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="colaborador@exemplo.com"
              value={inviteData.email}
              onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Função</Label>
            <Select 
              value={inviteData.role} 
              onValueChange={(value: 'staff' | 'client') => 
                setInviteData({ ...inviteData, role: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="staff">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                      Funcionário
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Acesso limitado
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="client">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                      Cliente
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Apenas seus processos
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-4 space-y-3">
            <Button 
              onClick={handleSendInvite}
              disabled={sending}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              {sending ? 'Enviando...' : 'Enviar Convite por Email'}
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">ou</span>
              </div>
            </div>

            <Button 
              onClick={copyInviteLink}
              variant="outline"
              className="w-full"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copiar Link de Convite
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}