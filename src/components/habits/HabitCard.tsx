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
import { useNavigate } from 'react-router-dom';
import { triggerHaptic } from '@/lib/haptics';

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

// Sticky note colors based on index
const stickyColors = [
    { bg: 'bg-sticky-yellow', shadow: 'shadow-sticky' },
    { bg: 'bg-sticky-pink', shadow: 'shadow-sticky' },
    { bg: 'bg-sticky-blue', shadow: 'shadow-sticky' },
    { bg: 'bg-sticky-green', shadow: 'shadow-sticky' },
];

// Rotation variations for playful effect
const rotations = ['rotate-[-1deg]', 'rotate-[1deg]', 'rotate-[-2deg]', 'rotate-[0.5deg]'];

const HabitCard = ({ habit, onToggle, onEdit, onDelete, onViewStats, index = 0 }: HabitCardProps) => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const colorIndex = index % stickyColors.length;
    const rotation = rotations[index % rotations.length];
    const { bg, shadow } = stickyColors[colorIndex];

    const handleViewDetail = () => {
        triggerHaptic();
        navigate(`/habit/${habit.id}`);
    };

    return (
        <div
            className={cn(
                "group relative p-4 rounded-sm font-handwriting",
                // Sticky note style
                bg, shadow, rotation,
                // GPU-optimized transitions
                "transition-transform duration-150 will-change-transform",
                "hover:scale-[1.02] hover:rotate-0",
                "active:scale-[0.98]",
                // Completed state
                habit.isCompletedToday && "ring-2 ring-doodle-green ring-offset-2 ring-offset-paper"
            )}
            style={{
                animationDelay: `${index * 50}ms`,
            }}
        >
            <div className="flex items-start gap-3">
                {/* Icon & Check Button */}
                <button
                    onClick={() => onToggle(habit.id)}
                    className={cn(
                        "flex-shrink-0 w-10 h-10 rounded-sm flex items-center justify-center text-xl",
                        "border-2 border-dashed transition-all duration-150",
                        habit.isCompletedToday
                            ? "bg-doodle-green/20 border-solid border-doodle-green text-doodle-green"
                            : "border-ink/30 hover:border-ink/50 text-ink/70",
                        !habit.isScheduledToday && !habit.isCompletedToday && "opacity-50"
                    )}
                >
                    {habit.isCompletedToday ? (
                        <Check className="w-5 h-5" strokeWidth={3} />
                    ) : (
                        habit.icon || '✨'
                    )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3
                            onClick={handleViewDetail}
                            className={cn(
                                "font-handwriting text-lg text-ink font-semibold truncate cursor-pointer hover:text-doodle-primary transition-colors",
                                habit.isCompletedToday && "line-through decoration-2 decoration-doodle-red/60"
                            )}>
                            {habit.name}
                        </h3>

                        {/* Streak Badge - Fire doodle style */}
                        {habit.currentStreak > 0 && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-sm bg-orange-500/20 text-orange-600 text-sm font-handwriting border border-orange-500/30">
                                <Flame className="w-3 h-3" />
                                {habit.currentStreak}
                            </span>
                        )}
                    </div>

                    <p className="text-sm text-pencil mt-0.5 font-handwriting">
                        {getFrequencyText(habit)}
                    </p>

                    {habit.description && (
                        <p className="text-xs text-pencil/70 mt-1 line-clamp-1 italic">
                            "{habit.description}"
                        </p>
                    )}
                </div>

                {/* Actions Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-pencil hover:text-ink"
                        >
                            <MoreVertical className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="font-handwriting">
                        <DropdownMenuItem onClick={handleViewDetail} className="gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Lihat Statistik
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(habit)} className="gap-2">
                            <Calendar className="w-4 h-4" />
                            Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => onDelete(habit.id)}
                            className="gap-2 text-doodle-red focus:text-doodle-red"
                        >
                            Hapus
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Status indicator - Not scheduled badge */}
            {!habit.isScheduledToday && !habit.isCompletedToday && (
                <div className="absolute -top-2 -right-2 rotate-6">
                    <span className="text-[9px] text-pencil bg-paper px-1.5 py-0.5 rounded-sm border border-dashed border-pencil/30 font-handwriting">
                        Not today
                    </span>
                </div>
            )}
        </div>
    );
};

export default HabitCard;
