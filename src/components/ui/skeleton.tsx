import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'circular' | 'rectangular' | 'text';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'default',
  width,
  height,
  animation = 'pulse'
}) => {
  const baseClasses = 'bg-gray-300 dark:bg-gray-700';
  
  const variantClasses = {
    default: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    text: 'rounded h-4'
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-pulse bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700',
    none: ''
  };

  const style = {
    width: width || undefined,
    height: height || undefined
  };

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={style}
    />
  );
};

// Resource Skeleton Component
export const ResourceSkeleton: React.FC = () => {
  return (
    <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" width={40} height={40} className="bg-gray-600" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="w-3/4 bg-gray-600" />
          <Skeleton variant="text" className="w-1/2 bg-gray-600" />
        </div>
      </div>
    </div>
  );
};

// Timeline Item Skeleton
export const TimelineItemSkeleton: React.FC<{ width?: number }> = ({ width = 100 }) => {
  return (
    <div 
      className="h-12 bg-gray-600 rounded border border-gray-500 animate-pulse"
      style={{ width: `${width}px` }}
    >
      <div className="p-2 h-full flex items-center">
        <Skeleton variant="text" className="w-full bg-gray-500" />
      </div>
    </div>
  );
};

// Canvas Loading Skeleton
export const CanvasLoadingSkeleton: React.FC = () => {
  return (
    <div className="flex-1 bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center min-h-[300px]">
      <div className="text-center space-y-4">
        <Skeleton variant="circular" width={64} height={64} className="mx-auto bg-gray-600" />
        <div className="space-y-2">
          <Skeleton variant="text" className="w-48 mx-auto bg-gray-600" />
          <Skeleton variant="text" className="w-32 mx-auto bg-gray-600" />
        </div>
      </div>
    </div>
  );
};

// Resource Panel Loading
export const ResourcePanelSkeleton: React.FC = () => {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <ResourceSkeleton key={index} />
      ))}
    </div>
  );
};

// Timeline Loading Skeleton
export const TimelineSkeleton: React.FC = () => {
  return (
    <div className="p-4 space-y-2">
      {Array.from({ length: 3 }).map((_, trackIndex) => (
        <div key={trackIndex} className="flex items-center gap-4">
          <Skeleton variant="text" className="w-20 bg-gray-600" />
          <div className="flex-1 h-14 bg-gray-700 rounded relative flex gap-2 p-2">
            {Array.from({ length: Math.floor(Math.random() * 4) + 1 }).map((_, itemIndex) => (
              <TimelineItemSkeleton 
                key={itemIndex} 
                width={Math.floor(Math.random() * 150) + 80} 
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Skeleton;