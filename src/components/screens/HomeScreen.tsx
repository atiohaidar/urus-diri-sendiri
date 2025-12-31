import { useState, useEffect } from 'react';
import { Moon, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import RoutineCard from '@/components/RoutineCard';
import PriorityItem from '@/components/PriorityItem';
import MaghribCheckin from '@/components/MaghribCheckin';
import { 
  getRoutines, 
  getPriorities, 
  updatePriorityCompletion,
  type RoutineItem,
  type PriorityTask 
} from '@/lib/storage';

const HomeScreen = () => {
  const [routines, setRoutines] = useState<RoutineItem[]>([]);
  const [priorities, setPriorities] = useState<PriorityTask[]>([]);
  const [showCheckin, setShowCheckin] = useState(false);

  const loadData = () => {
    setRoutines(getRoutines());
    setPriorities(getPriorities());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTogglePriority = (id: string, completed: boolean) => {
    const updated = updatePriorityCompletion(id, completed);
    setPriorities(updated);
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
          <h2 className="text-lg font-bold text-foreground mb-4">Daily Routine</h2>
          <div className="space-y-3">
            {routines.map((routine, index) => (
              <RoutineCard key={routine.id} routine={routine} index={index} />
            ))}
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
    </div>
  );
};

export default HomeScreen;
