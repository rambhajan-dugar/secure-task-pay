import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';

export interface TaskVerification {
  id: string;
  task_id: string;
  uploaded_by: string;
  phase: 'before' | 'after';
  image_path: string;
  is_approved: boolean | null;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  uploaded_at: string;
  expires_at: string;
  image_url?: string;
}

interface UseTaskVerificationReturn {
  verifications: TaskVerification[];
  isLoading: boolean;
  error: string | null;
  uploadImage: (file: File, phase: 'before' | 'after') => Promise<boolean>;
  approveVerification: (verificationId: string) => Promise<boolean>;
  rejectVerification: (verificationId: string, reason: string) => Promise<boolean>;
  canUpload: boolean;
  canReview: boolean;
  beforeImages: TaskVerification[];
  afterImages: TaskVerification[];
}

const MAX_IMAGES_PER_PHASE = 3;

export function useTaskVerification(
  taskId: string,
  taskStatus: string,
  isDoer: boolean,
  isPoster: boolean
): UseTaskVerificationReturn {
  const { user } = useAuth();
  const [verifications, setVerifications] = useState<TaskVerification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Permissions
  const canUpload = isDoer && ['accepted', 'in_progress', 'submitted'].includes(taskStatus);
  const canReview = isPoster;

  // Filtered lists
  const beforeImages = verifications.filter(v => v.phase === 'before');
  const afterImages = verifications.filter(v => v.phase === 'after');

  // Load verifications
  useEffect(() => {
    if (!taskId || !user) return;

    const loadVerifications = async () => {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('task_verifications')
        .select('*')
        .eq('task_id', taskId)
        .order('uploaded_at', { ascending: true });

      if (fetchError) {
        setError(fetchError.message);
        console.error('Error loading verifications:', fetchError);
      } else {
        // Get signed URLs for images
        const verificationsWithUrls = await Promise.all(
          (data || []).map(async (v) => {
            const { data: urlData } = await supabase.storage
              .from('task-verifications')
              .createSignedUrl(v.image_path, 3600); // 1 hour expiry
            return {
              ...v,
              phase: v.phase as 'before' | 'after',
              image_url: urlData?.signedUrl || '',
            };
          })
        );
        setVerifications(verificationsWithUrls);
      }

      setIsLoading(false);
    };

    loadVerifications();
  }, [taskId, user]);

  // Upload image
  const uploadImage = useCallback(async (file: File, phase: 'before' | 'after'): Promise<boolean> => {
    if (!user || !canUpload) {
      toast.error('You cannot upload images at this time');
      return false;
    }

    // Check limit
    const currentPhaseCount = verifications.filter(v => v.phase === phase).length;
    if (currentPhaseCount >= MAX_IMAGES_PER_PHASE) {
      toast.error(`Maximum ${MAX_IMAGES_PER_PHASE} ${phase} images allowed`);
      return false;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPEG, PNG, and WebP images are allowed');
      return false;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return false;
    }

    try {
      // Upload to storage
      const fileName = `${user.id}/${taskId}/${phase}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('task-verifications')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error('Failed to upload image');
        return false;
      }

      // Create verification record
      const { data: newVerification, error: insertError } = await supabase
        .from('task_verifications')
        .insert({
          task_id: taskId,
          uploaded_by: user.id,
          phase,
          image_path: fileName,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        toast.error('Failed to save verification');
        return false;
      }

      // Get signed URL
      const { data: urlData } = await supabase.storage
        .from('task-verifications')
        .createSignedUrl(fileName, 3600);

      setVerifications(prev => [...prev, {
        ...newVerification,
        phase: newVerification.phase as 'before' | 'after',
        image_url: urlData?.signedUrl || '',
      }]);

      toast.success(`${phase.charAt(0).toUpperCase() + phase.slice(1)} image uploaded`);
      return true;
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Failed to upload image');
      return false;
    }
  }, [user, taskId, canUpload, verifications]);

  // Approve verification
  const approveVerification = useCallback(async (verificationId: string): Promise<boolean> => {
    if (!user || !canReview) {
      toast.error('You cannot review verifications');
      return false;
    }

    const { error: updateError } = await supabase
      .from('task_verifications')
      .update({
        is_approved: true,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', verificationId);

    if (updateError) {
      console.error('Approve error:', updateError);
      toast.error('Failed to approve verification');
      return false;
    }

    setVerifications(prev =>
      prev.map(v =>
        v.id === verificationId
          ? { ...v, is_approved: true, reviewed_by: user.id, reviewed_at: new Date().toISOString() }
          : v
      )
    );

    toast.success('Verification approved');
    return true;
  }, [user, canReview]);

  // Reject verification
  const rejectVerification = useCallback(async (verificationId: string, reason: string): Promise<boolean> => {
    if (!user || !canReview) {
      toast.error('You cannot review verifications');
      return false;
    }

    const { error: updateError } = await supabase
      .from('task_verifications')
      .update({
        is_approved: false,
        rejection_reason: reason,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', verificationId);

    if (updateError) {
      console.error('Reject error:', updateError);
      toast.error('Failed to reject verification');
      return false;
    }

    setVerifications(prev =>
      prev.map(v =>
        v.id === verificationId
          ? { ...v, is_approved: false, rejection_reason: reason, reviewed_by: user.id, reviewed_at: new Date().toISOString() }
          : v
      )
    );

    toast.success('Verification rejected. Doer will be asked to re-upload.');
    return true;
  }, [user, canReview]);

  return {
    verifications,
    isLoading,
    error,
    uploadImage,
    approveVerification,
    rejectVerification,
    canUpload,
    canReview,
    beforeImages,
    afterImages,
  };
}
