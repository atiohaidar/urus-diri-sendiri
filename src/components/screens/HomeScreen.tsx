import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Sparkles, Settings2, Plus, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import RoutineCard from '@/components/RoutineCard';
import PriorityItem from '@/components/PriorityItem';
import { useRoutines } from '@/hooks/useRoutines';
import {
  checkOverlap,
  parseTimeToMinutes,
  getCompletionStats
} from '@/lib/storage';
import { useLanguage } from '@/i18n/LanguageContext';
import GreetingOverlay from '@/components/GreetingOverlay';
import { triggerHaptic } from '@/lib/haptics';
import { isCheckinCompletedToday } from '@/lib/checkin-helper';
// import DailyQuote from '@/components/DailyQuote';

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

      <main className="container px-4 py-6 md:py-8 space-y-8 md:space-y-0 md:grid md:grid-cols-2 md:gap-8 md:max-w-7xl">

        {/* Left Column (Desktop - Priority & Routines) */}
        <div className="md:col-span-1 space-y-8">

          {/* Smart Maghrib Button (Mobile Only) */}
          {currentDate.getHours() >= 17 && !isCheckinCompletedToday() && (
            <section className="block md:hidden animate-in slide-in-from-top-4 duration-500">
              <Button
                onClick={() => navigate('/maghrib-checkin')}
                className="w-full h-16 rounded-2xl text-lg font-bold gap-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-xl shadow-indigo-500/20 text-white relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <Moon className="w-6 h-6 fill-current animate-pulse" />
                <div className="flex flex-col items-start">
                  <span>{t.home.start_checkin}</span>
                  <span className="text-xs font-normal opacity-90">Time for evening reflection</span>
                </div>
              </Button>
            </section>
          )}

          <GreetingOverlay />
          {/* <DailyQuote /> */}

          {/* Daily Routine (Left side on Desktop) */}
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
                    onToggle={() => {
                      handleCheckIn(routine.id);
                      triggerHaptic();
                    }}
                  />
                );
              })}
              {routines.length > 0 && (
                <div className="py-32 flex flex-col items-center justify-center text-center opacity-50 space-y-2">
                  <div className="w-16 h-1 bg-border/50 rounded-full mb-2"></div>
                  <p className="text-xs font-medium text-muted-foreground">{t.home.schedule_finished_title}</p>
                  <p className="text-sm text-muted-foreground/60">{t.home.schedule_finished_desc}</p>
                </div>
              )}

              {routines.length === 0 && (
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
            </div>
          </section>

          {/* Top 3 Priorities (NOW BELOW ROUTINES) */}
          {/* Priorities (Mobile Only - shown below routines) */}
          <section className="md:hidden">
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

        {/* Right Column (Desktop Only) - Tasks & Check-in */}
        <div className="hidden md:block md:col-span-1 space-y-8">

          {/* Smart Maghrib Button (Desktop) */}
          {currentDate.getHours() >= 17 && !isCheckinCompletedToday() && (
            <section className="animate-in slide-in-from-top-4 duration-500">
              <Button
                onClick={() => navigate('/maghrib-checkin')}
                className="w-full h-24 rounded-3xl text-2xl font-bold gap-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-2xl shadow-indigo-500/20 text-white relative overflow-hidden group transform hover:scale-[1.02] transition-all duration-300"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <Moon className="w-10 h-10 fill-current animate-pulse" />
                <div className="flex flex-col items-start gap-1">
                  <span>{t.home.start_checkin}</span>
                  <span className="text-base font-normal opacity-90">Time for evening reflection</span>
                </div>
              </Button>
            </section>
          )}

          {/* Priorities Section (Desktop Duplicate for Split View) */}
          <section className="bg-card/50 rounded-3xl p-6 border border-border/50 h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">{t.home.priorities_title}</h2>
              <span className="text-base text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">
                {priorities.filter(p => p.completed).length}/{priorities.length} {t.home.priorities_done_suffix}
              </span>
            </div>

            {priorities.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  {priorities.map((priority, index) => (
                    <PriorityItem
                      key={`desktop-${priority.id}`}
                      priority={priority}
                      index={index}
                      onToggle={handleTogglePriority}
                    />
                  ))}
                </div>

                <div className="flex gap-2 pt-4">
                  <Input
                    placeholder={t.home.add_priority_placeholder}
                    className="h-14 text-lg bg-card rounded-xl border-dashed border-2 border-border/50 focus-visible:ring-primary/30"
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
                    className="h-14 w-14 rounded-xl border-dashed border-2"
                    onClick={() => {
                      // This is a bit hacky for the duplicate ID issue, relying on the fact that user interacts with one input at a time
                      // Ideally we'd use controlled state for input value
                      const inputs = document.querySelectorAll(`input[placeholder="${t.home.add_priority_placeholder}"]`);
                      // Find the one that has value
                      inputs.forEach((input) => {
                        const el = input as HTMLInputElement;
                        if (el.value.trim()) {
                          handleAddPriority(el.value.trim());
                          el.value = '';
                        }
                      });
                    }}
                  >
                    <Plus className="w-6 h-6" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-card rounded-3xl p-12 text-center card-elevated border-2 border-dashed border-border/50">
                  <p className="text-muted-foreground mb-2 text-xl font-medium">{t.home.no_priorities_title}</p>
                  <p className="text-base text-muted-foreground/70">
                    {t.home.no_priorities_desc}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder={t.home.first_priority_placeholder}
                    className="h-14 text-lg bg-card rounded-xl border-dashed border-2 border-border/50"
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

      </main >
    </div >
  );
};

export default HomeScreen;

