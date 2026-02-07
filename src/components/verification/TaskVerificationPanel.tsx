import React, { useState, useRef } from 'react';
import { useTaskVerification, TaskVerification } from '@/hooks/useTaskVerification';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { format } from 'date-fns';
import {
  Camera,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskVerificationPanelProps {
  taskId: string;
  taskStatus: string;
  isDoer: boolean;
  isPoster: boolean;
}

export const TaskVerificationPanel: React.FC<TaskVerificationPanelProps> = ({
  taskId,
  taskStatus,
  isDoer,
  isPoster,
}) => {
  const {
    isLoading,
    uploadImage,
    approveVerification,
    rejectVerification,
    canUpload,
    canReview,
    beforeImages,
    afterImages,
  } = useTaskVerification(taskId, taskStatus, isDoer, isPoster);

  const [isUploading, setIsUploading] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedVerificationId, setSelectedVerificationId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, phase: 'before' | 'after') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    await uploadImage(file, phase);
    setIsUploading(false);

    // Reset input
    if (phase === 'before' && beforeInputRef.current) {
      beforeInputRef.current.value = '';
    } else if (phase === 'after' && afterInputRef.current) {
      afterInputRef.current.value = '';
    }
  };

  const openRejectDialog = (verificationId: string) => {
    setSelectedVerificationId(verificationId);
    setRejectionReason('');
    setShowRejectDialog(true);
  };

  const handleReject = async () => {
    if (!selectedVerificationId || !rejectionReason.trim()) return;
    await rejectVerification(selectedVerificationId, rejectionReason);
    setShowRejectDialog(false);
    setSelectedVerificationId(null);
  };

  if (isLoading) {
    return (
      <div className="p-6 rounded-xl bg-card border border-border">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-xl bg-card border border-border">
      <div className="flex items-center gap-3 mb-6">
        <Camera className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Task Verification</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Before Images */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">Before Photos</h3>
            <Badge variant="secondary">{beforeImages.length}/3</Badge>
          </div>
          <div className="space-y-3">
            {beforeImages.map((v) => (
              <VerificationCard
                key={v.id}
                verification={v}
                canReview={canReview}
                onApprove={() => approveVerification(v.id)}
                onReject={() => openRejectDialog(v.id)}
                onPreview={() => setPreviewImage(v.image_url || null)}
              />
            ))}
            {canUpload && beforeImages.length < 3 && (
              <UploadButton
                inputRef={beforeInputRef}
                onChange={(e) => handleUpload(e, 'before')}
                isUploading={isUploading}
              />
            )}
            {beforeImages.length === 0 && !canUpload && (
              <EmptyState phase="before" />
            )}
          </div>
        </div>

        {/* After Images */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">After Photos</h3>
            <Badge variant="secondary">{afterImages.length}/3</Badge>
          </div>
          <div className="space-y-3">
            {afterImages.map((v) => (
              <VerificationCard
                key={v.id}
                verification={v}
                canReview={canReview}
                onApprove={() => approveVerification(v.id)}
                onReject={() => openRejectDialog(v.id)}
                onPreview={() => setPreviewImage(v.image_url || null)}
              />
            ))}
            {canUpload && afterImages.length < 3 && (
              <UploadButton
                inputRef={afterInputRef}
                onChange={(e) => handleUpload(e, 'after')}
                isUploading={isUploading}
              />
            )}
            {afterImages.length === 0 && !canUpload && (
              <EmptyState phase="after" />
            )}
          </div>
        </div>
      </div>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Re-upload</DialogTitle>
            <DialogDescription>
              Explain why this verification image needs to be replaced.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Image is blurry, wrong angle, doesn't show the required area..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectionReason.trim()}>
              <XCircle className="w-4 h-4 mr-2" />
              Request Re-upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Image Preview</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <AspectRatio ratio={16 / 9}>
              <img
                src={previewImage}
                alt="Verification"
                className="w-full h-full object-contain rounded-lg"
              />
            </AspectRatio>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface VerificationCardProps {
  verification: TaskVerification;
  canReview: boolean;
  onApprove: () => void;
  onReject: () => void;
  onPreview: () => void;
}

const VerificationCard: React.FC<VerificationCardProps> = ({
  verification,
  canReview,
  onApprove,
  onReject,
  onPreview,
}) => {
  const getStatusBadge = () => {
    if (verification.is_approved === null) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Pending
        </Badge>
      );
    }
    if (verification.is_approved) {
      return (
        <Badge variant="default" className="flex items-center gap-1 bg-success">
          <CheckCircle className="w-3 h-3" />
          Approved
        </Badge>
      );
    }
    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <XCircle className="w-3 h-3" />
        Rejected
      </Badge>
    );
  };

  return (
    <div className="p-3 rounded-lg border border-border bg-muted/30">
      <div className="flex gap-3">
        <div
          className="w-20 h-20 rounded-md bg-muted flex items-center justify-center overflow-hidden cursor-pointer"
          onClick={onPreview}
        >
          {verification.image_url ? (
            <img
              src={verification.image_url}
              alt="Verification"
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageIcon className="w-6 h-6 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            {getStatusBadge()}
            <span className="text-xs text-muted-foreground">
              {format(new Date(verification.uploaded_at), 'MMM dd, HH:mm')}
            </span>
          </div>
          {verification.rejection_reason && (
            <p className="text-xs text-destructive mb-2">
              Reason: {verification.rejection_reason}
            </p>
          )}
          {canReview && verification.is_approved === null && (
            <div className="flex gap-2">
              <Button size="sm" variant="success" onClick={onApprove}>
                <CheckCircle className="w-3 h-3 mr-1" />
                Approve
              </Button>
              <Button size="sm" variant="destructive" onClick={onReject}>
                <XCircle className="w-3 h-3 mr-1" />
                Reject
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface UploadButtonProps {
  inputRef: React.RefObject<HTMLInputElement>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
}

const UploadButton: React.FC<UploadButtonProps> = ({ inputRef, onChange, isUploading }) => {
  return (
    <div
      className={cn(
        'p-4 rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer',
        isUploading && 'pointer-events-none opacity-50'
      )}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onChange}
        className="hidden"
      />
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        {isUploading ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : (
          <Upload className="w-6 h-6" />
        )}
        <span className="text-sm">
          {isUploading ? 'Uploading...' : 'Upload Image'}
        </span>
      </div>
    </div>
  );
};

const EmptyState: React.FC<{ phase: string }> = ({ phase }) => {
  return (
    <div className="p-4 rounded-lg border border-border bg-muted/30 text-center">
      <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
      <p className="text-sm text-muted-foreground">
        No {phase} photos uploaded yet
      </p>
    </div>
  );
};

export default TaskVerificationPanel;
