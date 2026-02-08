import React from 'react';
import { Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export type DeliveryStatus = 'sending' | 'sent' | 'delivered' | 'read';

interface MessageDeliveryStatusProps {
  status: DeliveryStatus;
  className?: string;
}

export const MessageDeliveryStatus: React.FC<MessageDeliveryStatusProps> = ({ 
  status, 
  className 
}) => {
  if (status === 'sending') {
    return (
      <div className={cn('w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin', className)} />
    );
  }

  if (status === 'sent') {
    return <Check className={cn('w-3.5 h-3.5', className)} />;
  }

  if (status === 'delivered') {
    return <CheckCheck className={cn('w-3.5 h-3.5', className)} />;
  }

  // Read - blue double check
  return <CheckCheck className={cn('w-3.5 h-3.5 text-info', className)} />;
};

export default MessageDeliveryStatus;
