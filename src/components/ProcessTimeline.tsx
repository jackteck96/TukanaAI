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
          circle: 'bg-gradient-to-br from-green-400 to-green-500 text-white border-green-300 shadow-md shadow-green-200',
          line: 'bg-gradient-to-b from-green-400 to-green-300',
          content: 'text-foreground'
        };
      case 'current':
        return {
          circle: 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-primary/50 animate-pulse shadow-md shadow-primary/30',
          line: 'bg-gradient-to-b from-muted to-muted/50',
          content: 'text-foreground font-medium'
        };
      case 'pending':
        return {
          circle: 'bg-muted text-muted-foreground border-border shadow-sm',
          line: 'bg-muted/50',
          content: 'text-muted-foreground'
        };
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center space-x-2 mb-6">
        <div className="w-1 h-6 bg-gradient-to-b from-primary to-primary/50 rounded-full" />
        <h3 className="font-semibold text-foreground">Timeline do Processo</h3>
      </div>
      
      <div className="relative pl-2">
        {steps.map((step, index) => {
          const styles = getStepStyles(step.status);
          const isLast = index === steps.length - 1;
          
          return (
            <div key={step.id} className="relative flex items-start space-x-4 pb-8">
              {/* Timeline Line */}
              {!isLast && (
                <div className="absolute left-4 top-10 w-0.5 h-full">
                  <div className={cn('w-full h-full rounded-full', styles.line)} />
                </div>
              )}
              
              {/* Step Circle */}
              <div className={cn(
                'relative z-10 flex items-center justify-center w-9 h-9 rounded-full border-2 transition-all duration-300',
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
              <div className="flex-1 min-w-0 pb-2">
                <div className={cn('font-semibold text-sm', styles.content)}>
                  {step.title}
                </div>
                <div className={cn('text-sm mt-1 leading-relaxed', styles.content)}>
                  {step.description}
                </div>
                {step.date && step.status === 'completed' && (
                  <div className="text-xs text-muted-foreground mt-2 flex items-center space-x-1">
                    <div className="w-1 h-1 bg-current rounded-full opacity-50" />
                    <span>{step.date}</span>
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