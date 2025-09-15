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
      container: 'w-7 h-3.5',
      fill: 'h-2',
      tip: 'w-0.5 h-2',
      text: 'text-xs'
    },
    md: {
      container: 'w-9 h-4',
      fill: 'h-2.5',
      tip: 'w-1 h-2.5',
      text: 'text-xs'
    },
    lg: {
      container: 'w-12 h-5',
      fill: 'h-3.5',
      tip: 'w-1 h-3.5',
      text: 'text-sm'
    }
  };

  const config = sizeConfig[size];

  const getProgressColor = () => {
    if (progressClamped >= 90) return 'bg-gradient-to-r from-green-400 to-green-500';
    if (progressClamped >= 70) return 'bg-gradient-to-r from-blue-400 to-blue-500';
    if (progressClamped >= 40) return 'bg-gradient-to-r from-yellow-400 to-yellow-500';
    if (progressClamped >= 20) return 'bg-gradient-to-r from-orange-400 to-orange-500';
    return 'bg-gradient-to-r from-red-400 to-red-500';
  };

  const getBorderColor = () => {
    if (progressClamped >= 90) return 'border-green-300';
    if (progressClamped >= 70) return 'border-blue-300';
    if (progressClamped >= 40) return 'border-yellow-300';
    if (progressClamped >= 20) return 'border-orange-300';
    return 'border-red-300';
  };

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      {/* Battery Body */}
      <div className={cn(
        'relative border-2 rounded-md flex items-center bg-background shadow-sm',
        config.container,
        getBorderColor()
      )}>
        {/* Battery Fill */}
        <div 
          className={cn(
            'absolute left-0.5 rounded-sm transition-all duration-500 ease-out',
            config.fill,
            getProgressColor()
          )}
          style={{ width: `${Math.max(0, (progressClamped / 100) * 75)}%` }}
        />
        
        {/* Subtle inner glow effect */}
        <div 
          className="absolute inset-0.5 rounded-sm bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
        />
      </div>
      
      {/* Battery Tip */}
      <div className={cn(
        'rounded-r-md border-l-0 border-2',
        config.tip,
        getBorderColor(),
        progressClamped > 80 ? getProgressColor() : 'bg-muted'
      )} />
      
      {/* Progress Text - only for larger sizes */}
      {size !== 'sm' && (
        <span className={cn(
          'font-medium text-muted-foreground',
          config.text
        )}>
          {progressClamped}%
        </span>
      )}
    </div>
  );
};

export default DocumentProgressBattery;