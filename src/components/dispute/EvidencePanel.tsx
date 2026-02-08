import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import {
  FileText,
  Image as ImageIcon,
  Upload,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EvidenceItem {
  id: string;
  type: 'image' | 'text' | 'verification';
  content: string;
  imageUrl?: string;
  phase?: 'before' | 'after';
  submittedBy: 'captain' | 'ace';
  submitterName: string;
  submittedAt: Date;
  status?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
}

interface EvidencePanelProps {
  evidence: EvidenceItem[];
  canSubmit: boolean;
  userRole: 'captain' | 'ace';
  onSubmitEvidence?: (text: string) => Promise<void>;
  onUploadImage?: (file: File, phase: 'after') => Promise<void>;
  captainRejectionReason?: string;
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({
  evidence,
  canSubmit,
  userRole,
  onSubmitEvidence,
  onUploadImage,
  captainRejectionReason,
}) => {
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [evidenceText, setEvidenceText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const beforeEvidence = evidence.filter(e => e.phase === 'before');
  const afterEvidence = evidence.filter(e => e.phase === 'after');
  const textEvidence = evidence.filter(e => e.type === 'text');

  const handleSubmit = async () => {
    if (!evidenceText.trim() || !onSubmitEvidence) return;
    setIsSubmitting(true);
    await onSubmitEvidence(evidenceText);
    setIsSubmitting(false);
    setShowSubmitDialog(false);
    setEvidenceText('');
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge variant="default" className="bg-success">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Captain's Rejection Reason */}
      {captainRejectionReason && userRole === 'ace' && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <h4 className="font-medium text-destructive mb-2">Captain's Rejection Reason</h4>
          <p className="text-sm text-muted-foreground">{captainRejectionReason}</p>
        </div>
      )}

      {/* Side-by-side Before/After */}
      {(beforeEvidence.length > 0 || afterEvidence.length > 0) && (
        <div className="grid grid-cols-2 gap-4">
          {/* Before */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Before Photos
            </h4>
            <div className="space-y-2">
              {beforeEvidence.map(item => (
                <div key={item.id} className="relative">
                  <AspectRatio ratio={4/3}>
                    <img
                      src={item.imageUrl || item.content}
                      alt="Before"
                      className="w-full h-full object-cover rounded-lg cursor-pointer"
                      onClick={() => setPreviewImage(item.imageUrl || item.content)}
                    />
                  </AspectRatio>
                  <div className="absolute top-2 right-2">
                    {getStatusBadge(item.status)}
                  </div>
                </div>
              ))}
              {beforeEvidence.length === 0 && (
                <div className="p-4 bg-muted rounded-lg text-center text-muted-foreground text-sm">
                  No before photos
                </div>
              )}
            </div>
          </div>

          {/* After */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              After Photos
            </h4>
            <div className="space-y-2">
              {afterEvidence.map(item => (
                <div key={item.id} className="relative">
                  <AspectRatio ratio={4/3}>
                    <img
                      src={item.imageUrl || item.content}
                      alt="After"
                      className="w-full h-full object-cover rounded-lg cursor-pointer"
                      onClick={() => setPreviewImage(item.imageUrl || item.content)}
                    />
                  </AspectRatio>
                  <div className="absolute top-2 right-2">
                    {getStatusBadge(item.status)}
                  </div>
                  {item.rejectionReason && (
                    <div className="absolute bottom-0 left-0 right-0 bg-destructive/90 text-destructive-foreground text-xs p-2 rounded-b-lg">
                      {item.rejectionReason}
                    </div>
                  )}
                </div>
              ))}
              {afterEvidence.length === 0 && (
                <div className="p-4 bg-muted rounded-lg text-center text-muted-foreground text-sm">
                  No after photos
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Text Evidence */}
      {textEvidence.length > 0 && (
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Statements
          </h4>
          <div className="space-y-3">
            {textEvidence.map(item => (
              <div key={item.id} className="p-4 bg-muted/50 rounded-lg border border-border">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={item.submittedBy === 'captain' ? 'default' : 'secondary'}>
                    {item.submittedBy === 'captain' ? 'Captain' : 'Ace'}: {item.submitterName}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(item.submittedAt, 'MMM dd, HH:mm')}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{item.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit Evidence */}
      {canSubmit && (
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowSubmitDialog(true)}>
            <FileText className="w-4 h-4 mr-2" />
            Add Statement
          </Button>
          {userRole === 'ace' && onUploadImage && (
            <Button variant="outline" onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) onUploadImage(file, 'after');
              };
              input.click();
            }}>
              <Upload className="w-4 h-4 mr-2" />
              Upload After Photo
            </Button>
          )}
        </div>
      )}

      {/* Submit Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Evidence Statement</DialogTitle>
          </DialogHeader>
          <Textarea
            value={evidenceText}
            onChange={(e) => setEvidenceText(e.target.value)}
            placeholder="Provide details to support your case..."
            rows={5}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowSubmitDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!evidenceText.trim() || isSubmitting}
            >
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Image Preview</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <img
              src={previewImage}
              alt="Preview"
              className="w-full h-auto rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EvidencePanel;
