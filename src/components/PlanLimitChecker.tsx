import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Crown, Zap } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';

interface PlanLimitCheckerProps {
  limitType: 'users' | 'documents';
  showProgress?: boolean;
  className?: string;
  currentOverride?: number; // quando fornecido, usa este valor como uso atual
}

const PlanLimitChecker: React.FC<PlanLimitCheckerProps> = ({ 
  limitType, 
  showProgress = false,
  className = '',
  currentOverride,
}) => {
  const { checkPlanLimits, subscription, usageMetrics } = useCompany();
  const [limits, setLimits] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLimits = async () => {
      setLoading(true);
      const result = await checkPlanLimits(limitType);
      setLimits(result);
      setLoading(false);
    };

    fetchLimits();
  }, [limitType, checkPlanLimits, usageMetrics]);

  if (loading || !limits) return null;

  const { limit, plan } = limits;
  const isUnlimited = limit === -1;

  // Ajuste: usar métricas atuais do contexto para usuários (fonte da verdade pós-exclusão)
  const effectiveCurrent =
    currentOverride ?? (limitType === 'users' && usageMetrics ? usageMetrics.user_count : limits.current_usage);

  const usage_percentage = isUnlimited ? 0 : (effectiveCurrent / limit) * 100;
  const isNearLimit = usage_percentage >= 80;
  const isAtLimit = usage_percentage >= 100;
  const effectiveCanAdd = isUnlimited || effectiveCurrent < limit;

  const getPlanIcon = () => {
    switch (plan) {
      case 'professional':
        return <Crown className="h-4 w-4" />;
      case 'enterprise':
        return <Zap className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getPlanDisplayName = () => {
    switch (plan) {
      case 'starter':
        return 'Starter';
      case 'professional':
        return 'Professional';
      case 'enterprise':
        return 'Enterprise';
      default:
        return plan;
    }
  };

  const getLimitText = () => {
    if (isUnlimited) {
      return `${effectiveCurrent} ${limitType === 'users' ? 'usuários' : 'documentos'} (ilimitado)`;
    }
    return `${effectiveCurrent} de ${limit} ${limitType === 'users' ? 'usuários' : 'documentos'}`;
  };

  if (!showProgress && effectiveCanAdd) return null;

  return (
    <div className={className}>
      {/* Usage Alert */}
      {(isNearLimit || isAtLimit) && (
        <Alert className={isAtLimit ? 'border-destructive' : 'border-warning'}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {isAtLimit ? (
              <span>
                Você atingiu o limite do plano {getPlanDisplayName()}: {getLimitText()}
              </span>
            ) : (
              <span>
                Você está próximo do limite do plano {getPlanDisplayName()}: {getLimitText()}
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Progress Bar */}
      {showProgress && !isUnlimited && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              {getPlanIcon()}
              <span className="font-medium">Plano {getPlanDisplayName()}</span>
            </div>
            <span className="text-muted-foreground">
              {getLimitText()}
            </span>
          </div>
          <Progress 
            value={usage_percentage} 
            className="h-2"
          />
          {isNearLimit && (
            <p className="text-xs text-muted-foreground">
              {isAtLimit 
                ? 'Limite atingido. Considere fazer upgrade do seu plano.'
                : 'Próximo do limite. Considere fazer upgrade em breve.'
              }
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default PlanLimitChecker;