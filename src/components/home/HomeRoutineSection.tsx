import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings2, Sparkles, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import RoutineCard from '@/components/RoutineCard';
import { useLanguage } from '@/i18n/LanguageContext';
import { checkOverlap, parseTimeToMinutes, RoutineItem } from '@/lib/storage';
import { triggerHaptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';

interface HomeRoutineSectionProps {
    routines: RoutineItem[];
    isLoading: boolean;
    activeIndex: number;
    currentDate: Date;
    onCheckIn: (id: string, note?: string) => void;
}

export const HomeRoutineSection = ({
    routines,
    isLoading,
    activeIndex,
    currentDate,
    onCheckIn
}: HomeRoutineSectionProps) => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const routineRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Auto-scroll to active routine
    useEffect(() => {
        const container = scrollContainerRef.current;
        const activeElement = routineRefs.current[activeIndex];

        if (routines.length > 0 && activeElement && container) {
            setTimeout(() => {
                const topPos = activeElement.offsetTop - 12;
                container.scrollTo({
                    top: topPos,
                    behavior: 'smooth',
                });
            }, 100);
        }
    }, [routines, activeIndex]);

    return (
        <section className="flex flex-col h-full">
            {/* Section Header - Notebook style */}
            <div className="py-2 flex items-center justify-between mb-3">
                <h2 className="font-handwriting text-xl text-ink flex items-center gap-2">
                    <span className="underline-squiggle">{t.home.routine_title}</span>
                    <Star className="w-4 h-4 text-sticky-yellow fill-sticky-yellow" />
                </h2>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/schedule-editor')}
                    className="gap-1.5 text-pencil hover:text-ink font-handwriting"
                >
                    <Settings2 className="w-4 h-4" />
                    {t.home.edit_routine}
                </Button>
            </div>

            {/* Scrollable container - Notebook paper style */}
            <div
                ref={scrollContainerRef}
                className={cn(
                    "relative h-[260px] lg:h-[calc(100vh-200px)] overflow-y-auto",
                    "rounded-sm p-3 space-y-3 scroll-smooth",
                    "bg-paper-lines/10 border-2 border-dashed border-paper-lines",
                    "custom-scrollbar"
                )}
            >
                {isLoading && routines.length === 0 ? (
                    // Skeleton Loader
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-card rounded-sm p-4 space-y-3 border-2 border-paper-lines/30">
                            <div className="flex justify-between items-start">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-20" />
                                </div>
                                <Skeleton className="h-6 w-6 rounded-sm" />
                            </div>
                        </div>
                    ))
                ) : routines.length > 0 ? (
                    routines.map((routine, index) => {
                        // Check if this routine overlaps with any other
                        const isOverlapping = routines.some(other => checkOverlap(routine, other));

                        // Determine status
                        let status: 'active' | 'upcoming' | 'default' = 'default';
                        if (index === activeIndex) {
                            const nowMinutes = currentDate.getHours() * 60 + currentDate.getMinutes();
                            const startMinutes = parseTimeToMinutes(routine.startTime);
                            if (nowMinutes >= startMinutes) {
                                status = 'active';
                            } else {
                                status = 'upcoming';
                            }
                        }

                        return (
                            <RoutineCard
                                key={routine.id}
                                ref={(el) => (routineRefs.current[index] = el)}
                                routine={routine}
                                index={index}
                                status={status}
                                isOverlapping={isOverlapping}
                                onToggle={(note) => {
                                    onCheckIn(routine.id, note);
                                    triggerHaptic();
                                }}
                            />
                        );
                    })
                ) : (
                    // Empty State - Notebook doodle style
                    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                        <div className="w-20 h-20 bg-sticky-yellow shadow-sticky rounded-sm flex items-center justify-center mb-4 rotate-2">
                            <Sparkles className="w-10 h-10 text-ink" />
                        </div>
                        <h3 className="font-handwriting text-xl text-ink mb-2">{t.home.no_routines_title}</h3>
                        <p className="font-handwriting text-base text-pencil mb-6">{t.home.no_routines_desc}</p>
                        <Button onClick={() => navigate('/schedule-editor')} variant="sticker">
                            ✨ {t.home.create_first_routine}
                        </Button>
                    </div>
                )}

                {!isLoading && routines.length > 0 && (
                    <div className="py-16 flex flex-col items-center justify-center text-center opacity-50 space-y-2">
                        <div className="w-16 h-0.5 bg-paper-lines rounded-full mb-2"></div>
                        <p className="font-handwriting text-sm text-pencil">{t.home.schedule_finished_title}</p>
                        <p className="font-handwriting text-xs text-pencil/60 italic">"{t.home.schedule_finished_desc}"</p>
                    </div>
                )}
            </div>
        </section>
    );
};
