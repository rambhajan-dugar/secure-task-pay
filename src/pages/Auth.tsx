import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth, AppRole } from '@/contexts/SupabaseAuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Loader2, Upload, Shield, ImageIcon } from 'lucide-react';
import LanguageSelector from '@/components/LanguageSelector';

const Auth: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signIn, signUp, isAuthenticated, isLoading: authLoading, currentRole, profile } = useAuth();
  const { language } = useLanguage();
  
  const [mode, setMode] = useState<'login' | 'signup'>(
    searchParams.get('mode') === 'signup' ? 'signup' : 'login'
  );
  const [role, setRole] = useState<AppRole>(
    (searchParams.get('role') as AppRole) || 'task_doer'
  );
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [idImage, setIdImage] = useState<File | null>(null);
  const [idImagePreview, setIdImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });

  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    name?: string;
    idImage?: string;
  }>({});

  useEffect(() => {
    if (isAuthenticated && !authLoading && profile) {
      const verificationStatus = (profile as any).verification_status;
      if (verificationStatus === 'approved') {
        // Route based on role
        if (currentRole === 'task_poster') {
          navigate('/captain/dashboard');
        } else if (currentRole === 'admin') {
          navigate('/admin/moderation');
        } else {
          navigate('/ace/dashboard');
        }
      } else {
        navigate('/verification-pending');
      }
    }
  }, [isAuthenticated, authLoading, navigate, currentRole, profile]);

  const handleIdImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, idImage: 'Image must be less than 5MB' }));
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setErrors(prev => ({ ...prev, idImage: 'Only JPG, PNG, or WEBP images allowed' }));
        return;
      }
      setIdImage(file);
      setIdImagePreview(URL.createObjectURL(file));
      setErrors(prev => ({ ...prev, idImage: undefined }));
    }
  };

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
    
    if (mode === 'signup') {
      if (!formData.name.trim()) {
        newErrors.name = 'Name is required';
      }
      if (!idImage) {
        newErrors.idImage = 'ID image is required for verification';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const uploadIdImage = async (userId: string): Promise<string | null> => {
    if (!idImage) return null;
    const ext = idImage.name.split('.').pop();
    const path = `${userId}/id-verification.${ext}`;
    
    const { error } = await supabase.storage
      .from('id-verifications')
      .upload(path, idImage, { upsert: true });
    
    if (error) {
      console.error('ID image upload error:', error);
      return null;
    }
    return path;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    setErrors({});

    try {
      if (mode === 'login') {
        const { user } = await signIn(formData.email, formData.password);
        toast.success('Welcome back!');
        // Navigation handled by useEffect
      } else {
        const result = await signUp(formData.email, formData.password, formData.name, role, language);
        
        // Upload ID image after signup
        if (result.user) {
          const imagePath = await uploadIdImage(result.user.id);
          if (imagePath) {
            // Update profile with image path
            await supabase
              .from('profiles')
              .update({ id_image_url: imagePath } as any)
              .eq('user_id', result.user.id);
          }
        }
        
        toast.success('Account created! Pending verification.');
        // Auto login after signup
        await signIn(formData.email, formData.password);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong';
      if (message.includes('Invalid login credentials')) {
        toast.error('Invalid email or password');
      } else if (message.includes('User already registered')) {
        toast.error('An account with this email already exists');
        setMode('login');
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

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
      <div className="flex-1 flex items-center justify-center p-6 md:p-8">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">N</span>
              </div>
              <span className="text-xl font-bold">Nap-it</span>
            </Link>
            <LanguageSelector variant="dropdown" />
          </div>

          <h1 className="text-3xl font-bold mb-2">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-muted-foreground mb-6">
            {mode === 'login' 
              ? 'Sign in to continue' 
              : 'Join Nap-it as a Captain or Ace'}
          </p>

          {/* Role Selection - only on signup */}
          {mode === 'signup' && (
            <div className="mb-6">
              <Label className="text-sm text-muted-foreground mb-2 block">I want to be</Label>
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
                  <div className="text-lg mb-1">🎯</div>
                  <p className="font-semibold">Captain</p>
                  <p className="text-xs text-muted-foreground">I post tasks</p>
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
                  <div className="text-lg mb-1">⚡</div>
                  <p className="font-semibold">Ace</p>
                  <p className="text-xs text-muted-foreground">I complete tasks</p>
                </button>
              </div>
            </div>
          )}

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

            {/* ID Image Upload - only on signup */}
            {mode === 'signup' && (
              <div>
                <Label>ID Verification Image</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Upload a photo of your government-issued ID for verification
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleIdImageChange}
                  className="hidden"
                />
                {idImagePreview ? (
                  <div className="relative mt-1">
                    <img 
                      src={idImagePreview} 
                      alt="ID Preview" 
                      className="w-full h-32 object-cover rounded-xl border border-border"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIdImage(null);
                        setIdImagePreview(null);
                      }}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors ${
                      errors.idImage ? 'border-destructive' : 'border-border hover:border-primary/50'
                    }`}
                    disabled={loading}
                  >
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Click to upload ID image</span>
                  </button>
                )}
                {errors.idImage && <p className="text-destructive text-sm mt-1">{errors.idImage}</p>}
              </div>
            )}

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

          {mode === 'signup' && (
            <div className="mt-4 p-3 rounded-lg bg-info/10 border border-info/20 flex items-start gap-2">
              <Shield className="w-4 h-4 text-info shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Your account will be reviewed by our team before activation. This helps keep Nap-it safe for everyone.
              </p>
            </div>
          )}

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
          <h2 className="text-2xl font-bold mb-4">Verified & Secure Marketplace</h2>
          <p className="text-muted-foreground mb-8">
            Every user is verified before they can participate. Your safety is our priority.
          </p>
          <div className="flex flex-col gap-4 text-left">
            {[
              'ID verification for all users',
              'Role-based access (Captain or Ace)',
              '100% escrow-protected payments',
              'Admin-reviewed dispute resolution',
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
