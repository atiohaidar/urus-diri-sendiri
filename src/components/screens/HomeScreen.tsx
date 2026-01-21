import { useRoutines } from '@/hooks/useRoutines'; // Hook khusus buat ambil data aktivitas harian
import { useHabits } from '@/hooks/useHabits'; // Hook khusus buat data kebiasaan (habits) 
import { HomeHeader } from '@/components/home/HomeHeader';
import { HomeRoutineSection } from '@/components/home/HomeRoutineSection';
import { HomePrioritySection } from '@/components/home/HomePrioritySection';
import { CheckInButton } from '@/components/home/CheckInButton';
import { GoogleSearchWidget } from '@/components/home/GoogleSearchWidget';
import HabitCard from '@/components/habits/HabitCard';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Flame, Star } from 'lucide-react';
import HabitCompletionModal from '@/components/habits/HabitCompletionModal';
import { useState } from 'react';
import { Habit } from '@/lib/types';
import { triggerHaptic } from '@/lib/haptics';
import { useLanguage } from '@/i18n/LanguageContext';

/**
 * HOME SCREEN: Halaman utama yang kamu lihat pertama kali.
 * Fungsinya seperti "Dashboard" atau "Meja Belajar" kamu.
 */
const HomeScreen = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  // --- 1. AMBIL DATA DARI MESIN (HOOKS) ---
  // Kita panggil si 'Asisten' (useRoutines & useHabits) buat lapor data terbaru
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
    handleUpdatePriorityText,
    handleUpdatePrioritySchedule
  } = useRoutines();

  const {
    todayHabits,
    habits,
    toggleCompletion,
  } = useHabits();

  // State lokal buat ngatur pop-up "Habit Berhasil!"
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [completingHabit, setCompletingHabit] = useState<Habit | null>(null);

  // Fungsi pas kamu klik centang di Habit
  const handleToggleAttempt = (habitId: string) => {
    triggerHaptic(); // Getaran kecil di HP biar kerasa nyata
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    if (habit.isCompletedToday) {
      // Kalau udah centang, diklik lagi berarti batalin centang
      toggleCompletion(habitId);
    } else {
      // Kalau belum, tampilin pop-up buat kasih catatan/selebrasi
      setCompletingHabit(habit);
      setIsCompletionModalOpen(true);
    }
  };

  const handleRedirectToHabits = () => navigate('/habits');

  return (
    <div className="pb-24 md:pb-8 bg-notebook">
      {/* Header Halaman: Menampilkan tanggal dan sapaan */}
      <HomeHeader
        currentDate={currentDate}
        isLoading={isRoutineLoading}
        onRefresh={refreshData}
        routines={routines}
        priorities={priorities}
      />

      {/* 
          LAYOUT GRID (HP vs DESKTOP):
          - 'md:grid-cols-2': Di laptop, layar dibagi 2 kolom kiri & kanan.
          - 'space-y-8': Di HP, semua elemen menumpuk ke bawah dengan jarak.
      */}
      <main className="container px-4 py-6 md:py-8 space-y-8 md:space-y-0 md:grid md:grid-cols-2 md:gap-8 md:max-w-7xl">

        {/* --- KOLOM KIRI --- */}
        <div className="md:col-span-1 space-y-8">

          {/* Tombol Check-In (Maghrib/Daily): Cuma muncul di HP di posisi atas */}
          <CheckInButton variant="mobile" currentDate={currentDate} />

          {/* Kotak Pencarian Google: Cuma muncul di Laptop biar ngebantu produktivitas */}
          <div className="hidden md:block">
            <GoogleSearchWidget />
          </div>

          {/* Bagian Habits Hari Ini */}
          {todayHabits.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-handwriting text-xl text-ink flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  <span className="underline-squiggle">{t.home.todays_habits}</span>
                  <Star className="w-4 h-4 text-sticky-yellow fill-sticky-yellow" />
                </h2>
                <Button variant="ghost" size="sm" onClick={handleRedirectToHabits} className="gap-1 text-xs text-pencil font-handwriting">
                  {t.home.view_all} <ArrowRight className="w-3 h-3" />
                </Button>
              </div>

              {/* Geser Horizontal di HP, tapi jadi Baris (Grid) di Laptop */}
              <div className="flex overflow-x-auto pb-4 gap-3 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-2 md:overflow-visible md:pb-0 scrollbar-hide">
                {todayHabits.map((habit, index) => (
                  <div key={habit.id} className="min-w-[260px] md:min-w-0">
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

          {/* Daftar Rutinitas Harian (Jadwal) */}
          <HomeRoutineSection
            routines={routines}
            isLoading={isRoutineLoading}
            activeIndex={activeIndex}
            currentDate={currentDate}
            onCheckIn={handleCheckIn}
          />

          {/* Daftar Prioritas: Cuma muncul di kolom kiri kalau di HP */}
          <HomePrioritySection
            priorities={priorities}
            onToggle={handleTogglePriority}
            onDelete={handleDeletePriority}
            onUpdate={handleUpdatePriorityText}
            onUpdateSchedule={handleUpdatePrioritySchedule}
            onAdd={handleAddPriority}
            variant="mobile"
            className="md:hidden"
          />
        </div>

        {/* --- KOLOM KANAN (Hanya muncul di Laptop) --- */}
        <div className="hidden md:block md:col-span-1 space-y-8">
          {/* Tombol Check-In versi Laptop: Posisinya di kanan atas */}
          <CheckInButton variant="desktop" currentDate={currentDate} />

          {/* Daftar Prioritas versi Laptop: Posisinya di kanan bawah */}
          <HomePrioritySection
            priorities={priorities}
            onToggle={handleTogglePriority}
            onDelete={handleDeletePriority}
            onUpdate={handleUpdatePriorityText}
            onUpdateSchedule={handleUpdatePrioritySchedule}
            onAdd={handleAddPriority}
            variant="desktop"
          />
        </div>

      </main >

      {/* Pop-up rahasia yang muncul pas Habit dicentang */}
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
