import { forwardRef, useState } from 'react';
import type { RoutineItem } from '@/lib/storage';
import { calculateDuration, isRoutineCompletedToday } from '@/lib/storage';
import { Clock, Sparkles, Dumbbell, Apple, Target, Moon, BookOpen, CheckCircle2, Circle, AlignLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CompletionNoteDialog } from '@/components/CompletionNoteDialog';

interface RoutineCardProps {
  routine: RoutineItem;
  index: number;
  status?: 'active' | 'upcoming' | 'default';
  isOverlapping?: boolean;
  onToggle?: (note?: string) => void;
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
  ({ routine, index, status = 'default', isOverlapping = false, onToggle }, ref) => {
    const isActive = status === 'active';
    const isUpcoming = status === 'upcoming';
    const isHighlighted = isActive || isUpcoming;
    const isCompleted = isRoutineCompletedToday(routine);
    const [isOpen, setIsOpen] = useState(false);
    const [showNoteDialog, setShowNoteDialog] = useState(false);

    return (
      <>
        <CompletionNoteDialog
          isOpen={showNoteDialog}
          onClose={() => setShowNoteDialog(false)}
          onSave={(note) => {
            onToggle?.(note);
            setShowNoteDialog(false);
          }}
          title={routine.activity}
          initialNote={routine.completionNote}
        />

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <div
              ref={ref}
              className={cn(
                "bg-card rounded-3xl p-4 card-elevated animate-fade-in transition-all duration-300 border-2 relative overflow-hidden cursor-pointer active:scale-[0.98]",
                isActive && !isCompleted && "bg-primary/5 ring-2 ring-primary shadow-lg shadow-primary/10 border-primary",
                isUpcoming && !isCompleted && "bg-muted/40 border-primary/50 border-dashed",
                !isHighlighted && "border-transparent",
                isOverlapping && "border-destructive/50 bg-destructive/5",
                isCompleted && "opacity-75 bg-muted/30 grayscale-[0.5] border-transparent"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Active Status Background Decoration */}
              {isActive && !isCompleted && (
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-4 -mt-4 pointer-events-none" />
              )}

              <div className="flex items-start justify-between relative z-10 gap-3">
                {/* Checkbox Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isCompleted) {
                      onToggle?.();
                    } else {
                      setShowNoteDialog(true);
                    }
                  }}
                  className={cn(
                    "mt-1 p-0.5 rounded-full transition-all duration-300 shrink-0 z-20",
                    isCompleted ? "text-primary scale-110" : "text-muted-foreground/30 hover:text-primary hover:scale-105"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-7 h-7 fill-primary/10" />
                  ) : (
                    <Circle className="w-7 h-7" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1 flex-wrap">
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Clock className={cn("w-3.5 h-3.5", isOverlapping && "text-destructive", isActive && !isCompleted && "text-primary")} />
                      <span className={cn(isOverlapping && "text-destructive font-medium", isActive && !isCompleted && "text-primary font-bold", isCompleted && "line-through opacity-70")}>
                        {routine.startTime} - {routine.endTime}
                      </span>
                    </div>

                    {!isCompleted && <span className="text-muted-foreground/50 hidden sm:inline">•</span>}
                    {!isCompleted && <span className="hidden sm:inline">{calculateDuration(routine.startTime, routine.endTime)}</span>}

                    {isActive && !isCompleted && (
                      <span className="ml-1 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider animate-pulse whitespace-nowrap">
                        Now
                      </span>
                    )}
                    {isUpcoming && !isCompleted && (
                      <span className="ml-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                        Next
                      </span>
                    )}

                    {isOverlapping && (
                      <span className="ml-1 px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs font-medium whitespace-nowrap">
                        Overlap
                      </span>
                    )}
                  </div>

                  <h3 className={cn("font-semibold text-foreground text-lg leading-tight truncate pr-2 flex items-center gap-2", isCompleted && "line-through text-muted-foreground decoration-2 decoration-muted-foreground/30")}>
                    {routine.activity}
                    {routine.description && <AlignLeft className="w-3.5 h-3.5 text-muted-foreground/50 inline-block" />}
                  </h3>
                  {status === 'upcoming' && !isCompleted && !routine.description && (
                    <p className="text-xs text-muted-foreground mt-1 italic">Up next</p>
                  )}
                  {routine.description && !isCompleted && (
                    <p className="text-xs text-muted-foreground mt-1 truncate max-w-[90%] opacity-80">
                      {routine.description}
                    </p>
                  )}
                </div>

                <div className={cn("p-2 rounded-2xl transition-colors shrink-0", categoryColors[routine.category] || "bg-gray-100 text-gray-700", isCompleted && "bg-muted text-muted-foreground")}>
                  {categoryIcons[routine.category] || <Target className="w-4 h-4" />}
                </div>
              </div>
            </div>
          </DialogTrigger>
          <DialogContent className="rounded-3xl max-w-sm sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className={cn("rounded-lg px-2 py-0.5 text-xs font-normal border-0", categoryColors[routine.category] || "bg-gray-100 text-gray-700")}>
                  {categoryIcons[routine.category]}
                  <span className="ml-1.5">{routine.category}</span>
                </Badge>
                <span className="text-muted-foreground text-xs">•</span>
                <span className="text-muted-foreground text-xs font-mono">
                  {routine.startTime} - {routine.endTime}
                </span>
              </div>
              <DialogTitle className="text-2xl">{routine.activity}</DialogTitle>
              <DialogDescription className="text-base pt-2">
                {routine.description || "Tidak ada deskripsi tambahan."}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 pt-4">
              {/* Future: Add specific actions here if needed */}
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }
);

export default RoutineCard;
