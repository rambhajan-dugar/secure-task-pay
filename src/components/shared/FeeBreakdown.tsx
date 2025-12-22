import React from 'react';
import { calculateFee, formatCurrency, formatPercentage } from '@/lib/feeCalculator';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface FeeBreakdownProps {
  grossAmount: number;
  tasksCompleted: number;
  showDetails?: boolean;
}

const FeeBreakdown: React.FC<FeeBreakdownProps> = ({ 
  grossAmount, 
  tasksCompleted,
  showDetails = true 
}) => {
  const fee = calculateFee(grossAmount, tasksCompleted);

  return (
    <div className="bg-card/50 rounded-lg border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Task Reward</span>
        <span className="font-mono font-medium">{formatCurrency(fee.grossAmount)}</span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground">Platform Fee</span>
          <Tooltip>
            <TooltipTrigger>
              <Info className="w-3 h-3 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <div className="text-xs space-y-1">
                <p>Fee based on tasks completed: {formatPercentage(fee.taskBasedFeePercent)}</p>
                {fee.valueBasedFeePercent && (
                  <p>High-value override: {formatPercentage(fee.valueBasedFeePercent)}</p>
                )}
                <p className="text-primary font-medium">Applied: {formatPercentage(fee.appliedFeePercent)} (lowest)</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
            {formatPercentage(fee.appliedFeePercent)}
          </span>
          <span className="font-mono font-medium text-destructive">-{formatCurrency(fee.platformFee)}</span>
        </div>
      </div>

      <div className="h-px bg-border" />

      <div className="flex items-center justify-between">
        <span className="font-medium">You Receive</span>
        <span className="font-mono text-lg font-bold text-success">{formatCurrency(fee.netPayout)}</span>
      </div>

      {showDetails && (
        <div className="mt-3 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground space-y-1">
          <p>• Fee decreases as you complete more tasks</p>
          <p>• High-value tasks (₹20K+) get automatic discounts</p>
          <p>• You've completed {tasksCompleted} tasks</p>
        </div>
      )}
    </div>
  );
};

export default FeeBreakdown;
