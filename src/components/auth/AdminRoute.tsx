import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useRef } from 'react';

interface AdminRouteProps {
  children: React.ReactNode;
}

// AdminRoute agora é APENAS para platform_admin
const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { isPlatformAdmin, loading: roleLoading } = useUserRole();
  const location = useLocation();
  const { toast } = useToast();
  
  const loading = authLoading || roleLoading;
  const unauthorized = !isPlatformAdmin;
  const toastShownRef = useRef(false);

  useEffect(() => {
    if (unauthorized && user) {
      if (!toastShownRef.current) {
        toast({
          title: "Acesso Restrito",
          description: "Apenas administradores da plataforma podem acessar esta área.",
          variant: "destructive"
        });
        toastShownRef.current = true;
      }
    } else {
      toastShownRef.current = false;
    }
  }, [unauthorized, user]);

  // Show loading while checking auth and role
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Access denied if not platform admin
  if (unauthorized) {
    return <Navigate to="/" replace />;
  }

  // Render children if platform admin
  return <>{children}</>;
};

export default AdminRoute;