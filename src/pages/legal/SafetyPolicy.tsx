import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { ArrowLeft, Shield, Phone, Mail, AlertTriangle, Users, MapPin, Mic, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SafetyPolicy: React.FC = () => {
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 border border-destructive/20 mb-4">
              <Shield className="w-4 h-4 text-destructive" />
              <span className="text-sm text-destructive font-medium">Safety First</span>
            </div>
            <h1 className="text-4xl font-bold mb-2">Safety Policy</h1>
            <p className="text-muted-foreground">Your safety is our top priority</p>
          </div>

          <div className="prose prose-invert max-w-none space-y-8">
            {/* SOS Feature Section */}
            <section className="p-6 rounded-xl bg-destructive/5 border border-destructive/20">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                SOS Emergency System
              </h2>
              <p className="text-muted-foreground mb-4">
                Nap-it features a comprehensive SOS system available to both The Captain and The Ace during active tasks.
              </p>
              
              <div className="grid md:grid-cols-2 gap-4 mt-6">
                <div className="p-4 rounded-lg bg-background/50">
                  <h3 className="font-semibold flex items-center gap-2 mb-2">
                    <UserPlus className="w-4 h-4 text-primary" />
                    Emergency Contacts
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Add up to 3 favorite emergency contacts who will receive instant alerts when you trigger SOS.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-background/50">
                  <h3 className="font-semibold flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-success" />
                    Live Location
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Real-time GPS location is shared with your emergency contacts and our Safety Team every 4 seconds.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-background/50">
                  <h3 className="font-semibold flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-info" />
                    Safety Team Alert
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Our internal safety team is automatically notified within 30 seconds of SOS activation.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-background/50">
                  <h3 className="font-semibold flex items-center gap-2 mb-2">
                    <Mic className="w-4 h-4 text-warning" />
                    Silent Mode
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Discreet SOS activation that works silently without alerting anyone nearby.
                  </p>
                </div>
              </div>
            </section>

            <section className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-xl font-semibold mb-4">SOS Alert Contents</h2>
              <p className="text-muted-foreground mb-4">When SOS is triggered, your emergency contacts receive:</p>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Your name and profile information</li>
                <li>• Your role (The Captain or The Ace)</li>
                <li>• Current task reference ID</li>
                <li>• Timestamp of SOS activation</li>
                <li>• Real-time GPS location link</li>
                <li>• Emergency service contact numbers (112, 102)</li>
              </ul>
            </section>

            <section className="p-6 rounded-xl bg-warning/5 border border-warning/20">
              <h2 className="text-xl font-semibold mb-4 text-warning">Personal Information Safety</h2>
              <p className="text-muted-foreground mb-4">
                <strong>CRITICAL:</strong> For your safety and the safety of others, DO NOT share:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2">
                  ❌ Personal phone numbers
                </li>
                <li className="flex items-center gap-2">
                  ❌ Home or work addresses
                </li>
                <li className="flex items-center gap-2">
                  ❌ Social media profiles
                </li>
                <li className="flex items-center gap-2">
                  ❌ Bank account or payment details
                </li>
                <li className="flex items-center gap-2">
                  ❌ Government ID numbers
                </li>
              </ul>
              <p className="text-muted-foreground mt-4">
                All communication should happen through Nap-it's in-built chat system only.
              </p>
            </section>

            <section className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-xl font-semibold mb-4">In-App Chat Safety</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Chat is only enabled after The Ace accepts a task</li>
                <li>• All messages are encrypted and logged for safety</li>
                <li>• Chat logs are used for dispute resolution</li>
                <li>• Inappropriate messages can be reported</li>
                <li>• Images shared in chat are for task proof only</li>
              </ul>
            </section>

            <section className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-xl font-semibold mb-4">Meeting Safety Guidelines</h2>
              <p className="text-muted-foreground mb-4">For in-person tasks:</p>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Meet in public, well-lit areas when possible</li>
                <li>• Inform someone you trust about the task</li>
                <li>• Keep your phone charged and SOS accessible</li>
                <li>• Trust your instincts - if something feels wrong, leave</li>
                <li>• Report any suspicious behavior immediately</li>
              </ul>
            </section>

            <section className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-xl font-semibold mb-4">Image Verification for Safety</h2>
              <p className="text-muted-foreground">
                Our before/after image verification system serves multiple purposes:
              </p>
              <ul className="space-y-2 text-muted-foreground mt-4">
                <li>• Provides evidence of task completion</li>
                <li>• Helps resolve disputes fairly</li>
                <li>• Protects both The Captain and The Ace</li>
                <li>• Creates an accountability trail</li>
              </ul>
            </section>

            <section className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-xl font-semibold mb-4">Violation Consequences</h2>
              <p className="text-muted-foreground mb-4">
                Safety violations may result in:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Immediate account suspension</li>
                <li>• Permanent platform ban</li>
                <li>• Escrow hold or forfeiture</li>
                <li>• Report to law enforcement if applicable</li>
              </ul>
            </section>

            <section className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5 text-primary" />
                Emergency & Support Contacts
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <div className="p-4 rounded-lg bg-destructive/10">
                  <p className="font-semibold text-destructive">Emergency Services</p>
                  <p>Police: 112 | Medical: 102 | Women's Helpline: 1091</p>
                </div>
                <div className="space-y-2">
                  <p className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <strong>Nap-it Support:</strong> +91 7439689645
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <strong>Email:</strong> contactnapit@gmail.com
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SafetyPolicy;
