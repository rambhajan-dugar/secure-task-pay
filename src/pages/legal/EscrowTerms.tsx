import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { ArrowLeft, Shield, Phone, Mail, Lock, Clock, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const EscrowTerms: React.FC = () => {
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-info/10 border border-info/20 mb-4">
              <Lock className="w-4 h-4 text-info" />
              <span className="text-sm text-info font-medium">Payment Security</span>
            </div>
            <h1 className="text-4xl font-bold mb-2">Escrow Terms</h1>
            <p className="text-muted-foreground">How your money is protected</p>
          </div>

          <div className="prose prose-invert max-w-none space-y-8">
            <section className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-xl font-semibold mb-4">What is Escrow?</h2>
              <p className="text-muted-foreground">
                Nap-it Escrow is a secure payment holding system that protects both The Captain (task giver) 
                and The Ace (task doer). When a task is accepted, the full payment is held securely by Nap-it 
                until the task is completed and verified.
              </p>
            </section>

            <section className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-xl font-semibold mb-4">Escrow Lifecycle</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-lg bg-background/50">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="font-bold text-primary">1</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">Task Posted</h3>
                    <p className="text-sm text-muted-foreground">The Captain creates a task with reward amount (minimum ₹100)</p>
                  </div>
                </div>
                <div className="flex justify-center">
                  <ArrowRight className="w-5 h-5 text-muted-foreground rotate-90" />
                </div>
                <div className="flex items-center gap-4 p-4 rounded-lg bg-background/50">
                  <div className="w-10 h-10 rounded-full bg-info/20 flex items-center justify-center">
                    <span className="font-bold text-info">2</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">Funds Held in Escrow</h3>
                    <p className="text-sm text-muted-foreground">When The Ace accepts, full amount is secured in escrow</p>
                  </div>
                </div>
                <div className="flex justify-center">
                  <ArrowRight className="w-5 h-5 text-muted-foreground rotate-90" />
                </div>
                <div className="flex items-center gap-4 p-4 rounded-lg bg-background/50">
                  <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
                    <span className="font-bold text-warning">3</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">Task Execution</h3>
                    <p className="text-sm text-muted-foreground">The Ace completes checkpoints and submits work</p>
                  </div>
                </div>
                <div className="flex justify-center">
                  <ArrowRight className="w-5 h-5 text-muted-foreground rotate-90" />
                </div>
                <div className="flex items-center gap-4 p-4 rounded-lg bg-background/50">
                  <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                    <span className="font-bold text-success">4</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">Payment Released</h3>
                    <p className="text-sm text-muted-foreground">The Captain approves → Funds released to The Ace (minus platform fee)</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="p-6 rounded-xl bg-info/5 border border-info/20">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-info">
                <Clock className="w-5 h-5" />
                Auto-Release (24 Hours)
              </h2>
              <p className="text-muted-foreground">
                If The Captain does not respond within <strong>24 hours</strong> after task submission, 
                funds are automatically released to The Ace. This protects task doers from unresponsive 
                task givers.
              </p>
            </section>

            <section className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-xl font-semibold mb-4">Payment Terms</h2>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <span><strong>Minimum Amount:</strong> ₹100 INR per task</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <span><strong>Platform Fee:</strong> Automatically deducted from The Ace's payout (12-20% based on task volume)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <span><strong>The Captain Pays:</strong> Full task reward amount to escrow</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <span><strong>The Ace Receives:</strong> Reward minus platform fee upon approval</span>
                </li>
              </ul>
            </section>

            <section className="p-6 rounded-xl bg-warning/5 border border-warning/20">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-warning">
                <AlertTriangle className="w-5 h-5" />
                Dispute Hold Rules
              </h2>
              <p className="text-muted-foreground mb-4">
                When a dispute is raised:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Escrow funds are immediately locked</li>
                <li>• Auto-release is suspended</li>
                <li>• Nap-it reviews chat logs, checkpoints, and images</li>
                <li>• Resolution determines fund distribution</li>
              </ul>
            </section>

            <section className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-xl font-semibold mb-4">Dispute Resolution Outcomes</h2>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-success/10">
                  <h3 className="font-semibold text-success">Full Release to The Ace</h3>
                  <p className="text-sm text-muted-foreground">
                    If evidence shows task was completed properly, full payment (minus fee) goes to The Ace.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-info/10">
                  <h3 className="font-semibold text-info">Full Refund to The Captain</h3>
                  <p className="text-sm text-muted-foreground">
                    If task was not completed or significantly misrepresented, full amount returns to The Captain.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-warning/10">
                  <h3 className="font-semibold text-warning">Split Decision</h3>
                  <p className="text-sm text-muted-foreground">
                    In partial completion cases, funds may be split between both parties as determined by Nap-it.
                  </p>
                </div>
              </div>
            </section>

            <section className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-xl font-semibold mb-4">No External Payments</h2>
              <p className="text-muted-foreground">
                <strong>IMPORTANT:</strong> All payments must go through Nap-it escrow. Requesting or making 
                payments outside the platform violates our Terms of Service and voids all protections. 
                Users who attempt external payments may face account suspension.
              </p>
            </section>

            <section className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-xl font-semibold mb-4">Escrow Security</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Funds held in secure, audited escrow accounts</li>
                <li>• Optimistic locking prevents double-release</li>
                <li>• Atomic transactions ensure data integrity</li>
                <li>• Full audit trail for all transactions</li>
                <li>• Idempotency protection against duplicate requests</li>
              </ul>
            </section>

            <section className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5 text-primary" />
                Payment Support
              </h2>
              <p className="text-muted-foreground mb-4">
                For payment-related questions or issues:
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

export default EscrowTerms;
