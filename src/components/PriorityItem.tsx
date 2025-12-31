import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import type { PriorityTask } from '@/lib/storage';

interface PriorityItemProps {
  priority: PriorityTask;
  index: number;
  onToggle: (id: string, completed: boolean) => void;
}

const PriorityItem = ({ priority, index, onToggle }: PriorityItemProps) => {
  return (
    <div 
      className={cn(
        "flex items-center gap-3 p-4 bg-card rounded-3xl card-elevated transition-all duration-300 animate-fade-in",
        priority.completed && "opacity-70"
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <button
        onClick={() => onToggle(priority.id, !priority.completed)}
        className={cn(
          "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200",
          priority.completed 
            ? "bg-primary border-primary" 
            : "border-muted-foreground/30 hover:border-primary"
        )}
      >
        {priority.completed && (
          <Check className="w-4 h-4 text-primary-foreground animate-check" />
        )}
      </button>
      <div className="flex items-center gap-3 flex-1">
        <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold text-primary">
          {index + 1}
        </span>
        <span className={cn(
          "flex-1 font-medium transition-all duration-300",
          priority.completed && "line-through-animated text-muted-foreground"
        )}>
          {priority.text}
        </span>
      </div>
    </div>
  );
};

export default PriorityItem;
