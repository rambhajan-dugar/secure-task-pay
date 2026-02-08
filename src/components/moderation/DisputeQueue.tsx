import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import {
  Scale,
  Clock,
  User,
  DollarSign,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/feeCalculator';

export interface DisputeQueueItem {
  id: string;
  taskId: string;
  taskTitle: string;
  reason: string;
  status: 'open' | 'under_review' | 'escalated';
  raisedBy: 'captain' | 'ace';
  captainName: string;
  aceName: string;
  escrowAmount: number;
  createdAt: Date;
  priority: 'low' | 'medium' | 'high';
}

interface DisputeQueueProps {
  disputes: DisputeQueueItem[];
  onSelectDispute: (disputeId: string) => void;
}

export const DisputeQueue: React.FC<DisputeQueueProps> = ({
  disputes,
  onSelectDispute,
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-destructive text-destructive-foreground';
      case 'medium':
        return 'bg-warning text-warning-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'escalated':
        return <Badge variant="destructive">Escalated</Badge>;
      case 'under_review':
        return <Badge variant="secondary">Under Review</Badge>;
      default:
        return <Badge variant="outline">Open</Badge>;
    }
  };

  if (disputes.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Scale className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No disputes in queue</p>
      </div>
    );
  }

  // Sort: escalated first, then by priority, then by date
  const sortedDisputes = [...disputes].sort((a, b) => {
    if (a.status === 'escalated' && b.status !== 'escalated') return -1;
    if (b.status === 'escalated' && a.status !== 'escalated') return 1;
    
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <ScrollArea className="h-[500px]">
      <div className="space-y-3">
        {sortedDisputes.map((dispute) => (
          <Card 
            key={dispute.id}
            className={cn(
              'cursor-pointer transition-all hover:border-primary/50',
              dispute.status === 'escalated' && 'border-destructive/50 bg-destructive/5'
            )}
            onClick={() => onSelectDispute(dispute.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={cn('text-xs', getPriorityColor(dispute.priority))}>
                      {dispute.priority.toUpperCase()}
                    </Badge>
                    {getStatusBadge(dispute.status)}
                    {dispute.status === 'escalated' && (
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                    )}
                  </div>

                  {/* Title */}
                  <h4 className="font-medium truncate mb-1">{dispute.taskTitle}</h4>
                  
                  {/* Reason */}
                  <p className="text-sm text-muted-foreground truncate mb-2">
                    {dispute.reason}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {dispute.raisedBy === 'captain' ? dispute.captainName : dispute.aceName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(dispute.createdAt, 'MMM dd, HH:mm')}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {formatCurrency(dispute.escrowAmount)}
                    </span>
                  </div>
                </div>

                {/* Arrow */}
                <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
};

export default DisputeQueue;
