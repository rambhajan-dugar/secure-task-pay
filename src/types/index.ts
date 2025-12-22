export type UserRole = 'task_giver' | 'task_doer';

export type PaymentStatus = 'pending' | 'in_escrow' | 'released' | 'disputed' | 'refunded';

export type TaskStatus = 'open' | 'accepted' | 'in_progress' | 'submitted' | 'under_review' | 'approved' | 'disputed' | 'completed' | 'cancelled';

export type TaskCategory = 
  | 'design' 
  | 'development' 
  | 'writing' 
  | 'marketing' 
  | 'data_entry' 
  | 'research' 
  | 'translation' 
  | 'video' 
  | 'audio' 
  | 'other';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tasksCompleted: number;
  rating: number;
  totalEarnings: number;
  createdAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  reward: number;
  deadline: Date;
  status: TaskStatus;
  giverId: string;
  giverName: string;
  doerId?: string;
  doerName?: string;
  createdAt: Date;
  acceptedAt?: Date;
  submittedAt?: Date;
  approvedAt?: Date;
  escrowId?: string;
}

export interface EscrowTransaction {
  id: string;
  taskId: string;
  giverId: string;
  doerId: string;
  grossAmount: number;
  platformFee: number;
  feePercentage: number;
  netPayout: number;
  status: PaymentStatus;
  createdAt: Date;
  releasedAt?: Date;
  autoReleaseAt?: Date;
}

export interface Dispute {
  id: string;
  taskId: string;
  escrowId: string;
  raisedBy: string;
  reason: string;
  description: string;
  status: 'open' | 'under_review' | 'resolved_giver' | 'resolved_doer';
  createdAt: Date;
  resolvedAt?: Date;
}

export interface FeeCalculation {
  grossAmount: number;
  tasksCompleted: number;
  taskBasedFeePercent: number;
  valueBasedFeePercent: number | null;
  appliedFeePercent: number;
  platformFee: number;
  netPayout: number;
}
