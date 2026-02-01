import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { ArrowLeft, Shield, Phone, Mail, CheckCircle, AlertTriangle, Ban, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TrustSafety: React.FC = () => {
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/20 mb-4">
              <Shield className="w-4 h-4 text-success" />
              <span className="text-sm text-success font-medium">Trust Center</span>
            </div>
            <h1 className="text-4xl font-bold mb-2">Trust & Safety</h1>
            <p className="text-muted-foreground">Building a safe and trustworthy community</p>
          </div>

          <div className="prose prose-invert max-w-none space-y-8">
            <section className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-xl font-semibold mb-4">Our Commitment</h2>
              <p className="text-muted-foreground">
                At Nap-it, trust is the foundation of everything we do. We've built comprehensive systems 
                to ensure every interaction between The Captain and The Ace is safe, fair, and transparent.
              </p>
            </section>

            <section className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success" />
                Verification Systems
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-background/50">
                  <h3 className="font-semibold mb-2">Checkpoint Tracking</h3>
                  <p className="text-sm text-muted-foreground">
                    Every task includes 3 mandatory checkpoints that The Ace marks as completed, 
                    providing clear progress tracking and accountability.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-background/50">
                  <h3 className="font-semibold mb-2">Before/After Images</h3>
                  <p className="text-sm text-muted-foreground">
                    Optional image verification allows both parties to document task state, 
                    creating undeniable evidence of work completion.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-background/50">
                  <h3 className="font-semibold mb-2">Escrow Protection</h3>
                  <p className="text-sm text-muted-foreground">
                    100% of payment is held in escrow until task completion is verified, 
                    protecting both parties from fraud.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-background/50">
                  <h3 className="font-semibold mb-2">Chat Logging</h3>
                  <p className="text-sm text-muted-foreground">
                    All in-app communications are securely logged and available for 
                    dispute resolution when needed.
                  </p>
                </div>
              </div>
            </section>

            <section className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-warning" />
                Rating & Trust Score System
              </h2>
              <p className="text-muted-foreground mb-4">
                After each task, both The Captain and The Ace can rate each other and provide feedback:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li><strong>1-5 Star Rating:</strong> Overall experience rating</li>
                <li><strong>Trust Score:</strong> Cumulative score based on completed tasks and ratings</li>
                <li><strong>Completion Rate:</strong> Percentage of tasks completed successfully</li>
                <li><strong>Response Time:</strong> Average time to accept and complete tasks</li>
              </ul>
            </section>

            <section className="p-6 rounded-xl bg-destructive/5 border border-destructive/20">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                Red Flag Reporting
              </h2>
              <p className="text-muted-foreground mb-4">
                Users can flag concerning behavior. Reportable issues include:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Asked for extra money outside escrow</li>
                <li>• Poor or aggressive verbal communication</li>
                <li>• Unsafe behavior during task</li>
                <li>• Task misrepresentation</li>
                <li>• Work not done properly</li>
                <li>• Time commitment issues</li>
                <li>• Harassment or inappropriate behavior</li>
                <li>• Attempted external contact</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                Red flags affect visibility on the platform and may trigger account review.
              </p>
            </section>

            <section className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-xl font-semibold mb-4">Fraud Prevention</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li><strong>No Direct Payments:</strong> All transactions must go through Nap-it escrow</li>
                <li><strong>Communication Monitoring:</strong> AI-assisted detection of suspicious patterns</li>
                <li><strong>Rate Limiting:</strong> Prevents spam task creation and abuse</li>
                <li><strong>Account Verification:</strong> Multi-factor authentication available</li>
                <li><strong>Idempotency Protection:</strong> Prevents duplicate transactions</li>
              </ul>
            </section>

            <section className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Ban className="w-5 h-5 text-destructive" />
                Account Actions
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <div className="p-4 rounded-lg bg-warning/10">
                  <h3 className="font-semibold text-warning">Account Suspension</h3>
                  <p className="text-sm">Temporary restriction for minor violations or pending investigation.</p>
                </div>
                <div className="p-4 rounded-lg bg-destructive/10">
                  <h3 className="font-semibold text-destructive">Permanent Ban</h3>
                  <p className="text-sm">Complete platform removal for serious violations including fraud, harassment, or safety threats.</p>
                </div>
                <div className="p-4 rounded-lg bg-info/10">
                  <h3 className="font-semibold text-info">Escrow Hold</h3>
                  <p className="text-sm">Funds may be held during dispute investigation to ensure fair resolution.</p>
                </div>
              </div>
            </section>

            <section className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-xl font-semibold mb-4">Data Protection</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Task data deleted 28 days after completion</li>
                <li>• Encrypted chat and file storage</li>
                <li>• No selling of user data to third parties</li>
                <li>• GDPR-compliant data handling</li>
              </ul>
            </section>

            <section className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5 text-primary" />
                Report an Issue
              </h2>
              <p className="text-muted-foreground mb-4">
                If you encounter any safety or trust issues, please contact us immediately:
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

export default TrustSafety;
