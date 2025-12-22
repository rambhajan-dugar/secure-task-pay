import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  UserCheck, 
  Wallet, 
  CheckCircle, 
  Shield, 
  Clock, 
  AlertTriangle,
  ArrowRight,
  Zap
} from 'lucide-react';

const HowItWorks: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          {/* Hero */}
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              How <span className="gradient-text">kaam.com</span> Works
            </h1>
            <p className="text-xl text-muted-foreground">
              A secure, transparent task marketplace with built-in escrow protection. 
              Here's the complete journey from task creation to payment.
            </p>
          </div>

          {/* Task Lifecycle */}
          <div className="max-w-4xl mx-auto mb-20">
            <h2 className="text-2xl font-bold mb-8 text-center">The Complete Task Lifecycle</h2>
            
            <div className="relative">
              {/* Connecting Line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border hidden md:block" />

              <div className="space-y-8">
                {[
                  {
                    step: 1,
                    title: 'Task Giver Creates a Task',
                    description: 'Post a task with clear title, detailed description, category, reward amount, and deadline. Every task gets a unique ID.',
                    icon: FileText,
                    color: 'primary',
                  },
                  {
                    step: 2,
                    title: 'Task Doer Accepts',
                    description: 'Skilled doers browse available tasks and accept ones matching their expertise. Once accepted, the task is locked.',
                    icon: UserCheck,
                    color: 'info',
                  },
                  {
                    step: 3,
                    title: 'Giver Funds Escrow',
                    description: 'The Task Giver pays the full reward amount to kaam.com escrow. Funds are held securely until task completion.',
                    icon: Wallet,
                    color: 'warning',
                  },
                  {
                    step: 4,
                    title: 'Doer Completes & Submits',
                    description: 'Task Doer works on the task and submits completed work with notes and deliverables before the deadline.',
                    icon: Zap,
                    color: 'primary',
                  },
                  {
                    step: 5,
                    title: 'Giver Reviews Work',
                    description: 'Task Giver has 24 hours to review. They can approve (release payment) or raise a dispute if unsatisfied.',
                    icon: Clock,
                    color: 'warning',
                  },
                  {
                    step: 6,
                    title: 'Payment Released',
                    description: 'Upon approval (or 24-hour auto-release), escrow releases payment to the Doer minus platform fees.',
                    icon: CheckCircle,
                    color: 'success',
                  },
                ].map((item, index) => (
                  <div key={index} className="relative flex gap-6 md:gap-8">
                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center shrink-0 z-10 
                      ${item.color === 'primary' ? 'bg-primary/10' : ''}
                      ${item.color === 'info' ? 'bg-info/10' : ''}
                      ${item.color === 'warning' ? 'bg-warning/10' : ''}
                      ${item.color === 'success' ? 'bg-success/10' : ''}
                    `}>
                      <item.icon className={`w-7 h-7 
                        ${item.color === 'primary' ? 'text-primary' : ''}
                        ${item.color === 'info' ? 'text-info' : ''}
                        ${item.color === 'warning' ? 'text-warning' : ''}
                        ${item.color === 'success' ? 'text-success' : ''}
                      `} />
                    </div>
                    <div className="flex-1 pb-8">
                      <div className="p-6 rounded-xl bg-card border border-border">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-mono text-muted-foreground">STEP {item.step}</span>
                        </div>
                        <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                        <p className="text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Escrow Protection */}
          <div className="max-w-4xl mx-auto mb-20">
            <div className="p-8 rounded-2xl bg-gradient-to-br from-info/10 via-card to-primary/10 border border-border">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="w-8 h-8 text-info" />
                <h2 className="text-2xl font-bold">Escrow Protection</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">How Escrow Works</h3>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-success shrink-0 mt-1" />
                      <span>Funds are never paid directly between users</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-success shrink-0 mt-1" />
                      <span>kaam.com securely holds funds until work is approved</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-success shrink-0 mt-1" />
                      <span>Both parties are protected throughout the process</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Dispute Resolution</h3>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-1" />
                      <span>If disputed, funds remain locked in escrow</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-1" />
                      <span>Our support team reviews all evidence</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-1" />
                      <span>Fair resolution: refund to giver or release to doer</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* 24-Hour Auto Release */}
          <div className="max-w-4xl mx-auto mb-20">
            <div className="p-8 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-3 mb-6">
                <Clock className="w-8 h-8 text-warning" />
                <h2 className="text-2xl font-bold">24-Hour Auto-Release</h2>
              </div>

              <p className="text-muted-foreground mb-6">
                To protect Task Doers from unresponsive Givers, we have an automatic release mechanism:
              </p>

              <div className="grid md:grid-cols-3 gap-4">
                {[
                  'Task Doer submits completed work',
                  'Task Giver has 24 hours to review and respond',
                  'If no response, payment auto-releases to Doer',
                ].map((text, index) => (
                  <div key={index} className="p-4 rounded-lg bg-muted/50 border border-border text-center">
                    <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center mx-auto mb-3">
                      <span className="text-warning font-bold">{index + 1}</span>
                    </div>
                    <p className="text-sm">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-muted-foreground mb-8">
              Join our trusted marketplace today
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="lg" asChild>
                <Link to="/auth?mode=signup&role=task_giver">
                  Post a Task <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button variant="glass" size="lg" asChild>
                <Link to="/auth?mode=signup&role=task_doer">
                  Start Earning
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default HowItWorks;
