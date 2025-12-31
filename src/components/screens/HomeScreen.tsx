import { useState, useEffect, useRef, useCallback } from 'react';
import { Moon, Sparkles, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import RoutineCard from '@/components/RoutineCard';
import RoutineEditor from '@/components/RoutineEditor';
import PriorityItem from '@/components/PriorityItem';
import MaghribCheckin from '@/components/MaghribCheckin';
import { 
  getRoutines, 
  getPriorities, 
  updatePriorityCompletion,
  saveRoutines,
  findCurrentRoutineIndex,
  type RoutineItem,
  type PriorityTask 
} from '@/lib/storage';

const HomeScreen = () => {
  const [routines, setRoutines] = useState<RoutineItem[]>([]);
  const [priorities, setPriorities] = useState<PriorityTask[]>([]);
  const [showCheckin, setShowCheckin] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  
  const routineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(() => {
    const loadedRoutines = getRoutines();
    setRoutines(loadedRoutines);
    setPriorities(getPriorities());
    
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

  const handleSaveRoutines = (newRoutines: RoutineItem[]) => {
    saveRoutines(newRoutines);
    setRoutines(newRoutines);
    const currentIndex = findCurrentRoutineIndex(newRoutines);
    setActiveIndex(currentIndex);
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">{greeting()} 👋</h1>
              <p className="text-sm text-muted-foreground">Focus on yourself today</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-md mx-auto px-4 py-6 space-y-8">
        {/* Maghrib Check-in Button */}
        <Button
          onClick={() => setShowCheckin(true)}
          className="w-full h-14 rounded-2xl text-base font-semibold gap-3 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
        >
          <Moon className="w-5 h-5" />
          Start Maghrib Check-in
        </Button>

        {/* Top 3 Priorities */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">Today's Priorities</h2>
            <span className="text-sm text-muted-foreground">
              {priorities.filter(p => p.completed).length}/{priorities.length} done
            </span>
          </div>
          
          {priorities.length > 0 ? (
            <div className="space-y-3">
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
            <div className="bg-card rounded-3xl p-6 text-center card-elevated">
              <p className="text-muted-foreground mb-2">No priorities set yet</p>
              <p className="text-sm text-muted-foreground/70">
                Complete your Maghrib Check-in to set tomorrow's priorities
              </p>
            </div>
          )}
        </section>

        {/* Daily Routine */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">Daily Routine</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEditor(true)}
              className="gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <Settings2 className="w-4 h-4" />
              Edit
            </Button>
          </div>
          
          {/* Fixed height scrollable container */}
          <div 
            ref={scrollContainerRef}
            className="h-[380px] overflow-y-auto rounded-3xl bg-muted/30 p-3 space-y-3 scroll-smooth"
          >
            {routines.map((routine, index) => (
              <RoutineCard
                key={routine.id}
                ref={(el) => (routineRefs.current[index] = el)}
                routine={routine}
                index={index}
                isActive={index === activeIndex}
              />
            ))}
            {routines.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No routines yet. Add some!</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Maghrib Check-in Modal */}
      {showCheckin && (
        <MaghribCheckin 
          onClose={() => setShowCheckin(false)} 
          onSave={loadData}
        />
      )}

      {/* Routine Editor Modal */}
      <RoutineEditor
        open={showEditor}
        onClose={() => setShowEditor(false)}
        routines={routines}
        onSave={handleSaveRoutines}
      />
    </div>
  );
};

export default HomeScreen;
