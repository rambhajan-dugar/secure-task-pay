import React from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  FileText,
  Search,
  Scale,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  DollarSign,
} from 'lucide-react';

export interface DisputeEvent {
  id: string;
  type: 'raised' | 'evidence_submitted' | 'admin_review' | 'resolved' | 'partial_resolution' | 'escalated';
  title: string;
  description?: string;
  timestamp: Date;
  actor?: string;
  metadata?: Record<string, unknown>;
}

interface DisputeTimelineProps {
  events: DisputeEvent[];
  currentStatus: string;
}

export const DisputeTimeline: React.FC<DisputeTimelineProps> = ({
  events,
  currentStatus,
}) => {
  const getEventIcon = (type: DisputeEvent['type']) => {
    switch (type) {
      case 'raised':
        return <AlertTriangle className="w-4 h-4" />;
      case 'evidence_submitted':
        return <FileText className="w-4 h-4" />;
      case 'admin_review':
        return <Search className="w-4 h-4" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4" />;
      case 'partial_resolution':
        return <Scale className="w-4 h-4" />;
      case 'escalated':
        return <ArrowRight className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getEventColor = (type: DisputeEvent['type']) => {
    switch (type) {
      case 'raised':
        return 'bg-warning text-warning-foreground';
      case 'evidence_submitted':
        return 'bg-info text-info-foreground';
      case 'admin_review':
        return 'bg-primary text-primary-foreground';
      case 'resolved':
        return 'bg-success text-success-foreground';
      case 'partial_resolution':
        return 'bg-secondary text-secondary-foreground';
      case 'escalated':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Scale className="w-4 h-4" />
        <span>Current Status: </span>
        <span className="font-medium text-foreground capitalize">
          {currentStatus.replace('_', ' ')}
        </span>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

        {/* Events */}
        <div className="space-y-6">
          {events.map((event, index) => (
            <div key={event.id} className="relative flex gap-4">
              {/* Icon */}
              <div className={cn(
                'relative z-10 w-8 h-8 rounded-full flex items-center justify-center',
                getEventColor(event.type)
              )}>
                {getEventIcon(event.type)}
              </div>

              {/* Content */}
              <div className="flex-1 pb-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">{event.title}</h4>
                  <span className="text-xs text-muted-foreground">
                    {format(event.timestamp, 'MMM dd, HH:mm')}
                  </span>
                </div>
                {event.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {event.description}
                  </p>
                )}
                {event.actor && (
                  <p className="text-xs text-muted-foreground mt-1">
                    By: {event.actor}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DisputeTimeline;
