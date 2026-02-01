/**
 * Realtime event subscriptions for task and wallet events
 * No UI - just state updates via callbacks
 */

import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';

interface TaskEvent {
  id: string;
  task_id: string;
  actor_id: string;
  event_type: string;
  old_state: string | null;
  new_state: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface WalletEvent {
  id: string;
  user_id: string;
  event_type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  created_at: string;
}

interface UseRealtimeEventsOptions {
  onTaskEvent?: (event: TaskEvent) => void;
  onWalletEvent?: (event: WalletEvent) => void;
  taskIds?: string[]; // Subscribe to specific tasks only
}

export function useRealtimeEvents(options: UseRealtimeEventsOptions = {}) {
  const { user } = useAuth();
  const { onTaskEvent, onWalletEvent, taskIds } = options;

  const handleTaskEvent = useCallback((payload: { new: TaskEvent }) => {
    if (onTaskEvent) {
      onTaskEvent(payload.new);
    }
  }, [onTaskEvent]);

  const handleWalletEvent = useCallback((payload: { new: WalletEvent }) => {
    if (onWalletEvent && payload.new.user_id === user?.id) {
      onWalletEvent(payload.new);
    }
  }, [onWalletEvent, user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    const channels: ReturnType<typeof supabase.channel>[] = [];

    // Subscribe to wallet events for current user
    if (onWalletEvent) {
      const walletChannel = supabase
        .channel('wallet-events')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'wallet_events',
            filter: `user_id=eq.${user.id}`,
          },
          handleWalletEvent
        )
        .subscribe();

      channels.push(walletChannel);
    }

    // Subscribe to task events
    if (onTaskEvent) {
      if (taskIds && taskIds.length > 0) {
        // Subscribe to specific tasks
        taskIds.forEach(taskId => {
          const taskChannel = supabase
            .channel(`task-events-${taskId}`)
            .on(
              'postgres_changes',
              {
                event: 'INSERT',
                schema: 'public',
                table: 'task_events',
                filter: `task_id=eq.${taskId}`,
              },
              handleTaskEvent
            )
            .subscribe();

          channels.push(taskChannel);
        });
      } else {
        // Subscribe to all task events (user will filter in callback)
        const taskChannel = supabase
          .channel('all-task-events')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'task_events',
            },
            handleTaskEvent
          )
          .subscribe();

        channels.push(taskChannel);
      }
    }

    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [user?.id, onTaskEvent, onWalletEvent, taskIds, handleTaskEvent, handleWalletEvent]);
}

// Hook for subscribing to a specific task's events
export function useTaskRealtimeEvents(
  taskId: string | undefined,
  onEvent: (event: TaskEvent) => void
) {
  useRealtimeEvents({
    onTaskEvent: onEvent,
    taskIds: taskId ? [taskId] : [],
  });
}
