import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { ArrowLeft, Scale, Phone, Mail, FileText, Clock, CheckCircle, AlertTriangle, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DisputeResolution: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <Button variant="ghost" className="mb-6" asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>

          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-warning/10 border border-warning/20 mb-4">
              <Scale className="w-4 h-4 text-warning" />
              <span className="text-sm text-warning font-medium">Fair Resolution</span>
            </div>
            <h1 className="text-4xl font-bold mb-2">Dispute Resolution</h1>
            <p className="text-muted-foreground">How we resolve conflicts fairly</p>
          </div>

          <div className="prose prose-invert max-w-none space-y-8">
            <section className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-xl font-semibold mb-4">When to Raise a Dispute</h2>
              <p className="text-muted-foreground mb-4">
                Disputes can be raised after task submission if:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>• The Ace claims task wasn't completed as described</li>
                <li>• The Captain claims work quality doesn't meet requirements</li>
                <li>• There's disagreement about checkpoint completion</li>
                <li>• Either party suspects fraud or misrepresentation</li>
              </ul>
            </section>

            <section className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-xl font-semibold mb-4">Evidence We Review</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-background/50">
                  <h3 className="font-semibold flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    Checkpoint Status
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Which of the 3 mandatory checkpoints were marked complete and when.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-background/50">
                  <h3 className="font-semibold flex items-center gap-2 mb-2">
                    <Image className="w-4 h-4 text-info" />
                    Before/After Images
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Visual evidence of task state before and after completion.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-background/50">
                  <h3 className="font-semibold flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-primary" />
                    Chat History
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    All in-app messages between The Captain and The Ace.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-background/50">
                  <h3 className="font-semibold flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-warning" />
                    Timestamps
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Timeline of task creation, acceptance, checkpoints, and submission.
                  </p>
                </div>
              </div>
            </section>

            <section className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-xl font-semibold mb-4">Dispute Process</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-lg bg-background/50">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="font-bold text-primary text-sm">1</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">Dispute Filed</h3>
                    <p className="text-sm text-muted-foreground">
                      The Captain or The Ace raises a dispute with reason and description. 
                      Escrow funds are immediately locked.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-lg bg-background/50">
                  <div className="w-8 h-8 rounded-full bg-info/20 flex items-center justify-center shrink-0">
                    <span className="font-bold text-info text-sm">2</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">Evidence Collection</h3>
                    <p className="text-sm text-muted-foreground">
                      Nap-it gathers all checkpoints, images, chat logs, and timestamps automatically.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-lg bg-background/50">
                  <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center shrink-0">
                    <span className="font-bold text-warning text-sm">3</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">Review & Decision</h3>
                    <p className="text-sm text-muted-foreground">
                      Our team reviews all evidence and makes a fair determination based on facts.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-lg bg-background/50">
                  <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center shrink-0">
                    <span className="font-bold text-success text-sm">4</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">Resolution Executed</h3>
                    <p className="text-sm text-muted-foreground">
                      Funds are distributed according to the decision. Both parties are notified.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-xl font-semibold mb-4">Possible Outcomes</h2>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                  <h3 className="font-semibold text-success mb-2">Full Release to The Ace</h3>
                  <p className="text-sm text-muted-foreground">
                    Evidence shows task was completed as described. Full payment (minus platform fee) 
                    is released to The Ace.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-info/10 border border-info/20">
                  <h3 className="font-semibold text-info mb-2">Full Refund to The Captain</h3>
                  <p className="text-sm text-muted-foreground">
                    Evidence shows task was not completed or significantly misrepresented. 
                    Full amount is refunded to The Captain.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
                  <h3 className="font-semibold text-warning mb-2">Split Decision</h3>
                  <p className="text-sm text-muted-foreground">
                    For partial completion cases, funds may be split proportionally between 
                    both parties based on work completed.
                  </p>
                </div>
              </div>
            </section>

            <section className="p-6 rounded-xl bg-destructive/5 border border-destructive/20">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                Important Notice
              </h2>
              <p className="text-muted-foreground">
                <strong>Nap-it's decision is final and binding.</strong> We make decisions based solely on 
                available evidence. To protect yourself:
              </p>
              <ul className="space-y-2 text-muted-foreground mt-4">
                <li>• Always communicate through in-app chat</li>
                <li>• Complete checkpoints as work progresses</li>
                <li>• Upload before/after images when applicable</li>
                <li>• Be clear and detailed in task descriptions</li>
              </ul>
            </section>

            <section className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-xl font-semibold mb-4">Timeline</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li><strong>Dispute Window:</strong> Can be raised within 24 hours of task submission</li>
                <li><strong>Review Time:</strong> Most disputes are resolved within 48-72 hours</li>
                <li><strong>Complex Cases:</strong> May take up to 7 days for thorough investigation</li>
              </ul>
            </section>

            <section className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5 text-primary" />
                Need Help?
              </h2>
              <p className="text-muted-foreground mb-4">
                If you're experiencing issues or need assistance with a dispute:
              </p>
              <div className="space-y-2 text-muted-foreground">
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <strong>Phone:</strong> +91 7439689645
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <strong>Email:</strong> contactnapit@gmail.com
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default DisputeResolution;
