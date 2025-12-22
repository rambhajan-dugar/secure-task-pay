import { FeeCalculation } from '@/types';

// Task-based fee structure
const getTaskBasedFeePercent = (tasksCompleted: number): number => {
  if (tasksCompleted < 12) return 20;
  if (tasksCompleted < 50) return 15;
  if (tasksCompleted < 200) return 12.5;
  return 12;
};

// Value-based fee structure (high-value transactions)
const getValueBasedFeePercent = (amount: number): number | null => {
  if (amount >= 500000) return 4;
  if (amount >= 123000) return 6.5;
  if (amount >= 47000) return 8;
  if (amount >= 20000) return 10;
  return null;
};

export const calculateFee = (grossAmount: number, tasksCompleted: number): FeeCalculation => {
  const taskBasedFeePercent = getTaskBasedFeePercent(tasksCompleted);
  const valueBasedFeePercent = getValueBasedFeePercent(grossAmount);
  
  // Apply whichever fee results in LOWER platform fee
  let appliedFeePercent: number;
  
  if (valueBasedFeePercent !== null && valueBasedFeePercent < taskBasedFeePercent) {
    appliedFeePercent = valueBasedFeePercent;
  } else {
    appliedFeePercent = taskBasedFeePercent;
  }
  
  const platformFee = Math.round((grossAmount * appliedFeePercent) / 100);
  const netPayout = grossAmount - platformFee;
  
  return {
    grossAmount,
    tasksCompleted,
    taskBasedFeePercent,
    valueBasedFeePercent,
    appliedFeePercent,
    platformFee,
    netPayout,
  };
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatPercentage = (percent: number): string => {
  return `${percent}%`;
};
