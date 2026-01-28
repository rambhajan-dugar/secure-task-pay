import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth, AppRole } from '@/contexts/SupabaseAuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import LanguageSelector from '@/components/LanguageSelector';

const Auth: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signIn, signUp, isAuthenticated, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  
  const [mode, setMode] = useState<'login' | 'signup'>(
    searchParams.get('mode') === 'signup' ? 'signup' : 'login'
  );
  const [role, setRole] = useState<AppRole>(
    (searchParams.get('role') as AppRole) || 'task_doer'
  );
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });

  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    name?: string;
  }>({});

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, authLoading, navigate]);

  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (mode === 'signup' && !formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setErrors({});

    try {
      if (mode === 'login') {
        await signIn(formData.email, formData.password);
        toast.success('Welcome back!');
        navigate('/dashboard');
      } else {
        await signUp(formData.email, formData.password, formData.name, role, language);
        toast.success('Account created! You can now sign in.');
        // Auto login after signup (since auto-confirm is enabled)
        await signIn(formData.email, formData.password);
        navigate('/dashboard');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong';
      
      // Handle specific Supabase errors
      if (message.includes('Invalid login credentials')) {
        toast.error('Invalid email or password');
      } else if (message.includes('User already registered')) {
        toast.error('An account with this email already exists');
        setMode('login');
      } else if (message.includes('Email not confirmed')) {
        toast.error('Please confirm your email before signing in');
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">K</span>
              </div>
              <span className="text-xl font-bold">kaam.com</span>
            </Link>
            <LanguageSelector variant="dropdown" />
          </div>

          <h1 className="text-3xl font-bold mb-2">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-muted-foreground mb-8">
            {mode === 'login' 
              ? 'Sign in to continue to your dashboard' 
              : 'Join thousands of users on kaam.com'}
          </p>

          {/* Role Selection */}
          <div className="mb-6">
            <Label className="text-sm text-muted-foreground mb-2 block">I want to</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('task_poster')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  role === 'task_poster'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <p className="font-medium">Post Tasks</p>
                <p className="text-xs text-muted-foreground">I need work done</p>
              </button>
              <button
                type="button"
                onClick={() => setRole('task_doer')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  role === 'task_doer'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <p className="font-medium">Do Tasks</p>
                <p className="text-xs text-muted-foreground">I want to earn</p>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <Label htmlFor="name">Full Name</Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`pl-10 ${errors.name ? 'border-destructive' : ''}`}
                    disabled={loading}
                  />
                </div>
                {errors.name && <p className="text-destructive text-sm mt-1">{errors.name}</p>}
              </div>
            )}

            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
                  disabled={loading}
                />
              </div>
              {errors.email && <p className="text-destructive text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`pl-10 pr-10 ${errors.password ? 'border-destructive' : ''}`}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-destructive text-sm mt-1">{errors.password}</p>}
            </div>

            <Button type="submit" variant="hero" className="w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
              <button
                onClick={() => {
                  setMode(mode === 'login' ? 'signup' : 'login');
                  setErrors({});
                }}
                className="text-primary font-medium ml-1 hover:underline"
                disabled={loading}
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Branding */}
      <div className="hidden lg:flex flex-1 bg-card border-l border-border items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-8">
            <span className="text-4xl">🔒</span>
          </div>
          <h2 className="text-2xl font-bold mb-4">Secure Escrow Payments</h2>
          <p className="text-muted-foreground mb-8">
            Your money is protected until you're satisfied with the work. No risks, only rewards.
          </p>
          <div className="flex flex-col gap-4 text-left">
            {[
              '100% money protection with escrow',
              '24-hour auto-release for quick payments',
              'Dispute resolution by our team',
              'Decreasing fees as you grow',
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center shrink-0">
                  <span className="text-success text-xs">✓</span>
                </div>
                <span className="text-sm text-muted-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
