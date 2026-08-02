import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireCompany?: boolean;
  requireClient?: boolean;
  requirePlatformAdmin?: boolean;
}

const ProtectedRoute = ({ 
  children, 
  requireCompany = false,
  requireClient = false,
  requirePlatformAdmin = false
}: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { primaryRole, loading: roleLoading, isPlatformAdmin, isCompanyUser, isClientUser } = useUserRole();
  const location = useLocation();
  
  const loading = authLoading || roleLoading;

  // Show loading spinner while checking auth status
  if (loading) {
    console.log('[ProtectedRoute] loading auth...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/5">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth page if not authenticated
  if (!user) {
    console.log('[ProtectedRoute] not authenticated, redirecting to /auth');
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Require platform admin
  if (requirePlatformAdmin && !loading && !isPlatformAdmin) {
    console.log('[ProtectedRoute] Platform admin required, redirecting');
    return <Navigate to="/" replace />;
  }

  // Require company user
  if (requireCompany && !loading && !isCompanyUser && !isPlatformAdmin) {
    console.log('[ProtectedRoute] Company role required, redirecting');
    return <Navigate to="/" replace />;
  }

  // Require client user
  if (requireClient && !loading && !isClientUser && !isPlatformAdmin) {
    console.log('[ProtectedRoute] Client role required, redirecting');
    return <Navigate to="/" replace />;
  }

  console.log('[ProtectedRoute] authenticated and authorized, rendering child route');
  return <>{children}</>;
};

export default ProtectedRoute;