import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useTaskChat, Message } from '@/hooks/useTaskChat';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { Send, MoreVertical, Flag, AlertTriangle, MessageSquare, Lock, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatStateBanner, ChatState, ChatStateType } from './ChatStateBanner';
import { ChatLockedOverlay } from './ChatLockedOverlay';
import { MessageDeliveryStatus, DeliveryStatus } from './MessageDeliveryStatus';

interface TaskChatPanelProps {
  taskId: string;
  taskStatus: string;
  otherPartyId: string | null;
  otherPartyName: string;
  isChatMuted?: boolean;
  isUserFrozen?: boolean;
  isOtherPartyFrozen?: boolean;
  disputeStatus?: string | null;
}

const FLAG_REASONS = [
  { value: 'spam', label: 'Spam or advertising' },
  { value: 'harassment', label: 'Harassment or abuse' },
  { value: 'external_payment', label: 'Asking for external payment' },
  { value: 'personal_info', label: 'Sharing personal contact info' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'other', label: 'Other' },
];

// Determine chat state based on conditions
function determineChatState(
  taskStatus: string,
  isChatMuted: boolean,
  isUserFrozen: boolean,
  isOtherPartyFrozen: boolean,
  disputeStatus: string | null | undefined,
  rateLimitRemaining: number
): ChatState {
  // LOCKED: Frozen account
  if (isUserFrozen) {
    return {
      type: 'locked',
      reason: 'frozen',
      message: 'Your account has been temporarily restricted. Messaging is disabled.',
    };
  }

  // LOCKED: Dispute escalated or disputed status
  if (disputeStatus === 'escalated' || taskStatus === 'disputed') {
    return {
      type: 'locked',
      reason: 'dispute',
      message: 'This conversation is locked while our team reviews the dispute.',
    };
  }

  // LOCKED: Task completed or cancelled
  if (['completed', 'cancelled', 'approved'].includes(taskStatus)) {
    return {
      type: 'locked',
      reason: 'admin_lock',
      message: 'This task has been completed. Chat is read-only.',
    };
  }

  // RESTRICTED: Muted by admin
  if (isChatMuted) {
    return {
      type: 'restricted',
      reason: 'muted',
      message: 'Chat temporarily disabled due to moderation review',
    };
  }

  // RESTRICTED: Under review
  if (taskStatus === 'under_review') {
    return {
      type: 'restricted',
      reason: 'under_review',
      message: 'Chat restricted while the task is under review',
    };
  }

  // RESTRICTED: Rate limited
  if (rateLimitRemaining <= 0) {
    return {
      type: 'restricted',
      reason: 'rate_limited',
      message: "You've hit the message limit. Please wait.",
      cooldownSeconds: 60,
    };
  }

  // RESTRICTED: Other party frozen
  if (isOtherPartyFrozen) {
    return {
      type: 'restricted',
      reason: 'frozen',
      message: 'The other party is temporarily unavailable.',
    };
  }

  // ACTIVE: Normal operation
  if (['accepted', 'in_progress', 'submitted'].includes(taskStatus)) {
    return { type: 'active' };
  }

  // Default to locked for other statuses
  return {
    type: 'locked',
    reason: 'admin_lock',
    message: 'Chat is not available for this task status.',
  };
}

