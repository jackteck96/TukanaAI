import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Loader2, Shield, Users } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import UserInviteSystem from '@/components/UserInviteSystem';
import { CollaboratorPermissionsModal } from '@/components/CollaboratorPermissionsModal';
import ClientCollaboratorInvite from '@/components/ClientCollaboratorInvite';

interface Collaborator {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

interface PermissionData {
  access_type: 'full' | 'limited';
  process_count: number;
  total_processes: number;
}

export default function GestaoPermissoes() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { primaryRole, companyId, loading: roleLoading } = useUserRole();
  const { company } = useCompany();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [permissions, setPermissions] = useState<Record<string, PermissionData>>({});
  const [selectedCollaborator, setSelectedCollaborator] = useState<Collaborator | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [clientEmail, setClientEmail] = useState<string | null>(null);
  const [quickSelectedId, setQuickSelectedId] = useState<string | null>(null);

  const isCompanyAdmin = primaryRole === 'company_admin' || (primaryRole === 'platform_admin' && !!(company?.id ?? companyId));
  const isClient = primaryRole === 'client';
  const isClientOrClientCollab = primaryRole === 'client' || primaryRole === 'client_collaborator';
  const effectiveCompanyId = company?.id ?? companyId ?? undefined;

  // Debug detalhado
  useEffect(() => {
    console.log('[GestaoPermissoes] Estado completo:', { 
      primaryRole, 
      companyId, 
      effectiveCompanyId, 
      loading,
      isCompanyAdmin,
      companyName: company?.name
    });
  }, [primaryRole, companyId, effectiveCompanyId, loading, isCompanyAdmin, company]);

  // Verificar autorização: apenas company_admin, client e client_collaborator podem acessar
  useEffect(() => {
    if (!loading && primaryRole && primaryRole === 'company_collaborator') {
      toast({
        title: 'Acesso negado',
        description: 'Apenas administradores da empresa podem gerenciar permissões',
        variant: 'destructive'
      });
      navigate(getDashboardRoute());
    }
  }, [primaryRole, loading]);

  const getDashboardRoute = () => {
    // Se é admin da empresa ou colaborador E tem company_id, vai para /empresa
    if ((primaryRole === 'company_admin' || primaryRole === 'company_collaborator') && companyId) {
      return '/empresa';
    }
    // Se é cliente ou colaborador de cliente, vai para /cliente
    if (primaryRole === 'client' || primaryRole === 'client_collaborator') {
      return '/cliente';
    }
    // Se é admin da plataforma (sem company_id), vai para /admin
    if (primaryRole === 'platform_admin' && !companyId) {
      return '/admin';
    }
    // Fallback: se não se encaixa em nenhum, tenta decidir com base no contexto
    if (companyId) return '/empresa';
    if (clientEmail) return '/cliente';
    // Último fallback
    return '/empresa';
  };

  useEffect(() => {
    loadData();
  }, [user, companyId, primaryRole, company?.id]);

  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let collaboratorsData: Collaborator[] = [];
      let contextCompanyId: string | undefined;
      let contextClientEmail: string | undefined;
      let rolesByUser: Record<string, string[]> = {};

