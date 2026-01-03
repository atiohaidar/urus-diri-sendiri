import { forwardRef, useState } from 'react';
import type { RoutineItem } from '@/lib/storage';
import { calculateDuration, isRoutineCompletedToday } from '@/lib/storage';
import { Clock, Sparkles, Dumbbell, Apple, Target, Moon, BookOpen, AlignLeft, Check } from 'lucide-react';
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

// Notebook-themed category colors
const categoryColors: Record<string, string> = {
  Mindfulness: 'bg-sticky-pink text-ink',
  Fitness: 'bg-sticky-yellow text-ink',
  Nutrition: 'bg-sticky-green text-ink',
  Productivity: 'bg-sticky-blue text-ink',
  Spiritual: 'bg-sticky-yellow text-ink',
  Learning: 'bg-sticky-pink text-ink',
};

const RoutineCard = forwardRef<HTMLDivElement, RoutineCardProps>(
  ({ routine, index, status = 'default', isOverlapping = false, onToggle }, ref) => {
    const isActive = status === 'active';
    const isUpcoming = status === 'upcoming';
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
                // Base notebook paper style
                "relative p-4 rounded-sm font-handwriting cursor-pointer",
                "bg-card border-2",
                "shadow-notebook",
                // GPU-optimized
                "transition-all duration-150 will-change-transform",
                "hover:shadow-notebook-hover hover:-translate-y-0.5",
                "active:scale-[0.98]",
                // Status variations - notebook themed
                isActive && !isCompleted && [
                  "bg-sticky-yellow/20 border-doodle-primary border-solid",
                  "ring-2 ring-doodle-primary/50 ring-offset-2 ring-offset-paper"
                ],
                isUpcoming && !isCompleted && "border-dashed border-pencil/40",
                !isActive && !isUpcoming && "border-paper-lines/50",
                isOverlapping && "border-doodle-red/50 bg-doodle-red/5",
                isCompleted && "opacity-60 bg-paper-lines/20 border-paper-lines"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start gap-3">
                {/* Hand-drawn Checkbox */}
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
                    "mt-0.5 w-6 h-6 flex items-center justify-center shrink-0",
                    "border-2 border-dashed rounded-none transition-all duration-150",
                    isCompleted
                      ? "border-solid border-doodle-green bg-doodle-green/10 text-doodle-green"
                      : "border-ink/40 hover:border-ink/60"
                  )}
                >
                  {isCompleted && <Check className="w-4 h-4" strokeWidth={3} />}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Time row */}
                  <div className="flex items-center gap-2 text-sm text-pencil mb-1 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <Clock className={cn(
                        "w-3.5 h-3.5",
                        isOverlapping && "text-doodle-red",
                        isActive && !isCompleted && "text-doodle-primary"
                      )} />
                      <span className={cn(
                        "font-handwriting",
                        isOverlapping && "text-doodle-red",
                        isActive && !isCompleted && "text-doodle-primary font-semibold",
                        isCompleted && "line-through"
                      )}>
                        {routine.startTime} - {routine.endTime}
                      </span>
                    </div>

                    {!isCompleted && (
                      <span className="text-pencil/50 hidden sm:inline">
                        • {calculateDuration(routine.startTime, routine.endTime)}
                      </span>
                    )}

                    {/* Status badges - notebook style */}
                    {isActive && !isCompleted && (
                      <span className="ml-1 px-2 py-0.5 rounded-sm bg-doodle-primary text-white text-[10px] font-handwriting uppercase">
                        Sekarang
                      </span>
                    )}
                    {isUpcoming && !isCompleted && (
                      <span className="ml-1 px-2 py-0.5 rounded-sm bg-paper-lines/40 text-pencil text-[10px] font-handwriting uppercase border border-dashed border-pencil/30">
                        Selanjutnya
                      </span>
                    )}
                    {isOverlapping && (
                      <span className="ml-1 px-2 py-0.5 rounded-sm bg-doodle-red/10 text-doodle-red text-[10px] font-handwriting">
                        Overlap
                      </span>
                    )}
                  </div>

                  {/* Activity title */}
                  <h3 className={cn(
                    "font-handwriting text-lg text-ink leading-tight truncate pr-2 flex items-center gap-2",
                    isCompleted && "line-through text-pencil decoration-2 decoration-doodle-red/40"
                  )}>
                    {routine.activity}
                    {routine.description && <AlignLeft className="w-3.5 h-3.5 text-pencil/50" />}
                  </h3>

                  {/* Description */}
                  {routine.description && !isCompleted && (
                    <p className="text-sm text-pencil/70 mt-1 truncate italic">
                      "{routine.description}"
                    </p>
                  )}
                </div>

                {/* Category icon - sticky note style */}
                <div className={cn(
                  "p-2 rounded-sm shrink-0 shadow-tape -rotate-2",
                  categoryColors[routine.category] || "bg-sticky-yellow text-ink",
                  isCompleted && "opacity-50"
                )}>
                  {categoryIcons[routine.category] || <Target className="w-4 h-4" />}
                </div>
              </div>
            </div>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className={cn(
                  "rounded-sm px-2 py-0.5 text-xs font-handwriting border-0 shadow-tape",
                  categoryColors[routine.category] || "bg-sticky-yellow text-ink"
                )}>
                  {categoryIcons[routine.category]}
                  <span className="ml-1.5">{routine.category}</span>
                </Badge>
                <span className="text-pencil text-xs">•</span>
                <span className="text-pencil text-xs font-handwriting">
                  {routine.startTime} - {routine.endTime}
                </span>
              </div>
              <DialogTitle>{routine.activity}</DialogTitle>
              <DialogDescription>
                {routine.description || "Tidak ada deskripsi tambahan."}
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </>
    );
  }
);

export default RoutineCard;
