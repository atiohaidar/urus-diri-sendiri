import { useRoutines } from '@/hooks/useRoutines';
import GreetingOverlay from '@/components/GreetingOverlay';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { HomeHeader } from '@/components/home/HomeHeader';
import { HomeRoutineSection } from '@/components/home/HomeRoutineSection';
import { HomePrioritySection } from '@/components/home/HomePrioritySection';
import { CheckInButton } from '@/components/home/CheckInButton';

const HomeScreen = () => {
  const {
    routines,
    priorities,
    activeIndex,
    currentDate,
    isLoading,
    refreshData,
    handleCheckIn,
    handleTogglePriority,
    handleAddPriority,
    handleDeletePriority,
    handleUpdatePriorityText
  } = useRoutines();

  return (
    <PullToRefresh onRefresh={async () => { await refreshData(); }} className="min-h-screen pb-24 md:pb-8">
      {/* Header */}
      <HomeHeader
        currentDate={currentDate}
        isLoading={isLoading}
        onRefresh={refreshData}
        routines={routines}
        priorities={priorities}
      />

      <main className="container px-4 py-6 md:py-8 space-y-8 md:space-y-0 md:grid md:grid-cols-2 md:gap-8 md:max-w-7xl">

        {/* Left Column (Desktop - Priority & Routines) */}
        <div className="md:col-span-1 space-y-8">

          {/* Smart Maghrib Button (Mobile Only) */}
          <CheckInButton variant="mobile" currentDate={currentDate} />

          <GreetingOverlay />

          {/* Daily Routine (Left side on Desktop) */}
          <HomeRoutineSection
            routines={routines}
            isLoading={isLoading}
            activeIndex={activeIndex}
            currentDate={currentDate}
            onCheckIn={handleCheckIn}
          />

          {/* Priorities (Mobile Only - shown below routines) */}
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

        {/* Right Column (Desktop Only) - Tasks & Check-in */}
        <div className="hidden md:block md:col-span-1 space-y-8">

          {/* Smart Maghrib Button (Desktop) */}
          <CheckInButton variant="desktop" currentDate={currentDate} />

          {/* Priorities Section (Desktop Duplicate for Split View) */}
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
    </PullToRefresh >
  );
};

export default HomeScreen;
