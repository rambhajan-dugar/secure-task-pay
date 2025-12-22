import React, { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Link } from 'react-router-dom';
import { calculateFee, formatCurrency, formatPercentage } from '@/lib/feeCalculator';
import { Zap, TrendingDown, Calculator, ArrowRight, CheckCircle } from 'lucide-react';

const Pricing: React.FC = () => {
  const [taskAmount, setTaskAmount] = useState(10000);
  const [tasksCompleted, setTasksCompleted] = useState([25]);

  const feeInfo = calculateFee(taskAmount, tasksCompleted[0]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          {/* Hero */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Transparent <span className="gradient-text">Pricing</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Fair fees that decrease as you grow. High-value tasks get automatic discounts.
            </p>
          </div>

          {/* Fee Structure */}
          <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
            {/* Task-based fees */}
            <div className="p-8 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Task-Based Fees</h2>
                  <p className="text-sm text-muted-foreground">Lower fees as you complete more tasks</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {[
                  { range: 'First 12 tasks', fee: '20%', tasks: '0-11' },
                  { range: 'Up to 50 tasks', fee: '15%', tasks: '12-49' },
                  { range: 'Up to 200 tasks', fee: '12.5%', tasks: '50-199' },
                  { range: 'Above 200 tasks', fee: '12%', tasks: '200+' },
                ].map((tier, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
                    <div>
                      <p className="font-medium">{tier.range}</p>
                      <p className="text-xs text-muted-foreground">{tier.tasks} completed</p>
                    </div>
                    <span className="text-xl font-mono font-bold">{tier.fee}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Value-based fees */}
            <div className="p-8 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                  <TrendingDown className="w-6 h-6 text-success" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">High-Value Discounts</h2>
                  <p className="text-sm text-muted-foreground">Automatic discounts for large transactions</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {[
                  { range: 'Above ₹20,000', fee: '10%', value: '₹20K+' },
                  { range: 'Above ₹47,000', fee: '8%', value: '₹47K+' },
                  { range: 'Above ₹1,23,000', fee: '6.5%', value: '₹1.23L+' },
                  { range: 'Above ₹5,00,000', fee: '4%', value: '₹5L+' },
                ].map((tier, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
                    <div>
                      <p className="font-medium">{tier.range}</p>
                      <p className="text-xs text-muted-foreground">Transaction value</p>
                    </div>
                    <span className="text-xl font-mono font-bold text-success">{tier.fee}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* How it Works */}
          <div className="max-w-3xl mx-auto mb-16 p-6 rounded-2xl bg-primary/5 border border-primary/20">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              We Apply the LOWER Fee
            </h3>
            <p className="text-muted-foreground">
              If your task amount qualifies for a high-value discount AND you have a task-based fee rate, 
              we automatically apply whichever results in a <span className="text-primary font-medium">lower platform fee</span> for you.
            </p>
          </div>

          {/* Fee Calculator */}
          <div className="max-w-2xl mx-auto mb-16">
            <div className="p-8 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-lg bg-info/10 flex items-center justify-center">
                  <Calculator className="w-6 h-6 text-info" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Fee Calculator</h2>
                  <p className="text-sm text-muted-foreground">See exactly what you'll earn</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <Label className="mb-2 block">Task Reward Amount (₹)</Label>
                  <Input
                    type="number"
                    value={taskAmount}
                    onChange={(e) => setTaskAmount(parseInt(e.target.value) || 0)}
                    min={500}
                    className="text-lg font-mono"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Tasks Completed</Label>
                    <span className="text-sm font-mono">{tasksCompleted[0]}</span>
                  </div>
                  <Slider
                    value={tasksCompleted}
                    onValueChange={setTasksCompleted}
                    max={250}
                    step={1}
                    className="py-4"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0</span>
                    <span>50</span>
                    <span>100</span>
                    <span>150</span>
                    <span>200</span>
                    <span>250</span>
                  </div>
                </div>

                {/* Results */}
                <div className="p-6 rounded-xl bg-muted/50 border border-border space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Task Reward</span>
                    <span className="font-mono font-medium">{formatCurrency(feeInfo.grossAmount)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-muted-foreground">Task-based fee rate</span>
                      <p className="text-xs text-muted-foreground">({tasksCompleted[0]} tasks completed)</p>
                    </div>
                    <span className="font-mono">{formatPercentage(feeInfo.taskBasedFeePercent)}</span>
                  </div>
                  
                  {feeInfo.valueBasedFeePercent && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">High-value discount</span>
                      <span className="font-mono text-success">{formatPercentage(feeInfo.valueBasedFeePercent)}</span>
                    </div>
                  )}
                  
                  <div className="h-px bg-border" />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">Applied Fee</span>
                      {feeInfo.valueBasedFeePercent && feeInfo.valueBasedFeePercent < feeInfo.taskBasedFeePercent && (
                        <p className="text-xs text-success">High-value discount applied!</p>
                      )}
                    </div>
                    <span className="font-mono font-medium text-destructive">
                      -{formatCurrency(feeInfo.platformFee)} ({formatPercentage(feeInfo.appliedFeePercent)})
                    </span>
                  </div>
                  
                  <div className="h-px bg-border" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold">You Receive</span>
                    <span className="text-2xl font-mono font-bold text-success">
                      {formatCurrency(feeInfo.netPayout)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Start Earning Today</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Fair, transparent fees with no hidden charges. The more you work, the more you keep.
            </p>
            <Button variant="hero" size="lg" asChild>
              <Link to="/auth?mode=signup">
                Get Started Free <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Pricing;
