/**
 * Task state guard utilities
 * Determines which actions are allowed based on current state and user role
 */

import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useMemo } from 'react';

export type TaskStatus = 
  | 'open' 
  | 'accepted' 
  | 'in_progress' 
  | 'submitted' 
  | 'under_review'
  | 'approved' 
  | 'disputed' 
  | 'completed' 
  | 'cancelled';

export interface TaskGuardInput {
  status: TaskStatus;
  posterId: string;
  doerId?: string | null;
}

export interface TaskActions {
  canAccept: boolean;
  canStart: boolean;
  canSubmit: boolean;
  canApprove: boolean;
  canDispute: boolean;
  canCancel: boolean;
  canRelease: boolean;
}

export function useTaskActions(task: TaskGuardInput | null): TaskActions {
  const { user, currentRole, profile } = useAuth();

  return useMemo(() => {
    const noActions: TaskActions = {
      canAccept: false,
      canStart: false,
      canSubmit: false,
      canApprove: false,
      canDispute: false,
      canCancel: false,
      canRelease: false,
    };

    if (!task || !user || !profile) {
      return noActions;
    }

    const userId = user.id;
    const isPoster = task.posterId === userId;
    const isDoer = task.doerId === userId;
    const isAssignedDoer = isDoer && task.doerId != null;

    // Role-based restrictions
    const canActAsPoster = isPoster && currentRole === 'task_poster';
    const canActAsDoer = currentRole === 'task_doer';

    return {
      // Doer can accept open tasks (not their own)
      canAccept: 
        task.status === 'open' && 
        canActAsDoer && 
        !isPoster,

      // Assigned doer can start accepted tasks
      canStart: 
        task.status === 'accepted' && 
        isAssignedDoer,

      // Assigned doer can submit in-progress tasks
      canSubmit: 
        task.status === 'in_progress' && 
        isAssignedDoer,

      // Poster can approve submitted work
      canApprove: 
        task.status === 'submitted' && 
        canActAsPoster,

      // Poster can dispute submitted work
      canDispute: 
        task.status === 'submitted' && 
        canActAsPoster,

      // Poster can cancel open tasks
      canCancel: 
        task.status === 'open' && 
        canActAsPoster,

      // Poster can manually release escrow on submitted tasks
      canRelease: 
        task.status === 'submitted' && 
        canActAsPoster,
    };
  }, [task, user, currentRole, profile]);
}

// Check if a wallet operation is allowed
export function useWalletGuards() {
  const { profile, isAuthenticated } = useAuth();

  return useMemo(() => {
    const balance = profile?.wallet_balance ?? 0;

    return {
      canAddFunds: isAuthenticated,
      canWithdraw: isAuthenticated && balance > 0,
      maxWithdraw: balance,
      isBalancePositive: balance > 0,
    };
  }, [profile, isAuthenticated]);
}

// State transition display helper
export function getNextActions(status: TaskStatus, role: 'poster' | 'doer'): string[] {
  const posterActions: Record<TaskStatus, string[]> = {
    open: ['Cancel Task'],
    accepted: [],
    in_progress: [],
    submitted: ['Approve', 'Dispute', 'Release Manually'],
    under_review: ['Approve', 'Dispute'],
    approved: [],
    disputed: ['Awaiting Admin Resolution'],
    completed: [],
    cancelled: [],
  };

  const doerActions: Record<TaskStatus, string[]> = {
    open: ['Accept Task'],
    accepted: ['Start Work'],
    in_progress: ['Submit Work'],
    submitted: ['Awaiting Review'],
    under_review: ['Awaiting Review'],
    approved: [],
    disputed: ['Awaiting Resolution'],
    completed: [],
    cancelled: [],
  };

  return role === 'poster' ? posterActions[status] : doerActions[status];
}
