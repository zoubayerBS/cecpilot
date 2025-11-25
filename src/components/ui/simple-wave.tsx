
import React from 'react';
import { cn } from '@/lib/utils';

interface SimpleWaveProps {
  className?: string;
}

export function SimpleWave({ className }: SimpleWaveProps) {
  return (
    <div className={cn("flex items-center justify-center space-x-1 h-10", className)}>
      <span className="w-1 h-2 bg-current rounded-full animate-wave-pulse" style={{ animationDelay: '-0.4s' }} />
      <span className="w-1 h-2 bg-current rounded-full animate-wave-pulse" style={{ animationDelay: '-0.2s' }} />
      <span className="w-1 h-2 bg-current rounded-full animate-wave-pulse" />
      <span className="w-1 h-2 bg-current rounded-full animate-wave-pulse" style={{ animationDelay: '0.2s' }} />
      <span className="w-1 h-2 bg-current rounded-full animate-wave-pulse" style={{ animationDelay: '0.4s' }} />
    </div>
  );
}
