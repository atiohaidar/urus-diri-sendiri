import { Settings, Cloud, CloudOff, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { isCheckinCompletedToday } from '@/lib/checkin-helper';
import { getCompletionStats } from '@/lib/storage';
import { RoutineItem, PriorityTask } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { useAuthSync } from '@/hooks/useAuthSync';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';


interface HomeHeaderProps {
    currentDate: Date;
    isLoading: boolean;
    routines: RoutineItem[];
    priorities: PriorityTask[];
}

export const HomeHeader = ({
    currentDate,
    isLoading,
    routines,
    priorities
}: HomeHeaderProps) => {
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const { isAuthenticated, state, user } = useAuthSync();

    const greeting = () => {
        const hour = currentDate.getHours();

        // Indonesian time divisions (more granular)
        if (language === 'id') {
            if (hour < 10) return t.home.greeting_morning;      // Pagi: 00:00-09:59
            if (hour < 15) return t.home.greeting_afternoon;    // Siang: 10:00-14:59
            if (hour < 18) return t.home.greeting_evening;      // Sore: 15:00-17:59
            return t.home.greeting_night;                       // Malam: 18:00-23:59
        }

        // English time divisions
        if (hour < 12) return t.home.greeting_morning;          // Morning: 00:00-11:59
        if (hour < 17) return t.home.greeting_afternoon;        // Afternoon: 12:00-16:59
        if (hour < 21) return t.home.greeting_evening;          // Evening: 17:00-20:59
        return t.home.greeting_night;                           // Night: 21:00-23:59
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

    // Grade based on overall completion
    const overallPercent = (routinePercent + priorityPercent) / 2;
    const getGrade = () => {
        if (overallPercent >= 90) return 'A+';
        if (overallPercent >= 80) return 'A';
        if (overallPercent >= 70) return 'B+';
        if (overallPercent >= 60) return 'B';
        if (overallPercent >= 50) return 'C';
        return '📝';
    };

    return (
        <header className="sticky top-0 z-40 bg-paper border-b-2 border-dashed border-paper-lines pt-safe">
            <div className="container px-4 py-4 md:max-w-7xl">
                <div className="flex items-center justify-between">
                    {/* Left: Greeting & Date */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl md:text-3xl font-handwriting text-ink truncate">
                                <span className="highlight">{greeting()}</span> 👋
                            </h1>

                        </div>
                        <p className="text-sm font-handwriting text-pencil mt-1 truncate">
                            [ {currentDate.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short' })} • {currentDate.toLocaleTimeString(language === 'id' ? 'id-ID' : 'en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} ]
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Grade Circle - Standalone */}
                        {/* <div className="grade-circle text-xs">
                            {getGrade()}
                        </div> */}



                        {/* Cloud Sync Status Indicator */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={() => navigate('/settings')}
                                    className="p-1.5 rounded-sm hover:bg-paper-lines/30 transition-colors duration-150 group"
                                >
                                    {state === 'syncing' ? (
                                        <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                                    ) : !isAuthenticated ? (
                                        <CloudOff className="w-4 h-4 text-pencil/40" />
                                    ) : state === 'error' ? (
                                        <Cloud className="w-4 h-4 text-doodle-red" />
                                    ) : (
                                        <Cloud className="w-4 h-4 text-doodle-green" />
                                    )}
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="font-handwriting border-2 border-paper-lines shadow-notebook bg-paper text-ink">
                                <p>
                                    {state === 'syncing'
                                        ? t.settings.sync_tooltip_syncing
                                        : !isAuthenticated
                                            ? t.settings.sync_tooltip_offline
                                            : state === 'error'
                                                ? t.settings.sync_tooltip_error
                                                : t.settings.sync_tooltip_connected.replace('{email}', user?.email || '')}
                                </p>
                            </TooltipContent>
                        </Tooltip>

                        {/* Settings Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate('/settings')}
                            className="text-pencil hover:text-ink hover:bg-paper-lines/30"
                        >
                            <Settings className="w-5 h-5" />
                        </Button>

                        {/* Progress Rings */}
                        <div className="relative w-12 h-12 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                {/* Outer Ring Background (Routine) */}
                                <circle
                                    cx="24" cy="24" r={outerRadius}
                                    stroke="currentColor" strokeWidth="3" fill="transparent"
                                    className="text-paper-lines/40"
                                    strokeDasharray="4 2"
                                />
                                {/* Inner Ring Background (Priority) */}
                                <circle
                                    cx="24" cy="24" r={innerRadius}
                                    stroke="currentColor" strokeWidth="3" fill="transparent"
                                    className="text-paper-lines/40"
                                    strokeDasharray="4 2"
                                />

                                {/* Outer Ring Progress (Routine - Primary) */}
                                <circle
                                    cx="24" cy="24" r={outerRadius}
                                    stroke="currentColor" strokeWidth="3" fill="transparent"
                                    strokeDasharray={outerCircumference} strokeDashoffset={outerStrokeDashoffset} strokeLinecap="round"
                                    className="text-doodle-primary transition-all duration-500 ease-out"
                                />
                                {/* Inner Ring Progress (Priority - Amber) */}
                                <circle
                                    cx="24" cy="24" r={innerRadius}
                                    stroke="currentColor" strokeWidth="3" fill="transparent"
                                    strokeDasharray={innerCircumference} strokeDashoffset={innerStrokeDashoffset} strokeLinecap="round"
                                    className="text-amber-500 transition-all duration-500 ease-out"
                                />

                                {/* Center Dot (Maghrib Check-in Status) */}
                                <circle
                                    cx="24" cy="24" r="5"
                                    fill="currentColor"
                                    className={`transition-all duration-500 ease-out ${isCheckinCompletedToday() ? 'text-doodle-green' : 'text-paper-lines/30'}`}
                                />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

