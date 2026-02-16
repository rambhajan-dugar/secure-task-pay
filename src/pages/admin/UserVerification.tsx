import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, Eye, UserCheck, UserX, Shield } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import Navbar from '@/components/layout/Navbar';

interface PendingUser {
  id: string;
  user_id: string;
  full_name: string;
  verification_status: string;
  id_image_url: string | null;
  created_at: string;
}

const UserVerification: React.FC = () => {
  const { user } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [reason, setReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .then(async (result) => {
        // Filter client-side since verification_status is new
        if (result.error) return result;
        let filtered = result.data || [];
        if (filter !== 'all') {
          filtered = filtered.filter((p: any) => p.verification_status === filter);
        }
        return { data: filtered, error: null };
      }) as any;
    if (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } else {
      setPendingUsers((data as any) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [filter]);

  const viewIdImage = async (profile: PendingUser) => {
    setSelectedUser(profile);
    if (profile.id_image_url) {
      const { data } = supabase.storage
        .from('id-verifications')
        .getPublicUrl(profile.id_image_url);
      
      // For private buckets, use createSignedUrl
      const { data: signedData } = await supabase.storage
        .from('id-verifications')
        .createSignedUrl(profile.id_image_url, 300);
      
      setImageUrl(signedData?.signedUrl || null);
    }
  };

  const handleAction = async () => {
    if (!selectedUser || !action || !user) return;
    setProcessing(true);

    try {
      const newStatus = action === 'approve' ? 'approved' : 'rejected';

      const { error } = await supabase
        .from('profiles')
        .update({ verification_status: newStatus } as any)
        .eq('user_id', selectedUser.user_id);

      if (error) throw error;

      // Log admin action
      await supabase.from('admin_actions').insert({
        admin_id: user.id,
        action_type: `user_${action}`,
        target_type: 'user',
        target_id: selectedUser.user_id,
        reason: reason || null,
        new_value: { verification_status: newStatus },
        old_value: { verification_status: selectedUser.verification_status },
      });

      toast.success(`User ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
      setSelectedUser(null);
      setAction(null);
      setReason('');
      fetchUsers();
    } catch (error) {
      toast.error(`Failed to ${action} user`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">User Verification</h1>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'glass'}
                size="sm"
                onClick={() => setFilter(f)}
                className="capitalize"
              >
                {f}
              </Button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : pendingUsers.length === 0 ? (
            <div className="text-center py-20">
              <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No {filter} users</h3>
              <p className="text-muted-foreground">
                {filter === 'pending' ? 'All users have been reviewed!' : `No ${filter} users found.`}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {pendingUsers.map((profile) => (
                <div
                  key={profile.id}
                  className="p-4 rounded-xl bg-card border border-border flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-bold text-primary">
                        {profile.full_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{profile.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Registered {new Date(profile.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        profile.verification_status === 'approved'
                          ? 'default'
                          : profile.verification_status === 'rejected'
                          ? 'destructive'
                          : 'secondary'
                      }
                      className="capitalize"
                    >
                      {profile.verification_status}
                    </Badge>

                    <Button
                      variant="glass"
                      size="sm"
                      onClick={() => viewIdImage(profile)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Review
                    </Button>

                    {profile.verification_status === 'pending' && (
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(profile);
                            setAction('approve');
                          }}
                        >
                          <UserCheck className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(profile);
                            setAction('reject');
                          }}
                        >
                          <UserX className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Review Image Dialog */}
      <Dialog open={!!selectedUser && !action} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>ID Verification - {selectedUser?.full_name}</DialogTitle>
            <DialogDescription>Review the uploaded ID image</DialogDescription>
          </DialogHeader>
          {imageUrl ? (
            <img src={imageUrl} alt="ID Verification" className="w-full rounded-lg border border-border" />
          ) : (
            <div className="text-center py-8 text-muted-foreground">No ID image uploaded</div>
          )}
          <DialogFooter className="flex gap-2">
            <Button
              variant="default"
              onClick={() => setAction('approve')}
            >
              <UserCheck className="w-4 h-4 mr-1" />
              Approve
            </Button>
            <Button
              variant="destructive"
              onClick={() => setAction('reject')}
            >
              <UserX className="w-4 h-4 mr-1" />
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={!!action} onOpenChange={() => { setAction(null); setReason(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === 'approve' ? 'Approve User' : 'Reject User'}
            </DialogTitle>
            <DialogDescription>
              {action === 'approve'
                ? `This will allow ${selectedUser?.full_name} to access the platform.`
                : `This will prevent ${selectedUser?.full_name} from accessing the platform.`}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder={action === 'reject' ? 'Reason for rejection (required)' : 'Notes (optional)'}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setAction(null); setReason(''); }}>
              Cancel
            </Button>
            <Button
              variant={action === 'approve' ? 'default' : 'destructive'}
              onClick={handleAction}
              disabled={processing || (action === 'reject' && !reason.trim())}
            >
              {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirm {action === 'approve' ? 'Approval' : 'Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserVerification;
