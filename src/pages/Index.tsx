import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { 
  Shield, 
  Zap, 
  TrendingDown, 
  Clock, 
  CheckCircle, 
  ArrowRight,
  Wallet,
  Users,
  FileCheck,
  Lock
} from 'lucide-react';

const Index: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-grid-pattern bg-[size:40px_40px] opacity-[0.03]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] opacity-50" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-info/20 rounded-full blur-[120px] opacity-50" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">Secure Escrow Payments</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              Get Tasks Done with{' '}
              <span className="gradient-text">Trust & Security</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
              India's trusted task marketplace. Post tasks, find skilled doers, and pay securely with escrow protection. Your money is safe until you're satisfied.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <Button variant="hero" size="xl" asChild>
                <Link to="/auth?mode=signup&role=task_giver">
                  Post a Task <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button variant="glass" size="xl" asChild>
                <Link to="/auth?mode=signup&role=task_doer">
                  Start Earning <Wallet className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
            
            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-8 mt-12 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="w-5 h-5 text-success" />
                <span>₹2Cr+ in Escrow</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="w-5 h-5 text-info" />
                <span>50K+ Users</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <FileCheck className="w-5 h-5 text-primary" />
                <span>100K+ Tasks Completed</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Simple, secure, and transparent task completion with escrow protection
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: '01',
                title: 'Post a Task',
                description: 'Describe your task with clear requirements, deadline, and reward amount.',
                icon: FileCheck,
              },
              {
                step: '02',
                title: 'Fund Escrow',
                description: 'Once a doer accepts, pay the full amount to secure escrow.',
                icon: Lock,
              },
              {
                step: '03',
                title: 'Work Gets Done',
                description: 'Doer completes the task. Track progress in real-time.',
                icon: Zap,
              },
              {
                step: '04',
                title: 'Release Payment',
                description: 'Approve work to release payment. Auto-releases after 24 hours.',
                icon: CheckCircle,
              },
            ].map((item, index) => (
              <div 
                key={index} 
                className="relative p-6 rounded-xl bg-card border border-border hover:border-primary/30 transition-all duration-300 group"
              >
                <div className="absolute -top-4 left-6 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  {item.step}
                </div>
                <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <item.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Built for Trust.<br />
                <span className="gradient-text">Designed for Safety.</span>
              </h2>
              <p className="text-muted-foreground mb-8">
                Our escrow system ensures your money is protected until you're 100% satisfied with the work delivered. No direct payments, no risks.
              </p>

              <div className="space-y-6">
                {[
                  {
                    icon: Shield,
                    title: 'Escrow Protection',
                    description: 'Funds held securely until task completion is verified',
                  },
                  {
                    icon: Clock,
                    title: '24-Hour Auto-Release',
                    description: 'If you don\'t respond, funds release automatically to the doer',
                  },
                  {
                    icon: TrendingDown,
                    title: 'Decreasing Fees',
                    description: 'Complete more tasks, pay lower platform fees (12% minimum)',
                  },
                ].map((feature, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Escrow Visualization */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-radial from-primary/20 via-transparent to-transparent blur-2xl" />
              <div className="relative glass rounded-2xl p-8">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-info/10 border border-info/20 mb-4">
                    <div className="w-2 h-2 rounded-full bg-info animate-pulse" />
                    <span className="text-sm text-info font-medium">Escrow Active</span>
                  </div>
                  <p className="text-3xl font-bold font-mono">₹45,000</p>
                  <p className="text-sm text-muted-foreground">Held Securely</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-card/50 border border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">JD</span>
                      </div>
                      <div>
                        <p className="font-medium">John Doe</p>
                        <p className="text-xs text-muted-foreground">Task Giver</p>
                      </div>
                    </div>
                    <CheckCircle className="w-5 h-5 text-success" />
                  </div>

                  <div className="flex justify-center">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-0.5 h-4 bg-border" />
                      <Lock className="w-5 h-5 text-primary" />
                      <div className="w-0.5 h-4 bg-border" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-card/50 border border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                        <span className="text-sm font-bold text-success">JS</span>
                      </div>
                      <div>
                        <p className="font-medium">Jane Smith</p>
                        <p className="text-xs text-muted-foreground">Task Doer</p>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-warning/10 text-warning">In Progress</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fee Structure */}
      <section className="py-20 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Transparent Pricing</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The more you work, the less you pay. Plus automatic discounts for high-value tasks.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Task-based fees */}
            <div className="p-6 rounded-xl bg-card border border-border">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Task-Based Fees
              </h3>
              <div className="space-y-3">
                {[
                  { range: 'First 12 tasks', fee: '20%' },
                  { range: 'Up to 50 tasks', fee: '15%' },
                  { range: 'Up to 200 tasks', fee: '12.5%' },
                  { range: 'Above 200 tasks', fee: '12%' },
                ].map((tier, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span className="text-muted-foreground">{tier.range}</span>
                    <span className="font-mono font-medium">{tier.fee}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Value-based fees */}
            <div className="p-6 rounded-xl bg-card border border-border">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-success" />
                High-Value Discounts
              </h3>
              <div className="space-y-3">
                {[
                  { range: 'Above ₹20,000', fee: '10%' },
                  { range: 'Above ₹47,000', fee: '8%' },
                  { range: 'Above ₹1,23,000', fee: '6.5%' },
                  { range: 'Above ₹5,00,000', fee: '4%' },
                ].map((tier, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span className="text-muted-foreground">{tier.range}</span>
                    <span className="font-mono font-medium text-success">{tier.fee}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            We automatically apply whichever fee is <span className="text-primary font-medium">LOWER</span> for you
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-card to-info/20 p-12 text-center">
            <div className="absolute inset-0 bg-grid-pattern bg-[size:30px_30px] opacity-[0.05]" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Join thousands of users who trust kaam.com for secure task completion. No risk, only rewards.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="hero" size="lg" asChild>
                  <Link to="/auth?mode=signup">
                    Create Free Account <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <Button variant="glass" size="lg" asChild>
                  <Link to="/tasks">
                    Browse Tasks
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