export const TaskChatPanel: React.FC<TaskChatPanelProps> = ({
  taskId,
  taskStatus,
  otherPartyId,
  otherPartyName,
  isChatMuted = false,
  isUserFrozen = false,
  isOtherPartyFrozen = false,
  disputeStatus = null,
}) => {
  const { user } = useAuth();
  const {
    messages,
    isLoading,
    sendMessage,
    flagMessage,
    markAsRead,
    isChatEnabled,
    rateLimitRemaining,
    messageEvents,
  } = useTaskChat(taskId, taskStatus, otherPartyId);

  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showFlagDialog, setShowFlagDialog] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [flagReason, setFlagReason] = useState('');
  const [showLockedOverlay, setShowLockedOverlay] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Determine current chat state
  const chatState = useMemo(() => determineChatState(
    taskStatus,
    isChatMuted,
    isUserFrozen,
    isOtherPartyFrozen,
    disputeStatus,
    rateLimitRemaining
  ), [taskStatus, isChatMuted, isUserFrozen, isOtherPartyFrozen, disputeStatus, rateLimitRemaining]);

  // Show locked overlay when locked and user tries to interact
  useEffect(() => {
    if (chatState.type === 'locked' && chatState.reason !== 'admin_lock') {
      setShowLockedOverlay(true);
    } else {
      setShowLockedOverlay(false);
    }
  }, [chatState]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Mark messages as read when they appear
  useEffect(() => {
    if (!user) return;
    messages.forEach((msg) => {
      if (msg.receiver_id === user.id) {
        markAsRead(msg.id);
      }
    });
  }, [messages, user, markAsRead]);

  const handleSend = async () => {
    if (!newMessage.trim() || isSending || chatState.type !== 'active') return;

    setIsSending(true);
    const success = await sendMessage(newMessage);
    if (success) {
      setNewMessage('');
    }
    setIsSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const openFlagDialog = (messageId: string) => {
    setSelectedMessageId(messageId);
    setFlagReason('');
    setShowFlagDialog(true);
  };

  const handleFlag = async () => {
    if (!selectedMessageId || !flagReason) return;
    await flagMessage(selectedMessageId, flagReason);
    setShowFlagDialog(false);
    setSelectedMessageId(null);
  };

  const getDeliveryStatus = (messageId: string, isOwn: boolean): DeliveryStatus => {
    if (!isOwn) return 'read';
    const events = messageEvents[messageId] || [];
    if (events.includes('read')) return 'read';
    if (events.includes('delivered')) return 'delivered';
    return 'sent';
  };

  if (!otherPartyId) {
    return (
      <div className="p-6 rounded-xl bg-card border border-border">
        <div className="flex items-center gap-3 mb-4">
          <MessageSquare className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Chat</h2>
        </div>
        <p className="text-muted-foreground text-sm">
          Chat will be available once an Ace accepts this task.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-xl bg-card border border-border relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Chat with {otherPartyName}</h2>
        </div>
        <div className="flex items-center gap-2">
          {chatState.type === 'locked' && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Locked
            </Badge>
          )}
          {chatState.type === 'restricted' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Restricted
            </Badge>
          )}
        </div>
      </div>

      {/* State Banner */}
      <div className="mb-4">
        <ChatStateBanner 
          state={chatState}
          onContactSupport={() => window.open('/contact', '_blank')}
        />
      </div>

      {/* Rate Limit Indicator */}
      {chatState.type === 'active' && rateLimitRemaining < 10 && (
        <div className="mb-3 px-3 py-1.5 bg-muted rounded-lg text-xs text-muted-foreground flex items-center justify-between">
          <span>Messages remaining this minute:</span>
          <span className={cn(
            'font-mono font-medium',
            rateLimitRemaining <= 3 ? 'text-destructive' : 'text-warning'
          )}>
            {rateLimitRemaining}/20
          </span>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="h-80 pr-4" ref={scrollRef}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground text-sm">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => {
              const isOwn = message.sender_id === user?.id;
              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={isOwn}
                  onFlag={() => openFlagDialog(message.id)}
                  deliveryStatus={getDeliveryStatus(message.id, isOwn)}
                  canFlag={chatState.type !== 'locked'}
                />
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Input - Show based on state */}
      {chatState.type === 'active' ? (
        <div className="mt-4 space-y-2">
          <div className="flex gap-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="min-h-[60px] resize-none"
              disabled={isSending}
            />
            <Button
              variant="hero"
              size="icon"
              onClick={handleSend}
              disabled={!newMessage.trim() || isSending || rateLimitRemaining <= 0}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : chatState.type === 'restricted' ? (
        <div className="mt-4">
          <div className="flex gap-2 opacity-50">
            <Textarea
              placeholder="Messaging is temporarily disabled..."
              className="min-h-[60px] resize-none"
              disabled
            />
            <Button variant="secondary" size="icon" disabled>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : null}

      {/* Locked Overlay */}
      {chatState.type === 'locked' && chatState.reason !== 'admin_lock' && (
        <ChatLockedOverlay
          isOpen={showLockedOverlay}
          reason={chatState.reason as 'frozen' | 'dispute' | 'admin_lock'}
          disputeStatus={disputeStatus || undefined}
          onContactSupport={() => window.open('/contact', '_blank')}
          onViewDispute={disputeStatus ? () => {} : undefined}
        />
      )}

      {/* Flag Dialog */}
      <Dialog open={showFlagDialog} onOpenChange={setShowFlagDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Report Message
            </DialogTitle>
            <DialogDescription>
              This message will be reviewed by our safety team.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">Reason</label>
            <Select value={flagReason} onValueChange={setFlagReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {FLAG_REASONS.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowFlagDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleFlag} disabled={!flagReason}>
              <Flag className="w-4 h-4 mr-2" />
              Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  onFlag: () => void;
  deliveryStatus: DeliveryStatus;
  canFlag: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  isOwn, 
  onFlag,
  deliveryStatus,
  canFlag,
}) => {
  return (
    <div
      className={cn(
        'flex gap-2',
        isOwn ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-4 py-2',
          isOwn
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-muted rounded-bl-sm',
          message.is_flagged && 'opacity-50 border border-destructive'
        )}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        <div className={cn(
          'flex items-center gap-1 mt-1',
          isOwn ? 'justify-end' : 'justify-start'
        )}>
          <span
            className={cn(
              'text-xs',
              isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
            )}
          >
            {format(new Date(message.created_at), 'HH:mm')}
          </span>
          {isOwn && (
            <MessageDeliveryStatus 
              status={deliveryStatus}
              className={cn(
                isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
              )}
            />
          )}
        </div>
      </div>
      {!isOwn && !message.is_flagged && canFlag && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 self-center opacity-0 group-hover:opacity-100 hover:opacity-100">
              <MoreVertical className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={onFlag} className="text-destructive">
              <Flag className="w-4 h-4 mr-2" />
              Report
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {message.is_flagged && (
        <Badge variant="destructive" className="self-center text-xs">
          Reported
        </Badge>
      )}
    </div>
  );
};

export default TaskChatPanel;
