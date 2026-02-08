import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import Navbar from '@/components/layout/Navbar';
import { DisputeTimeline, DisputeEvent } from '@/components/dispute/DisputeTimeline';
import { DisputeBanner } from '@/components/dispute/DisputeBanner';
import { EvidencePanel, EvidenceItem } from '@/components/dispute/EvidencePanel';
import { ResolutionSummary, ResolutionOutcome } from '@/components/dispute/ResolutionSummary';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Scale,
  FileText,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';

// Mock data - in production this would come from hooks
const mockDispute: {
  id: string;
  taskId: string;
  taskTitle: string;
  status: 'raised' | 'under_review' | 'resolved' | 'escalated';
  reason: string;
  description: string;
  raisedBy: 'captain' | 'ace';
  raisedByName: string;
  createdAt: Date;
  escrowAmount: number;
  resolution: null | {
    outcome: ResolutionOutcome;
    resolvedAt: Date;
    resolvedBy: string;
    notes: string;
    aceAmount: number;
    captainRefund: number;
  };
} = {
  id: 'dispute-001',
  taskId: 'TASK-004',
  taskTitle: 'Data Entry - Product Catalog',
  status: 'under_review' as const,
  reason: 'Quality not as expected',
  description: 'The data entered has multiple formatting errors and missing fields.',
  raisedBy: 'captain' as const,
  raisedByName: 'John Doe',
  createdAt: new Date('2024-12-21T10:30:00'),
  escrowAmount: 5000,
  resolution: null as null | {
    outcome: ResolutionOutcome;
    resolvedAt: Date;
    resolvedBy: string;
    notes: string;
    aceAmount: number;
    captainRefund: number;
  },
};

const mockEvents: DisputeEvent[] = [
  {
    id: 'evt-1',
    type: 'raised',
    title: 'Dispute Raised',
    description: 'Captain rejected the after verification image',
    timestamp: new Date('2024-12-21T10:30:00'),
    actor: 'John Doe (Captain)',
  },
  {
    id: 'evt-2',
    type: 'evidence_submitted',
    title: 'Evidence Submitted',
    description: 'Ace uploaded additional after photos',
    timestamp: new Date('2024-12-21T11:00:00'),
    actor: 'Raj Patel (Ace)',
  },
  {
    id: 'evt-3',
    type: 'admin_review',
    title: 'Admin Review Started',
    description: 'A moderator is now reviewing the case',
    timestamp: new Date('2024-12-21T14:00:00'),
    actor: 'System',
  },
];

const mockEvidence: EvidenceItem[] = [
  {
    id: 'ev-1',
    type: 'verification',
    content: '',
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400',
    phase: 'before',
    submittedBy: 'ace',
    submitterName: 'Raj Patel',
    submittedAt: new Date('2024-12-20T09:00:00'),
    status: 'approved',
  },
  {
    id: 'ev-2',
    type: 'verification',
    content: '',
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400',
    phase: 'after',
    submittedBy: 'ace',
    submitterName: 'Raj Patel',
    submittedAt: new Date('2024-12-21T10:00:00'),
    status: 'rejected',
    rejectionReason: 'Image does not show completed work clearly',
  },
  {
    id: 'ev-3',
    type: 'text',
    content: 'The submitted work is incomplete. Many product entries are missing descriptions and the formatting is inconsistent across categories.',
    submittedBy: 'captain',
    submitterName: 'John Doe',
    submittedAt: new Date('2024-12-21T10:35:00'),
  },
  {
    id: 'ev-4',
    type: 'text',
    content: 'I completed all entries as per the requirements. The descriptions were optional in the original brief. I can provide additional formatting if needed.',
    submittedBy: 'ace',
    submitterName: 'Raj Patel',
    submittedAt: new Date('2024-12-21T11:15:00'),
  },
];

const DisputeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('timeline');
  
  // In production, these would come from auth context
  const userRole = 'ace' as 'captain' | 'ace';
  const canSubmitEvidence = mockDispute.status !== 'resolved' && mockDispute.status !== 'escalated';

  const isResolved = mockDispute.resolution !== null;

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
                  variant={mockDispute.status === 'resolved' ? 'default' : 'secondary'}
                  className="capitalize"
                >
                  {mockDispute.status.replace('_', ' ')}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                {mockDispute.taskTitle} • Raised on {format(mockDispute.createdAt, 'MMM dd, yyyy')}
              </p>
            </div>
          </div>

          {/* Dispute Banner */}
          <DisputeBanner
            status={mockDispute.status}
            reason={mockDispute.description}
            raisedBy={mockDispute.raisedBy}
            onViewDetails={() => setActiveTab('timeline')}
            onSubmitEvidence={canSubmitEvidence ? () => setActiveTab('evidence') : undefined}
            className="mb-6"
          />

          {/* Resolution Summary (if resolved) */}
          {isResolved && mockDispute.resolution && (
            <div className="mb-6">
              <ResolutionSummary
                outcome={mockDispute.resolution.outcome}
                resolvedAt={mockDispute.resolution.resolvedAt}
                resolvedBy={mockDispute.resolution.resolvedBy}
                resolutionNotes={mockDispute.resolution.notes}
                totalAmount={mockDispute.escrowAmount}
                aceAmount={mockDispute.resolution.aceAmount}
                captainRefund={mockDispute.resolution.captainRefund}
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
                    events={mockEvents}
                    currentStatus={mockDispute.status}
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
                    evidence={mockEvidence}
                    canSubmit={canSubmitEvidence}
                    userRole={userRole}
                    captainRejectionReason={mockDispute.description}
                    onSubmitEvidence={async (text) => {
                      console.log('Submit evidence:', text);
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
                    <div className="space-y-4">
                      {/* Sample chat messages - in production would come from the task's chat */}
                      <div className="text-center text-xs text-muted-foreground py-2">
                        Dec 20, 2024
                      </div>
                      <div className="flex justify-start">
                        <div className="max-w-[75%] bg-muted rounded-2xl rounded-bl-sm px-4 py-2">
                          <p className="text-sm">Hi! I've started working on the data entry. Will update you on progress.</p>
                          <p className="text-xs text-muted-foreground mt-1">10:30</p>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <div className="max-w-[75%] bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-2">
                          <p className="text-sm">Great, thanks! Make sure to follow the format in the template.</p>
                          <p className="text-xs text-primary-foreground/70 mt-1">10:45</p>
                        </div>
                      </div>
                      <div className="text-center text-xs text-muted-foreground py-2">
                        Dec 21, 2024
                      </div>
                      <div className="flex justify-start">
                        <div className="max-w-[75%] bg-muted rounded-2xl rounded-bl-sm px-4 py-2">
                          <p className="text-sm">Done! All 500 products have been entered. Please check and approve.</p>
                          <p className="text-xs text-muted-foreground mt-1">10:00</p>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <div className="max-w-[75%] bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-2">
                          <p className="text-sm">I see issues with the formatting. Many entries are missing descriptions.</p>
                          <p className="text-xs text-primary-foreground/70 mt-1">10:25</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-center gap-2 py-4">
                        <AlertTriangle className="w-4 h-4 text-warning" />
                        <span className="text-sm text-muted-foreground">
                          Chat was locked when dispute was raised
                        </span>
                      </div>
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

export default DisputeDetail;
