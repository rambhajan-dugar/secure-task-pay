import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { ArrowLeft, FileText, Phone, Mail, Users, Shield, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TermsOfService: React.FC = () => {
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">Legal Document</span>
            </div>
            <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
            <p className="text-muted-foreground">Last updated: February 2026</p>
          </div>

          <div className="prose prose-invert max-w-none space-y-8">
            <section className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-xl font-semibold mb-4">1. Introduction & Acceptance</h2>
              <p className="text-muted-foreground">
                By accessing or using Nap-it, you agree to be bound by these Terms of Service. 
                Nap-it is a secure task marketplace that connects task givers with task doers, 
                protected by escrow payments and comprehensive safety features.
              </p>
            </section>

            <section className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                2. User Roles
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <div className="p-4 rounded-lg bg-background/50">
                  <h3 className="font-semibold text-foreground mb-2">The Captain (Task Giver)</h3>
                  <p>Creates and posts tasks, defines requirements and checkpoints, sets reward amounts (minimum ₹100), and approves completed work.</p>
                </div>
                <div className="p-4 rounded-lg bg-background/50">
                  <h3 className="font-semibold text-foreground mb-2">The Ace (Task Doer)</h3>
                  <p>Accepts and completes tasks, marks checkpoint progress, submits work with optional before/after images, and receives payment upon approval.</p>
                </div>
              </div>
            </section>

            <section className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-xl font-semibold mb-4">3. Task Creation Requirements</h2>
              <div className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Mandatory Fields:</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Task Title</li>
                    <li>Key Points / Checkpoints (3 main milestones)</li>
                    <li>Reward Amount (minimum ₹100 INR)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Optional Fields:</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Detailed Description</li>
                    <li>Images</li>
                    <li>Category</li>
                    <li>Hashtags (e.g., #cooking, #cleaning, #repair)</li>
                    <li>Image Verification Toggle</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-xl font-semibold mb-4">4. Checkpoint System</h2>
              <p className="text-muted-foreground mb-4">
                Each task must include 3 checkpoints defined by The Captain. The Ace must mark checkpoints as completed sequentially:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li><strong>Checkpoint 1:</strong> Task started / Arrived at location</li>
                <li><strong>Checkpoint 2:</strong> Work in progress</li>
                <li><strong>Checkpoint 3:</strong> Task completed</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                This system provides clear progress tracking and serves as evidence during dispute resolution.
              </p>
            </section>

            <section className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-success" />
                5. Escrow & Payments
              </h2>
              <ul className="space-y-2 text-muted-foreground">
                <li><strong>Minimum Payout:</strong> ₹100 INR per task</li>
                <li><strong>Escrow Protection:</strong> Full payment is held in escrow until task completion is verified</li>
                <li><strong>Auto-Release:</strong> Funds are automatically released after 24 hours if The Captain doesn't respond</li>
                <li><strong>No Direct Payments:</strong> All transactions must go through Nap-it escrow</li>
                <li><strong>Platform Fee:</strong> Automatically deducted from The Ace's payout</li>
              </ul>
            </section>

            <section className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-xl font-semibold mb-4">6. Image Verification</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li>The Captain may toggle image requirements ON or OFF</li>
                <li>The Ace can upload before/after images regardless of requirement</li>
                <li>Images serve as verification for task completion</li>
                <li>All images are stored securely and used for dispute resolution</li>
              </ul>
            </section>

            <section className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-xl font-semibold mb-4">7. Rating & Red-Flag System</h2>
              <p className="text-muted-foreground mb-4">
                After task completion, both parties can rate each other (1-5 stars) and optionally flag issues:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>Asked for extra money outside escrow</li>
                <li>Poor or aggressive verbal communication</li>
                <li>Unsafe behavior</li>
                <li>Task misrepresentation</li>
                <li>Work not done properly</li>
                <li>Time commitment issues</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                Red flags affect user trust scores and platform visibility.
              </p>
            </section>

            <section className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-xl font-semibold mb-4">8. Data Retention</h2>
              <p className="text-muted-foreground">
                Task data is automatically erased from our main database <strong>28 days after task completion</strong>. 
                Only anonymized safety and legal logs are retained.
              </p>
            </section>

            <section className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-warning" />
                9. Prohibited Conduct
              </h2>
              <ul className="space-y-2 text-muted-foreground">
                <li>Sharing personal contact information (phone, address, social media)</li>
                <li>Requesting or making payments outside Nap-it escrow</li>
                <li>Harassment, discrimination, or abusive behavior</li>
                <li>Creating fake tasks or fraudulent accounts</li>
                <li>Attempting to circumvent platform safety features</li>
              </ul>
            </section>

            <section className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-xl font-semibold mb-4">10. Account Termination</h2>
              <p className="text-muted-foreground">
                Violation of these terms may result in account suspension, permanent ban, or escrow forfeiture. 
                Nap-it reserves the right to terminate accounts at its discretion.
              </p>
            </section>

            <section className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5 text-primary" />
                11. Contact Us
              </h2>
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

export default TermsOfService;
