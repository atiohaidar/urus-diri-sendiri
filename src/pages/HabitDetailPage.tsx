import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, subMonths, addMonths, isToday } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { ArrowLeft, Flame, Calendar, TrendingUp, Target, CheckCircle2, ChevronLeft, ChevronRight, Clock, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/lib/haptics';
import { useState, useEffect, useCallback } from 'react';
import {
    getHabitById,
    getHabitLogsByHabitId,
    calculateStreak,
    calculateLongestStreak,
    calculateCompletionRate,
    getFrequencyText,
    initializeStorage,
    registerListener
} from '@/lib/storage';
import type { Habit, HabitLog } from '@/lib/types';

export default function HabitDetailPage() {
    const { habitId } = useParams<{ habitId: string }>();
    const navigate = useNavigate();

    const [habit, setHabit] = useState<Habit | null>(null);
    const [logs, setLogs] = useState<HabitLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const loadData = useCallback(async () => {
        if (!habitId) return;
        setIsLoading(true);
        try {
            await initializeStorage();
            const habitData = getHabitById(habitId);
            const logsData = getHabitLogsByHabitId(habitId);
            setHabit(habitData || null);
            setLogs(logsData.filter(l => l.completed));
        } finally {
            setIsLoading(false);
        }
    }, [habitId]);

    useEffect(() => {
        loadData();
        const unsubscribe = registerListener(() => loadData());
        return () => { unsubscribe(); };
    }, [loadData]);

    // Statistics
    const stats = useMemo(() => {
        if (!habitId) return null;

        const currentStreak = calculateStreak(habitId);
        const longestStreak = calculateLongestStreak(habitId);

        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 7);
        const weekStats = calculateCompletionRate(habitId, weekStart, now);

        const monthStart = new Date(now);
        monthStart.setDate(now.getDate() - 29); // 29 days ago + today = 30 days total
        const monthStats = calculateCompletionRate(habitId, monthStart, now);

        return {
            currentStreak,
            longestStreak,
            weekStats,
            monthStats,
            totalCompleted: logs.length,
        };
    }, [habitId, logs]);

    // Calendar data
    const calendarDays = useMemo(() => {
        const start = startOfMonth(currentMonth);
        const end = endOfMonth(currentMonth);
        return eachDayOfInterval({ start, end });
    }, [currentMonth]);

    const completedDates = useMemo(() => {
        return new Set(logs.map(l => l.date));
    }, [logs]);

    // Recent logs
    const recentLogs = useMemo(() => {
        return [...logs]
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 20);
    }, [logs]);

    const handleBack = () => {
        triggerHaptic();
        navigate(-1);
    };

    const handlePrevMonth = () => {
        triggerHaptic();
        setCurrentMonth(prev => subMonths(prev, 1));
    };

    const handleNextMonth = () => {
        triggerHaptic();
        setCurrentMonth(prev => addMonths(prev, 1));
    };

    if (isLoading || !habit) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-notebook p-4">
                <Flame className="w-12 h-12 animate-pulse text-doodle-primary mb-4" />
                <p className="font-handwriting text-pencil text-lg">Memuat data...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-notebook flex flex-col transition-colors duration-300">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-paper/95 backdrop-blur-md border-b-2 border-dashed border-paper-lines p-4 shadow-sm">
                <div className="max-w-3xl mx-auto flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleBack}
                        className="rounded-full hover:bg-paper-lines/20"
                    >
                        <ArrowLeft className="w-5 h-5 text-ink" />
                    </Button>
                    <div className="flex-1 min-w-0">
                        <h1 className="font-handwriting text-xl font-bold text-ink flex items-center gap-2 truncate">
                            <span className="text-2xl">{habit.icon || '🔥'}</span>
                            {habit.name}
                        </h1>
                        <p className="font-handwriting text-xs text-pencil">
                            {getFrequencyText(habit)}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20">
                <div className="max-w-3xl mx-auto space-y-6">

                    {/* Stats Cards - Sticky Note Style */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* Current Streak */}
                        <div className="bg-sticky-yellow rounded-sm p-4 shadow-sticky relative rotate-[-1deg] hover:rotate-0 transition-transform">
                            <div className="absolute top-0 right-0 opacity-30">
                                <Flame className="w-12 h-12 text-orange-600/50" />
                            </div>
                            <div className="relative z-10">
                                <p className="text-xs font-handwriting text-ink/70 font-bold mb-1">🔥 Streak Saat Ini</p>
                                <p className="text-3xl font-bold text-ink">{stats?.currentStreak || 0}</p>
                                <p className="text-xs text-ink/60">hari berturut-turut</p>
                            </div>
                        </div>

                        {/* Longest Streak */}
                        <div className="bg-sticky-pink rounded-sm p-4 shadow-sticky relative rotate-[1deg] hover:rotate-0 transition-transform">
                            <div className="absolute top-0 right-0 opacity-30">
                                <TrendingUp className="w-12 h-12 text-pink-600/50" />
                            </div>
                            <div className="relative z-10">
                                <p className="text-xs font-handwriting text-ink/70 font-bold mb-1">🏆 Rekor Terbaik</p>
                                <p className="text-3xl font-bold text-ink">{stats?.longestStreak || 0}</p>
                                <p className="text-xs text-ink/60">hari maksimal</p>
                            </div>
                        </div>

                        {/* Week Completion */}
                        <div className="bg-card border-2 border-dashed border-paper-lines rounded-sm p-4 shadow-notebook">
                            <p className="text-xs font-handwriting text-pencil mb-1">📅 7 Hari Terakhir</p>
                            <p className="text-2xl font-bold text-ink">{stats?.weekStats.rate || 0}%</p>
                            <p className="text-xs text-pencil">
                                {stats?.weekStats.completed}/{stats?.weekStats.total} selesai
                            </p>
                        </div>

                        {/* Target Progress (replacing 30 Days if target exists) */}
                        {habit.targetCount ? (
                            <div className="bg-sticky-green/30 border-2 border-dashed border-sticky-green rounded-sm p-4 shadow-notebook relative overflow-hidden">
                                <div className="absolute -top-1 -right-1 rotate-12">
                                    <span className="bg-doodle-green text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
                                        TARGET
                                    </span>
                                </div>
                                <p className="text-xs font-handwriting text-pencil mb-1">🎯 Progress Target</p>
                                <div className="flex items-end gap-1 mb-2">
                                    <span className="text-2xl font-bold text-doodle-green">{stats?.totalCompleted || 0}</span>
                                    <span className="text-sm text-pencil mb-1">/ {habit.targetCount}</span>
                                </div>
                                <div className="h-2.5 bg-paper rounded-full overflow-hidden border border-dashed border-paper-lines/50">
                                    <div
                                        className="h-full bg-doodle-green transition-all duration-500"
                                        style={{ width: `${Math.min(100, ((stats?.totalCompleted || 0) / habit.targetCount) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        ) : (
                            /* Month Completion (fallback if no target) */
                            <div className="bg-card border-2 border-dashed border-paper-lines rounded-sm p-4 shadow-notebook">
                                <p className="text-xs font-handwriting text-pencil mb-1">📆 30 Hari Terakhir</p>
                                <p className="text-2xl font-bold text-ink">{stats?.monthStats.rate || 0}%</p>
                                <p className="text-xs text-pencil">
                                    {stats?.monthStats.completed}/{stats?.monthStats.total} selesai
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Calendar Heatmap */}
                    <div className="bg-card border-2 border-paper-lines rounded-sm p-5 shadow-notebook">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-handwriting text-lg text-ink flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-doodle-primary" />
                                Kalender Aktivitas
                            </h2>
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-8 w-8">
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <span className="font-handwriting text-sm text-ink min-w-[100px] text-center">
                                    {format(currentMonth, 'MMMM yyyy', { locale: localeId })}
                                </span>
                                <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-8 w-8">
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Day Headers */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
                                <div key={day} className="text-center text-[10px] font-handwriting text-pencil py-1">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1">
                            {/* Empty cells for days before start of month */}
                            {Array.from({ length: calendarDays[0]?.getDay() || 0 }).map((_, i) => (
                                <div key={`empty-${i}`} className="aspect-square" />
                            ))}

                            {calendarDays.map(day => {
                                const dateStr = format(day, 'yyyy-MM-dd');
                                const isCompleted = completedDates.has(dateStr);
                                const isTodayDate = isToday(day);

                                return (
                                    <div
                                        key={dateStr}
                                        className={cn(
                                            "aspect-square rounded-lg flex items-center justify-center text-xs font-handwriting transition-all",
                                            isCompleted && "bg-doodle-green text-white shadow-md",
                                            !isCompleted && "bg-paper-lines/10 text-pencil",
                                            isTodayDate && !isCompleted && "ring-2 ring-doodle-primary ring-offset-2",
                                            isTodayDate && isCompleted && "ring-2 ring-white ring-offset-2 ring-offset-doodle-green"
                                        )}
                                    >
                                        {isCompleted ? (
                                            <CheckCircle2 className="w-4 h-4" />
                                        ) : (
                                            format(day, 'd')
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Legend */}
                        <div className="flex items-center justify-center gap-4 mt-4 text-xs font-handwriting text-pencil">
                            <div className="flex items-center gap-1.5">
                                <div className="w-4 h-4 rounded bg-doodle-green" />
                                <span>Selesai</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-4 h-4 rounded bg-paper-lines/20" />
                                <span>Belum</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-4 h-4 rounded bg-paper-lines/20 ring-2 ring-doodle-primary ring-offset-1" />
                                <span>Hari Ini</span>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity List */}
                    <div className="bg-card border-2 border-paper-lines rounded-sm p-5 shadow-notebook">
                        <h2 className="font-handwriting text-lg text-ink flex items-center gap-2 mb-4">
                            <FileText className="w-5 h-5 text-doodle-primary" />
                            Riwayat Penyelesaian
                        </h2>

                        {recentLogs.length === 0 ? (
                            <div className="text-center py-8 text-pencil font-handwriting">
                                <Target className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                <p>Belum ada riwayat</p>
                                <p className="text-xs opacity-60">Selesaikan habit untuk mulai tracking!</p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-80 overflow-y-auto">
                                {recentLogs.map((log, index) => (
                                    <div
                                        key={log.id}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-xl transition-all",
                                            index === 0 ? "bg-doodle-green/10 border border-doodle-green/30" : "bg-paper/50"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                                            index === 0 ? "bg-doodle-green text-white" : "bg-paper-lines/20 text-pencil"
                                        )}>
                                            <CheckCircle2 className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-handwriting text-ink font-bold">
                                                {format(new Date(log.date), 'EEEE, d MMMM yyyy', { locale: localeId })}
                                            </p>
                                            <div className="flex items-center gap-2 text-xs text-pencil">
                                                <Clock className="w-3 h-3" />
                                                <span>
                                                    {log.completedAt
                                                        ? format(new Date(log.completedAt), 'HH:mm', { locale: localeId })
                                                        : '-'
                                                    }
                                                </span>
                                            </div>
                                            {log.note && (
                                                <p className="text-xs text-pencil italic mt-1 truncate">
                                                    📝 {log.note}
                                                </p>
                                            )}
                                        </div>
                                        {index === 0 && (
                                            <span className="text-[10px] font-bold text-doodle-green bg-doodle-green/10 px-2 py-0.5 rounded-full uppercase">
                                                Terbaru
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Total Summary */}
                    <div className="bg-sticky-yellow/20 border-2 border-dashed border-sticky-yellow/50 rounded-sm p-5 text-center">
                        <p className="font-handwriting text-pencil text-sm mb-1">Total Keseluruhan</p>
                        <p className="font-handwriting text-4xl font-bold text-ink">
                            {stats?.totalCompleted || 0}
                        </p>
                        <p className="font-handwriting text-pencil text-sm">kali diselesaikan 🎉</p>
                    </div>

                </div>
            </div>
        </div>
    );
}
