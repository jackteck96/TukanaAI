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
import { ArrowLeft, Edit, Loader2, Shield } from 'lucide-react';
import { CollaboratorPermissionsModal } from '@/components/CollaboratorPermissionsModal';

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
  const { primaryRole, companyId } = useUserRole();
  const { company } = useCompany();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [permissions, setPermissions] = useState<Record<string, PermissionData>>({});
  const [selectedCollaborator, setSelectedCollaborator] = useState<Collaborator | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [clientEmail, setClientEmail] = useState<string | null>(null);

  const isCompanyAdmin = primaryRole === 'company_admin';
  const isClient = primaryRole === 'client';

  useEffect(() => {
    loadData();
  }, [user, companyId, primaryRole]);

  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let collaboratorsData: Collaborator[] = [];
      let contextCompanyId: string | undefined;
      let contextClientEmail: string | undefined;

      if (isCompanyAdmin && companyId) {
        // Carregar colaboradores da empresa
        contextCompanyId = companyId;
        const { data, error } = await supabase
          .from('profiles')
          .select('id, email, full_name, role')
          .eq('company_id', companyId)
          .in('role', ['staff', 'lawyer']);

        if (error) throw error;
        collaboratorsData = data || [];
      } else if (isClient) {
        // Carregar email do cliente e seus colaboradores
        const { data: profileData } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', user.id)
          .single();

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
      }

      setCollaborators(collaboratorsData);

      // Carregar permissões para cada colaborador
      const permissionsMap: Record<string, PermissionData> = {};

      for (const collab of collaboratorsData) {
        // Buscar permissão do colaborador
        let permissionQuery = supabase
          .from('collaborator_permissions')
          .select(`
            access_type,
            collaborator_process_access(count)
          `)
          .eq('user_id', collab.id);

        if (contextCompanyId) {
          permissionQuery = permissionQuery.eq('company_id', contextCompanyId);
        } else if (contextClientEmail) {
          permissionQuery = permissionQuery.eq('client_email', contextClientEmail);
        }

        const { data: permData } = await permissionQuery.maybeSingle();

        // Contar total de processos
        let totalProcessesQuery = supabase
          .from('processes')
          .select('id', { count: 'exact', head: true });

        if (contextCompanyId) {
          totalProcessesQuery = totalProcessesQuery.eq('company_id', contextCompanyId);
        } else if (contextClientEmail) {
          totalProcessesQuery = totalProcessesQuery.eq('client_email', contextClientEmail);
        }

        const { count: totalCount } = await totalProcessesQuery;

        if (permData) {
          permissionsMap[collab.id] = {
            access_type: permData.access_type as 'full' | 'limited',
            process_count: permData.access_type === 'full' 
              ? (totalCount || 0)
              : (permData.collaborator_process_access?.[0]?.count || 0),
            total_processes: totalCount || 0
          };
        } else {
          // Sem permissão configurada
          permissionsMap[collab.id] = {
            access_type: 'limited',
            process_count: 0,
            total_processes: totalCount || 0
          };
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
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Permissões de Colaboradores</h1>
            <p className="text-muted-foreground">
              Gerencie o acesso dos colaboradores aos processos
            </p>
          </div>
        </div>

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
          companyId={isCompanyAdmin ? companyId || undefined : undefined}
          clientEmail={isClient ? clientEmail || undefined : undefined}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}
