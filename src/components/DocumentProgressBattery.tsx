import React from 'react';
import { cn } from '@/lib/utils';

interface DocumentProgressBatteryProps {
  progress: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const DocumentProgressBattery: React.FC<DocumentProgressBatteryProps> = ({ 
  progress, 
  size = 'sm',
  className 
}) => {
  const progressClamped = Math.min(100, Math.max(0, progress));
  
  const sizeConfig = {
    sm: {
      container: 'w-6 h-3',
      fill: 'h-1.5',
      tip: 'w-0.5 h-1'
    },
    md: {
      container: 'w-8 h-4',
      fill: 'h-2',
      tip: 'w-1 h-1.5'
    },
    lg: {
      container: 'w-10 h-5',
      fill: 'h-3',
      tip: 'w-1 h-2'
    }
  };

  const config = sizeConfig[size];

  const getProgressColor = () => {
    if (progressClamped >= 80) return 'bg-green-500';
    if (progressClamped >= 50) return 'bg-yellow-500';
    if (progressClamped >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className={cn('flex items-center space-x-1', className)}>
      {/* Battery Body */}
      <div className={cn(
        'relative border border-border rounded-sm flex items-center',
        config.container
      )}>
        {/* Battery Fill */}
        <div 
          className={cn(
            'absolute left-0.5 rounded-sm transition-all duration-300',
            config.fill,
            getProgressColor()
          )}
          style={{ width: `${Math.max(0, (progressClamped / 100) * 80)}%` }}
        />
      </div>
      
      {/* Battery Tip */}
      <div className={cn(
        'bg-border rounded-r-sm',
        config.tip
      )} />
      
      {/* Progress Text */}
      {size !== 'sm' && (
        <span className="text-xs text-muted-foreground ml-1">
          {progressClamped}%
        </span>
      )}
    </div>
  );
};

export default DocumentProgressBattery;