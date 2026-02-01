/**
 * Hook for uploading submission files to Supabase Storage
 * Files are stored in: submissions/{task_id}/{user_id}/{filename}
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface UploadResult {
  path: string;
  url: string;
}

// Allowed MIME types (must match storage bucket config)
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'video/mp4',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function useSubmissionUpload(taskId: string) {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `File type ${file.type} not allowed. Allowed: JPEG, PNG, WebP, PDF, MP4`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size is 10MB`;
    }
    return null;
  }, []);

  const uploadFile = useCallback(async (file: File): Promise<UploadResult | null> => {
    if (!user?.id) {
      setError('Not authenticated');
      return null;
    }

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return null;
    }

    setIsUploading(true);
    setError(null);
    setProgress({ loaded: 0, total: file.size, percentage: 0 });

    try {
      // Path: task_id/user_id/timestamp_filename
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const path = `${taskId}/${user.id}/${timestamp}_${safeName}`;

      const { data, error: uploadError } = await supabase.storage
        .from('submissions')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get signed URL (valid for 1 hour)
      const { data: urlData } = await supabase.storage
        .from('submissions')
        .createSignedUrl(path, 3600);

      setProgress({ loaded: file.size, total: file.size, percentage: 100 });

      return {
        path: data.path,
        url: urlData?.signedUrl || '',
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [taskId, user?.id, validateFile]);

  const uploadMultiple = useCallback(async (files: File[]): Promise<UploadResult[]> => {
    const results: UploadResult[] = [];

    for (const file of files) {
      const result = await uploadFile(file);
      if (result) {
        results.push(result);
      }
    }

    return results;
  }, [uploadFile]);

  const getSubmissionUrl = useCallback(async (path: string): Promise<string | null> => {
    const { data } = await supabase.storage
      .from('submissions')
      .createSignedUrl(path, 3600);

    return data?.signedUrl || null;
  }, []);

  return {
    uploadFile,
    uploadMultiple,
    getSubmissionUrl,
    isUploading,
    progress,
    error,
    clearError: () => setError(null),
  };
}
