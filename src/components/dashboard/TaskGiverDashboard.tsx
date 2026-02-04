import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User } from '@/types';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatsCard from '@/components/shared/StatsCard';
import TaskCard from '@/components/shared/TaskCard';
import CountdownTimer from '@/components/shared/CountdownTimer';
import EscrowStatusBadge from '@/components/shared/EscrowStatusBadge';
import { mockTasks, mockEscrowTransactions } from '@/lib/mockData';
import { formatCurrency } from '@/lib/feeCalculator';
import { 
  Plus, 
  FileText, 
  Wallet, 
  Clock, 
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface TaskGiverDashboardProps {
  user: User;
}

const TaskGiverDashboard: React.FC<TaskGiverDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState('active');
  
  // Filter tasks for this user
  const myTasks = mockTasks.filter(t => t.giverId === user.id || t.giverName === 'John Doe');
  const activeTasks = myTasks.filter(t => ['open', 'accepted', 'in_progress', 'submitted', 'under_review'].includes(t.status));
  const completedTasks = myTasks.filter(t => ['approved', 'completed'].includes(t.status));
  const pendingApproval = myTasks.filter(t => t.status === 'submitted');

  const totalInEscrow = mockEscrowTransactions
    .filter(e => e.status === 'in_escrow')
    .reduce((sum, e) => sum + e.grossAmount, 0);

  return (
    <div className="container mx-auto px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, Captain {user.name}</h1>
          <p className="text-muted-foreground">Manage your tasks and payments</p>
        </div>
        <Button variant="hero" asChild>
          <Link to="/create-task">
            <Plus className="w-4 h-4 mr-2" />
            Post New Task
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Active Tasks"
          value={activeTasks.length}
          icon={FileText}
          variant="info"
        />
        <StatsCard
          title="In Escrow"
          value={formatCurrency(totalInEscrow)}
          icon={Wallet}
          variant="warning"
          subtitle="Secured funds"
        />
        <StatsCard
          title="Pending Approval"
          value={pendingApproval.length}
          icon={Clock}
          variant="warning"
        />
        <StatsCard
          title="Completed"
          value={completedTasks.length}
          icon={CheckCircle}
          variant="success"
        />
      </div>

      {/* Pending Approval Alert */}
      {pendingApproval.length > 0 && (
        <div className="mb-8 p-4 rounded-xl bg-warning/10 border border-warning/20 flex items-start gap-4">
          <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-warning mb-1">
              {pendingApproval.length} task{pendingApproval.length > 1 ? 's' : ''} awaiting your approval
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Review submitted work within 24 hours or payments will auto-release.
            </p>
            <div className="space-y-2">
              {pendingApproval.map(task => {
                const escrow = mockEscrowTransactions.find(e => e.taskId === task.id);
                return (
                  <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border">
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="text-xs text-muted-foreground">{task.id}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      {escrow?.autoReleaseAt && (
                        <CountdownTimer 
                          targetDate={escrow.autoReleaseAt} 
                          label="Auto-release"
                        />
                      )}
                      <Button variant="success" size="sm" asChild>
                        <Link to={`/task/${task.id}`}>Review</Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Escrow Transactions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Active Escrow</h2>
        <div className="grid gap-4">
          {mockEscrowTransactions.filter(e => e.status === 'in_escrow').map(escrow => {
            const task = mockTasks.find(t => t.id === escrow.taskId);
            return (
              <div key={escrow.id} className="p-4 rounded-xl bg-card border border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-info/10 flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-info" />
                  </div>
                  <div>
                    <p className="font-medium">{task?.title || 'Task'}</p>
                    <p className="text-xs text-muted-foreground">{escrow.id} • To: {task?.doerName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-mono font-bold">{formatCurrency(escrow.grossAmount)}</p>
                    <EscrowStatusBadge status={escrow.status} size="sm" />
                  </div>
                  {escrow.autoReleaseAt && (
                    <CountdownTimer targetDate={escrow.autoReleaseAt} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tasks */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="active">Active ({activeTasks.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedTasks.length})</TabsTrigger>
          <TabsTrigger value="all">All Tasks ({myTasks.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeTasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
          {activeTasks.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground mb-4">No active tasks</p>
              <Button variant="hero" asChild>
                <Link to="/create-task">
                  <Plus className="w-4 h-4 mr-2" />
                  Post Your First Task
                </Link>
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {completedTasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
          {completedTasks.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No completed tasks yet
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myTasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TaskGiverDashboard;
