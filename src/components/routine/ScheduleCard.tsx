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
                "group bg-card hover:bg-muted/50 transition-colors p-4 rounded-3xl border border-border/50 flex items-center gap-4 cursor-pointer active:scale-[0.98] duration-200 h-full",
                "border-primary/20",
                isOverlap && "border-destructive/50 bg-destructive/5"
            )}
        >
            <div className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary font-bold text-xs shrink-0 leading-tight">
                <span>{item.startTime}</span>
                <ArrowRight className="w-3 h-3 opacity-50 my-px rotate-90" />
                <span className="opacity-80">{item.endTime}</span>
            </div>

            <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">{item.activity}</h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span className="bg-muted px-2 py-0.5 rounded-full">{item.category}</span>
                    <span>•</span>
                    <span>{calculateDuration(item.startTime, item.endTime)}</span>
                    {isOverlap && (
                        <span className="flex items-center gap-1 text-destructive font-medium">
                            <AlertTriangle className="w-3 h-3" />
                            Overlap
                        </span>
                    )}
                </div>
            </div>

            <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground/30 group-hover:text-destructive transition-colors -mr-2"
                onClick={(e) => onDelete(e, item.id)}
            >
                <Trash2 className="w-5 h-5" />
            </Button>
        </div>
    );
};
