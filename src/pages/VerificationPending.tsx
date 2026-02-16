import React from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Navigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Clock, Shield, LogOut, CheckCircle, XCircle } from 'lucide-react';
import { Loader2 } from 'lucide-react';

const VerificationPending: React.FC = () => {
  const { isAuthenticated, isLoading, profile, signOut, currentRole } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  const verificationStatus = (profile as any)?.verification_status || 'pending';

  // If approved, redirect to proper dashboard
  if (verificationStatus === 'approved') {
    if (currentRole === 'task_poster') return <Navigate to="/captain/dashboard" replace />;
    if (currentRole === 'admin') return <Navigate to="/admin/moderation" replace />;
    return <Navigate to="/ace/dashboard" replace />;
  }

  const handleLogout = async () => {
    await signOut();
  };

  const isRejected = verificationStatus === 'rejected';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${
          isRejected ? 'bg-destructive/10' : 'bg-warning/10'
        }`}>
          {isRejected ? (
            <XCircle className="w-10 h-10 text-destructive" />
          ) : (
            <Clock className="w-10 h-10 text-warning" />
          )}
        </div>

        <h1 className="text-2xl font-bold mb-2">
          {isRejected ? 'Verification Rejected' : 'Verification Pending'}
        </h1>

        <p className="text-muted-foreground mb-6">
          {isRejected
            ? 'Your ID verification was not approved. Please contact support or re-upload a clearer image.'
            : 'Your account is being reviewed by our team. This usually takes less than 24 hours.'}
        </p>

        <div className="p-4 rounded-xl bg-card border border-border mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-medium">Why verification?</span>
          </div>
          <ul className="text-sm text-muted-foreground space-y-2 text-left">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" />
              Protects against fraud and fake accounts
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" />
              Builds trust between Captains and Aces
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" />
              Ensures secure escrow transactions
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <Button variant="glass" onClick={handleLogout} className="w-full">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
          <Link to="/contact" className="text-sm text-primary hover:underline">
            Need help? Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerificationPending;
