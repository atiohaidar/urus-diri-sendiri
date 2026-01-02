import { useState } from 'react';
import { Flame, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHabits, type Habit, type HabitWithStatus } from '@/hooks/useHabits';
import { useLanguage } from '@/i18n/LanguageContext';
import HabitCard from '@/components/habits/HabitCard';
import HabitFormModal from '@/components/habits/HabitFormModal';
import { cn } from '@/lib/utils';

const HabitsScreen = () => {
    const { t } = useLanguage();
    const {
        habits,
        isLoading,
        addHabit,
        updateHabit,
        deleteHabit,
        toggleCompletion,
    } = useHabits();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

    // Separate today's habits from others
    const todayHabits = habits.filter(h => h.isScheduledToday);
    const otherHabits = habits.filter(h => !h.isScheduledToday);

    // Calculate overall stats
    const completedToday = todayHabits.filter(h => h.isCompletedToday).length;
    const totalToday = todayHabits.length;
    const completionPercent = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

    const handleOpenNew = () => {
        setEditingHabit(null);
        setIsFormOpen(true);
    };

    const handleEdit = (habit: Habit) => {
        setEditingHabit(habit);
        setIsFormOpen(true);
    };

    const handleSave = (habitData: any) => {
        if (editingHabit) {
            updateHabit(editingHabit.id, habitData);
        } else {
            addHabit(habitData);
        }
    };

    return (
        <div className="min-h-screen pb-24 md:pb-8">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 pt-safe">
                <div className="container max-w-md md:max-w-5xl mx-auto px-4 py-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-orange-500/10">
                                <Flame className="w-6 h-6 text-orange-500" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-foreground">Habits</h1>
                                <p className="text-sm text-muted-foreground hidden md:block">
                                    Build consistency, one day at a time
                                </p>
                            </div>
                        </div>

                        {/* Today's Progress (Desktop) */}
                        {totalToday > 0 && (
                            <div className="hidden md:flex items-center gap-4">
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-foreground">
                                        {completedToday}/{totalToday}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        completed today
                                    </div>
                                </div>
                                <div className="w-16 h-16 relative">
                                    <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                                        <circle
                                            cx="18"
                                            cy="18"
                                            r="15.9155"
                                            fill="none"
                                            className="stroke-muted"
                                            strokeWidth="2"
                                        />
                                        <circle
                                            cx="18"
                                            cy="18"
                                            r="15.9155"
                                            fill="none"
                                            className="stroke-orange-500"
                                            strokeWidth="2"
                                            strokeDasharray={`${completionPercent}, 100`}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold">
                                        {completionPercent}%
                                    </span>
                                </div>
                            </div>
                        )}

                        <Button onClick={handleOpenNew} className="gap-2 md:px-6">
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">New Habit</span>
                        </Button>
                    </div>

                    {/* Today's Progress (Mobile) */}
                    {totalToday > 0 && (
                        <div className="md:hidden mt-4">
                            <div className="flex items-center justify-between text-sm text-muted-foreground mb-1.5">
                                <span>Today's progress</span>
                                <span>{completedToday}/{totalToday}</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-500"
                                    style={{ width: `${completionPercent}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </header>

            <main className="container max-w-md md:max-w-5xl mx-auto px-4 py-6 md:py-8">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : habits.length === 0 ? (
                    /* Empty State */
                    <div className="text-center py-12 md:py-24">
                        <div className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-orange-500/10 mx-auto mb-6 flex items-center justify-center">
                            <Flame className="w-10 h-10 md:w-14 md:h-14 text-orange-500" />
                        </div>
                        <h3 className="font-semibold text-lg md:text-xl text-foreground mb-2">
                            No habits yet
                        </h3>
                        <p className="text-sm md:text-base text-muted-foreground mb-6 max-w-sm mx-auto">
                            Start building good habits! Track your progress and build streaks to stay motivated.
                        </p>
                        <Button onClick={handleOpenNew} size="lg" className="gap-2">
                            <Sparkles className="w-4 h-4" />
                            Create Your First Habit
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Today's Habits */}
                        {todayHabits.length > 0 && (
                            <section>
                                <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                                    Today
                                </h2>
                                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                    {todayHabits.map((habit, index) => (
                                        <HabitCard
                                            key={habit.id}
                                            habit={habit}
                                            onToggle={toggleCompletion}
                                            onEdit={handleEdit}
                                            onDelete={deleteHabit}
                                            index={index}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Other Habits */}
                        {otherHabits.length > 0 && (
                            <section>
                                <h2 className="text-sm font-medium text-muted-foreground mb-3">
                                    Other Habits
                                </h2>
                                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                    {otherHabits.map((habit, index) => (
                                        <HabitCard
                                            key={habit.id}
                                            habit={habit}
                                            onToggle={toggleCompletion}
                                            onEdit={handleEdit}
                                            onDelete={deleteHabit}
                                            index={index}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </main>

            {/* FAB for mobile (alternative to header button) */}
            <button
                onClick={handleOpenNew}
                className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] right-4 md:hidden w-14 h-14 bg-gradient-to-tr from-orange-500 to-amber-500 rounded-full shadow-lg shadow-orange-500/30 flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-transform z-40"
            >
                <Plus className="w-6 h-6" strokeWidth={2.5} />
            </button>

            {/* Form Modal */}
            <HabitFormModal
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                habit={editingHabit}
                onSave={handleSave}
            />
        </div>
    );
};

export default HabitsScreen;
