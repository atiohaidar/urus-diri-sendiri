import { Trash2, AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { RoutineItem } from '@/lib/types';
import { calculateDuration } from '@/lib/time-utils';

interface ScheduleCardProps {
    item: RoutineItem;
    isOverlap: boolean;
    onEdit: (item: RoutineItem) => void;
    onDelete: (e: React.MouseEvent, id: string) => void;
}

export const ScheduleCard = ({ item, isOverlap, onEdit, onDelete }: ScheduleCardProps) => {
    return (
        <div
            onClick={() => onEdit(item)}
            className={cn(
                "group bg-card transition-colors p-4 rounded-sm",
                "border-2 shadow-notebook cursor-pointer",
                "hover:shadow-notebook-hover active:scale-[0.98] duration-150 h-full",
                "flex items-center gap-4",
                isOverlap
                    ? "border-doodle-red/50 bg-doodle-red/5"
                    : "border-paper-lines/50"
            )}
        >
            {/* Time badge - Sticky note style */}
            <div className="flex flex-col items-center justify-center w-14 h-14 rounded-sm bg-sticky-yellow text-ink font-handwriting text-xs shrink-0 leading-tight shadow-tape -rotate-2">
                <span>{item.startTime}</span>
                <ArrowRight className="w-3 h-3 opacity-60 my-px rotate-90" />
                <span className="opacity-80">{item.endTime}</span>
            </div>

            <div className="flex-1 min-w-0">
                <h3 className="font-handwriting text-lg text-ink truncate">{item.activity}</h3>
                <div className="flex items-center gap-2 font-handwriting text-xs text-pencil mt-0.5">
                    <span className="bg-sticky-blue/30 px-2 py-0.5 rounded-sm text-ink">{item.category}</span>
                    <span>•</span>
                    <span>{calculateDuration(item.startTime, item.endTime)}</span>
                    {isOverlap && (
                        <span className="flex items-center gap-1 text-doodle-red font-handwriting">
                            <AlertTriangle className="w-3 h-3" />
                            Overlap!
                        </span>
                    )}
                </div>
            </div>

            <Button
                variant="ghost"
                size="icon"
                className="text-pencil/30 group-hover:text-doodle-red transition-colors -mr-2 rounded-sm"
                onClick={(e) => onDelete(e, item.id)}
            >
                <Trash2 className="w-5 h-5" />
            </Button>
        </div>
    );
};