      if (primaryRole === 'company_admin' || primaryRole === 'company_collaborator') {
        // Contexto de empresa: carregar colaboradores exatamente como na Gestão de Colaboradores
        contextCompanyId = effectiveCompanyId;

        if (!contextCompanyId) {
          collaboratorsData = [];
        } else {
          // 1) Buscar apenas colaboradores ativos via user_roles
          const { data: roleLinks, error: rolesError } = await supabase
            .from('user_roles')
            .select('user_id, role')
            .eq('company_id', contextCompanyId)
            .eq('role', 'company_collaborator')
            .neq('user_id', user.id);

          if (rolesError) throw rolesError;

          if (!roleLinks || roleLinks.length === 0) {
            collaboratorsData = [];
          } else {
            const listedUserIds = roleLinks.map((r: any) => r.user_id as string);

            // 2) Buscar profiles apenas dos colaboradores ativos
            const { data: profilesData, error: profilesError } = await supabase
              .from('profiles')
              .select('id, email, full_name')
              .in('id', listedUserIds);

            if (profilesError) throw profilesError;

            // 3) Montar rolesByUser para compatibilidade
            rolesByUser = roleLinks.reduce((acc: Record<string, string[]>, r: any) => {
              acc[r.user_id] = [r.role];
              return acc;
            }, {});

            collaboratorsData = (profilesData || []).map((p: any) => ({
              id: p.id,
              email: p.email,
              full_name: p.full_name,
              role: (rolesByUser[p.id] || []).join(',')
            }));
          }
        }

      } else if (primaryRole === 'client') {
        // Contexto de cliente: carregar email do cliente e seus colaboradores
        const { data: profileData } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', user.id)
          .maybeSingle();

        if (profileData?.email) {
          contextClientEmail = profileData.email;
          setClientEmail(profileData.email);

          // Buscar colaboradores via user_roles
          const { data: rolesData, error: rolesError } = await supabase
            .from('user_roles')
            .select('user_id')
            .eq('role', 'client_collaborator')
            .eq('client_email', profileData.email);

          if (rolesError) throw rolesError;

          if (rolesData && rolesData.length > 0) {
            const userIds = rolesData.map(r => r.user_id);
            const { data: profilesData, error: profilesError } = await supabase
              .from('profiles')
              .select('id, email, full_name, role')
              .in('id', userIds);

            if (profilesError) throw profilesError;
            collaboratorsData = profilesData || [];
          }
        }

      } else if (primaryRole === 'client_collaborator') {
        // Contexto de colaborador de cliente: obter o email do cliente associado
        const { data: roleLink, error: roleErr } = await supabase
          .from('user_roles')
          .select('client_email')
          .eq('user_id', user.id)
          .eq('role', 'client_collaborator')
          .maybeSingle();

        if (roleErr) throw roleErr;
        if (roleLink?.client_email) {
          contextClientEmail = roleLink.client_email as string;
          setClientEmail(contextClientEmail);

          // Carregar colaboradores vinculados ao mesmo cliente
          const { data: rolesData, error: rolesError } = await supabase
            .from('user_roles')
            .select('user_id')
            .eq('role', 'client_collaborator')
            .eq('client_email', contextClientEmail);

          if (rolesError) throw rolesError;

          if (rolesData && rolesData.length > 0) {
            const userIds = rolesData.map(r => r.user_id);
            const { data: profilesData, error: profilesError } = await supabase
              .from('profiles')
              .select('id, email, full_name, role')
              .in('id', userIds);

            if (profilesError) throw profilesError;
            collaboratorsData = profilesData || [];
          }
        }
      }

      setCollaborators(collaboratorsData);
      console.log('[GestaoPermissoes] colaboradores:', collaboratorsData.length);

      // Carregar permissões em lote para melhor performance
      const permissionsMap: Record<string, PermissionData> = {};
      const userIds = collaboratorsData.map(c => c.id);

      // Contar total de processos uma única vez
      let totalProcessesQuery = supabase
        .from('processes')
        .select('id', { count: 'exact', head: true });

      if (contextCompanyId) {
        totalProcessesQuery = totalProcessesQuery.eq('company_id', contextCompanyId);
      } else if (contextClientEmail) {
        totalProcessesQuery = totalProcessesQuery.eq('client_email', contextClientEmail);
      }

      const { count: totalCount } = await totalProcessesQuery;

      if (userIds.length > 0) {
        let permsQuery = supabase
          .from('collaborator_permissions')
          .select('user_id, access_type, id, collaborator_process_access(count)')
          .in('user_id', userIds);

        if (contextCompanyId) {
          permsQuery = permsQuery.eq('company_id', contextCompanyId);
        } else if (contextClientEmail) {
          permsQuery = permsQuery.eq('client_email', contextClientEmail);
        }

        const { data: permsData, error: permsError } = await permsQuery;
        if (permsError) throw permsError;

        const permByUser: Record<string, any> = {};
        (permsData || []).forEach((p: any) => {
          permByUser[p.user_id] = p;
        });

        for (const collab of collaboratorsData) {
          const p = permByUser[collab.id];
          if (p) {
            const access = p.access_type as 'full' | 'limited';
            permissionsMap[collab.id] = {
              access_type: access,
              process_count: access === 'full' ? (totalCount || 0) : (p.collaborator_process_access?.[0]?.count || 0),
              total_processes: totalCount || 0,
            };
          } else {
            const isAdminCollab = (rolesByUser[collab.id] || []).includes('company_admin');
            permissionsMap[collab.id] = {
              access_type: isAdminCollab && !!contextCompanyId ? 'full' : 'limited',
              process_count: isAdminCollab && !!contextCompanyId ? (totalCount || 0) : 0,
              total_processes: totalCount || 0,
            };
          }
        }
      }

