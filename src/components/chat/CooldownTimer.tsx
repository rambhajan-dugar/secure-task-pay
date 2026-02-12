import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CooldownTimerProps {
  seconds: number;
  onComplete?: () => void;
  className?: string;
}

export const CooldownTimer: React.FC<CooldownTimerProps> = ({
  seconds,
  onComplete,
  className,
}) => {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (remaining <= 0) {
      onComplete?.();
      return;
    }

    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remaining, onComplete]);

  if (remaining <= 0) return null;

  return (
    <div className={cn(
      'inline-flex items-center gap-1.5 text-sm font-mono',
      remaining <= 10 ? 'text-destructive' : 'text-warning',
      className
    )}>
      <Clock className="w-3.5 h-3.5 animate-pulse" />
      <span>{remaining}s</span>
    </div>
  );
};

export default CooldownTimer;
