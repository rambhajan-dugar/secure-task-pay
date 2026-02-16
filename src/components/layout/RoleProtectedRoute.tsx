import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, AppRole } from '@/contexts/SupabaseAuthContext';
import { Loader2 } from 'lucide-react';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: AppRole[];
  requireVerification?: boolean;
}

const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({
  children,
  allowedRoles,
  requireVerification = true,
}) => {
  const { isAuthenticated, isLoading, currentRole, profile } = useAuth();

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

  // Check verification status
  if (requireVerification) {
    const verificationStatus = (profile as any)?.verification_status;
    if (verificationStatus !== 'approved') {
      return <Navigate to="/verification-pending" replace />;
    }
  }

  // Check role
  if (!currentRole || !allowedRoles.includes(currentRole)) {
    // Redirect to proper dashboard based on current role
    if (currentRole === 'task_poster') return <Navigate to="/captain/dashboard" replace />;
    if (currentRole === 'admin') return <Navigate to="/admin/moderation" replace />;
    return <Navigate to="/ace/dashboard" replace />;
  }

  return <>{children}</>;
};

export default RoleProtectedRoute;
