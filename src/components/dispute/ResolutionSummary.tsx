import React from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle,
  XCircle,
  Scale,
  DollarSign,
  Star,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/feeCalculator';

export type ResolutionOutcome = 'approved' | 'rejected' | 'partial';

interface ResolutionSummaryProps {
  outcome: ResolutionOutcome;
  resolvedAt: Date;
  resolvedBy?: string;
  resolutionNotes?: string;
  // Financial breakdown
  totalAmount: number;
  aceAmount?: number;
  captainRefund?: number;
  // Callbacks
  onRateOther?: () => void;
  onAppeal?: () => void;
  canAppeal?: boolean;
  userRole: 'captain' | 'ace';
}

export const ResolutionSummary: React.FC<ResolutionSummaryProps> = ({
  outcome,
  resolvedAt,
  resolvedBy,
  resolutionNotes,
  totalAmount,
  aceAmount,
  captainRefund,
  onRateOther,
  onAppeal,
  canAppeal,
  userRole,
}) => {
  const getOutcomeDetails = () => {
    switch (outcome) {
      case 'approved':
        return {
          icon: <CheckCircle className="w-8 h-8" />,
          title: 'Task Approved',
          description: 'The work has been approved. Payment released to the Ace.',
          color: 'text-success',
          bgColor: 'bg-success/10 border-success/20',
        };
      case 'rejected':
        return {
          icon: <XCircle className="w-8 h-8" />,
          title: 'Task Rejected',
          description: 'The work did not meet requirements. Funds refunded to the Captain.',
          color: 'text-destructive',
          bgColor: 'bg-destructive/10 border-destructive/20',
        };
      case 'partial':
        return {
          icon: <Scale className="w-8 h-8" />,
          title: 'Partial Resolution',
          description: 'The escrow has been split between both parties.',
          color: 'text-warning',
          bgColor: 'bg-warning/10 border-warning/20',
        };
    }
  };

  const details = getOutcomeDetails();

  return (
    <div className={cn('p-6 rounded-xl border', details.bgColor)}>
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className={details.color}>{details.icon}</div>
        <div>
          <h3 className={cn('text-xl font-semibold', details.color)}>
            {details.title}
          </h3>
          <p className="text-muted-foreground">{details.description}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Resolved on {format(resolvedAt, 'MMMM dd, yyyy at HH:mm')}
            {resolvedBy && ` by ${resolvedBy}`}
          </p>
        </div>
      </div>

      {/* Financial Breakdown */}
      <div className="p-4 bg-background rounded-lg mb-6">
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          Financial Breakdown
        </h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Escrow Amount</span>
            <span className="font-mono">{formatCurrency(totalAmount)}</span>
          </div>
          <Separator />
          {aceAmount !== undefined && aceAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Payment to Ace</span>
              <span className="font-mono text-success">
                {formatCurrency(aceAmount)}
              </span>
            </div>
          )}
          {captainRefund !== undefined && captainRefund > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Refund to Captain</span>
              <span className="font-mono text-info">
                {formatCurrency(captainRefund)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Resolution Notes */}
      {resolutionNotes && (
        <div className="p-4 bg-background rounded-lg mb-6">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Resolution Notes
          </h4>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {resolutionNotes}
          </p>
        </div>
      )}

      {/* Final Notice */}
      <div className="p-3 bg-muted rounded-lg mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        <span>This decision is final and has been recorded in our system.</span>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {onRateOther && (
          <Button variant="default" onClick={onRateOther}>
            <Star className="w-4 h-4 mr-2" />
            Rate {userRole === 'captain' ? 'Ace' : 'Captain'}
          </Button>
        )}
        {canAppeal && onAppeal && outcome === 'rejected' && userRole === 'ace' && (
          <Button variant="outline" onClick={onAppeal}>
            Submit Appeal
          </Button>
        )}
      </div>
    </div>
  );
};

export default ResolutionSummary;
