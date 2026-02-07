import React, { useState, useRef, useEffect } from 'react';
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
import { Send, MoreVertical, Flag, AlertTriangle, MessageSquare, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskChatPanelProps {
  taskId: string;
  taskStatus: string;
  otherPartyId: string | null;
  otherPartyName: string;
}

const FLAG_REASONS = [
  { value: 'spam', label: 'Spam or advertising' },
  { value: 'harassment', label: 'Harassment or abuse' },
  { value: 'external_payment', label: 'Asking for external payment' },
  { value: 'personal_info', label: 'Sharing personal contact info' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'other', label: 'Other' },
];

export const TaskChatPanel: React.FC<TaskChatPanelProps> = ({
  taskId,
  taskStatus,
  otherPartyId,
  otherPartyName,
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
  } = useTaskChat(taskId, taskStatus, otherPartyId);

  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showFlagDialog, setShowFlagDialog] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [flagReason, setFlagReason] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

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
    if (!newMessage.trim() || isSending) return;

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

  if (!otherPartyId) {
    return (
      <div className="p-6 rounded-xl bg-card border border-border">
        <div className="flex items-center gap-3 mb-4">
          <MessageSquare className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Chat</h2>
        </div>
        <p className="text-muted-foreground text-sm">
          Chat will be available once a doer accepts this task.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-xl bg-card border border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Chat with {otherPartyName}</h2>
        </div>
        {!isChatEnabled && (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Locked
          </Badge>
        )}
      </div>

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
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.sender_id === user?.id}
                onFlag={() => openFlagDialog(message.id)}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      {isChatEnabled ? (
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
          {rateLimitRemaining < 5 && (
            <p className="text-xs text-warning">
              {rateLimitRemaining} messages remaining this minute
            </p>
          )}
        </div>
      ) : (
        <div className="mt-4 p-3 rounded-lg bg-muted/50 text-center">
          <p className="text-sm text-muted-foreground">
            Chat is locked. Messages can only be sent during active task phases.
          </p>
        </div>
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
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn, onFlag }) => {
  return (
    <div
      className={cn(
        'flex gap-2',
        isOwn ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[75%] rounded-lg px-3 py-2',
          isOwn
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted',
          message.is_flagged && 'opacity-50 border border-destructive'
        )}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        <p
          className={cn(
            'text-xs mt-1',
            isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
          )}
        >
          {format(new Date(message.created_at), 'HH:mm')}
        </p>
      </div>
      {!isOwn && !message.is_flagged && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 self-center">
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
