import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';

export interface Message {
  id: string;
  task_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_flagged: boolean;
  flagged_at: string | null;
  flagged_reason: string | null;
  created_at: string;
}

export interface ChatEvent {
  id: string;
  message_id: string;
  event_type: 'sent' | 'delivered' | 'read' | 'flagged';
  created_at: string;
}

interface UseTaskChatReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<boolean>;
  flagMessage: (messageId: string, reason: string) => Promise<boolean>;
  markAsRead: (messageId: string) => Promise<void>;
  isChatEnabled: boolean;
  rateLimitRemaining: number;
  messageEvents: Record<string, string[]>;
}

// Rate limit: 20 messages per minute
const RATE_LIMIT_WINDOW = 60000; // 1 minute in ms
const RATE_LIMIT_MAX = 20;

export function useTaskChat(
  taskId: string,
  taskStatus: string,
  otherPartyId: string | null
): UseTaskChatReturn {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messageTimes, setMessageTimes] = useState<number[]>([]);
  const [messageEvents, setMessageEvents] = useState<Record<string, string[]>>({});

  // Chat is enabled only for active task statuses
  const isChatEnabled = ['accepted', 'in_progress', 'submitted', 'under_review'].includes(taskStatus);

  // Calculate rate limit remaining
  const now = Date.now();
  const recentMessages = messageTimes.filter(time => now - time < RATE_LIMIT_WINDOW);
  const rateLimitRemaining = RATE_LIMIT_MAX - recentMessages.length;

  // Load messages and their events
  useEffect(() => {
    if (!taskId || !user) return;

    const loadMessages = async () => {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('messages')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (fetchError) {
        setError(fetchError.message);
        console.error('Error loading messages:', fetchError);
      } else {
        setMessages(data || []);

        // Load chat events for delivery status
        if (data && data.length > 0) {
          const messageIds = data.map(m => m.id);
          const { data: events } = await supabase
            .from('chat_events')
            .select('*')
            .in('message_id', messageIds);

          if (events) {
            const eventsMap: Record<string, string[]> = {};
            events.forEach((event: ChatEvent) => {
              if (!eventsMap[event.message_id]) {
                eventsMap[event.message_id] = [];
              }
              eventsMap[event.message_id].push(event.event_type);
            });
            setMessageEvents(eventsMap);
          }
        }
      }

      setIsLoading(false);
    };

    loadMessages();

    // Subscribe to real-time messages
    const channel = supabase
      .channel(`messages:${taskId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `task_id=eq.${taskId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some(m => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `task_id=eq.${taskId}`,
        },
        (payload) => {
          const updatedMessage = payload.new as Message;
          setMessages((prev) =>
            prev.map((m) => (m.id === updatedMessage.id ? updatedMessage : m))
          );
        }
      )
      .subscribe();

    // Subscribe to chat events for real-time delivery status
    const eventsChannel = supabase
      .channel(`chat_events:${taskId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_events',
        },
        (payload) => {
          const newEvent = payload.new as ChatEvent;
          setMessageEvents((prev) => {
            const current = prev[newEvent.message_id] || [];
            if (current.includes(newEvent.event_type)) return prev;
            return {
              ...prev,
              [newEvent.message_id]: [...current, newEvent.event_type],
            };
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(eventsChannel);
    };
  }, [taskId, user]);

  // Send message
  const sendMessage = useCallback(async (content: string): Promise<boolean> => {
    if (!user || !otherPartyId || !isChatEnabled) {
      toast.error('Cannot send message at this time');
      return false;
    }

    // Check rate limit
    const now = Date.now();
    const recentMessages = messageTimes.filter(time => now - time < RATE_LIMIT_WINDOW);
    if (recentMessages.length >= RATE_LIMIT_MAX) {
      toast.error('Rate limit exceeded. Please wait before sending more messages.');
      return false;
    }

    // Basic profanity check (placeholder - can be enhanced)
    const profanityPatterns = [/\b(phone|whatsapp|telegram|upi|gpay|paytm)\b/gi];
    const hasSuspiciousContent = profanityPatterns.some(pattern => pattern.test(content));
    
    if (hasSuspiciousContent) {
      toast.warning('Please keep all communication within the platform for your safety.');
    }

    const trimmedContent = content.trim();
    if (!trimmedContent) return false;

    const { data: insertedMessage, error: insertError } = await supabase.from('messages').insert({
      task_id: taskId,
      sender_id: user.id,
      receiver_id: otherPartyId,
      content: trimmedContent,
    }).select().single();

    if (insertError) {
      console.error('Error sending message:', insertError);
      toast.error('Failed to send message');
      return false;
    }

    // Track message time for rate limiting
    setMessageTimes(prev => [...prev.filter(t => now - t < RATE_LIMIT_WINDOW), now]);

    // Create sent event
    if (insertedMessage) {
      await supabase.from('chat_events').insert({
        message_id: insertedMessage.id,
        event_type: 'sent',
      });

      // Simulate delivered event after a short delay (in production, this would come from the receiver's client)
      setTimeout(async () => {
        await supabase.from('chat_events').insert({
          message_id: insertedMessage.id,
          event_type: 'delivered',
        });
      }, 1000);
    }

    return true;
  }, [user, otherPartyId, taskId, isChatEnabled, messageTimes]);

  // Flag message
  const flagMessage = useCallback(async (messageId: string, reason: string): Promise<boolean> => {
    if (!user) return false;

    const { error: updateError } = await supabase
      .from('messages')
      .update({
        is_flagged: true,
        flagged_at: new Date().toISOString(),
        flagged_reason: reason,
      })
      .eq('id', messageId)
      .eq('receiver_id', user.id); // Only recipient can flag

    if (updateError) {
      console.error('Error flagging message:', updateError);
      toast.error('Failed to report message');
      return false;
    }

    // Create flagged event
    await supabase.from('chat_events').insert({
      message_id: messageId,
      event_type: 'flagged',
    });

    toast.success('Message reported. Our team will review it.');
    return true;
  }, [user]);

  // Mark message as read
  const markAsRead = useCallback(async (messageId: string): Promise<void> => {
    if (!user) return;

    // Check if already marked as read
    const { data: existingEvent } = await supabase
      .from('chat_events')
      .select('id')
      .eq('message_id', messageId)
      .eq('event_type', 'read')
      .maybeSingle();

    if (existingEvent) return;

    await supabase.from('chat_events').insert({
      message_id: messageId,
      event_type: 'read',
    });
  }, [user]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    flagMessage,
    markAsRead,
    isChatEnabled,
    rateLimitRemaining,
    messageEvents,
  };
}
