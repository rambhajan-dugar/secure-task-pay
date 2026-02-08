import React, { useState } from 'react';
import { useModeration } from '@/hooks/useModeration';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import {
  MessageSquare,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  Flag,
  AlertTriangle,
  Scale,
  DollarSign,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/feeCalculator';

interface DisputeReviewPanelProps {
  dispute: {
    id: string;
    taskId: string;
    taskTitle: string;
    reason: string;
    description: string;
    status: string;
    raisedBy: 'captain' | 'ace';
    captainName: string;
    aceName: string;
    escrowAmount: number;
    createdAt: Date;
  };
  chatMessages: Array<{
    id: string;
    content: string;
    senderId: string;
    senderName: string;
    isFlagged: boolean;
    flaggedReason?: string;
    createdAt: Date;
  }>;
  beforeImages: Array<{
    id: string;
    imageUrl: string;
    status: 'pending' | 'approved' | 'rejected';
    uploadedAt: Date;
  }>;
  afterImages: Array<{
    id: string;
    imageUrl: string;
    status: 'pending' | 'approved' | 'rejected';
    rejectionReason?: string;
    uploadedAt: Date;
  }>;
  captainProfile: {
    name: string;
    disputesCount: number;
    sosCount: number;
    flagsCount: number;
    isFrozen: boolean;
  };
  aceProfile: {
    name: string;
    disputesCount: number;
    sosCount: number;
    flagsCount: number;
    isFrozen: boolean;
  };
  onResolve: (decision: {
    outcome: 'approve' | 'reject' | 'partial';
    aceAmount?: number;
    captainRefund?: number;
    notes: string;
  }) => Promise<void>;
  onBack: () => void;
}

export const DisputeReviewPanel: React.FC<DisputeReviewPanelProps> = ({
  dispute,
  chatMessages,
  beforeImages,
  afterImages,
  captainProfile,
  aceProfile,
  onResolve,
  onBack,
}) => {
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [resolveOutcome, setResolveOutcome] = useState<'approve' | 'reject' | 'partial' | null>(null);
  const [resolveNotes, setResolveNotes] = useState('');
  const [aceAmount, setAceAmount] = useState(dispute.escrowAmount);
  const [captainRefund, setCaptainRefund] = useState(0);
  const [isResolving, setIsResolving] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleResolve = async () => {
    if (!resolveOutcome || !resolveNotes.trim()) return;
    
    setIsResolving(true);
    await onResolve({
      outcome: resolveOutcome,
      aceAmount: resolveOutcome === 'approve' ? dispute.escrowAmount : 
                 resolveOutcome === 'partial' ? aceAmount : 0,
      captainRefund: resolveOutcome === 'reject' ? dispute.escrowAmount :
                     resolveOutcome === 'partial' ? captainRefund : 0,
      notes: resolveNotes,
    });
    setIsResolving(false);
    setShowResolveDialog(false);
  };

  const openResolveDialog = (outcome: 'approve' | 'reject' | 'partial') => {
    setResolveOutcome(outcome);
    setResolveNotes('');
    if (outcome === 'approve') {
      setAceAmount(dispute.escrowAmount);
      setCaptainRefund(0);
    } else if (outcome === 'reject') {
      setAceAmount(0);
      setCaptainRefund(dispute.escrowAmount);
    } else {
      setAceAmount(Math.floor(dispute.escrowAmount / 2));
      setCaptainRefund(Math.floor(dispute.escrowAmount / 2));
    }
    setShowResolveDialog(true);
  };

  const getRiskLevel = (profile: typeof captainProfile) => {
    const score = profile.disputesCount * 2 + profile.flagsCount + profile.sosCount * 0.5;
    if (score >= 5) return { level: 'High', color: 'text-destructive' };
    if (score >= 2) return { level: 'Medium', color: 'text-warning' };
    return { level: 'Low', color: 'text-success' };
  };

  const flaggedMessages = chatMessages.filter(m => m.isFlagged);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Queue
        </Button>
        <Badge variant="secondary" className="capitalize">
          {dispute.status.replace('_', ' ')}
        </Badge>
      </div>

      {/* Dispute Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-warning" />
                {dispute.taskTitle}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Dispute ID: {dispute.id} • Raised by {dispute.raisedBy === 'captain' ? 'Captain' : 'Ace'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Escrow Amount</p>
              <p className="text-xl font-bold font-mono">{formatCurrency(dispute.escrowAmount)}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-muted rounded-lg">
            <p className="font-medium mb-1">Reason: {dispute.reason}</p>
            <p className="text-sm text-muted-foreground">{dispute.description}</p>
          </div>
        </CardContent>
      </Card>

      {/* Side-by-side Evidence */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Verification Images
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            {/* Before */}
            <div>
              <h4 className="font-medium mb-3">Before Photos</h4>
              <div className="space-y-3">
                {beforeImages.map((img) => (
                  <div 
                    key={img.id} 
                    className="relative cursor-pointer"
                    onClick={() => setPreviewImage(img.imageUrl)}
                  >
                    <AspectRatio ratio={4/3}>
                      <img
                        src={img.imageUrl}
                        alt="Before"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </AspectRatio>
                    <div className="absolute top-2 right-2">
                      <Badge 
                        variant={img.status === 'approved' ? 'default' : 'secondary'}
                        className={img.status === 'approved' ? 'bg-success' : ''}
                      >
                        {img.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                {beforeImages.length === 0 && (
                  <div className="p-8 bg-muted rounded-lg text-center text-muted-foreground">
                    No before photos
                  </div>
                )}
              </div>
            </div>

            {/* After */}
            <div>
              <h4 className="font-medium mb-3">After Photos</h4>
              <div className="space-y-3">
                {afterImages.map((img) => (
                  <div 
                    key={img.id} 
                    className="relative cursor-pointer"
                    onClick={() => setPreviewImage(img.imageUrl)}
                  >
                    <AspectRatio ratio={4/3}>
                      <img
                        src={img.imageUrl}
                        alt="After"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </AspectRatio>
                    <div className="absolute top-2 right-2">
                      <Badge 
                        variant={img.status === 'approved' ? 'default' : img.status === 'rejected' ? 'destructive' : 'secondary'}
                        className={img.status === 'approved' ? 'bg-success' : ''}
                      >
                        {img.status}
                      </Badge>
                    </div>
                    {img.rejectionReason && (
                      <div className="absolute bottom-0 left-0 right-0 bg-destructive/90 text-destructive-foreground text-xs p-2 rounded-b-lg">
                        {img.rejectionReason}
                      </div>
                    )}
                  </div>
                ))}
                {afterImages.length === 0 && (
                  <div className="p-8 bg-muted rounded-lg text-center text-muted-foreground">
                    No after photos
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chat Transcript with Flagged Highlights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Chat Transcript
            {flaggedMessages.length > 0 && (
              <Badge variant="destructive">{flaggedMessages.length} flagged</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-80">
            <div className="space-y-3">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    'p-3 rounded-lg border',
                    msg.isFlagged 
                      ? 'bg-destructive/10 border-destructive/30' 
                      : 'bg-muted/50 border-border'
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{msg.senderName}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(msg.createdAt, 'MMM dd, HH:mm')}
                    </span>
                  </div>
                  <p className="text-sm">{msg.content}</p>
                  {msg.isFlagged && (
                    <div className="flex items-center gap-2 mt-2 text-destructive text-xs">
                      <Flag className="w-3 h-3" />
                      <span>Flagged: {msg.flaggedReason}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* User Risk Profiles */}
      <div className="grid grid-cols-2 gap-4">
        {/* Captain Profile */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Captain: {captainProfile.name}</span>
              {captainProfile.isFrozen && <Badge variant="destructive">Frozen</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Risk Level</span>
                <span className={cn('font-medium', getRiskLevel(captainProfile).color)}>
                  {getRiskLevel(captainProfile).level}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Disputes</span>
                <span>{captainProfile.disputesCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Flagged Messages</span>
                <span>{captainProfile.flagsCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">SOS Events</span>
                <span>{captainProfile.sosCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ace Profile */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Ace: {aceProfile.name}</span>
              {aceProfile.isFrozen && <Badge variant="destructive">Frozen</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Risk Level</span>
                <span className={cn('font-medium', getRiskLevel(aceProfile).color)}>
                  {getRiskLevel(aceProfile).level}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Disputes</span>
                <span>{aceProfile.disputesCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Flagged Messages</span>
                <span>{aceProfile.flagsCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">SOS Events</span>
                <span>{aceProfile.sosCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resolution Actions */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Resolution Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button 
              variant="success" 
              className="flex-1"
              onClick={() => openResolveDialog('approve')}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve (Pay Ace)
            </Button>
            <Button 
              variant="destructive" 
              className="flex-1"
              onClick={() => openResolveDialog('reject')}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject (Refund Captain)
            </Button>
            <Button 
              variant="warning" 
              className="flex-1"
              onClick={() => openResolveDialog('partial')}
            >
              <Scale className="w-4 h-4 mr-2" />
              Split Escrow
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resolution Dialog */}
      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {resolveOutcome === 'approve' && <CheckCircle className="w-5 h-5 text-success" />}
              {resolveOutcome === 'reject' && <XCircle className="w-5 h-5 text-destructive" />}
              {resolveOutcome === 'partial' && <Scale className="w-5 h-5 text-warning" />}
              Confirm Resolution
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Amount breakdown */}
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Escrow</span>
                <span className="font-mono">{formatCurrency(dispute.escrowAmount)}</span>
              </div>
              <Separator />
              {resolveOutcome === 'partial' ? (
                <>
                  <div className="flex justify-between items-center text-sm">
                    <span>Payment to Ace</span>
                    <input
                      type="number"
                      value={aceAmount}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setAceAmount(val);
                        setCaptainRefund(dispute.escrowAmount - val);
                      }}
                      className="w-24 px-2 py-1 text-right font-mono bg-background border rounded"
                    />
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span>Refund to Captain</span>
                    <span className="font-mono">{formatCurrency(captainRefund)}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between text-sm">
                    <span>Payment to Ace</span>
                    <span className="font-mono text-success">
                      {formatCurrency(resolveOutcome === 'approve' ? dispute.escrowAmount : 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Refund to Captain</span>
                    <span className="font-mono text-info">
                      {formatCurrency(resolveOutcome === 'reject' ? dispute.escrowAmount : 0)}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Resolution notes */}
            <div>
              <label className="text-sm font-medium mb-2 block">Resolution Notes (required)</label>
              <Textarea
                value={resolveNotes}
                onChange={(e) => setResolveNotes(e.target.value)}
                placeholder="Explain your decision..."
                rows={4}
              />
            </div>

            <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                This action is final and will immediately release or refund the escrowed funds.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowResolveDialog(false)}>
              Cancel
            </Button>
            <Button
              variant={resolveOutcome === 'approve' ? 'default' : resolveOutcome === 'reject' ? 'destructive' : 'secondary'}
              onClick={handleResolve}
              disabled={!resolveNotes.trim() || isResolving}
            >
              {isResolving ? 'Processing...' : 'Confirm Resolution'}
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

export default DisputeReviewPanel;
