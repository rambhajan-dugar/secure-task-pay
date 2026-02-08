import React from 'react';
import { AlertTriangle, Scale, FileText, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DisputeBannerProps {
  status: 'raised' | 'under_review' | 'resolved' | 'escalated';
  reason?: string;
  raisedBy?: 'captain' | 'ace';
  onViewDetails?: () => void;
  onSubmitEvidence?: () => void;
  className?: string;
}

export const DisputeBanner: React.FC<DisputeBannerProps> = ({
  status,
  reason,
  raisedBy,
  onViewDetails,
  onSubmitEvidence,
  className,
}) => {
  const getStatusContent = () => {
    switch (status) {
      case 'raised':
        return {
          icon: <AlertTriangle className="w-5 h-5" />,
          title: 'Dispute Raised',
          description: reason || 'This task is now in dispute. Funds are locked in escrow.',
          bgColor: 'bg-warning/10 border-warning/20',
          textColor: 'text-warning',
        };
      case 'under_review':
        return {
          icon: <Scale className="w-5 h-5" />,
          title: 'Under Admin Review',
          description: 'Our team is reviewing the evidence. You may be contacted for more information.',
          bgColor: 'bg-info/10 border-info/20',
          textColor: 'text-info',
        };
      case 'escalated':
        return {
          icon: <ArrowRight className="w-5 h-5" />,
          title: 'Escalated',
          description: 'This dispute has been escalated to senior moderation.',
          bgColor: 'bg-destructive/10 border-destructive/20',
          textColor: 'text-destructive',
        };
      case 'resolved':
        return {
          icon: <FileText className="w-5 h-5" />,
          title: 'Dispute Resolved',
          description: 'The dispute has been resolved. Check the resolution details below.',
          bgColor: 'bg-success/10 border-success/20',
          textColor: 'text-success',
        };
      default:
        return {
          icon: <AlertTriangle className="w-5 h-5" />,
          title: 'Dispute',
          description: 'There is an issue with this task.',
          bgColor: 'bg-muted',
          textColor: 'text-muted-foreground',
        };
    }
  };

  const content = getStatusContent();

  return (
    <div className={cn(
      'p-4 rounded-lg border',
      content.bgColor,
      className
    )}>
      <div className="flex items-start gap-3">
        <div className={cn('flex-shrink-0', content.textColor)}>
          {content.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={cn('font-medium', content.textColor)}>
              {content.title}
            </h4>
            {raisedBy && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                By {raisedBy === 'captain' ? 'Captain' : 'Ace'}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {content.description}
          </p>
        </div>
      </div>
      
      {(onViewDetails || onSubmitEvidence) && status !== 'resolved' && (
        <div className="flex gap-2 mt-3 ml-8">
          {onViewDetails && (
            <Button variant="outline" size="sm" onClick={onViewDetails}>
              View Details
            </Button>
          )}
          {onSubmitEvidence && status !== 'escalated' && (
            <Button variant="secondary" size="sm" onClick={onSubmitEvidence}>
              Submit Evidence
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default DisputeBanner;
