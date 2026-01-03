import { useState } from 'react';
import { Flame, Plus, Sparkles, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHabits, type Habit } from '@/hooks/useHabits';
import { useLanguage } from '@/i18n/LanguageContext';
import HabitCard from '@/components/habits/HabitCard';
import HabitFormModal from '@/components/habits/HabitFormModal';
import HabitCompletionModal from '@/components/habits/HabitCompletionModal';
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

    // Completion Modal State
    const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
    const [completingHabit, setCompletingHabit] = useState<Habit | null>(null);

    // Separate today's habits from others
    const todayHabits = habits.filter(h => h.isScheduledToday);
    const otherHabits = habits.filter(h => !h.isScheduledToday);

    // Calculate overall stats
    const completedToday = todayHabits.filter(h => h.isCompletedToday).length;
    const totalToday = todayHabits.length;
    const completionPercent = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

    // Grade based on completion
    const getGrade = () => {
        if (completionPercent >= 100) return 'A+';
        if (completionPercent >= 80) return 'A';
        if (completionPercent >= 60) return 'B';
        if (completionPercent >= 40) return 'C';
        return '📝';
    };

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

    return (
        <div className="min-h-screen pb-24 md:pb-8 bg-notebook">
            {/* Header - Notebook style */}
            <header className="sticky top-0 z-40 bg-paper border-b-2 border-dashed border-paper-lines pt-safe">
                <div className="container max-w-md md:max-w-5xl mx-auto px-4 py-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-sm bg-sticky-yellow shadow-sticky -rotate-2">
                                <Flame className="w-6 h-6 text-orange-600" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-handwriting text-ink flex items-center gap-2">
                                    <span className="highlight">Amalan Yaumiah</span>
                                    <Star className="w-5 h-5 text-sticky-yellow fill-sticky-yellow" />
                                </h1>
                                <p className="text-sm font-handwriting text-pencil hidden md:block">
                                    Konsisten setiap hari, sedikit demi sedikit ✏️
                                </p>
                            </div>
                        </div>

                        {/* Today's Progress (Desktop) - Grade Circle */}
                        {totalToday > 0 && (
                            <div className="hidden md:flex items-center gap-4">
                                <div className="text-right font-handwriting">
                                    <div className="text-2xl text-ink">
                                        {completedToday}/{totalToday}
                                    </div>
                                    <div className="text-xs text-pencil">
                                        selesai hari ini
                                    </div>
                                </div>
                                {/* Grade Circle */}
                                <div className="grade-circle text-lg">
                                    {getGrade()}
                                </div>
                            </div>
                        )}

                        <Button onClick={handleOpenNew} variant="sticker" className="hidden md:flex gap-2 md:px-6">
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">Tambah Amalan</span>
                        </Button>
                    </div>

                    {/* Today's Progress (Mobile) - Notebook line style */}
                    {totalToday > 0 && (
                        <div className="md:hidden mt-4">
                            <div className="flex items-center justify-between text-sm font-handwriting text-pencil mb-1.5">
                                <span>Progress hari ini</span>
                                <span className="flex items-center gap-2">
                                    {completedToday}/{totalToday}
                                    <span className="grade-circle text-xs w-7 h-7">{getGrade()}</span>
                                </span>
                            </div>
                            <div className="h-3 bg-paper-lines/30 rounded-sm overflow-hidden border-2 border-dashed border-paper-lines">
                                <div
                                    className="h-full bg-doodle-primary transition-all duration-300"
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
                        <div className="font-handwriting text-pencil">Memuat...</div>
                    </div>
                ) : habits.length === 0 ? (
                    /* Empty State - Notebook doodle style */
                    <div className="text-center py-12 md:py-24">
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-sm bg-sticky-yellow shadow-sticky mx-auto mb-6 flex items-center justify-center rotate-2">
                            <Flame className="w-12 h-12 md:w-16 md:h-16 text-orange-600" />
                        </div>
                        <h3 className="font-handwriting text-2xl md:text-3xl text-ink mb-2">
                            Belum ada amalan 📝
                        </h3>
                        <p className="font-handwriting text-base md:text-lg text-pencil mb-6 max-w-sm mx-auto">
                            Yuk mulai bangun kebiasaan baik! Catat progress dan bangun streak untuk tetap semangat.
                        </p>
                        <Button onClick={handleOpenNew} variant="sticker" size="lg" className="gap-2">
                            <Sparkles className="w-5 h-5" />
                            Buat Amalan Pertama
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Today's Habits */}
                        {todayHabits.length > 0 && (
                            <section>
                                <h2 className="font-handwriting text-lg text-ink mb-4 flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-orange-500 border-2 border-ink/20" />
                                    <span className="underline-squiggle">Hari Ini</span>
                                </h2>
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {todayHabits.map((habit, index) => (
                                        <HabitCard
                                            key={habit.id}
                                            habit={habit}
                                            onToggle={handleToggleAttempt}
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
                                <h2 className="font-handwriting text-lg text-pencil mb-4">
                                    Amalan Lainnya
                                </h2>
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {otherHabits.map((habit, index) => (
                                        <HabitCard
                                            key={habit.id}
                                            habit={habit}
                                            onToggle={handleToggleAttempt}
                                            onEdit={handleEdit}
                                            onDelete={deleteHabit}
                                            index={index + todayHabits.length}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </main>

            {/* FAB for mobile - Pencil button style */}
            <button
                onClick={handleOpenNew}
                className={cn(
                    "fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] right-4 md:hidden",
                    "w-14 h-14 rounded-full flex items-center justify-center",
                    "bg-doodle-primary text-white",
                    "shadow-[2px_2px_0_0_rgba(0,0,0,0.2)]",
                    "border-2 border-ink/20",
                    "hover:scale-105 active:scale-95 transition-transform duration-150",
                    "will-change-transform z-40"
                )}
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

            {/* Completion Note Modal */}
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

export default HabitsScreen;
