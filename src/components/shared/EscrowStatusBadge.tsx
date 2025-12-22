import React from 'react';
import { Badge } from '@/components/ui/badge';
import { PaymentStatus } from '@/types';
import { getPaymentStatusVariant } from '@/lib/mockData';
import { Shield, Clock, CheckCircle, AlertTriangle, RotateCcw } from 'lucide-react';

interface EscrowStatusBadgeProps {
  status: PaymentStatus;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const statusLabels: Record<PaymentStatus, string> = {
  pending: 'Pending Payment',
  in_escrow: 'In Escrow',
  released: 'Released',
  disputed: 'Disputed',
  refunded: 'Refunded',
};

const statusIcons: Record<PaymentStatus, React.ReactNode> = {
  pending: <Clock className="w-3 h-3" />,
  in_escrow: <Shield className="w-3 h-3" />,
  released: <CheckCircle className="w-3 h-3" />,
  disputed: <AlertTriangle className="w-3 h-3" />,
  refunded: <RotateCcw className="w-3 h-3" />,
};

const EscrowStatusBadge: React.FC<EscrowStatusBadgeProps> = ({ 
  status, 
  showIcon = true,
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-0.5',
    lg: 'text-sm px-3 py-1',
  };

  return (
    <Badge 
      variant={getPaymentStatusVariant(status)} 
      className={`${sizeClasses[size]} flex items-center gap-1`}
    >
      {showIcon && statusIcons[status]}
      {statusLabels[status]}
    </Badge>
  );
};

export default EscrowStatusBadge;
