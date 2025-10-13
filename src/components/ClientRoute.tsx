import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

interface ClientRouteProps {
  children: React.ReactNode;
}

const ClientRoute = ({ children }: ClientRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { isClientUser, isPlatformAdmin, loading: roleLoading } = useUserRole();
  const location = useLocation();
  const { toast } = useToast();
  
  const loading = authLoading || roleLoading;

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

  // Show access denied if not client user or platform admin
  if (!isClientUser && !isPlatformAdmin) {
    useEffect(() => {
      toast({
        title: "Acesso Restrito",
        description: "Apenas clientes podem acessar esta área.",
        variant: "destructive"
      });
    }, []);
    
    return <Navigate to="/" replace />;
  }

  // Render children if authorized
  return <>{children}</>;
};

export default ClientRoute;
