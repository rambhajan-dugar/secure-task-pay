import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  targetDate: Date;
  label?: string;
  onComplete?: () => void;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ 
  targetDate, 
  label = 'Auto-release in',
  onComplete 
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    total: number;
  }>({ hours: 0, minutes: 0, seconds: 0, total: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = targetDate.getTime() - new Date().getTime();
      
      if (difference <= 0) {
        onComplete?.();
        return { hours: 0, minutes: 0, seconds: 0, total: 0 };
      }

      return {
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24) + Math.floor(difference / (1000 * 60 * 60 * 24)) * 24,
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        total: difference,
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onComplete]);

  const isUrgent = timeLeft.total < 1000 * 60 * 60 * 2; // Less than 2 hours

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
      isUrgent ? 'bg-warning/10 border border-warning/20' : 'bg-info/10 border border-info/20'
    }`}>
      <Clock className={`w-4 h-4 ${isUrgent ? 'text-warning' : 'text-info'}`} />
      <div className="flex flex-col">
        <span className={`text-xs ${isUrgent ? 'text-warning' : 'text-info'}`}>{label}</span>
        <div className="flex items-center gap-1 font-mono text-sm font-medium">
          <span className={isUrgent ? 'text-warning' : 'text-foreground'}>
            {String(timeLeft.hours).padStart(2, '0')}h
          </span>
          <span className="text-muted-foreground">:</span>
          <span className={isUrgent ? 'text-warning' : 'text-foreground'}>
            {String(timeLeft.minutes).padStart(2, '0')}m
          </span>
          <span className="text-muted-foreground">:</span>
          <span className={isUrgent ? 'text-warning' : 'text-foreground'}>
            {String(timeLeft.seconds).padStart(2, '0')}s
          </span>
        </div>
      </div>
    </div>
  );
};

export default CountdownTimer;
