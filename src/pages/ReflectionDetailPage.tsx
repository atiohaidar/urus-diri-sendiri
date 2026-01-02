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
    Calendar
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
            <div className="min-h-screen flex items-center justify-center">
                <p className="animate-pulse text-muted-foreground">{t.common.loading}</p>
            </div>
        );
    }

    if (!reflection) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
                <h2 className="text-xl font-bold mb-4">Reflection not found</h2>
                <Button onClick={() => navigate('/history')}>{t.common.back}</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-12 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 pt-safe">
                <div className="container max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
                        <ArrowLeft className="w-6 h-6" />
                    </Button>
                    <div>
                        <h1 className="font-bold text-lg">{t.history.evening_reflection}</h1>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(reflection.date)}
                        </p>
                    </div>
                </div>
            </header>

            <main className="container max-w-2xl mx-auto px-4 py-8 space-y-8">
                {/* Win of the Day */}
                <section className="space-y-3">
                    <h2 className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-wider">
                        <Trophy className="w-5 h-5 text-amber-500" />
                        {t.history.win_of_day}
                    </h2>
                    <div className="bg-card p-6 rounded-3xl card-elevated border border-border/40">
                        <p className="text-lg font-medium leading-relaxed italic text-foreground">
                            "{reflection.winOfDay || '---'}"
                        </p>
                    </div>
                </section>

                {/* Hurdle */}
                <section className="space-y-3">
                    <h2 className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-wider">
                        <Construction className="w-5 h-5 text-orange-500" />
                        {t.history.hurdle}
                    </h2>
                    <div className="bg-card p-6 rounded-3xl card-elevated border border-border/40">
                        <p className="text-foreground">{reflection.hurdle || '---'}</p>
                    </div>
                </section>

                {/* Priorities Set */}
                <section className="space-y-3">
                    <h2 className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-wider">
                        <Rocket className="w-5 h-5 text-primary" />
                        {t.history.priorities_set}
                    </h2>
                    <div className="space-y-3">
                        {reflection.priorities.map((p, i) => (
                            <div key={i} className="flex items-center gap-4 bg-card p-4 rounded-2xl card-elevated border border-border/40">
                                <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                                    {i + 1}
                                </span>
                                <span className="text-foreground font-medium">{p}</span>
                            </div>
                        ))}
                        {reflection.priorities.length === 0 && <p className="text-muted-foreground italic pl-2">No priorities set.</p>}
                    </div>
                </section>

                {/* Small Change */}
                <section className="space-y-3">
                    <h2 className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-wider">
                        <Sprout className="w-5 h-5 text-emerald-500" />
                        {t.history.small_change}
                    </h2>
                    <div className="bg-card p-6 rounded-3xl card-elevated border border-border/40">
                        <p className="text-foreground">{reflection.smallChange || '---'}</p>
                    </div>
                </section>

                {/* Photos */}
                {((reflection.imageIds?.length || 0) > 0 || (reflection.images?.length || 0) > 0) && (
                    <section className="space-y-3">
                        <h2 className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-wider">
                            <ImageIcon className="w-5 h-5 text-pink-500" />
                            {t.history.daily_photos}
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            {reflection.imageIds?.map((id) => (
                                <div key={id} className="aspect-square rounded-3xl overflow-hidden shadow-sm border border-border/50">
                                    <LazyImage imageId={id} className="w-full h-full object-cover" />
                                </div>
                            ))}
                            {reflection.images?.map((img, i) => (
                                <a
                                    key={i}
                                    href={img}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="aspect-square rounded-3xl bg-secondary/30 border border-border/50 flex flex-col items-center justify-center gap-2 hover:bg-secondary/50 transition-colors group p-4 text-center"
                                >
                                    <ExternalLink className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
                                    <span className="text-xs font-medium text-muted-foreground">View Drive Link</span>
                                </a>
                            ))}
                        </div>
                    </section>
                )}

                {/* Technical Snapshots (TECHNICAL DETAIL) */}
                <div className="pt-8 border-t border-border space-y-8">
                    {/* Routine Log */}
                    {reflection.todayRoutines && reflection.todayRoutines.length > 0 && (
                        <section className="space-y-3">
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                                Detailed Routine Log
                            </h2>
                            <div className="space-y-2">
                                {reflection.todayRoutines.map((r) => (
                                    <div key={r.id} className="p-4 rounded-2xl bg-muted/20 border border-border/30">
                                        <div className="flex items-center justify-between mb-2 last:mb-0">
                                            <div className="flex flex-col">
                                                <span className={cn("font-semibold", r.completedAt ? "text-foreground" : "text-muted-foreground/50")}>
                                                    {r.activity}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {r.startTime} - {r.endTime}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {r.updatedAt && r.completedAt && (
                                                    <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full font-bold">
                                                        {new Date(r.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                )}
                                                {r.completedAt ? (
                                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                                ) : (
                                                    <Circle className="w-5 h-5 text-muted-foreground/20" />
                                                )}
                                            </div>
                                        </div>
                                        {r.completionNote && (
                                            <div className="mt-2 text-xs text-muted-foreground bg-background/50 p-2 rounded-lg italic border border-border/20">
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
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                                Priority Status Snapshot
                            </h2>
                            <div className="space-y-2">
                                {reflection.todayPriorities.map((p) => (
                                    <div key={p.id} className="p-4 rounded-2xl bg-secondary/10 border border-border/30">
                                        <div className="flex items-center justify-between mb-2 last:mb-0">
                                            <span className={cn("font-medium text-sm", p.completed ? "text-foreground" : "text-muted-foreground/60")}>
                                                {p.text}
                                            </span>
                                            <div className="flex items-center gap-3">
                                                {p.completed ? (
                                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                                ) : (
                                                    <Circle className="w-5 h-5 text-muted-foreground/20" />
                                                )}
                                            </div>
                                        </div>
                                        {p.completionNote && (
                                            <div className="mt-2 text-xs text-muted-foreground bg-background/50 p-2 rounded-lg italic border border-border/20">
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
