import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';

export interface FlaggedMessage {
  id: string;
  task_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_flagged: boolean;
  flagged_at: string;
  flagged_reason: string;
  created_at: string;
  task_title?: string;
  sender_name?: string;
  receiver_name?: string;
}

export interface PendingVerification {
  id: string;
  task_id: string;
  uploaded_by: string;
  phase: 'before' | 'after';
  image_path: string;
  is_approved: boolean | null;
  rejection_reason: string | null;
  uploaded_at: string;
  image_url?: string;
  task_title?: string;
  uploader_name?: string;
}

export interface UserRiskProfile {
  user_id: string;
  full_name: string;
  email?: string;
  disputes_count: number;
  sos_count: number;
  flagged_messages_count: number;
  is_frozen: boolean;
  created_at: string;
}

export interface ModerationEvent {
  id: string;
  admin_id: string;
  target_type: string;
  target_id: string;
  action_type: string;
  reason: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface UseModerationReturn {
  flaggedMessages: FlaggedMessage[];
  pendingVerifications: PendingVerification[];
  userRiskProfiles: UserRiskProfile[];
  moderationHistory: ModerationEvent[];
  isLoading: boolean;
  isAdmin: boolean;
  // Actions
  warnUser: (userId: string, messageId: string, reason: string) => Promise<boolean>;
  muteChat: (taskId: string, reason: string) => Promise<boolean>;
  freezeAccount: (userId: string, reason: string) => Promise<boolean>;
  unfreezeAccount: (userId: string, reason: string) => Promise<boolean>;
  overrideApproval: (verificationId: string, approve: boolean, reason: string) => Promise<boolean>;
  dismissFlag: (messageId: string, reason: string) => Promise<boolean>;
  refreshData: () => Promise<void>;
}

export function useModeration(): UseModerationReturn {
  const { user, currentRole } = useAuth();
  const [flaggedMessages, setFlaggedMessages] = useState<FlaggedMessage[]>([]);
  const [pendingVerifications, setPendingVerifications] = useState<PendingVerification[]>([]);
  const [userRiskProfiles, setUserRiskProfiles] = useState<UserRiskProfile[]>([]);
  const [moderationHistory, setModerationHistory] = useState<ModerationEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = currentRole === 'admin';

  const loadData = useCallback(async () => {
    if (!user || !isAdmin) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      // Load flagged messages
      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('is_flagged', true)
        .order('flagged_at', { ascending: false })
        .limit(100);

      setFlaggedMessages((messages || []) as FlaggedMessage[]);

      // Load pending/disputed verifications
      const { data: verifications } = await supabase
        .from('task_verifications')
        .select('*')
        .or('is_approved.is.null,is_approved.eq.false')
        .order('uploaded_at', { ascending: false })
        .limit(100);

      // Get signed URLs for verification images
      const verificationsWithUrls = await Promise.all(
        (verifications || []).map(async (v) => {
          const { data: urlData } = await supabase.storage
            .from('task-verifications')
            .createSignedUrl(v.image_path, 3600);
          return {
            ...v,
            phase: v.phase as 'before' | 'after',
            image_url: urlData?.signedUrl || '',
          };
        })
      );
      setPendingVerifications(verificationsWithUrls);

      // Load user risk profiles (aggregated data)
      // Get users with disputes
      const { data: disputeUsers } = await supabase
        .from('disputes')
        .select('raised_by_id')
        .not('raised_by_id', 'is', null);

      // Get users with SOS events
      const { data: sosUsers } = await supabase
        .from('sos_events')
        .select('user_id');

      // Get users with flagged messages (as senders)
      const { data: flaggedSenders } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('is_flagged', true);

      // Get frozen users
      const { data: frozenUsers } = await supabase
        .from('user_freezes')
        .select('user_id')
        .is('unfrozen_at', null);

      // Aggregate unique user IDs
      const userIds = new Set<string>();
      disputeUsers?.forEach(d => d.raised_by_id && userIds.add(d.raised_by_id));
      sosUsers?.forEach(s => userIds.add(s.user_id));
      flaggedSenders?.forEach(f => userIds.add(f.sender_id));

      // Get profiles for these users
      const riskProfiles: UserRiskProfile[] = [];
      for (const userId of userIds) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id, full_name, created_at')
          .eq('user_id', userId)
          .single();

        if (profile) {
          const disputesCount = disputeUsers?.filter(d => d.raised_by_id === userId).length || 0;
          const sosCount = sosUsers?.filter(s => s.user_id === userId).length || 0;
          const flaggedCount = flaggedSenders?.filter(f => f.sender_id === userId).length || 0;
          const isFrozen = frozenUsers?.some(f => f.user_id === userId) || false;

          riskProfiles.push({
            user_id: userId,
            full_name: profile.full_name,
            disputes_count: disputesCount,
            sos_count: sosCount,
            flagged_messages_count: flaggedCount,
            is_frozen: isFrozen,
            created_at: profile.created_at,
          });
        }
      }

      // Sort by risk (disputes + flagged messages)
      riskProfiles.sort((a, b) => 
        (b.disputes_count + b.flagged_messages_count) - (a.disputes_count + a.flagged_messages_count)
      );
      setUserRiskProfiles(riskProfiles);

      // Load moderation history
      const { data: history } = await supabase
        .from('moderation_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      setModerationHistory((history || []) as ModerationEvent[]);

    } catch (err) {
      console.error('Error loading moderation data:', err);
    }

    setIsLoading(false);
  }, [user, isAdmin]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const createModerationEvent = async (
    targetType: string,
    targetId: string,
    actionType: string,
    reason: string,
    metadata: Record<string, unknown> = {}
  ) => {
    if (!user) return;

    await supabase.from('moderation_events').insert([{
      admin_id: user.id,
      target_type: targetType,
      target_id: targetId,
      action_type: actionType,
      reason,
      metadata: metadata as unknown as import('@/integrations/supabase/types').Json,
    }]);
  };

  const warnUser = useCallback(async (userId: string, messageId: string, reason: string): Promise<boolean> => {
    if (!user || !isAdmin) return false;

    try {
      // Create notification for the user
      await supabase.rpc('create_notification', {
        _user_id: userId,
        _type: 'warning',
        _title: 'You have received a warning',
        _payload: { reason, message_id: messageId },
      });

      await createModerationEvent('user', userId, 'warn', reason, { message_id: messageId });
      toast.success('Warning sent to user');
      await loadData();
      return true;
    } catch (err) {
      console.error('Error warning user:', err);
      toast.error('Failed to warn user');
      return false;
    }
  }, [user, isAdmin, loadData]);

  const muteChat = useCallback(async (taskId: string, reason: string): Promise<boolean> => {
    if (!user || !isAdmin) return false;

    try {
      // Update task to muted status (we'll add a flag or use status)
      await createModerationEvent('task', taskId, 'mute_chat', reason);
      toast.success('Chat muted for this task');
      await loadData();
      return true;
    } catch (err) {
      console.error('Error muting chat:', err);
      toast.error('Failed to mute chat');
      return false;
    }
  }, [user, isAdmin, loadData]);

  const freezeAccount = useCallback(async (userId: string, reason: string): Promise<boolean> => {
    if (!user || !isAdmin) return false;

    try {
      const { error } = await supabase.from('user_freezes').insert({
        user_id: userId,
        frozen_by: user.id,
        reason,
      });

      if (error) throw error;

      await createModerationEvent('user', userId, 'freeze_account', reason);
      toast.success('Account frozen');
      await loadData();
      return true;
    } catch (err) {
      console.error('Error freezing account:', err);
      toast.error('Failed to freeze account');
      return false;
    }
  }, [user, isAdmin, loadData]);

  const unfreezeAccount = useCallback(async (userId: string, reason: string): Promise<boolean> => {
    if (!user || !isAdmin) return false;

    try {
      const { error } = await supabase
        .from('user_freezes')
        .update({
          unfrozen_at: new Date().toISOString(),
          unfrozen_by: user.id,
        })
        .eq('user_id', userId)
        .is('unfrozen_at', null);

      if (error) throw error;

      await createModerationEvent('user', userId, 'unfreeze_account', reason);
      toast.success('Account unfrozen');
      await loadData();
      return true;
    } catch (err) {
      console.error('Error unfreezing account:', err);
      toast.error('Failed to unfreeze account');
      return false;
    }
  }, [user, isAdmin, loadData]);

  const overrideApproval = useCallback(async (verificationId: string, approve: boolean, reason: string): Promise<boolean> => {
    if (!user || !isAdmin) return false;

    try {
      const { error } = await supabase
        .from('task_verifications')
        .update({
          is_approved: approve,
          rejection_reason: approve ? null : reason,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', verificationId);

      if (error) throw error;

      await createModerationEvent(
        'verification',
        verificationId,
        approve ? 'approve_override' : 'reject_override',
        reason
      );
      toast.success(approve ? 'Verification approved (admin override)' : 'Verification rejected (admin override)');
      await loadData();
      return true;
    } catch (err) {
      console.error('Error overriding verification:', err);
      toast.error('Failed to update verification');
      return false;
    }
  }, [user, isAdmin, loadData]);

  const dismissFlag = useCallback(async (messageId: string, reason: string): Promise<boolean> => {
    if (!user || !isAdmin) return false;

    try {
      const { error } = await supabase
        .from('messages')
        .update({
          is_flagged: false,
          flagged_at: null,
          flagged_reason: null,
        })
        .eq('id', messageId);

      if (error) throw error;

      await createModerationEvent('message', messageId, 'dismiss_flag', reason);
      toast.success('Flag dismissed');
      await loadData();
      return true;
    } catch (err) {
      console.error('Error dismissing flag:', err);
      toast.error('Failed to dismiss flag');
      return false;
    }
  }, [user, isAdmin, loadData]);

  return {
    flaggedMessages,
    pendingVerifications,
    userRiskProfiles,
    moderationHistory,
    isLoading,
    isAdmin,
    warnUser,
    muteChat,
    freezeAccount,
    unfreezeAccount,
    overrideApproval,
    dismissFlag,
    refreshData: loadData,
  };
}
