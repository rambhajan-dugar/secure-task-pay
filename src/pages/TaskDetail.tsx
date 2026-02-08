import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import FeeBreakdown from '@/components/shared/FeeBreakdown';
import CountdownTimer from '@/components/shared/CountdownTimer';
import EscrowStatusBadge from '@/components/shared/EscrowStatusBadge';
import SOSButton from '@/components/safety/SOSButton';
import TaskChatPanel from '@/components/chat/TaskChatPanel';
import TaskVerificationPanel from '@/components/verification/TaskVerificationPanel';
import { mockTasks, mockEscrowTransactions, taskCategories, getStatusColor } from '@/lib/mockData';
import { formatCurrency } from '@/lib/feeCalculator';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Send,
  Shield,
  MapPin
} from 'lucide-react';

const TaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, currentRole, profile } = useAuth();
  
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showDisputeDialog, setShowDisputeDialog] = useState(false);
  const [submissionNote, setSubmissionNote] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDescription, setDisputeDescription] = useState('');

  const task = mockTasks.find(t => t.id === id);
  const escrow = mockEscrowTransactions.find(e => e.taskId === id);
  const category = taskCategories.find(c => c.value === task?.category);

  if (!task) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 container mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold mb-4">Task Not Found</h1>
          <Button variant="glass" asChild>
            <Link to="/tasks">Browse Tasks</Link>
          </Button>
        </div>
      </div>
    );
  }

  const statusVariant = getStatusColor(task.status) as any;
  const isGiver = currentRole === 'task_poster';
  const isDoer = currentRole === 'task_doer';
  const isMyTask = isGiver && task.giverName === profile?.full_name;
  const isAssignedToMe = isDoer && task.doerName === profile?.full_name;
  
  // Show SOS button for in-person tasks when doer is working on it
  const isInPersonTask = true; // Mock: assume all tasks can be in-person for demo
  const showSOS = isAssignedToMe && ['accepted', 'in_progress'].includes(task.status) && isInPersonTask;

  const handleAcceptTask = () => {
    toast.success('Task accepted! The giver will be notified to fund escrow.');
    setShowAcceptDialog(false);
    navigate('/dashboard');
  };

  const handleSubmitWork = () => {
    toast.success('Work submitted! Waiting for giver approval.');
    setShowSubmitDialog(false);
    navigate('/dashboard');
  };

  const handleApproveWork = () => {
    toast.success('Work approved! Payment released to the doer.');
    navigate('/dashboard');
  };

  const handleRaiseDispute = () => {
    toast.info('Dispute raised. Our team will review and contact both parties.');
    setShowDisputeDialog(false);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          {/* Back Button */}
          <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header Card */}
              <div className="p-6 rounded-xl bg-card border border-border">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center text-2xl">
                      {category?.icon}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{category?.label}</p>
                      <p className="text-xs text-muted-foreground font-mono">{task.id}</p>
                    </div>
                  </div>
                  <Badge variant={statusVariant} className="capitalize">
                    {task.status.replace('_', ' ')}
                  </Badge>
                </div>

                <h1 className="text-2xl font-bold mb-4">{task.title}</h1>

                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span>Posted by {task.giverName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Due {format(task.deadline, 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>Posted {format(task.createdAt, 'MMM dd')}</span>
                  </div>
                  {isInPersonTask && (
                    <div className="flex items-center gap-1 text-warning">
                      <MapPin className="w-4 h-4" />
                      <span>In-Person Task</span>
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <h3 className="font-medium mb-2">Description</h3>
                  <p className="text-muted-foreground whitespace-pre-line">{task.description}</p>
                </div>
              </div>

              {/* SOS Safety Section for In-Person Tasks */}
              {showSOS && (
                <div className="p-6 rounded-xl bg-destructive/5 border border-destructive/20">
                  <div className="flex items-center gap-3 mb-4">
                    <Shield className="w-5 h-5 text-destructive" />
                    <h2 className="text-lg font-semibold">Safety Tools</h2>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    This is an in-person task. If you feel unsafe at any point, use the SOS button below.
                  </p>
                <SOSButton 
                    taskId={task.id} 
                    userRole="doer"
                  />
                </div>
              )}

              {/* Image Verification Section (for assigned tasks) */}
              {task.doerName && ['accepted', 'in_progress', 'submitted', 'under_review'].includes(task.status) && (
                <TaskVerificationPanel
                  taskId={task.id}
                  taskStatus={task.status}
                  isDoer={isAssignedToMe}
                  isPoster={isMyTask}
                />
              )}

              {/* Chat Section (for assigned tasks) */}
              {task.doerName && (
                <TaskChatPanel
                  taskId={task.id}
                  taskStatus={task.status}
                  otherPartyId={isMyTask ? (task as any).doerId : (task as any).giverId}
                  otherPartyName={isMyTask ? task.doerName : task.giverName}
                  isChatMuted={false}
                  isUserFrozen={false}
                  isOtherPartyFrozen={false}
                  disputeStatus={task.status === 'disputed' ? 'open' : null}
                />
              )}

              {/* Escrow Info (for assigned tasks) */}
              {escrow && (
                <div className="p-6 rounded-xl bg-card border border-border">
                  <div className="flex items-center gap-3 mb-4">
                    <Shield className="w-5 h-5 text-info" />
                    <h2 className="text-lg font-semibold">Escrow Details</h2>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground mb-1">Escrow Amount</p>
                      <p className="text-2xl font-bold font-mono">{formatCurrency(escrow.grossAmount)}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground mb-1">Status</p>
                      <EscrowStatusBadge status={escrow.status} size="lg" />
                    </div>
                  </div>

                  {escrow.autoReleaseAt && escrow.status === 'in_escrow' && task.status === 'submitted' && (
                    <div className="mt-4">
                      <CountdownTimer 
                        targetDate={escrow.autoReleaseAt} 
                        label="Auto-release countdown"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Task Doer Info (if assigned) */}
              {task.doerName && (
                <div className="p-6 rounded-xl bg-card border border-border">
                  <h2 className="text-lg font-semibold mb-4">Assigned To</h2>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                      <span className="text-lg font-bold text-success">
                        {task.doerName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{task.doerName}</p>
                      <p className="text-sm text-muted-foreground">
                        {task.acceptedAt && `Accepted on ${format(task.acceptedAt, 'MMM dd, yyyy')}`}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Reward Card */}
              <div className="p-6 rounded-xl bg-card border border-border sticky top-24">
                <div className="text-center mb-6">
                  <p className="text-sm text-muted-foreground mb-1">Task Reward</p>
                  <p className="text-4xl font-bold font-mono text-primary">
                    {formatCurrency(task.reward)}
                  </p>
                </div>

                {/* Fee Breakdown for Doers */}
                {isDoer && profile && (
                  <div className="mb-6">
                    <FeeBreakdown 
                      grossAmount={task.reward} 
                      tasksCompleted={profile.tasks_completed || 0} 
                    />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  {/* Accept Task (for doers on open tasks) */}
                  {isDoer && task.status === 'open' && (
                    <Button 
                      variant="hero" 
                      className="w-full" 
                      onClick={() => setShowAcceptDialog(true)}
                    >
                      Accept Task
                    </Button>
                  )}

                  {/* Submit Work (for assigned doers on in-progress tasks) */}
                  {isAssignedToMe && ['accepted', 'in_progress'].includes(task.status) && (
                    <Button 
                      variant="success" 
                      className="w-full"
                      onClick={() => setShowSubmitDialog(true)}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Submit Work
                    </Button>
                  )}

                  {/* Approve/Dispute (for givers on submitted tasks) */}
                  {isMyTask && task.status === 'submitted' && (
                    <>
                      <Button 
                        variant="success" 
                        className="w-full"
                        onClick={handleApproveWork}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve & Release Payment
                      </Button>
                      <Button 
                        variant="destructive" 
                        className="w-full"
                        onClick={() => setShowDisputeDialog(true)}
                      >
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Raise Dispute
                      </Button>
                    </>
                  )}

                  {/* Not Authenticated */}
                  {!isAuthenticated && task.status === 'open' && (
                    <Button variant="hero" className="w-full" asChild>
                      <Link to="/auth?mode=signup&role=task_doer">
                        Sign Up to Accept
                      </Link>
                    </Button>
                  )}
                </div>

                {/* Trust Badge */}
                <div className="mt-6 p-3 rounded-lg bg-success/10 border border-success/20 text-center">
                  <div className="flex items-center justify-center gap-2 text-success text-sm">
                    <Shield className="w-4 h-4" />
                    <span>Escrow Protected</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Accept Task Dialog */}
      <Dialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept This Task?</DialogTitle>
            <DialogDescription>
              By accepting, you commit to completing this task by the deadline. The task giver will be notified to fund the escrow.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <FeeBreakdown 
              grossAmount={task.reward} 
              tasksCompleted={profile?.tasks_completed || 0} 
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAcceptDialog(false)}>Cancel</Button>
            <Button variant="hero" onClick={handleAcceptTask}>Accept Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submit Work Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Your Work</DialogTitle>
            <DialogDescription>
              Provide details about your completed work. The giver has 24 hours to review before auto-release.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Submission Notes</label>
              <Textarea
                placeholder="Describe what you've completed, include links to deliverables..."
                value={submissionNote}
                onChange={(e) => setSubmissionNote(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowSubmitDialog(false)}>Cancel</Button>
            <Button variant="success" onClick={handleSubmitWork}>
              <Send className="w-4 h-4 mr-2" />
              Submit Work
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dispute Dialog */}
      <Dialog open={showDisputeDialog} onOpenChange={setShowDisputeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Raise a Dispute</DialogTitle>
            <DialogDescription>
              Funds will remain in escrow while our team reviews the dispute and communicates with both parties.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Reason</label>
              <Select value={disputeReason} onValueChange={setDisputeReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="incomplete">Work is incomplete</SelectItem>
                  <SelectItem value="quality">Quality not as expected</SelectItem>
                  <SelectItem value="wrong">Wrong deliverables</SelectItem>
                  <SelectItem value="late">Submitted after deadline</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Textarea
                placeholder="Explain the issue in detail..."
                value={disputeDescription}
                onChange={(e) => setDisputeDescription(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDisputeDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRaiseDispute}>
              <AlertTriangle className="w-4 h-4 mr-2" />
              Raise Dispute
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaskDetail;
