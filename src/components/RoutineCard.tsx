import { forwardRef } from 'react';
import type { RoutineItem } from '@/lib/storage';
import { calculateDuration } from '@/lib/storage';
import { Clock, Sparkles, Dumbbell, Apple, Target, Moon, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoutineCardProps {
  routine: RoutineItem;
  index: number;
  status?: 'active' | 'upcoming' | 'default';
  isOverlapping?: boolean;
}

const categoryIcons: Record<string, React.ReactNode> = {
  Mindfulness: <Sparkles className="w-4 h-4" />,
  Fitness: <Dumbbell className="w-4 h-4" />,
  Nutrition: <Apple className="w-4 h-4" />,
  Productivity: <Target className="w-4 h-4" />,
  Spiritual: <Moon className="w-4 h-4" />,
  Learning: <BookOpen className="w-4 h-4" />,
};

const categoryColors: Record<string, string> = {
  Mindfulness: 'bg-purple-100 text-purple-700',
  Fitness: 'bg-orange-100 text-orange-700',
  Nutrition: 'bg-green-100 text-green-700',
  Productivity: 'bg-blue-100 text-blue-700',
  Spiritual: 'bg-amber-100 text-amber-700',
  Learning: 'bg-pink-100 text-pink-700',
};

const RoutineCard = forwardRef<HTMLDivElement, RoutineCardProps>(
  ({ routine, index, status = 'default', isOverlapping = false }, ref) => {
    const isActive = status === 'active';
    const isUpcoming = status === 'upcoming';
    const isHighlighted = isActive || isUpcoming;

    return (
      <div
        ref={ref}
        className={cn(
          "bg-card rounded-3xl p-4 card-elevated animate-fade-in transition-all duration-300 border-2",
          isActive && "bg-primary/5 ring-2 ring-primary shadow-lg shadow-primary/10 border-primary",
          isUpcoming && "bg-muted/40 border-primary/50 border-dashed",
          !isHighlighted && "border-transparent",
          isOverlapping && "border-destructive/50 bg-destructive/5"
        )}
        style={{ animationDelay: `${index * 50}ms` }}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Clock className={cn("w-3.5 h-3.5", isOverlapping && "text-destructive", isActive && "text-primary")} />
              <span className={cn(isOverlapping && "text-destructive font-medium", isActive && "text-primary font-bold")}>
                {routine.startTime} - {routine.endTime}
              </span>
              <span className="text-muted-foreground/50">•</span>
              <span>{calculateDuration(routine.startTime, routine.endTime)}</span>

              {isActive && (
                <span className="ml-1 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider animate-pulse">
                  Now
                </span>
              )}
              {isUpcoming && (
                <span className="ml-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                  Next
                </span>
              )}

              {isOverlapping && (
                <span className="ml-1 px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs font-medium">
                  Overlap
                </span>
              )}
            </div>
            <h3 className="font-semibold text-foreground">{routine.activity}</h3>
          </div>

          <div className={cn("p-2 rounded-2xl", categoryColors[routine.category] || "bg-gray-100 text-gray-700")}>
            {categoryIcons[routine.category] || <Target className="w-4 h-4" />}
          </div>
        </div>
      </div>
    );
  }
);

export default RoutineCard;
