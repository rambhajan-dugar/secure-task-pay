import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User } from '@/types';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatsCard from '@/components/shared/StatsCard';
import TaskCard from '@/components/shared/TaskCard';
import FeeBreakdown from '@/components/shared/FeeBreakdown';
import { mockTasks, mockEscrowTransactions } from '@/lib/mockData';
import { formatCurrency, calculateFee } from '@/lib/feeCalculator';
import { 
  Search, 
  Wallet, 
  TrendingUp, 
  CheckCircle,
  Clock,
  Star
} from 'lucide-react';

interface TaskDoerDashboardProps {
  user: User;
}

const TaskDoerDashboard: React.FC<TaskDoerDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState('available');
  
  // Filter tasks
  const myTasks = mockTasks.filter(t => t.doerId === user.id || t.doerName === 'Jane Smith');
  const availableTasks = mockTasks.filter(t => t.status === 'open');
  const inProgressTasks = myTasks.filter(t => ['accepted', 'in_progress'].includes(t.status));
  const submittedTasks = myTasks.filter(t => t.status === 'submitted');
  const completedTasks = myTasks.filter(t => ['approved', 'completed'].includes(t.status));

  const pendingEarnings = mockEscrowTransactions
    .filter(e => e.doerId === user.id || e.status === 'in_escrow')
    .reduce((sum, e) => sum + e.netPayout, 0);

  const feeInfo = calculateFee(10000, user.tasksCompleted);

  return (
    <div className="container mx-auto px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, Ace {user.name}</h1>
          <p className="text-muted-foreground">Find tasks and start earning</p>
        </div>
        <Button variant="hero" asChild>
          <Link to="/tasks">
            <Search className="w-4 h-4 mr-2" />
            Browse Tasks
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Total Earnings"
          value={formatCurrency(user.totalEarnings)}
          icon={Wallet}
          variant="success"
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Pending Payout"
          value={formatCurrency(pendingEarnings)}
          icon={Clock}
          variant="warning"
          subtitle="In escrow"
        />
        <StatsCard
          title="Tasks Completed"
          value={user.tasksCompleted}
          icon={CheckCircle}
          variant="info"
        />
        <StatsCard
          title="Current Fee Rate"
          value={`${feeInfo.appliedFeePercent}%`}
          icon={TrendingUp}
          variant="primary"
          subtitle={`${50 - user.tasksCompleted} more for 15%`}
        />
      </div>

      {/* Rating & Fee Info */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Rating */}
        <div className="p-6 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
              <Star className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Your Rating</p>
              <p className="text-2xl font-bold">{user.rating.toFixed(1)} / 5.0</p>
            </div>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-5 h-5 ${
                  star <= Math.floor(user.rating)
                    ? 'text-warning fill-warning'
                    : star <= user.rating
                    ? 'text-warning fill-warning/50'
                    : 'text-muted'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Fee Calculator Preview */}
        <div className="p-6 rounded-xl bg-card border border-border">
          <h3 className="font-semibold mb-4">Your Fee Structure</h3>
          <FeeBreakdown grossAmount={10000} tasksCompleted={user.tasksCompleted} showDetails={false} />
        </div>
      </div>

      {/* Active Work */}
      {(inProgressTasks.length > 0 || submittedTasks.length > 0) && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Your Active Work</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[...inProgressTasks, ...submittedTasks].map(task => (
              <TaskCard key={task.id} task={task} variant="compact" />
            ))}
          </div>
        </div>
      )}

      {/* Tasks */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="available">Available ({availableTasks.length})</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress ({inProgressTasks.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedTasks.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableTasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
          {availableTasks.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No tasks available right now. Check back later!
            </div>
          )}
        </TabsContent>

        <TabsContent value="in_progress" className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {inProgressTasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
          {inProgressTasks.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No tasks in progress
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {completedTasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
          {completedTasks.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No completed tasks yet. Start earning today!
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TaskDoerDashboard;
