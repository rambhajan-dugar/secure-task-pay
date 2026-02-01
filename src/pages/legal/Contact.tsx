import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { ArrowLeft, Phone, Mail, MessageCircle, Clock, MapPin, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const Contact: React.FC = () => {
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
              <MessageCircle className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">Get in Touch</span>
            </div>
            <h1 className="text-4xl font-bold mb-2">Contact Us</h1>
            <p className="text-muted-foreground">We're here to help you</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact Information */}
            <div className="space-y-6">
              <div className="p-6 rounded-xl bg-card border border-border">
                <h2 className="text-xl font-semibold mb-6">Contact Information</h2>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Phone className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Phone</h3>
                      <p className="text-muted-foreground">+91 7439689645</p>
                      <p className="text-xs text-muted-foreground mt-1">Available 9 AM - 9 PM IST</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Mail className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Email</h3>
                      <p className="text-muted-foreground">contactnapit@gmail.com</p>
                      <p className="text-xs text-muted-foreground mt-1">We respond within 24 hours</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Clock className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Support Hours</h3>
                      <p className="text-muted-foreground">Monday - Sunday</p>
                      <p className="text-xs text-muted-foreground mt-1">9:00 AM - 9:00 PM IST</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-destructive/5 border border-destructive/20">
                <h3 className="font-semibold flex items-center gap-2 mb-4 text-destructive">
                  <Shield className="w-5 h-5" />
                  Emergency Support
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  For urgent safety concerns during an active task, use the SOS button in the app. 
                  Our safety team responds immediately.
                </p>
                <div className="space-y-2 text-sm">
                  <p><strong>Police:</strong> 112</p>
                  <p><strong>Medical:</strong> 102</p>
                  <p><strong>Women's Helpline:</strong> 1091</p>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-card border border-border">
                <h3 className="font-semibold mb-4">Quick Links</h3>
                <div className="space-y-2">
                  <Link to="/safety" className="block text-muted-foreground hover:text-primary transition-colors">
                    Safety Policy
                  </Link>
                  <Link to="/disputes" className="block text-muted-foreground hover:text-primary transition-colors">
                    Dispute Resolution
                  </Link>
                  <Link to="/escrow" className="block text-muted-foreground hover:text-primary transition-colors">
                    Escrow Terms
                  </Link>
                  <Link to="/trust" className="block text-muted-foreground hover:text-primary transition-colors">
                    Trust & Safety
                  </Link>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-xl font-semibold mb-6">Send us a Message</h2>
              
              <form className="space-y-4">
                <div>
                  <Label htmlFor="name">Your Name</Label>
                  <Input id="name" placeholder="Enter your name" />
                </div>
                
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" placeholder="Enter your email" />
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone Number (Optional)</Label>
                  <Input id="phone" type="tel" placeholder="+91 XXXXX XXXXX" />
                </div>
                
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" placeholder="What is this about?" />
                </div>
                
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea 
                    id="message" 
                    placeholder="Describe your issue or question in detail..."
                    className="min-h-[150px]"
                  />
                </div>
                
                <Button type="submit" className="w-full">
                  Send Message
                </Button>
                
                <p className="text-xs text-muted-foreground text-center">
                  By submitting, you agree to our Privacy Policy
                </p>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
