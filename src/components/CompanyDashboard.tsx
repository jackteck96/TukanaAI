import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Building2, 
  Users, 
  FileText, 
  HardDrive, 
  Calendar,
  Crown,
  Zap,
  TrendingUp,
  Settings
} from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import PlanLimitChecker from './PlanLimitChecker';

const CompanyDashboard = () => {
  const { company, subscription, usageMetrics, refreshMetrics } = useCompany();
  const { user } = useAuth();

  if (!company || !subscription || !usageMetrics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard da Empresa</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-20"></div>
                <div className="h-4 w-4 bg-muted rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16 mb-2"></div>
                <div className="h-3 bg-muted rounded w-24"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const getPlanIcon = () => {
    switch (subscription.plan) {
      case 'professional':
        return <Crown className="h-4 w-4" />;
      case 'enterprise':
        return <Zap className="h-4 w-4" />;
      default:
        return <Building2 className="h-4 w-4" />;
    }
  };

  const getPlanDisplayName = () => {
    switch (subscription.plan) {
      case 'starter':
        return 'Starter';
      case 'professional':
        return 'Professional';
      case 'enterprise':
        return 'Enterprise';
      default:
        return subscription.plan;
    }
  };

  const getStatusColor = () => {
    switch (subscription.status) {
      case 'active':
        return 'bg-green-500';
      case 'trial':
        return 'bg-blue-500';
      case 'expired':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (subscription.status) {
      case 'active':
        return 'Ativo';
      case 'trial':
        return 'Trial';
      case 'expired':
        return 'Expirado';
      case 'canceled':
        return 'Cancelado';
      default:
        return subscription.status;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getPlanLimits = () => {
    switch (subscription.plan) {
      case 'starter':
        return { users: 3, documents: 100 };
      case 'professional':
        return { users: 10, documents: 1000 };
      case 'enterprise':
        return { users: -1, documents: -1 };
      default:
        return { users: 3, documents: 100 };
    }
  };

  const limits = getPlanLimits();
  const userProgress = limits.users === -1 ? 0 : (usageMetrics.user_count / limits.users) * 100;
  const docProgress = limits.documents === -1 ? 0 : (usageMetrics.document_count / limits.documents) * 100;

  const isTrialExpiringSoon = subscription.status === 'trial' && 
    subscription.trial_ends_at && 
    new Date(subscription.trial_ends_at).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000; // 7 days

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{company.name}</h1>
          <p className="text-muted-foreground">Dashboard da empresa</p>
        </div>
        <Button variant="outline" onClick={refreshMetrics}>
          <TrendingUp className="mr-2 h-4 w-4" />
          Atualizar Métricas
        </Button>
      </div>

      {/* Plan Status Alert */}
      {isTrialExpiringSoon && (
        <PlanLimitChecker limitType="users" className="mb-4" />
      )}

      {/* Subscription Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getPlanIcon()}
            Plano {getPlanDisplayName()}
          </CardTitle>
          <CardDescription>
            Informações da sua assinatura
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Status:</span>
            <Badge className={getStatusColor()}>
              {getStatusText()}
            </Badge>
          </div>
          
          {subscription.status === 'trial' && subscription.trial_ends_at && (
            <div className="flex items-center justify-between">
              <span>Trial expira em:</span>
              <span className="text-sm">
                {new Date(subscription.trial_ends_at).toLocaleDateString('pt-BR')}
              </span>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <span>Próxima renovação:</span>
            <span className="text-sm">
              {new Date(subscription.current_period_end).toLocaleDateString('pt-BR')}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Usage Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usageMetrics.user_count}</div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                {limits.users === -1 
                  ? 'Ilimitado' 
                  : `de ${limits.users} usuários`
                }
              </p>
              {limits.users !== -1 && (
                <Progress value={userProgress} className="h-1" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documentos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usageMetrics.document_count}</div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                {limits.documents === -1 
                  ? 'Ilimitado' 
                  : `de ${limits.documents} documentos`
                }
              </p>
              {limits.documents !== -1 && (
                <Progress value={docProgress} className="h-1" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Armazenamento</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatBytes(usageMetrics.storage_used_bytes)}
            </div>
            <p className="text-xs text-muted-foreground">
              Espaço utilizado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Última Atualização</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {new Date(usageMetrics.last_calculated_at).toLocaleDateString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date(usageMetrics.last_calculated_at).toLocaleTimeString('pt-BR')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Plan Limit Checkers */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Limite de Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <PlanLimitChecker limitType="users" showProgress />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Limite de Documentos</CardTitle>
          </CardHeader>
          <CardContent>
            <PlanLimitChecker limitType="documents" showProgress />
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>
            Gerencie sua empresa e configurações
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Configurações da Empresa
          </Button>
          <Button variant="outline">
            <Users className="mr-2 h-4 w-4" />
            Gerenciar Usuários
          </Button>
          <Button>
            <Crown className="mr-2 h-4 w-4" />
            Fazer Upgrade
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyDashboard;