import { useRoutines } from '@/hooks/useRoutines';
import { useHabits } from '@/hooks/useHabits';
import { HomeHeader } from '@/components/home/HomeHeader';
import { HomeRoutineSection } from '@/components/home/HomeRoutineSection';
import { HomePrioritySection } from '@/components/home/HomePrioritySection';
import { CheckInButton } from '@/components/home/CheckInButton';
import { GoogleSearchWidget } from '@/components/home/GoogleSearchWidget';
import HabitCard from '@/components/habits/HabitCard';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Flame } from 'lucide-react';
import HabitCompletionModal from '@/components/habits/HabitCompletionModal';
import { useState } from 'react';
import { Habit } from '@/lib/types';

const HomeScreen = () => {
  const navigate = useNavigate();

  // Routines & Priorities
  const {
    routines,
    priorities,
    activeIndex,
    currentDate,
    isLoading: isRoutineLoading,
    refreshData,
    handleCheckIn,
    handleTogglePriority,
    handleAddPriority,
    handleDeletePriority,
    handleUpdatePriorityText
  } = useRoutines();

  // Habits
  const {
    todayHabits,
    habits,
    toggleCompletion,
    updateHabit,
    deleteHabit
  } = useHabits();

  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [completingHabit, setCompletingHabit] = useState<Habit | null>(null);

  const handleToggleAttempt = (habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    if (habit.isCompletedToday) {
      toggleCompletion(habitId);
    } else {
      setCompletingHabit(habit);
      setIsCompletionModalOpen(true);
    }
  };

  const handleRedirectToHabits = () => navigate('/habits');

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      {/* Header */}
      <HomeHeader
        currentDate={currentDate}
        isLoading={isRoutineLoading}
        onRefresh={refreshData}
        routines={routines}
        priorities={priorities}
      />

      <main className="container px-4 py-6 md:py-8 space-y-8 md:space-y-0 md:grid md:grid-cols-2 md:gap-8 md:max-w-7xl">

        {/* Left Column (Desktop) */}
        <div className="md:col-span-1 space-y-8">

          {/* Smart Maghrib Button (Mobile Only) */}
          <CheckInButton variant="mobile" currentDate={currentDate} />

          {/* Google Search (Desktop Only) */}
          <div className="hidden md:block">
            <GoogleSearchWidget />
          </div>

          {/* Today's Habits Section (New) */}
          {todayHabits.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  Today's Habits
                </h2>
                <Button variant="ghost" size="sm" onClick={handleRedirectToHabits} className="gap-1 text-xs text-muted-foreground">
                  View All <ArrowRight className="w-3 h-3" />
                </Button>
              </div>

              {/* Horizontal Scroll for Mobile, Grid for Desktop */}
              <div className="flex overflow-x-auto pb-4 gap-3 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-2 md:overflow-visible md:pb-0 scrollbar-hide">
                {todayHabits.map((habit, index) => (
                  <div key={habit.id} className="min-w-[280px] md:min-w-0">
                    <HabitCard
                      habit={habit}
                      onToggle={handleToggleAttempt}
                      onEdit={handleRedirectToHabits}
                      onDelete={handleRedirectToHabits}
                      index={index}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Daily Routine */}
          <HomeRoutineSection
            routines={routines}
            isLoading={isRoutineLoading}
            activeIndex={activeIndex}
            currentDate={currentDate}
            onCheckIn={handleCheckIn}
          />

          {/* Priorities (Mobile Only) */}
          <HomePrioritySection
            priorities={priorities}
            onToggle={handleTogglePriority}
            onDelete={handleDeletePriority}
            onUpdate={handleUpdatePriorityText}
            onAdd={handleAddPriority}
            variant="mobile"
            className="md:hidden"
          />
        </div>

        {/* Right Column (Desktop Only) */}
        <div className="hidden md:block md:col-span-1 space-y-8">
          {/* Smart Maghrib Button (Desktop) */}
          <CheckInButton variant="desktop" currentDate={currentDate} />

          {/* Priorities Section */}
          <HomePrioritySection
            priorities={priorities}
            onToggle={handleTogglePriority}
            onDelete={handleDeletePriority}
            onUpdate={handleUpdatePriorityText}
            onAdd={handleAddPriority}
            variant="desktop"
          />
        </div>

      </main >

      {/* Global Habit Completion Modal (for Home Screen interactions) */}
      <HabitCompletionModal
        open={isCompletionModalOpen}
        onOpenChange={setIsCompletionModalOpen}
        habitName={completingHabit?.name || ''}
        onSave={(note) => {
          if (completingHabit) {
            toggleCompletion(completingHabit.id, undefined, note);
            setCompletingHabit(null);
          }
        }}
      />
    </div>
  );
};

export default HomeScreen;
