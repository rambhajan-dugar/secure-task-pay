import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import TaskGiverDashboard from '@/components/dashboard/TaskGiverDashboard';
import TaskDoerDashboard from '@/components/dashboard/TaskDoerDashboard';
import Navbar from '@/components/layout/Navbar';

const Dashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-12">
        {user.role === 'task_giver' ? (
          <TaskGiverDashboard user={user} />
        ) : (
          <TaskDoerDashboard user={user} />
        )}
      </main>
    </div>
  );
};

export default Dashboard;
