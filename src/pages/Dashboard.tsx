import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import TaskGiverDashboard from '@/components/dashboard/TaskGiverDashboard';
import TaskDoerDashboard from '@/components/dashboard/TaskDoerDashboard';
import Navbar from '@/components/layout/Navbar';
import { Loader2 } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { isAuthenticated, isLoading, currentRole, profile, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/auth" replace />;
  }

  // Check verification
  const verificationStatus = (profile as any)?.verification_status;
  if (verificationStatus !== 'approved') {
    return <Navigate to="/verification-pending" replace />;
  }

  // Role-based redirect for legacy /dashboard route
  const path = window.location.pathname;
  if (path === '/dashboard') {
    if (currentRole === 'task_poster') return <Navigate to="/captain/dashboard" replace />;
    if (currentRole === 'admin') return <Navigate to="/admin/moderation" replace />;
    return <Navigate to="/ace/dashboard" replace />;
  }

  const compatibleUser = {
    id: user.id,
    email: user.email || '',
    name: profile?.full_name || user.email || 'User',
    role: currentRole === 'task_poster' ? 'task_giver' as const : 'task_doer' as const,
    tasksCompleted: profile?.tasks_completed || 0,
    rating: profile?.rating || 0,
    totalEarnings: profile?.total_earnings || 0,
    createdAt: new Date(profile?.created_at || Date.now()),
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-12">
        {currentRole === 'task_poster' ? (
          <TaskGiverDashboard user={compatibleUser} />
        ) : (
          <TaskDoerDashboard user={compatibleUser} />
        )}
      </main>
    </div>
  );
};

export default Dashboard;
