import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Clock, 
  CheckCircle, 
  X, 
  Search,
  Crown,
  Shield,
  User,
  Trash2,
  ArrowLeft,
  Copy,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import UserInviteSystem from '@/components/UserInviteSystem';
import PlanLimitChecker from '@/components/PlanLimitChecker';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'lawyer' | 'staff' | 'client';
  access_type?: 'full' | 'restricted';
  created_at: string;
  status: 'active' | 'pending';
  invite_token?: string;
  invite_id?: string;
}


const GestaoColaboradores = () => {
  const { user } = useAuth();
  const { company, subscription, usageMetrics, refreshMetrics } = useCompany();
  const navigate = useNavigate();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPermission, setFilterPermission] = useState<string>('all');

  const fetchTeamMembers = async () => {
    if (!user || !company) return;

    try {
      // 1. Buscar colaboradores ativos (já confirmados)
      const { data: roleLinks, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role, created_at')
        .eq('company_id', company.id)
        .eq('role', 'company_collaborator');

      if (rolesError) throw rolesError;

      const activeMembers: TeamMember[] = [];

      if (roleLinks && roleLinks.length > 0) {
        const userIds = roleLinks.map((r) => r.user_id);

        // Buscar perfis dos colaboradores confirmados
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, email, created_at')
          .in('id', userIds);

        if (profilesError) throw profilesError;

        // Buscar permissões dos colaboradores
        const { data: permissionsData, error: permissionsError } = await supabase
          .from('collaborator_permissions')
          .select('user_id, access_type')
          .eq('company_id', company.id)
          .in('user_id', userIds);

        if (permissionsError) throw permissionsError;

        // Montar lista de colaboradores ativos
        roleLinks.forEach((link) => {
          const profile = profilesData?.find((p) => p.id === link.user_id);
          if (!profile) return;

          const permission = permissionsData?.find((p) => p.user_id === link.user_id);

          activeMembers.push({
            id: profile.id,
            full_name: profile.full_name,
            email: profile.email,
            role: 'staff',
            access_type: permission?.access_type as 'full' | 'restricted' | undefined,
            created_at: profile.created_at || link.created_at,
            status: 'active',
          });
        });
      }

      // 2. Buscar convites pendentes de colaboradores
      const { data: invitesData, error: invitesError } = await supabase
        .from('user_invites')
        .select('id, email, full_name, token, created_at')
        .eq('company_id', company.id)
        .eq('status', 'pending')
        .in('role', ['admin', 'lawyer', 'staff']);

      if (invitesError) throw invitesError;

      const pendingMembers: TeamMember[] = (invitesData || []).map((invite) => ({
        id: invite.id,
        full_name: invite.full_name,
        email: invite.email,
        role: 'staff',
        created_at: invite.created_at,
        status: 'pending' as const,
        invite_token: invite.token,
        invite_id: invite.id,
      }));

      // 3. Combinar ambas as listas
      const allMembers = [...activeMembers, ...pendingMembers];
      console.log('Total de colaboradores (ativos + pendentes):', allMembers.length);
      setTeamMembers(allMembers);
    } catch (error) {
      console.error('Error fetching team members:', error);
      toast.error('Erro ao carregar membros da equipe');
    }
  };


  const removeTeamMember = async (memberId: string, memberEmail: string, status: 'active' | 'pending', inviteId?: string) => {
    if (memberId === user?.id) {
      toast.error('Você não pode remover a si mesmo');
      return;
    }

    if (!company) return;

    try {
      if (status === 'pending' && inviteId) {
        // Remover convite pendente
        const { error } = await supabase
          .from('user_invites')
          .delete()
          .eq('id', inviteId);

        if (error) throw error;
        toast.success(`Convite de ${memberEmail} foi removido`);
      } else {
        // Remover colaborador ativo
        // 1. Deletar permissões do colaborador
        const { error: permError } = await supabase
          .from('collaborator_permissions')
          .delete()
          .eq('user_id', memberId)
          .eq('company_id', company.id);

        if (permError) {
          console.error('Erro ao deletar permissões:', permError);
        }

        // 2. Deletar acessos a processos específicos
        const { data: permissions } = await supabase
          .from('collaborator_permissions')
          .select('id')
          .eq('user_id', memberId)
          .eq('company_id', company.id);

        if (permissions && permissions.length > 0) {
          const permissionIds = permissions.map(p => p.id);
          await supabase
            .from('collaborator_process_access')
            .delete()
            .in('permission_id', permissionIds);
        }

        // 3. Deletar vínculo na tabela user_roles
        const { error: roleError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', memberId)
          .eq('company_id', company.id);

        if (roleError) throw roleError;

        // 4. Verificar se usuário ainda tem outros vínculos
        const { data: remainingRoles, error: checkError } = await supabase
          .from('user_roles')
          .select('id')
          .eq('user_id', memberId)
          .limit(1);

        if (checkError) {
          console.error('Erro ao verificar roles restantes:', checkError);
        }

        // 5. Se não tiver outros vínculos, deletar o profile
        if (!remainingRoles || remainingRoles.length === 0) {
          const { error: profileError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', memberId);

          if (profileError) {
            console.error('Erro ao deletar profile:', profileError);
          }
        }

        toast.success(`${memberEmail} foi removido permanentemente`);
      }

      await fetchTeamMembers();
      await refreshMetrics();
    } catch (error) {
      console.error('Error removing team member:', error);
      toast.error('Erro ao remover membro da equipe');
    }
  };

  const resendInviteEmail = async (email: string, fullName: string, token: string) => {
    try {
      if (!user || !company?.id) return;

      const inviteLink = `${window.location.origin}/cadastro-via-convite?token=${token}`;

      const { error } = await supabase.functions.invoke('send-unified-email', {
        body: {
          email,
          full_name: fullName,
          companyId: company.id,
          inviteLink,
          inviterName: user?.user_metadata?.full_name || user?.email || company.name,
          role: 'staff',
          isCollaborator: true
        }
      });

      if (error) throw error;
      toast.success('Email de convite reenviado com sucesso!');
    } catch (error) {
      console.error('Erro ao reenviar convite:', error);
      toast.error('Erro ao reenviar email de convite');
    }
  };

  const copyInviteLink = async (token: string) => {
    const inviteLink = `${window.location.origin}/cadastro-via-convite?token=${token}`;
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast.success('Link de convite copiado!');
    } catch (error) {
      console.error('Erro ao copiar link:', error);
      toast.error('Erro ao copiar link');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4" />;
      case 'lawyer':
        return <Shield className="h-4 w-4" />; // Keep for existing data
      case 'staff':
        return <User className="h-4 w-4" />;
      case 'client':
        return <Users className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'lawyer':
        return 'Advogado'; // Keep for existing data
      case 'staff':
        return 'Funcionário';
      case 'client':
        return 'Cliente';
      default:
        return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'lawyer':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'; // Keep for existing data
      case 'staff':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'client':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'accepted':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'expired':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'accepted':
        return 'Aceito';
      case 'expired':
        return 'Expirado';
      default:
        return status;
    }
  };

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = member.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPermission = filterPermission === 'all' || member.access_type === filterPermission;
    return matchesSearch && matchesPermission;
  });

  const refreshData = async () => {
    setLoading(true);
    await Promise.all([
      fetchTeamMembers(),
      refreshMetrics()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, [user, company]);

  if (!company || !subscription || !usageMetrics) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/empresa')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Gestão de Colaboradores</h1>
            <p className="text-muted-foreground">Gerencie os membros da sua equipe e convites pendentes</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={refreshData} disabled={loading}>
            {loading ? 'Atualizando...' : 'Atualizar'}
          </Button>
        </div>
      </div>

      {/* Plan Limits Card */}
      <PlanLimitChecker limitType="users" showProgress className="mb-6" currentOverride={teamMembers.length} />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Colaboradores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMembers.length}</div>
            <p className="text-xs text-muted-foreground">Cadastrados na empresa</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Colaboradores Ativos</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMembers.filter(m => m.status === 'active').length}</div>
            <p className="text-xs text-muted-foreground">Cadastro confirmado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Convites Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMembers.filter(m => m.status === 'pending').length}</div>
            <p className="text-xs text-muted-foreground">Aguardando confirmação</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <select
            value={filterPermission}
            onChange={(e) => setFilterPermission(e.target.value)}
            className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
          >
            <option value="all">Todas as permissões</option>
            <option value="full">Acesso Total</option>
            <option value="restricted">Acesso Restrito</option>
          </select>
        </div>
        <UserInviteSystem onInviteSent={refreshData} />
      </div>

      {/* Team Members Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Membros da Equipe
          </CardTitle>
          <CardDescription>
            Gerencie os membros da sua equipe e suas permissões
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum membro encontrado</p>
              <p className="text-sm">Convide colaboradores para sua equipe</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tipo de Permissão</TableHead>
                  <TableHead>Cadastrado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.full_name || 'Nome não informado'}
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      {member.status === 'active' ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Confirmado
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                          <Clock className="h-3 w-3 mr-1" />
                          Pendente
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {member.status === 'active' ? (
                        member.access_type ? (
                          <Badge variant={member.access_type === 'full' ? 'default' : 'secondary'}>
                            {member.access_type === 'full' ? 'Acesso Total' : 'Acesso Restrito'}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Não definido</Badge>
                        )
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(member.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {member.status === 'pending' && member.invite_token && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => resendInviteEmail(member.email, member.full_name, member.invite_token!)}
                              title="Reenviar email de convite"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyInviteLink(member.invite_token!)}
                              title="Copiar link de convite"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {member.id !== user?.id && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" title="Excluir colaborador">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {member.status === 'pending' ? 'Cancelar convite' : 'Remover colaborador'}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja {member.status === 'pending' ? 'cancelar o convite de' : 'remover'} {member.full_name || member.email}? 
                                  Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => removeTeamMember(member.id, member.email, member.status, member.invite_id)}
                                >
                                  {member.status === 'pending' ? 'Cancelar Convite' : 'Remover'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
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
  );
};

export default GestaoColaboradores;