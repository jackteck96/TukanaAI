import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 
  | 'platform_admin' 
  | 'company_admin' 
  | 'company_collaborator' 
  | 'client' 
  | 'client_collaborator';

interface UserRoleData {
  role: AppRole;
  company_id: string | null;
  client_email: string | null;
}

export const useUserRole = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<UserRoleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [primaryRole, setPrimaryRole] = useState<AppRole | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRoles = async () => {
      if (!user?.id) {
        setRoles([]);
        setPrimaryRole(null);
        setCompanyId(null);
        setLoading(false);
        return;
      }

      try {
        // Prefer roles from user_roles via RPC (supports multiple roles including platform_admin)
        const { data: rolesData, error: rolesError } = await supabase
          .rpc('get_user_role_details' as any, { user_uuid: user.id });

        if (!rolesError && Array.isArray(rolesData) && rolesData.length > 0) {
          const mapped: UserRoleData[] = rolesData.map((r: any) => ({
            role: mapDbRole(r.role),
            company_id: r.company_id ?? null,
            client_email: r.client_email ?? null,
          }));

          setRoles(mapped);

          // Determine primary role (prioritize platform_admin > company_admin > company_collaborator > client > client_collaborator)
          const roleOrder: AppRole[] = [
            'platform_admin',
            'company_admin',
            'company_collaborator',
            'client',
            'client_collaborator',
          ];
          const primary = roleOrder.find((r) => mapped.some((m) => m.role === r)) ?? mapped[0].role;
          setPrimaryRole(primary);

          const firstCompany = mapped.find((m) => m.company_id)?.company_id ?? null;
          setCompanyId(firstCompany);
          return;
        }

        // Fallback to profiles for legacy setups
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role, company_id, email')
          .eq('id', user.id)
          .single();

        if (profileData) {
          const mappedRole = mapLegacyRole(profileData.role);
          const roleData: UserRoleData = {
            role: mappedRole,
            company_id: profileData.company_id,
            client_email: profileData.role === 'client' ? profileData.email : null,
          };

          setRoles([roleData]);
          setPrimaryRole(mappedRole);
          setCompanyId(profileData.company_id);
        }
      } catch (error) {
        console.error('Error fetching user roles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRoles();
  }, [user?.id]);

  const hasRole = (role: AppRole): boolean => {
    return roles.some(r => r.role === role);
  };

  const hasAnyRole = (checkRoles: AppRole[]): boolean => {
    return roles.some(r => checkRoles.includes(r.role));
  };

  const isPlatformAdmin = hasRole('platform_admin');
  const isCompanyUser = hasAnyRole(['company_admin', 'company_collaborator']);
  const isClientUser = hasAnyRole(['client', 'client_collaborator']);

  return {
    roles,
    primaryRole,
    companyId,
    loading,
    hasRole,
    hasAnyRole,
    isPlatformAdmin,
    isCompanyUser,
    isClientUser
  };
};

// Helper para mapear roles antigos para novos
function mapLegacyRole(oldRole: string): AppRole {
  switch (oldRole) {
    case 'admin':
      return 'company_admin';
    case 'lawyer':
    case 'staff':
      return 'company_collaborator';
    case 'client':
      return 'client';
    default:
      return 'company_collaborator';
  }
}

function mapDbRole(dbRole: string): AppRole {
  switch (dbRole) {
    case 'platform_admin':
      return 'platform_admin';
    case 'company_admin':
      return 'company_admin';
    case 'company_collaborator':
      return 'company_collaborator';
    case 'client':
      return 'client';
    case 'client_collaborator':
      return 'client_collaborator';
    // Legacy fallbacks
    case 'admin':
      return 'company_admin';
    case 'lawyer':
    case 'staff':
      return 'company_collaborator';
    default:
      return 'company_collaborator';
  }
}
