import React from 'react';
import { cn } from '@/lib/utils';
import { 
  Shield, 
  AlertTriangle, 
  Lock, 
  Clock, 
  MessageSquareOff,
  Phone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CooldownTimer } from './CooldownTimer';

export type ChatStateType = 'active' | 'restricted' | 'locked';

export interface ChatState {
  type: ChatStateType;
  reason?: 'muted' | 'under_review' | 'rate_limited' | 'frozen' | 'dispute' | 'admin_lock';
  message?: string;
  cooldownSeconds?: number;
}

interface ChatStateBannerProps {
  state: ChatState;
  onContactSupport?: () => void;
}

export const ChatStateBanner: React.FC<ChatStateBannerProps> = ({ 
  state, 
  onContactSupport 
}) => {
  if (state.type === 'active') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-success/10 border border-success/20 rounded-lg text-sm text-success">
        <Shield className="w-4 h-4 flex-shrink-0" />
        <span>For your safety, keep all communication inside Nap-it</span>
      </div>
    );
  }

  if (state.type === 'restricted') {
    let icon = <AlertTriangle className="w-4 h-4 flex-shrink-0" />;
    let message = state.message || 'Chat temporarily disabled';
    let bgColor = 'bg-warning/10 border-warning/20 text-warning';

    if (state.reason === 'rate_limited') {
      icon = <Clock className="w-4 h-4 flex-shrink-0" />;
    } else if (state.reason === 'muted' || state.reason === 'under_review') {
      icon = <MessageSquareOff className="w-4 h-4 flex-shrink-0" />;
      message = 'Chat temporarily disabled due to moderation review';
    }

    return (
      <div className={cn(
        'flex items-center gap-2 px-3 py-2 border rounded-lg text-sm',
        bgColor
      )}>
        {icon}
        <span className="flex-1">{message}</span>
        {state.reason === 'rate_limited' && state.cooldownSeconds && (
          <CooldownTimer seconds={state.cooldownSeconds} />
        )}
      </div>
    );
  }

  // Locked state
  return (
    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
      <div className="flex items-center gap-2 mb-3">
        <Lock className="w-5 h-5 text-destructive" />
        <span className="font-medium text-destructive">Chat Locked</span>
      </div>
      <p className="text-sm text-muted-foreground mb-3">
        {state.message || 'This conversation is locked while our team reviews the task.'}
      </p>
      {onContactSupport && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onContactSupport}
          className="w-full"
        >
          <Phone className="w-4 h-4 mr-2" />
          Contact Support
        </Button>
      )}
    </div>
  );
};

export default ChatStateBanner;