      setPermissions(permissionsMap);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar dados de permissões',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditPermissions = (collaborator: Collaborator) => {
    setSelectedCollaborator(collaborator);
    setModalOpen(true);
  };

  const getAccessTypeBadge = (accessType: 'full' | 'limited') => {
    if (accessType === 'full') {
      return <Badge className="bg-green-500">Acesso Total</Badge>;
    }
    return <Badge variant="secondary">Acesso Limitado</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate(getDashboardRoute())}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Permissões de Colaboradores</h1>
            <p className="text-muted-foreground">
              Gerencie o acesso dos colaboradores aos processos
            </p>
          </div>
        </div>

        {/* Ações Rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>Convide, gerencie e edite permissões rapidamente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Convidar Colaborador - Apenas para company_admin */}
              {roleLoading ? (
                <Button variant="outline" disabled>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Carregando...
                </Button>
              ) : isCompanyAdmin ? (
                <UserInviteSystem onInviteSent={loadData} />
              ) : isClientOrClientCollab ? (
                clientEmail ? (
                  <ClientCollaboratorInvite clientEmail={clientEmail} onInviteSent={loadData} />
                ) : (
                  <Button variant="outline" disabled>Carregando…</Button>
                )
              ) : (
                <div className="space-y-2">
                  <Button variant="outline" disabled>Indisponível</Button>
                  <p className="text-xs text-muted-foreground">
                    Role detectado: {primaryRole || 'nenhum'}. Abra o console (F12) para mais detalhes.
                  </p>
                </div>
              )}

              {/* Gerenciar Colaboradores */}
              <div className="flex flex-col gap-2">
                <Button variant="outline" onClick={() => navigate('/gestao-colaboradores')}>
                  <Users className="h-4 w-4 mr-2" />
                  Gerenciar Colaboradores
                </Button>
              </div>

              {/* Selecionar colaborador para editar permissões */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Selecionar Colaborador</div>
                <Select value={quickSelectedId || undefined} onValueChange={(v) => setQuickSelectedId(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder={collaborators.length === 0 ? 'Nenhum colaborador' : 'Escolha um colaborador'} />
                  </SelectTrigger>
                  <SelectContent>
                    {collaborators.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        Nenhum colaborador encontrado
                      </div>
                    ) : (
                      collaborators.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.full_name || c.email}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  disabled={!quickSelectedId}
                  onClick={() => {
                    const collab = collaborators.find((c) => c.id === quickSelectedId);
                    if (collab) handleEditPermissions(collab);
                  }}
                >
                  Editar Permissões
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Colaboradores
            </CardTitle>
            <CardDescription>
              Configure quais processos cada colaborador pode acessar
            </CardDescription>
          </CardHeader>
          <CardContent>
            {collaborators.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum colaborador encontrado
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Tipo de Acesso</TableHead>
                    <TableHead>Processos Autorizados</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collaborators.map(collaborator => {
                    const perm = permissions[collaborator.id];
                    return (
                      <TableRow key={collaborator.id}>
                        <TableCell className="font-medium">
                          {collaborator.full_name}
                        </TableCell>
                        <TableCell>{collaborator.email}</TableCell>
                        <TableCell>
                          {perm ? getAccessTypeBadge(perm.access_type) : (
                            <Badge variant="outline">Não configurado</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {perm ? (
                            perm.access_type === 'full' ? (
                              <span className="text-sm text-muted-foreground">
                                Todos ({perm.total_processes})
                              </span>
                            ) : (
                              <span className="text-sm">
                                {perm.process_count} de {perm.total_processes}
                              </span>
                            )
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditPermissions(collaborator)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Editar Permissões
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedCollaborator && (
        <CollaboratorPermissionsModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          collaborator={selectedCollaborator}
          companyId={isCompanyAdmin ? effectiveCompanyId : undefined}
          clientEmail={isClientOrClientCollab ? clientEmail || undefined : undefined}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}
