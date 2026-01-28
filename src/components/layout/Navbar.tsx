import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { User, LogOut, LayoutDashboard, Settings, Wallet, RefreshCw } from 'lucide-react';
import { formatCurrency } from '@/lib/feeCalculator';
import { toast } from 'sonner';

const Navbar: React.FC = () => {
  const { user, isAuthenticated, signOut, profile, currentRole, switchRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const handleSwitchRole = async () => {
    const newRole = currentRole === 'task_poster' ? 'task_doer' : 'task_poster';
    try {
      await switchRole(newRole);
      toast.success(`Switched to ${newRole === 'task_poster' ? 'Task Giver' : 'Task Doer'} mode`);
    } catch (error) {
      toast.error('Failed to switch role');
    }
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const displayRole = currentRole === 'task_poster' ? 'Task Giver' : 'Task Doer';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">K</span>
            </div>
            <span className="text-xl font-bold">kaam.com</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/tasks" className="text-muted-foreground hover:text-foreground transition-colors">
              Browse Tasks
            </Link>
            <Link to="/how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </Link>
            <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
          </div>

          {/* Auth Section */}
          <div className="flex items-center gap-4">
            {isAuthenticated && user ? (
              <>
                {currentRole === 'task_doer' && profile && (
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success/10 border border-success/20">
                    <Wallet className="w-4 h-4 text-success" />
                    <span className="text-success font-medium">{formatCurrency(profile.wallet_balance || 0)}</span>
                  </div>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="glass" className="gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <span className="hidden sm:inline">{displayName}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{displayName}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-primary mt-1">{displayRole}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="cursor-pointer">
                        <LayoutDashboard className="w-4 h-4 mr-2" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSwitchRole} className="cursor-pointer">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Switch to {currentRole === 'task_poster' ? 'Task Doer' : 'Task Giver'}
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="cursor-pointer">
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/auth">Login</Link>
                </Button>
                <Button variant="hero" asChild>
                  <Link to="/auth?mode=signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
