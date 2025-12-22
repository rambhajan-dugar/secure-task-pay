import React from 'react';
import { Link } from 'react-router-dom';
import { Task } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/feeCalculator';
import { taskCategories, getStatusColor } from '@/lib/mockData';
import { Calendar, User, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

interface TaskCardProps {
  task: Task;
  showActions?: boolean;
  variant?: 'default' | 'compact';
}

const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  showActions = true,
  variant = 'default' 
}) => {
  const category = taskCategories.find(c => c.value === task.category);
  const statusVariant = getStatusColor(task.status) as any;

  if (variant === 'compact') {
    return (
      <Link to={`/task/${task.id}`} className="block">
        <div className="p-4 rounded-lg bg-card border border-border hover:border-primary/50 transition-all duration-200 group">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{category?.icon}</span>
                <Badge variant={statusVariant} className="capitalize">{task.status.replace('_', ' ')}</Badge>
              </div>
              <h3 className="font-medium truncate group-hover:text-primary transition-colors">{task.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">ID: {task.id}</p>
            </div>
            <div className="text-right">
              <p className="font-mono font-bold text-primary">{formatCurrency(task.reward)}</p>
              <p className="text-xs text-muted-foreground">{format(task.deadline, 'MMM dd')}</p>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="p-6 rounded-xl bg-card border border-border hover:border-primary/30 transition-all duration-300 group">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-2xl">
            {category?.icon}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{category?.label}</p>
            <p className="text-xs text-muted-foreground font-mono">{task.id}</p>
          </div>
        </div>
        <Badge variant={statusVariant} className="capitalize">{task.status.replace('_', ' ')}</Badge>
      </div>

      <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
        {task.title}
      </h3>
      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
        {task.description}
      </p>

      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          <span>{format(task.deadline, 'MMM dd, yyyy')}</span>
        </div>
        <div className="flex items-center gap-1">
          <User className="w-4 h-4" />
          <span>{task.giverName}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div>
          <p className="text-xs text-muted-foreground">Reward</p>
          <p className="font-mono text-xl font-bold text-primary">{formatCurrency(task.reward)}</p>
        </div>
        {showActions && (
          <Button variant="ghost" asChild className="group-hover:bg-primary group-hover:text-primary-foreground">
            <Link to={`/task/${task.id}`}>
              View Details <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
