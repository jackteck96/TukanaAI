import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Crown, Zap } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';

interface PlanLimitCheckerProps {
  limitType: 'users' | 'documents';
  showProgress?: boolean;
  className?: string;
}

const PlanLimitChecker: React.FC<PlanLimitCheckerProps> = ({ 
  limitType, 
  showProgress = false,
  className = ''
}) => {
  const { checkPlanLimits, subscription } = useCompany();
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
  }, [limitType, checkPlanLimits]);

  if (loading || !limits) return null;

  const { current_usage, limit, plan, can_add } = limits;
  const isUnlimited = limit === -1;
  const usage_percentage = isUnlimited ? 0 : (current_usage / limit) * 100;
  const isNearLimit = usage_percentage >= 80;
  const isAtLimit = usage_percentage >= 100;

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
      return `${current_usage} ${limitType === 'users' ? 'usuários' : 'documentos'} (ilimitado)`;
    }
    return `${current_usage} de ${limit} ${limitType === 'users' ? 'usuários' : 'documentos'}`;
  };

  if (!showProgress && can_add) return null;

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