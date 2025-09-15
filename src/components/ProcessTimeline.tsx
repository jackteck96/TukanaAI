import React from 'react';
import { cn } from '@/lib/utils';
import { Check, Clock, FileText, Search, Eye, FileCheck, CheckCircle } from 'lucide-react';

interface TimelineStep {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'pending';
  icon: React.ReactNode;
  date?: string;
}

interface ProcessTimelineProps {
  currentStatus: string;
  className?: string;
}

const ProcessTimeline: React.FC<ProcessTimelineProps> = ({ currentStatus, className }) => {
  // Mapear status para etapas da timeline
  const getTimelineSteps = (status: string): TimelineStep[] => {
    const baseSteps = [
      {
        id: 'received',
        title: 'Recepção',
        description: 'Documento recebido e registrado no sistema',
        icon: <FileText className="h-4 w-4" />,
        status: 'completed' as const,
        date: new Date().toLocaleDateString()
      },
      {
        id: 'analysis',
        title: 'Análise',
        description: 'Documento em processo de análise técnica',
        icon: <Search className="h-4 w-4" />,
        status: 'pending' as const
      },
      {
        id: 'review',
        title: 'Revisão',
        description: 'Revisão final e validação do documento',
        icon: <Eye className="h-4 w-4" />,
        status: 'pending' as const
      },
      {
        id: 'approval',
        title: 'Aprovação',
        description: 'Aprovação final e assinatura do documento',
        icon: <FileCheck className="h-4 w-4" />,
        status: 'pending' as const
      },
      {
        id: 'completed',
        title: 'Finalização',
        description: 'Processo concluído com sucesso',
        icon: <CheckCircle className="h-4 w-4" />,
        status: 'pending' as const
      }
    ];

    // Atualizar status baseado no status atual
    switch (status.toLowerCase()) {
      case 'pendente':
        (baseSteps[1] as any).status = 'current';
        break;
      case 'em análise':
        (baseSteps[1] as any).status = 'completed';
        (baseSteps[2] as any).status = 'current';
        break;
      case 'em revisão':
        (baseSteps[1] as any).status = 'completed';
        (baseSteps[2] as any).status = 'completed';
        (baseSteps[3] as any).status = 'current';
        break;
      case 'aprovado':
        (baseSteps[1] as any).status = 'completed';
        (baseSteps[2] as any).status = 'completed';
        (baseSteps[3] as any).status = 'completed';
        (baseSteps[4] as any).status = 'current';
        break;
      case 'finalizado':
      case 'concluído':
        baseSteps.forEach(step => (step as any).status = 'completed');
        break;
    }

    return baseSteps;
  };

  const steps = getTimelineSteps(currentStatus);

  const getStepStyles = (status: TimelineStep['status']) => {
    switch (status) {
      case 'completed':
        return {
          circle: 'bg-green-500 text-white border-green-500',
          line: 'bg-green-500',
          content: 'text-foreground'
        };
      case 'current':
        return {
          circle: 'bg-primary text-primary-foreground border-primary animate-pulse',
          line: 'bg-muted',
          content: 'text-foreground font-medium'
        };
      case 'pending':
        return {
          circle: 'bg-muted text-muted-foreground border-muted',
          line: 'bg-muted',
          content: 'text-muted-foreground'
        };
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <h3 className="font-semibold text-foreground mb-4">Timeline do Processo</h3>
      
      <div className="relative">
        {steps.map((step, index) => {
          const styles = getStepStyles(step.status);
          const isLast = index === steps.length - 1;
          
          return (
            <div key={step.id} className="relative flex items-start space-x-4 pb-6">
              {/* Timeline Line */}
              {!isLast && (
                <div className="absolute left-4 top-8 w-0.5 h-full">
                  <div className={cn('w-full h-full', styles.line)} />
                </div>
              )}
              
              {/* Step Circle */}
              <div className={cn(
                'relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-200',
                styles.circle
              )}>
                {step.status === 'completed' ? (
                  <Check className="h-4 w-4" />
                ) : step.status === 'current' ? (
                  <Clock className="h-4 w-4" />
                ) : (
                  step.icon
                )}
              </div>
              
              {/* Step Content */}
              <div className="flex-1 min-w-0">
                <div className={cn('font-medium', styles.content)}>
                  {step.title}
                </div>
                <div className={cn('text-sm mt-1', styles.content)}>
                  {step.description}
                </div>
                {step.date && step.status === 'completed' && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {step.date}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProcessTimeline;