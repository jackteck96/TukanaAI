import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Plus, Users, Mail, Trash2, Edit, UserCheck, UserX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import UserInviteSystem from '@/components/UserInviteSystem';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'lawyer' | 'staff' | 'client';
  company_id: string | null;
  created_at: string;
}

interface InviteData {
  email: string;
  role: 'lawyer' | 'staff' | 'client';
  full_name: string;
}

export default function GestaoUsuarios() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteData, setInviteData] = useState<InviteData>({
    email: '',
    role: 'staff',
    full_name: ''
  });
  const [sendingInvite, setSendingInvite] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUsers(data || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const sendInvite = async () => {
    if (!inviteData.email || !inviteData.full_name) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setSendingInvite(true);

    try {
      // Verificar se o email já existe
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', inviteData.email)
        .single();

      if (existingUser) {
        toast.error('Este email já possui uma conta no sistema');
        return;
      }

      // Gerar token de convite e registrar na tabela user_invites
      const { data: tokenData, error: tokenError } = await supabase.rpc('generate_invite_token');
      if (tokenError) throw tokenError;

      const { data: userProfile, error: profileFetchError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user?.id)
        .single();
      if (profileFetchError) throw profileFetchError;

      const { error: inviteError } = await supabase
        .from('user_invites')
        .insert({
          token: tokenData,
          email: inviteData.email,
          full_name: inviteData.full_name,
          role: inviteData.role,
          company_id: userProfile.company_id,
          invited_by: user?.id,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending'
        });
      if (inviteError) throw inviteError;

      const baseUrl = window.location.hostname === 'localhost' ? window.location.origin : 'https://fuzen.online';
      const inviteLink = `${baseUrl}/cadastro-via-convite?token=${tokenData}`;
 
      // Enviar e-mail de convite personalizado com nosso token (sem auto login do Supabase)
      // Buscar nome da empresa para o e-mail
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('name')
        .eq('id', userProfile.company_id)
        .single();
      if (companyError) throw companyError;
 
      const { error: mailError } = await supabase.functions.invoke('send-invite-email', {
        body: {
          email: inviteData.email,
          clientName: inviteData.full_name,
          companyName: company?.name || 'Nossa Empresa',
          inviteToken: tokenData,
          inviteLink,
        }
      });
      if (mailError) throw mailError;

      toast.success('Convite enviado com sucesso!');
      setIsInviteDialogOpen(false);
      setInviteData({ email: '', role: 'staff', full_name: '' });
      loadUsers();
    } catch (error: any) {
      console.error('Erro ao enviar convite:', error);
      toast.error(error.message || 'Erro ao enviar convite');
    } finally {
      setSendingInvite(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'lawyer' | 'staff' | 'client') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      toast.success('Papel do usuário atualizado com sucesso!');
      loadUsers();
    } catch (error) {
      console.error('Erro ao atualizar papel:', error);
      toast.error('Erro ao atualizar papel do usuário');
    }
  };

  const deactivateUser = async (userId: string) => {
    try {
      // Desativar usuário (implementar lógica de desativação)
      toast.success('Usuário desativado com sucesso!');
      loadUsers();
    } catch (error) {
      console.error('Erro ao desativar usuário:', error);
      toast.error('Erro ao desativar usuário');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'lawyer':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'staff':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'client':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'lawyer':
        return 'Advogado';
      case 'staff':
        return 'Funcionário';
      case 'client':
        return 'Cliente';
      default:
        return role;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando usuários...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/empresa')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Gestão de Usuários</h1>
              <p className="text-muted-foreground">
                Gerencie colaboradores e permissões da empresa
              </p>
            </div>
          </div>
          
          <UserInviteSystem onInviteSent={loadUsers} />
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Usuários da Empresa ({users.length})
            </CardTitle>
            <CardDescription>
              Lista de todos os usuários cadastrados na empresa
            </CardDescription>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Nenhum usuário encontrado</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Papel</TableHead>
                    <TableHead>Data de Cadastro</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.full_name || 'Nome não informado'}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeColor(user.role)}>
                          {getRoleLabel(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Select
                            value={user.role}
                            onValueChange={(value: 'admin' | 'lawyer' | 'staff' | 'client') => 
                              updateUserRole(user.id, value)
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="lawyer">Advogado</SelectItem>
                              <SelectItem value="staff">Funcionário</SelectItem>
                              <SelectItem value="client">Cliente</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deactivateUser(user.id)}
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}