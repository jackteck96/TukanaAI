import React from 'react';
import { cn } from '@/lib/utils';

interface DocumentProgressBarProps {
  progress: number; // 0-100
  height?: 'thin' | 'medium' | 'thick';
  showPercentage?: boolean;
  className?: string;
}

const DocumentProgressBar: React.FC<DocumentProgressBarProps> = ({ 
  progress, 
  height = 'thin',
  showPercentage = false,
  className 
}) => {
  const progressClamped = Math.min(100, Math.max(0, progress));
  
  const heightConfig = {
    thin: 'h-1.5',
    medium: 'h-2.5',
    thick: 'h-3'
  };

  const getProgressColor = () => {
    if (progressClamped >= 90) return 'bg-gradient-to-r from-green-400 to-green-500';
    if (progressClamped >= 70) return 'bg-gradient-to-r from-blue-400 to-blue-500';
    if (progressClamped >= 40) return 'bg-gradient-to-r from-yellow-400 to-yellow-500';
    if (progressClamped >= 20) return 'bg-gradient-to-r from-orange-400 to-orange-500';
    return 'bg-gradient-to-r from-red-400 to-red-500';
  };

  const getGlowColor = () => {
    if (progressClamped >= 90) return 'shadow-green-200';
    if (progressClamped >= 70) return 'shadow-blue-200';
    if (progressClamped >= 40) return 'shadow-yellow-200';
    if (progressClamped >= 20) return 'shadow-orange-200';
    return 'shadow-red-200';
  };

  return (
    <div className={cn('flex items-center space-x-3 w-full', className)}>
      {/* Progress Bar */}
      <div className={cn(
        'flex-1 bg-muted rounded-full overflow-hidden border border-border/50 shadow-inner min-w-0',
        heightConfig[height]
      )}>
        <div 
          className={cn(
            'h-full transition-all duration-700 ease-out rounded-full relative shadow-sm',
            getProgressColor(),
            progressClamped > 0 && getGlowColor()
          )}
          style={{ width: `${progressClamped}%` }}
        >
          {/* Subtle shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full" />
        </div>
      </div>
      
      {/* Percentage Text */}
      {showPercentage && (
        <span className="text-sm font-medium text-foreground whitespace-nowrap min-w-[3rem] text-right">
          {progressClamped}%
        </span>
      )}
    </div>
  );
};

export default DocumentProgressBar;