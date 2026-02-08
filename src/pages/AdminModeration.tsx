import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useModeration } from '@/hooks/useModeration';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import {
  Shield,
  MessageSquare,
  Image as ImageIcon,
  Users,
  History,
  Flag,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Ban,
  Unlock,
  RefreshCw,
  Loader2,
  Scale,
} from 'lucide-react';

const AdminModeration: React.FC = () => {
  const { isAuthenticated, currentRole, isLoading: authLoading } = useAuth();
  const {
    flaggedMessages,
    pendingVerifications,
    userRiskProfiles,
    moderationHistory,
    isLoading,
    isAdmin,
    warnUser,
    freezeAccount,
    unfreezeAccount,
    overrideApproval,
    dismissFlag,
    refreshData,
  } = useModeration();

  const [actionDialog, setActionDialog] = useState<{
    type: 'warn' | 'freeze' | 'unfreeze' | 'approve' | 'reject' | 'dismiss' | null;
    targetId: string;
    secondaryId?: string;
  }>({ type: null, targetId: '' });
  const [actionReason, setActionReason] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({ open: false, title: '', description: '', onConfirm: () => {} });

  // Redirect if not admin
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || currentRole !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const handleAction = async () => {
    if (!actionDialog.type || !actionReason.trim()) return;

    let success = false;
    switch (actionDialog.type) {
      case 'warn':
        success = await warnUser(actionDialog.targetId, actionDialog.secondaryId || '', actionReason);
        break;
      case 'freeze':
        success = await freezeAccount(actionDialog.targetId, actionReason);
        break;
      case 'unfreeze':
        success = await unfreezeAccount(actionDialog.targetId, actionReason);
        break;
      case 'approve':
        success = await overrideApproval(actionDialog.targetId, true, actionReason);
        break;
      case 'reject':
        success = await overrideApproval(actionDialog.targetId, false, actionReason);
        break;
      case 'dismiss':
        success = await dismissFlag(actionDialog.targetId, actionReason);
        break;
    }

    if (success) {
      setActionDialog({ type: null, targetId: '' });
      setActionReason('');
    }
  };

  const openActionDialog = (type: typeof actionDialog.type, targetId: string, secondaryId?: string) => {
    setActionDialog({ type, targetId, secondaryId });
    setActionReason('');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Moderation Dashboard</h1>
                <p className="text-muted-foreground">Manage flagged content and user safety</p>
              </div>
            </div>
            <Button variant="outline" onClick={refreshData} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Flagged Messages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Flag className="w-5 h-5 text-destructive" />
                  <span className="text-2xl font-bold">{flaggedMessages.length}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pending Verifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-warning" />
                  <span className="text-2xl font-bold">{pendingVerifications.length}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  At-Risk Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-info" />
                  <span className="text-2xl font-bold">{userRiskProfiles.length}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Actions Today
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-success" />
                  <span className="text-2xl font-bold">
                    {moderationHistory.filter(
                      (e) => new Date(e.created_at).toDateString() === new Date().toDateString()
                    ).length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Tabs */}
          <Tabs defaultValue="disputes" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="disputes" className="flex items-center gap-2">
                <Scale className="w-4 h-4" />
                Disputes
              </TabsTrigger>
              <TabsTrigger value="flagged" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Flagged Chats
              </TabsTrigger>
              <TabsTrigger value="verifications" className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Image Review
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                User Risk
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="w-4 h-4" />
                History
              </TabsTrigger>
            </TabsList>

            {/* Disputes Tab */}
            <TabsContent value="disputes">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scale className="w-5 h-5" />
                    Dispute Queue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <div className="text-center py-12 text-muted-foreground">
                      <Scale className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No disputes in queue</p>
                      <p className="text-sm mt-2">Disputes will appear here when Captain or Ace raise them</p>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Flagged Messages Tab */}
            <TabsContent value="flagged">
              <Card>
                <CardHeader>
                  <CardTitle>Flagged Messages</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    {flaggedMessages.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Flag className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No flagged messages</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {flaggedMessages.map((msg) => (
                          <div key={msg.id} className="p-4 rounded-lg border border-border bg-muted/30">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="destructive">{msg.flagged_reason}</Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(msg.flagged_at), 'MMM dd, HH:mm')}
                                  </span>
                                </div>
                                <p className="text-sm bg-muted p-3 rounded-lg mb-2">
                                  "{msg.content}"
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Task ID: {msg.task_id.slice(0, 8)}...
                                </p>
                              </div>
                              <div className="flex flex-col gap-2">
                                <Button
                                  size="sm"
                                  variant="warning"
                                  onClick={() => openActionDialog('warn', msg.sender_id, msg.id)}
                                >
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  Warn
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => openActionDialog('freeze', msg.sender_id)}
                                >
                                  <Ban className="w-3 h-3 mr-1" />
                                  Freeze
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openActionDialog('dismiss', msg.id)}
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Dismiss
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Image Verifications Tab */}
            <TabsContent value="verifications">
              <Card>
                <CardHeader>
                  <CardTitle>Image Review Queue</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    {pendingVerifications.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No pending verifications</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pendingVerifications.map((v) => (
                          <div key={v.id} className="p-4 rounded-lg border border-border">
                            <div className="mb-3">
                              <AspectRatio ratio={4 / 3}>
                                {v.image_url ? (
                                  <img
                                    src={v.image_url}
                                    alt="Verification"
                                    className="w-full h-full object-cover rounded-lg"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-muted flex items-center justify-center rounded-lg">
                                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                                  </div>
                                )}
                              </AspectRatio>
                            </div>
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="secondary" className="capitalize">
                                {v.phase}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(v.uploaded_at), 'MMM dd')}
                              </span>
                            </div>
                            {v.rejection_reason && (
                              <p className="text-xs text-destructive mb-2">
                                Previously rejected: {v.rejection_reason}
                              </p>
                            )}
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="success"
                                className="flex-1"
                                onClick={() => openActionDialog('approve', v.id)}
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="flex-1"
                                onClick={() => openActionDialog('reject', v.id)}
                              >
                                <XCircle className="w-3 h-3 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* User Risk Tab */}
            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>User Risk Profiles</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    {userRiskProfiles.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No at-risk users</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {userRiskProfiles.map((user) => (
                          <div
                            key={user.user_id}
                            className="p-4 rounded-lg border border-border flex items-center justify-between"
                          >
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{user.full_name}</span>
                                {user.is_frozen && (
                                  <Badge variant="destructive">Frozen</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>Disputes: {user.disputes_count}</span>
                                <span>SOS: {user.sos_count}</span>
                                <span>Flags: {user.flagged_messages_count}</span>
                              </div>
                            </div>
                            <div>
                              {user.is_frozen ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openActionDialog('unfreeze', user.user_id)}
                                >
                                  <Unlock className="w-3 h-3 mr-1" />
                                  Unfreeze
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => openActionDialog('freeze', user.user_id)}
                                >
                                  <Ban className="w-3 h-3 mr-1" />
                                  Freeze
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Moderation History</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    {moderationHistory.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No moderation actions yet</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {moderationHistory.map((event) => (
                          <div
                            key={event.id}
                            className="p-3 rounded-lg border border-border flex items-center gap-4"
                          >
                            <Badge variant="outline" className="capitalize">
                              {event.action_type.replace('_', ' ')}
                            </Badge>
                            <span className="text-sm flex-1">
                              {event.target_type}: {event.target_id.slice(0, 8)}...
                            </span>
                            {event.reason && (
                              <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {event.reason}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(event.created_at), 'MMM dd, HH:mm')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Action Dialog */}
      <Dialog open={!!actionDialog.type} onOpenChange={() => setActionDialog({ type: null, targetId: '' })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="capitalize">
              {actionDialog.type?.replace('_', ' ')} Action
            </DialogTitle>
            <DialogDescription>
              Provide a reason for this action. This will be logged for audit purposes.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="Enter reason..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setActionDialog({ type: null, targetId: '' })}>
              Cancel
            </Button>
            <Button
              variant={actionDialog.type === 'dismiss' || actionDialog.type === 'approve' || actionDialog.type === 'unfreeze' ? 'default' : 'destructive'}
              onClick={handleAction}
              disabled={!actionReason.trim()}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDialog.onConfirm}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminModeration;
