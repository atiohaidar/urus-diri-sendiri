import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Trophy,
    Construction,
    Rocket,
    Sprout,
    ImageIcon,
    ExternalLink,
    CheckCircle2,
    Circle,
    Calendar,
    PenLine
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';
import { getReflectionsAsync, Reflection, initializeStorage } from '@/lib/storage';
import { LazyImage } from '@/components/history/LazyImage';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/time-utils';

const ReflectionDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [reflection, setReflection] = useState<Reflection | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadReflection = async () => {
            setLoading(true);
            await initializeStorage();
            const reflections = await getReflectionsAsync();
            const found = reflections.find(r => r.id === id);
            setReflection(found || null);
            setLoading(false);
        };
        loadReflection();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-notebook flex items-center justify-center">
                <div className="w-12 h-12 bg-sticky-yellow shadow-sticky rounded-sm flex items-center justify-center animate-pulse">
                    <PenLine className="w-6 h-6 text-ink" />
                </div>
            </div>
        );
    }

    if (!reflection) {
        return (
            <div className="min-h-screen bg-notebook flex flex-col items-center justify-center p-4 text-center">
                <div className="w-16 h-16 bg-sticky-pink shadow-sticky rounded-sm flex items-center justify-center mb-4 -rotate-3">
                    <PenLine className="w-8 h-8 text-ink" />
                </div>
                <h2 className="font-handwriting text-xl text-ink mb-4">Refleksi tidak ditemukan 📝</h2>
                <Button onClick={() => navigate('/history')} className="font-handwriting rounded-sm">{t.common.back}</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-notebook pb-12">
            {/* Header - Notebook style */}
            <header className="sticky top-0 z-40 bg-paper border-b-2 border-dashed border-paper-lines pt-safe">
                <div className="container max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(-1)}
                        className="rounded-sm bg-sticky-yellow shadow-tape -rotate-3"
                    >
                        <ArrowLeft className="w-6 h-6 text-ink" />
                    </Button>
                    <div>
                        <h1 className="font-handwriting text-xl text-ink">{t.history.evening_reflection} 🌙</h1>
                        <p className="text-xs font-handwriting text-pencil flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            [ {formatDate(reflection.date)} ]
                        </p>
                    </div>
                </div>
            </header>

            <main className="container max-w-2xl mx-auto px-4 py-8 space-y-8">
                {/* Win of the Day */}
                <section className="space-y-3">
                    <h2 className="flex items-center gap-2 font-handwriting text-sm text-pencil">
                        <Trophy className="w-5 h-5 text-sticky-yellow" />
                        {t.history.win_of_day}
                    </h2>
                    <div className="bg-card p-6 rounded-sm border-2 border-paper-lines/50 shadow-notebook">
                        <p className="font-handwriting text-lg text-ink italic">
                            "{reflection.winOfDay || '---'}"
                        </p>
                    </div>
                </section>

                {/* Hurdle */}
                <section className="space-y-3">
                    <h2 className="flex items-center gap-2 font-handwriting text-sm text-pencil">
                        <Construction className="w-5 h-5 text-orange-500" />
                        {t.history.hurdle}
                    </h2>
                    <div className="bg-card p-6 rounded-sm border-2 border-paper-lines/50 shadow-notebook">
                        <p className="font-handwriting text-base text-ink">{reflection.hurdle || '---'}</p>
                    </div>
                </section>

                {/* Priorities Set */}
                <section className="space-y-3">
                    <h2 className="flex items-center gap-2 font-handwriting text-sm text-pencil">
                        <Rocket className="w-5 h-5 text-doodle-primary" />
                        {t.history.priorities_set}
                    </h2>
                    <div className="space-y-3">
                        {reflection.priorities.map((p, i) => (
                            <div key={i} className="flex items-center gap-4 bg-card p-4 rounded-sm border-2 border-paper-lines/50 shadow-notebook">
                                <span className="w-8 h-8 rounded-full border-2 border-dashed border-doodle-primary flex items-center justify-center font-handwriting text-doodle-primary shrink-0">
                                    {i + 1}
                                </span>
                                <span className="font-handwriting text-ink">{p}</span>
                            </div>
                        ))}
                        {reflection.priorities.length === 0 && (
                            <p className="font-handwriting text-pencil italic pl-2">Tidak ada prioritas yang ditetapkan.</p>
                        )}
                    </div>
                </section>

                {/* Small Change */}
                <section className="space-y-3">
                    <h2 className="flex items-center gap-2 font-handwriting text-sm text-pencil">
                        <Sprout className="w-5 h-5 text-doodle-green" />
                        {t.history.small_change}
                    </h2>
                    <div className="bg-card p-6 rounded-sm border-2 border-paper-lines/50 shadow-notebook">
                        <p className="font-handwriting text-base text-ink">{reflection.smallChange || '---'}</p>
                    </div>
                </section>

                {/* Photos */}
                {((reflection.imageIds?.length || 0) > 0 || (reflection.images?.length || 0) > 0) && (
                    <section className="space-y-3">
                        <h2 className="flex items-center gap-2 font-handwriting text-sm text-pencil">
                            <ImageIcon className="w-5 h-5 text-sticky-pink" />
                            {t.history.daily_photos}
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            {reflection.imageIds?.map((id) => (
                                <div key={id} className="aspect-square rounded-sm overflow-hidden shadow-notebook border-2 border-paper-lines">
                                    <LazyImage imageId={id} className="w-full h-full object-cover" />
                                </div>
                            ))}
                            {reflection.images?.map((img, i) => (
                                <a
                                    key={i}
                                    href={img}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={cn(
                                        "aspect-square rounded-sm flex flex-col items-center justify-center gap-2 p-4 text-center",
                                        "bg-sticky-blue/20 border-2 border-dashed border-sticky-blue/50",
                                        "hover:bg-sticky-blue/30 transition-colors group"
                                    )}
                                >
                                    <ExternalLink className="w-8 h-8 text-doodle-primary group-hover:scale-110 transition-transform" />
                                    <span className="text-xs font-handwriting text-pencil">Buka Drive</span>
                                </a>
                            ))}
                        </div>
                    </section>
                )}

                {/* Technical Snapshots */}
                <div className="pt-8 border-t-2 border-dashed border-paper-lines space-y-8">
                    {/* Routine Log */}
                    {reflection.todayRoutines && reflection.todayRoutines.length > 0 && (
                        <section className="space-y-3">
                            <h2 className="font-handwriting text-sm text-pencil">
                                📋 Log Rutinitas Hari Ini
                            </h2>
                            <div className="space-y-2">
                                {reflection.todayRoutines.map((r) => (
                                    <div key={r.id} className="p-4 rounded-sm bg-paper-lines/10 border-2 border-dashed border-paper-lines/50">
                                        <div className="flex items-center justify-between mb-2 last:mb-0">
                                            <div className="flex flex-col">
                                                <span className={cn(
                                                    "font-handwriting",
                                                    r.completedAt ? "text-ink" : "text-pencil/50 line-through"
                                                )}>
                                                    {r.activity}
                                                </span>
                                                <span className="text-xs font-handwriting text-pencil">
                                                    {r.startTime} - {r.endTime}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {r.updatedAt && r.completedAt && (
                                                    <span className="text-xs bg-sticky-green/50 text-ink px-2 py-0.5 rounded-sm font-handwriting">
                                                        {new Date(r.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                )}
                                                {r.completedAt ? (
                                                    <CheckCircle2 className="w-5 h-5 text-doodle-green" />
                                                ) : (
                                                    <Circle className="w-5 h-5 text-pencil/30" />
                                                )}
                                            </div>
                                        </div>
                                        {r.completionNote && (
                                            <div className="mt-2 font-handwriting text-sm text-pencil bg-paper/50 p-2 rounded-sm italic border-2 border-dashed border-paper-lines/30">
                                                "{r.completionNote}"
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Priority Achievements */}
                    {reflection.todayPriorities && reflection.todayPriorities.length > 0 && (
                        <section className="space-y-3">
                            <h2 className="font-handwriting text-sm text-pencil">
                                🎯 Status Prioritas
                            </h2>
                            <div className="space-y-2">
                                {reflection.todayPriorities.map((p) => (
                                    <div key={p.id} className="p-4 rounded-sm bg-sticky-yellow/10 border-2 border-dashed border-sticky-yellow/50">
                                        <div className="flex items-center justify-between mb-2 last:mb-0">
                                            <span className={cn(
                                                "font-handwriting text-sm",
                                                p.completed ? "text-ink" : "text-pencil/50 line-through"
                                            )}>
                                                {p.text}
                                            </span>
                                            <div className="flex items-center gap-3">
                                                {p.completed ? (
                                                    <CheckCircle2 className="w-5 h-5 text-doodle-green" />
                                                ) : (
                                                    <Circle className="w-5 h-5 text-pencil/30" />
                                                )}
                                            </div>
                                        </div>
                                        {p.completionNote && (
                                            <div className="mt-2 font-handwriting text-sm text-pencil bg-paper/50 p-2 rounded-sm italic border-2 border-dashed border-paper-lines/30">
                                                "{p.completionNote}"
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ReflectionDetailPage;
