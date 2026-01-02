import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import RoutineCard from '@/components/RoutineCard';
import { useLanguage } from '@/i18n/LanguageContext';
import { checkOverlap, parseTimeToMinutes, RoutineItem } from '@/lib/storage';
import { triggerHaptic } from '@/lib/haptics';

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
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur py-2 flex items-center justify-between mb-2">
                <h2 className="text-lg md:text-xl font-bold text-foreground">{t.home.routine_title}</h2>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/schedule-editor')}
                    className="gap-1.5 text-muted-foreground hover:text-foreground"
                >
                    <Settings2 className="w-4 h-4" />
                    {t.home.edit_routine}
                </Button>
            </div>

            {/* Fixed height scrollable container */}
            <div
                ref={scrollContainerRef}
                className="relative h-[260px] lg:h-[calc(100vh-200px)] overflow-y-auto rounded-3xl bg-muted/30 p-3 space-y-3 scroll-smooth md:pr-2 custom-scrollbar"
            >
                {isLoading && routines.length === 0 ? (
                    // Skeleton Loader
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-card rounded-2xl p-4 space-y-3 border border-border/50">
                            <div className="flex justify-between items-start">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-20" />
                                </div>
                                <Skeleton className="h-6 w-6 rounded-full" />
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
                    // Empty State
                    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                            <Sparkles className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-lg font-bold mb-2">Start Your Journey</h3>
                        <p className="text-sm text-muted-foreground mb-6">You haven't set up any routines yet. Create your first routine to build better habits.</p>
                        <Button onClick={() => navigate('/schedule-editor')} className="rounded-xl">
                            ✨ Create First Routine
                        </Button>
                    </div>
                )}

                {!isLoading && routines.length > 0 && (
                    <div className="py-32 flex flex-col items-center justify-center text-center opacity-50 space-y-2">
                        <div className="w-16 h-1 bg-border/50 rounded-full mb-2"></div>
                        <p className="text-xs font-medium text-muted-foreground">{t.home.schedule_finished_title}</p>
                        <p className="text-sm text-muted-foreground/60">{t.home.schedule_finished_desc}</p>
                    </div>
                )}
            </div>
        </section>
    );
};
