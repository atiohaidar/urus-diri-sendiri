import { Check, Flame, MoreVertical, Calendar, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getFrequencyText, type Habit } from '@/lib/storage';
import { useLanguage } from '@/i18n/LanguageContext';

interface HabitCardProps {
    habit: Habit & {
        isScheduledToday: boolean;
        isCompletedToday: boolean;
        currentStreak: number;
    };
    onToggle: (habitId: string) => void;
    onEdit: (habit: Habit) => void;
    onDelete: (habitId: string) => void;
    onViewStats?: (habit: Habit) => void;
    index?: number;
}

const HabitCard = ({ habit, onToggle, onEdit, onDelete, onViewStats, index = 0 }: HabitCardProps) => {
    const { t } = useLanguage();

    return (
        <div
            className={cn(
                "group relative p-4 rounded-2xl bg-card border border-border/50 transition-all duration-300",
                "hover:shadow-lg hover:border-border hover:-translate-y-0.5",
                habit.isCompletedToday && "bg-primary/5 border-primary/20",
                "animate-in fade-in slide-in-from-bottom-4"
            )}
            style={{ animationDelay: `${index * 50}ms` }}
        >
            <div className="flex items-start gap-3">
                {/* Icon & Check Button */}
                <button
                    onClick={() => onToggle(habit.id)}
                    className={cn(
                        "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all duration-200",
                        habit.isCompletedToday
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                            : "bg-secondary hover:bg-secondary/80",
                        !habit.isScheduledToday && !habit.isCompletedToday && "opacity-50"
                    )}
                >
                    {habit.isCompletedToday ? (
                        <Check className="w-6 h-6" strokeWidth={3} />
                    ) : (
                        habit.icon || '✨'
                    )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className={cn(
                            "font-semibold text-foreground truncate",
                            habit.isCompletedToday && "text-primary"
                        )}>
                            {habit.name}
                        </h3>

                        {/* Streak Badge */}
                        {habit.currentStreak > 0 && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 text-xs font-medium">
                                <Flame className="w-3 h-3" />
                                {habit.currentStreak}
                            </span>
                        )}
                    </div>

                    <p className="text-sm text-muted-foreground mt-0.5">
                        {getFrequencyText(habit)}
                    </p>

                    {habit.description && (
                        <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-1">
                            {habit.description}
                        </p>
                    )}
                </div>

                {/* Actions Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <MoreVertical className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(habit)} className="gap-2">
                            <Calendar className="w-4 h-4" />
                            Edit
                        </DropdownMenuItem>
                        {onViewStats && (
                            <DropdownMenuItem onClick={() => onViewStats(habit)} className="gap-2">
                                <TrendingUp className="w-4 h-4" />
                                View Stats
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                            onClick={() => onDelete(habit.id)}
                            className="gap-2 text-destructive focus:text-destructive"
                        >
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Status indicator */}
            {!habit.isScheduledToday && !habit.isCompletedToday && (
                <div className="absolute top-2 right-2">
                    <span className="text-[10px] text-muted-foreground/50 bg-muted/50 px-1.5 py-0.5 rounded">
                        Not scheduled today
                    </span>
                </div>
            )}
        </div>
    );
};

export default HabitCard;
