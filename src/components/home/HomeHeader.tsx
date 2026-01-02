import { RotateCcw } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { isCheckinCompletedToday } from '@/lib/checkin-helper';
import { getCompletionStats } from '@/lib/storage';
import { RoutineItem, PriorityTask } from '@/lib/storage';

interface HomeHeaderProps {
    currentDate: Date;
    isLoading: boolean;
    onRefresh: () => void;
    routines: RoutineItem[];
    priorities: PriorityTask[];
}

export const HomeHeader = ({
    currentDate,
    isLoading,
    onRefresh,
    routines,
    priorities
}: HomeHeaderProps) => {
    const { t, language } = useLanguage();

    const greeting = () => {
        const hour = currentDate.getHours();
        if (hour < 12) return t.home.greeting_morning;
        if (hour < 17) return t.home.greeting_afternoon;
        return t.home.greeting_evening;
    };

    // Progress Calculation (Routines)
    const { percent: routinePercent } = getCompletionStats(routines);
    const outerRadius = 18;
    const outerCircumference = 2 * Math.PI * outerRadius;
    const outerStrokeDashoffset = outerCircumference - (routinePercent / 100) * outerCircumference;

    // Progress Calculation (Priorities)
    const totalPriorities = priorities.length;
    const completedPriorities = priorities.filter(p => p.completed).length;
    const priorityPercent = totalPriorities === 0 ? 0 : Math.round((completedPriorities / totalPriorities) * 100);
    const innerRadius = 12;
    const innerCircumference = 2 * Math.PI * innerRadius;
    const innerStrokeDashoffset = innerCircumference - (priorityPercent / 100) * innerCircumference;

    return (
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 pt-safe">
            <div className="container px-4 py-4 md:max-w-7xl">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl md:text-2xl font-bold text-foreground">{greeting()} 👋</h1>
                            <button
                                onClick={onRefresh}
                                className={`p-1.5 rounded-full hover:bg-muted/50 transition-colors ${isLoading ? 'animate-spin' : ''}`}
                                disabled={isLoading}
                            >
                                <RotateCcw className="w-4 h-4 text-muted-foreground" />
                            </button>
                        </div>
                        <p className="text-sm font-medium text-muted-foreground/90 mt-1">
                            {currentDate.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} • {currentDate.toLocaleTimeString(language === 'id' ? 'id-ID' : 'en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </p>
                    </div>

                    {/* Daily Progress Rings (Apple Activity Style) */}
                    <div className="flex flex-col items-center justify-center gap-1">
                        <div className="relative w-12 h-12 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                {/* Outer Ring Background (Routine) */}
                                <circle cx="24" cy="24" r={outerRadius} stroke="currentColor" strokeWidth="3" fill="transparent" className="text-muted/20" />
                                {/* Inner Ring Background (Priority) */}
                                <circle cx="24" cy="24" r={innerRadius} stroke="currentColor" strokeWidth="3" fill="transparent" className="text-muted/20" />

                                {/* Outer Ring Progress (Routine - Primary Green) */}
                                <circle
                                    cx="24" cy="24" r={outerRadius}
                                    stroke="currentColor" strokeWidth="3" fill="transparent"
                                    strokeDasharray={outerCircumference} strokeDashoffset={outerStrokeDashoffset} strokeLinecap="round"
                                    className="text-primary transition-all duration-1000 ease-out"
                                />
                                {/* Inner Ring Progress (Priority - Amber/Gold) */}
                                <circle
                                    cx="24" cy="24" r={innerRadius}
                                    stroke="currentColor" strokeWidth="3" fill="transparent"
                                    strokeDasharray={innerCircumference} strokeDashoffset={innerStrokeDashoffset} strokeLinecap="round"
                                    className="text-amber-500 transition-all duration-1000 ease-out"
                                />

                                {/* Center Dot (Maghrib Check-in Status) */}
                                <circle
                                    cx="24" cy="24" r="6"
                                    fill="currentColor"
                                    className={`transition-all duration-1000 ease-out ${isCheckinCompletedToday() ? 'text-indigo-500' : 'text-muted/20'}`}
                                />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};
