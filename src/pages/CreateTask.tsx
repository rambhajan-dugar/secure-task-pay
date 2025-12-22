import React, { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { taskCategories } from '@/lib/mockData';
import { TaskCategory } from '@/types';
import { formatCurrency } from '@/lib/feeCalculator';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Calendar, IndianRupee, FileText, AlertCircle } from 'lucide-react';

const CreateTask: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '' as TaskCategory | '',
    reward: '',
    deadline: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (user?.role !== 'task_giver') {
    return <Navigate to="/dashboard" replace />;
  }

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (formData.description.trim().length < 50) newErrors.description = 'Description must be at least 50 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    const reward = parseInt(formData.reward);
    if (!formData.reward || isNaN(reward)) newErrors.reward = 'Reward amount is required';
    else if (reward < 500) newErrors.reward = 'Minimum reward is ₹500';
    if (!formData.deadline) newErrors.deadline = 'Deadline is required';
    else {
      const deadline = new Date(formData.deadline);
      if (deadline <= new Date()) newErrors.deadline = 'Deadline must be in the future';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;

    // Generate task ID
    const taskId = `TASK-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
    
    toast.success(`Task ${taskId} created successfully!`);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Back Button */}
          <Button variant="ghost" className="mb-6" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Post a New Task</h1>
            <p className="text-muted-foreground">Describe your task clearly to find the right doer</p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-4 mb-8">
            {[1, 2].map((s) => (
              <React.Fragment key={s}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all ${
                  s <= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {s}
                </div>
                {s < 2 && (
                  <div className={`flex-1 h-1 rounded ${s < step ? 'bg-primary' : 'bg-muted'}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {/* Step 1: Task Details */}
            {step === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div className="p-6 rounded-xl bg-card border border-border">
                  <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Task Details
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Task Title</Label>
                      <Input
                        id="title"
                        placeholder="e.g., Design a Mobile App UI"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className={errors.title ? 'border-destructive' : ''}
                      />
                      {errors.title && (
                        <p className="text-destructive text-sm mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.title}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select 
                        value={formData.category} 
                        onValueChange={(value: TaskCategory) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger className={errors.category ? 'border-destructive' : ''}>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {taskCategories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              <span className="flex items-center gap-2">
                                <span>{cat.icon}</span>
                                {cat.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.category && (
                        <p className="text-destructive text-sm mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.category}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="description">
                        Detailed Description
                        <span className="text-muted-foreground font-normal ml-2">
                          (min 50 characters)
                        </span>
                      </Label>
                      <Textarea
                        id="description"
                        placeholder="Describe the task in detail. Include:
• What needs to be done
• Specific requirements and deliverables
• Any reference materials or examples
• Quality expectations"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className={`min-h-[200px] ${errors.description ? 'border-destructive' : ''}`}
                      />
                      <div className="flex justify-between mt-1">
                        {errors.description ? (
                          <p className="text-destructive text-sm flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.description}
                          </p>
                        ) : <span />}
                        <span className={`text-sm ${formData.description.length < 50 ? 'text-muted-foreground' : 'text-success'}`}>
                          {formData.description.length} characters
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="button" variant="hero" onClick={handleNext}>
                    Next Step
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Reward & Deadline */}
            {step === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div className="p-6 rounded-xl bg-card border border-border">
                  <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <IndianRupee className="w-5 h-5 text-primary" />
                    Reward & Timeline
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="reward">Reward Amount (INR)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                        <Input
                          id="reward"
                          type="number"
                          placeholder="5000"
                          min="500"
                          value={formData.reward}
                          onChange={(e) => setFormData({ ...formData, reward: e.target.value })}
                          className={`pl-8 ${errors.reward ? 'border-destructive' : ''}`}
                        />
                      </div>
                      {errors.reward ? (
                        <p className="text-destructive text-sm mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.reward}
                        </p>
                      ) : (
                        <p className="text-muted-foreground text-sm mt-1">
                          Minimum ₹500. You pay this amount to escrow when a doer accepts.
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="deadline" className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Deadline
                      </Label>
                      <Input
                        id="deadline"
                        type="date"
                        value={formData.deadline}
                        onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                        className={errors.deadline ? 'border-destructive' : ''}
                      />
                      {errors.deadline && (
                        <p className="text-destructive text-sm mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.deadline}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Preview */}
                {formData.reward && parseInt(formData.reward) >= 500 && (
                  <div className="p-6 rounded-xl bg-card border border-border">
                    <h3 className="font-semibold mb-4">Preview</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Task Reward</span>
                        <span className="font-mono font-medium">{formatCurrency(parseInt(formData.reward))}</span>
                      </div>
                      <div className="h-px bg-border" />
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">You Pay (to Escrow)</span>
                        <span className="font-mono font-bold text-primary">{formatCurrency(parseInt(formData.reward))}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-4">
                      Platform fee is deducted from the doer's payout, not from you.
                    </p>
                  </div>
                )}

                <div className="flex justify-between">
                  <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button type="submit" variant="hero">
                    Post Task
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </form>
        </div>
      </main>
    </div>
  );
};

export default CreateTask;
