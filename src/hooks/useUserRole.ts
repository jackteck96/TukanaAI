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
        // Usar query SQL direta temporariamente
        const { data, error } = await supabase
          .rpc('get_current_user_role' as any);

        if (!error && data) {
          // Por enquanto, usar o role principal do profiles
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
              client_email: profileData.role === 'client' ? profileData.email : null
            };
            
            setRoles([roleData]);
            setPrimaryRole(mappedRole);
            setCompanyId(profileData.company_id);
          }
        }
      } catch (error) {
        console.error('Error fetching user roles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRoles();
  }, [user]);

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
