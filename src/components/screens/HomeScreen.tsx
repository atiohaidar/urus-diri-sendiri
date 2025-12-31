import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Plus, Moon, Sparkles, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import RoutineCard from '@/components/RoutineCard';
import PriorityItem from '@/components/PriorityItem';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

import {
  getRoutines,
  getPriorities,
  updatePriorityCompletion,
  findCurrentRoutineIndex,
  checkOverlap,
  parseTimeToMinutes,
  toggleRoutineCompletion,
  getCompletionStats,
  type RoutineItem,
  type PriorityTask
} from '@/lib/storage';

const HomeScreen = () => {
  const [routines, setRoutines] = useState<RoutineItem[]>([]);
  const [priorities, setPriorities] = useState<PriorityTask[]>([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, percent: 0 }); // Added stats state
  const [activeIndex, setActiveIndex] = useState(0);
  const [currentDate, setCurrentDate] = useState(new Date());
  const navigate = useNavigate();

  const routineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(() => {
    const loadedRoutines = getRoutines();
    setRoutines(loadedRoutines);
    setPriorities(getPriorities());
    setStats(getCompletionStats(loadedRoutines)); // Update stats

    // Find current routine index
    const currentIndex = findCurrentRoutineIndex(loadedRoutines);
    setActiveIndex(currentIndex);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-scroll to active routine
  useEffect(() => {
    if (routines.length > 0 && routineRefs.current[activeIndex] && scrollContainerRef.current) {
      setTimeout(() => {
        routineRefs.current[activeIndex]?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 100);
    }
  }, [routines, activeIndex]);

  const handleTogglePriority = (id: string, completed: boolean) => {
    const updated = updatePriorityCompletion(id, completed);
    setPriorities(updated);
  };

  const greeting = () => {
    const hour = currentDate.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle check-in toggle
  const handleCheckIn = (id: string) => {
    const updated = toggleRoutineCompletion(id, routines);
    setRoutines(updated);
    setStats(getCompletionStats(updated));
    toast.success("Progress updated! Keep it up! 🚀");
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
                {currentDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} • {currentDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })}
              </p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-primary" />
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
              Start Maghrib Check-in
            </Button>
          </section>

          {/* Top 3 Priorities */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg md:text-xl font-bold text-foreground">Today's Priorities</h2>
              <span className="text-sm md:text-base text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">
                {priorities.filter(p => p.completed).length}/{priorities.length} done
              </span>
            </div>

            {priorities.length > 0 ? (
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
            ) : (
              <div className="bg-card rounded-3xl p-8 text-center card-elevated border-2 border-dashed border-border/50">
                <p className="text-muted-foreground mb-2 text-lg font-medium">No priorities set yet</p>
                <p className="text-sm text-muted-foreground/70">
                  Complete your Maghrib Check-in to set tomorrow's priorities
                </p>
              </div>
            )}
          </section>
        </div>

        {/* Right Column (Desktop) - Daily Routine */}
        <div className="md:col-span-5 lg:col-span-4">
          <section className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg md:text-xl font-bold text-foreground">Daily Routine</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/schedule-editor')}
                className="gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <Settings2 className="w-4 h-4" />
                Edit
              </Button>
            </div>

            {/* Fixed height scrollable container */}
            <div
              ref={scrollContainerRef}
              className="h-[380px] md:h-[calc(100vh-250px)] md:min-h-[500px] overflow-y-auto rounded-3xl bg-muted/30 p-3 space-y-3 scroll-smooth md:pr-2 custom-scrollbar"
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
                  />
                );
              })}
              {routines.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No routines yet. Add some!</p>
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
