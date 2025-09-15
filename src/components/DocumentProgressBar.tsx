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
    thin: 'h-1',
    medium: 'h-2',
    thick: 'h-3'
  };

  const getProgressColor = () => {
    if (progressClamped >= 80) return 'bg-green-500';
    if (progressClamped >= 50) return 'bg-yellow-500';
    if (progressClamped >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      {/* Progress Bar */}
      <div className={cn(
        'flex-1 bg-secondary rounded-full overflow-hidden',
        heightConfig[height]
      )}>
        <div 
          className={cn(
            'h-full transition-all duration-300 rounded-full',
            getProgressColor()
          )}
          style={{ width: `${progressClamped}%` }}
        />
      </div>
      
      {/* Percentage Text */}
      {showPercentage && (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {progressClamped}%
        </span>
      )}
    </div>
  );
};

export default DocumentProgressBar;