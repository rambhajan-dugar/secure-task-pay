import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import Navbar from '@/components/layout/Navbar';
import { DisputeTimeline, DisputeEvent } from '@/components/dispute/DisputeTimeline';
import { DisputeBanner } from '@/components/dispute/DisputeBanner';
import { EvidencePanel, EvidenceItem } from '@/components/dispute/EvidencePanel';
import { ResolutionSummary, ResolutionOutcome } from '@/components/dispute/ResolutionSummary';
import { useDispute } from '@/hooks/useDispute';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useTaskChat } from '@/hooks/useTaskChat';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import {
  ArrowLeft,
  Scale,
  FileText,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { useEffect } from 'react';

const DisputeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { dispute, isLoading, error, submitEvidence } = useDispute(id);
  const [activeTab, setActiveTab] = useState('timeline');
  const [taskEvents, setTaskEvents] = useState<DisputeEvent[]>([]);
  const [verifications, setVerifications] = useState<EvidenceItem[]>([]);

  // Fetch task events for timeline
  useEffect(() => {
    if (!dispute?.task_id) return;

    const fetchTimeline = async () => {
      const { data } = await supabase
        .from('task_events')
        .select('*')
        .eq('task_id', dispute.task_id)
        .order('created_at', { ascending: true });

      if (data) {
        const events: DisputeEvent[] = data
          .filter(e => ['dispute_raised', 'dispute_resolved', 'status_change', 'evidence_submitted'].includes(e.event_type) || e.new_state === 'disputed')
          .map(e => ({
            id: e.id,
            type: mapEventType(e.event_type, e.new_state),
            title: formatEventTitle(e.event_type, e.new_state),
            description: e.metadata ? JSON.stringify(e.metadata) : undefined,
            timestamp: new Date(e.created_at),
            actor: e.actor_role === 'task_poster' ? 'Captain' : e.actor_role === 'task_doer' ? 'Ace' : 'System',
          }));

        // Always add the dispute raised event
        if (events.length === 0) {
          events.push({
            id: 'dispute-created',
            type: 'raised',
            title: 'Dispute Raised',
            description: dispute.reason,
            timestamp: new Date(dispute.created_at),
            actor: dispute.raised_by_role === 'captain' ? 'Captain' : 'Ace',
          });
        }

        setTaskEvents(events);
      }
    };

    fetchTimeline();
  }, [dispute]);

  // Fetch verification images as evidence
  useEffect(() => {
    if (!dispute?.task_id) return;

    const fetchVerifications = async () => {
      const { data } = await supabase
        .from('task_verifications')
        .select('*')
        .eq('task_id', dispute.task_id)
        .order('uploaded_at', { ascending: true });

      if (data) {
        const items: EvidenceItem[] = await Promise.all(
          data.map(async (v) => {
            const { data: urlData } = await supabase.storage
              .from('task-verifications')
              .createSignedUrl(v.image_path, 3600);

            return {
              id: v.id,
              type: 'verification' as const,
              content: '',
              imageUrl: urlData?.signedUrl,
              phase: v.phase as 'before' | 'after',
              submittedBy: 'ace' as const,
              submitterName: dispute.doer_name || 'Ace',
              submittedAt: new Date(v.uploaded_at),
              status: v.is_approved === null ? 'pending' as const : v.is_approved ? 'approved' as const : 'rejected' as const,
              rejectionReason: v.rejection_reason || undefined,
            };
          })
        );
        setVerifications(items);
      }
    };

    fetchVerifications();
  }, [dispute]);

  // Load chat messages for read-only display
  const chatHook = useTaskChat(
    dispute?.task_id || '',
    'disputed',
    null // read-only, no other party needed
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error || !dispute) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 container mx-auto px-4 text-center">
          <AlertTriangle className="w-12 h-12 text-warning mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Dispute Not Found</h1>
          <p className="text-muted-foreground mb-4">{error || 'This dispute does not exist or you lack permission to view it.'}</p>
          <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  const status = dispute.status as 'raised' | 'under_review' | 'resolved' | 'escalated';
  const displayStatus = dispute.status === 'open' ? 'raised' : status;
  const userRole: 'captain' | 'ace' = dispute.poster_id === user?.id ? 'captain' : 'ace';
  const canSubmitEvidence = displayStatus !== 'resolved' && displayStatus !== 'escalated';
  const isResolved = dispute.resolved_at !== null;

  // Build timeline events - always include at least the raised event
  const timelineEvents: DisputeEvent[] = taskEvents.length > 0 ? taskEvents : [
    {
      id: 'dispute-created',
      type: 'raised' as const,
      title: 'Dispute Raised',
      description: dispute.reason,
      timestamp: new Date(dispute.created_at),
      actor: `${dispute.raised_by_role === 'captain' ? 'Captain' : 'Ace'}${dispute.poster_name ? ` (${dispute.raised_by_role === 'captain' ? dispute.poster_name : dispute.doer_name})` : ''}`,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Back Button */}
          <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Task
          </Button>

          {/* Header */}
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center">
              <Scale className="w-6 h-6 text-warning" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold">Dispute Details</h1>
                <Badge 
                  variant={displayStatus === 'resolved' ? 'default' : 'secondary'}
                  className="capitalize"
                >
                  {displayStatus.replace('_', ' ')}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                {dispute.task_title || 'Task'} • Raised on {format(new Date(dispute.created_at), 'MMM dd, yyyy')}
              </p>
            </div>
          </div>

          {/* Dispute Banner */}
          <DisputeBanner
            status={displayStatus}
            reason={dispute.description || dispute.reason}
            raisedBy={dispute.raised_by_role as 'captain' | 'ace'}
            onViewDetails={() => setActiveTab('timeline')}
            onSubmitEvidence={canSubmitEvidence ? () => setActiveTab('evidence') : undefined}
            className="mb-6"
          />

          {/* Resolution Summary (if resolved) */}
          {isResolved && (
            <div className="mb-6">
              <ResolutionSummary
                outcome={(dispute.resolution_type as ResolutionOutcome) || 'partial'}
                resolvedAt={new Date(dispute.resolved_at!)}
                resolvedBy={dispute.resolved_by || 'Admin'}
                resolutionNotes={dispute.resolution_notes || undefined}
                totalAmount={dispute.escrow_amount || 0}
                aceAmount={dispute.doer_payout_amount || 0}
                captainRefund={dispute.poster_refund_amount || 0}
                userRole={userRole}
                onRateOther={() => {}}
                canAppeal={userRole === 'ace'}
                onAppeal={() => {}}
              />
            </div>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="timeline" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Timeline
              </TabsTrigger>
              <TabsTrigger value="evidence" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Evidence
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Chat History
              </TabsTrigger>
            </TabsList>

            {/* Timeline Tab */}
            <TabsContent value="timeline">
              <Card>
                <CardHeader>
                  <CardTitle>Dispute Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <DisputeTimeline 
                    events={timelineEvents}
                    currentStatus={displayStatus}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Evidence Tab */}
            <TabsContent value="evidence">
              <Card>
                <CardHeader>
                  <CardTitle>Evidence & Statements</CardTitle>
                </CardHeader>
                <CardContent>
                  <EvidencePanel
                    evidence={verifications}
                    canSubmit={canSubmitEvidence}
                    userRole={userRole}
                    captainRejectionReason={dispute.description || undefined}
                    onSubmitEvidence={async (text) => {
                      if (id) await submitEvidence(id, text);
                    }}
                    onUploadImage={async (file, phase) => {
                      console.log('Upload image:', file.name, phase);
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Chat History Tab */}
            <TabsContent value="chat">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Chat History
                    <Badge variant="secondary">Read-only</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-3">
                      {chatHook.messages.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No chat messages found</p>
                        </div>
                      ) : (
                        <>
                          {chatHook.messages.map((msg) => {
                            const isOwn = msg.sender_id === user?.id;
                            return (
                              <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                                  isOwn
                                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                                    : 'bg-muted rounded-bl-sm'
                                } ${msg.is_flagged ? 'opacity-50 border border-destructive' : ''}`}>
                                  <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                                  <p className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                    {format(new Date(msg.created_at), 'HH:mm')}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                          <div className="flex items-center justify-center gap-2 py-4">
                            <AlertTriangle className="w-4 h-4 text-warning" />
                            <span className="text-sm text-muted-foreground">
                              Chat was locked when dispute was raised
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* What to Expect Section */}
          {!isResolved && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base">What happens next?</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span>Our team is reviewing all evidence from both parties</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-info mt-0.5 flex-shrink-0" />
                    <span>You may be contacted for additional information</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Scale className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                    <span>Resolution typically takes 24-48 hours</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <span>Funds remain locked in escrow until resolution</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

// Helper functions
function mapEventType(eventType: string, newState: string | null): DisputeEvent['type'] {
  if (eventType === 'dispute_raised' || newState === 'disputed') return 'raised';
  if (eventType === 'evidence_submitted') return 'evidence_submitted';
  if (eventType === 'dispute_resolved') return 'resolved';
  if (eventType === 'admin_review') return 'admin_review';
  if (eventType === 'escalated') return 'escalated';
  return 'admin_review';
}

function formatEventTitle(eventType: string, newState: string | null): string {
  if (eventType === 'dispute_raised' || newState === 'disputed') return 'Dispute Raised';
  if (eventType === 'evidence_submitted') return 'Evidence Submitted';
  if (eventType === 'dispute_resolved') return 'Dispute Resolved';
  if (eventType === 'admin_review') return 'Admin Review Started';
  if (eventType === 'escalated') return 'Dispute Escalated';
  return eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

export default DisputeDetail;
