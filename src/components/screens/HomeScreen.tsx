import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Sparkles, Settings2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import RoutineCard from '@/components/RoutineCard';
import PriorityItem from '@/components/PriorityItem';
import { useRoutines } from '@/hooks/useRoutines';
import {
  checkOverlap,
  parseTimeToMinutes,
} from '@/lib/storage';
import { useLanguage } from '@/i18n/LanguageContext';

const HomeScreen = () => {
  const {
    routines,
    priorities,
    activeIndex,
    currentDate,
    handleCheckIn,
    handleTogglePriority,
    handleAddPriority
  } = useRoutines();
  const { t, language } = useLanguage();

  const navigate = useNavigate();
  const routineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active routine
  // Auto-scroll to active routine
  useEffect(() => {
    const container = scrollContainerRef.current;
    const activeElement = routineRefs.current[activeIndex];

    if (routines.length > 0 && activeElement && container) {
      setTimeout(() => {
        // Calculate position relative to container (since container will be relative)
        // Subtract a small buffer (12px) for visual comfort
        const topPos = activeElement.offsetTop - 12;

        container.scrollTo({
          top: topPos,
          behavior: 'smooth',
        });
      }, 100);
    }
  }, [routines, activeIndex]);

  const greeting = () => {
    const hour = currentDate.getHours();
    if (hour < 12) return t.home.greeting_morning;
    if (hour < 17) return t.home.greeting_afternoon;
    return t.home.greeting_evening;
  };

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container px-4 py-4 md:max-w-7xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground">{greeting()} 👋</h1>
              <p className="text-sm font-medium text-muted-foreground/90 mt-1">
                {currentDate.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} • {currentDate.toLocaleTimeString(language === 'id' ? 'id-ID' : 'en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6 md:py-8 space-y-8 md:space-y-0 md:grid md:grid-cols-12 md:gap-8 md:max-w-7xl">

        {/* Left Column (Desktop) */}
        <div className="md:col-span-7 lg:col-span-8 space-y-8">
          {/* Maghrib Check-in Button */}
          <section>
            <Button
              onClick={() => navigate('/maghrib-checkin')}
              className="w-full h-14 md:h-16 rounded-2xl text-base md:text-lg font-semibold gap-3 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20"
            >
              <Moon className="w-5 h-5 md:w-6 md:h-6" />
              {t.home.start_checkin}
            </Button>
          </section>

          {/* Top 3 Priorities */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg md:text-xl font-bold text-foreground">{t.home.priorities_title}</h2>
              <span className="text-sm md:text-base text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">
                {priorities.filter(p => p.completed).length}/{priorities.length} {t.home.priorities_done_suffix}
              </span>
            </div>

            {priorities.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {priorities.map((priority, index) => (
                    <PriorityItem
                      key={priority.id}
                      priority={priority}
                      index={index}
                      onToggle={handleTogglePriority}
                    />
                  ))}
                </div>

                {/* Add Priority Input */}
                <div className="flex gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <Input
                    placeholder={t.home.add_priority_placeholder}
                    className="h-12 bg-card rounded-xl border-dashed border-2 border-border/50 focus-visible:ring-primary/30"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = e.currentTarget.value.trim();
                        if (val) {
                          handleAddPriority(val);
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    className="h-12 w-12 rounded-xl border-dashed border-2"
                    onClick={() => {
                      const input = document.querySelector(`input[placeholder="${t.home.add_priority_placeholder}"]`) as HTMLInputElement;
                      if (input && input.value.trim()) {
                        handleAddPriority(input.value.trim());
                        input.value = '';
                      }
                    }}
                  >
                    <Plus className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-card rounded-3xl p-8 text-center card-elevated border-2 border-dashed border-border/50">
                  <p className="text-muted-foreground mb-2 text-lg font-medium">{t.home.no_priorities_title}</p>
                  <p className="text-sm text-muted-foreground/70">
                    {t.home.no_priorities_desc}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder={t.home.first_priority_placeholder}
                    className="h-12 bg-card rounded-xl border-dashed border-2 border-border/50"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = e.currentTarget.value.trim();
                        if (val) {
                          handleAddPriority(val);
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Right Column (Desktop) - Daily Routine */}
        <div className="md:col-span-5 lg:col-span-4">
          <section className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
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
              className="relative h-[380px] md:h-[calc(100vh-250px)] md:min-h-[500px] overflow-y-auto rounded-3xl bg-muted/30 p-3 space-y-3 scroll-smooth md:pr-2 custom-scrollbar"
            >
              {routines.map((routine, index) => {
                // Check if this routine overlaps with any other
                const isOverlapping = routines.some(other => checkOverlap(routine, other));

                // Determine status
                let status: 'active' | 'upcoming' | 'default' = 'default';
                if (index === activeIndex) {
                  const nowMinutes = currentDate.getHours() * 60 + currentDate.getMinutes();
                  const startMinutes = parseTimeToMinutes(routine.startTime);
                  // If we are at the active index, it's either running NOW or it's the NEXT one.
                  // strict check: if now >= start, it's active. else upcoming.
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
                    onToggle={() => handleCheckIn(routine.id)}
                  />
                );
              })}
              {routines.length > 0 && (
                <div className="py-32 flex flex-col items-center justify-center text-center opacity-50 space-y-2">
                  <div className="w-16 h-1 bg-border/50 rounded-full mb-2"></div>
                  <p className="text-xs font-medium text-muted-foreground">{t.home.schedule_finished_title}</p>
                  <p className="text-[10px] text-muted-foreground/60">{t.home.schedule_finished_desc}</p>
                </div>
              )}

              {routines.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">{t.home.no_routines_text}</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default HomeScreen;

