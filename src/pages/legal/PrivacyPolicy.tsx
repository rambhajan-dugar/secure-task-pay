import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { ArrowLeft, Shield, Phone, Mail, AlertTriangle, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PrivacyPolicy: React.FC = () => {
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
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">Legal Document</span>
            </div>
            <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: February 2026</p>
          </div>

          <div className="prose prose-invert max-w-none space-y-8">
            <section className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
              <p className="text-muted-foreground">
                Welcome to Nap-it ("we," "our," or "us"). This Privacy Policy explains how we collect, 
                use, disclose, and safeguard your information when you use our task marketplace platform. 
                We are committed to protecting your privacy and ensuring the security of your personal data.
              </p>
            </section>

            <section className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-xl font-semibold mb-4">2. Information We Collect</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li><strong>Account Information:</strong> Name, email, phone number, profile picture</li>
                <li><strong>Identity Verification:</strong> Government ID for verification purposes</li>
                <li><strong>Transaction Data:</strong> Task details, payment information, escrow records</li>
                <li><strong>Communication Data:</strong> In-app chat messages between The Captain and The Ace</li>
                <li><strong>Location Data:</strong> Only during active SOS emergencies</li>
                <li><strong>Usage Data:</strong> App interactions, task history, ratings</li>
              </ul>
            </section>

            <section className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                3. SOS Safety Feature & Emergency Contacts
              </h2>
              <p className="text-muted-foreground mb-4">
                Our SOS feature is designed to protect both The Captain (task giver) and The Ace (task doer) during task execution.
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li><strong>Emergency Contacts:</strong> You can add up to 3 favorite emergency contacts who will receive alerts when you trigger SOS</li>
                <li><strong>SOS Activation:</strong> When triggered, your contacts receive your name, role, task reference ID, and timestamp</li>
                <li><strong>Location Sharing:</strong> Real-time location is shared with emergency contacts and our Safety Team during SOS events</li>
                <li><strong>Bidirectional Protection:</strong> Both parties in a task have access to SOS functionality</li>
                <li><strong>Safety Team Access:</strong> Our internal safety team monitors and responds to all SOS alerts</li>
              </ul>
            </section>

            <section className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-xl font-semibold mb-4">4. Data Retention</h2>
              <p className="text-muted-foreground">
                <strong>Task Data Deletion:</strong> All task-related data is automatically erased from our main database 
                <span className="text-primary font-semibold"> 28 days after task completion</span>. Only anonymized safety 
                and legal logs are retained for compliance purposes.
              </p>
            </section>

            <section className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-xl font-semibold mb-4">5. How We Use Your Information</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li>To facilitate task matching between The Captain and The Ace</li>
                <li>To process escrow payments securely</li>
                <li>To enable in-app communication</li>
                <li>To respond to SOS emergencies and ensure safety</li>
                <li>To resolve disputes using chat logs and task evidence</li>
                <li>To improve our platform and user experience</li>
              </ul>
            </section>

            <section className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-xl font-semibold mb-4">6. Data Security</h2>
              <p className="text-muted-foreground">
                We implement industry-standard security measures including:
              </p>
              <ul className="space-y-2 text-muted-foreground mt-4">
                <li>End-to-end encrypted chat messages</li>
                <li>Secure escrow payment processing</li>
                <li>Regular security audits</li>
                <li>Secure file storage for task submissions</li>
              </ul>
            </section>

            <section className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-xl font-semibold mb-4">7. We Do Not Sell Your Data</h2>
              <p className="text-muted-foreground">
                Nap-it does not sell, rent, or trade your personal information to third parties. 
                Your data is used solely for platform operations and safety purposes.
              </p>
            </section>

            <section className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-xl font-semibold mb-4">8. Your Rights</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li>Access your personal data</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your account</li>
                <li>Opt-out of non-essential communications</li>
                <li>Export your data</li>
              </ul>
            </section>

            <section className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5 text-primary" />
                9. Contact Us
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

export default PrivacyPolicy;
