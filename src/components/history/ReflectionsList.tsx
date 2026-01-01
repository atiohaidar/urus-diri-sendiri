import { Reflection } from '@/lib/storage';
import { formatDate } from '@/lib/time-utils';
import { useLanguage } from '@/i18n/LanguageContext';
import { LazyImage } from '@/components/history/LazyImage';
import { Button } from '@/components/ui/button';
import { Rocket, CheckCircle2, Circle, Trophy, Construction, Sprout, ImageIcon, ExternalLink, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, memo } from 'react';
import { Virtuoso } from 'react-virtuoso';

interface ReflectionsListProps {
    reflections: Reflection[];
    onLoadMore?: () => void;
    hasMore?: boolean;
}

// Memoized Card Component for performance
const ReflectionCard = memo(({ reflection, index }: { reflection: Reflection, index: number }) => {
    const { t } = useLanguage();
    const [expanded, setExpanded] = useState(false);

    return (
        <div
            className="bg-card rounded-3xl card-elevated overflow-hidden hover:shadow-lg transition-shadow duration-300 border border-border/40 mb-4"
        >
            {/* Header */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full p-4 flex items-center justify-between text-left"
            >
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-muted-foreground">
                            {formatDate(reflection.date)}
                        </p>
                        {/* Achievement Badge (Summary) */}
                        {(reflection.todayRoutines || reflection.todayPriorities) && (
                            <div className="flex items-center gap-2">
                                {reflection.todayPriorities && (
                                    <span className="flex items-center gap-1 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-md font-bold">
                                        <Rocket className="w-2.5 h-2.5" />
                                        {reflection.todayPriorities.filter(p => p.completed).length}/{reflection.todayPriorities.length}
                                    </span>
                                )}
                                {reflection.todayRoutines && (
                                    <span className="flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded-md font-bold">
                                        <CheckCircle2 className="w-2.5 h-2.5" />
                                        {reflection.todayRoutines.filter(r => r.completedAt).length}/{reflection.todayRoutines.length}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                    <p className="font-semibold text-foreground line-clamp-1">
                        {reflection.winOfDay || t.history.evening_reflection}
                    </p>
                </div>
                <div className="ml-2">
                    {expanded ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                </div>
            </button>

            {/* Expanded Content */}
            {expanded && (
                <div className="px-4 pb-4 space-y-4 border-t border-border pt-4 animate-in slide-in-from-top-2 duration-200">
                    {reflection.winOfDay && (
                        <div>
                            <p className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1">
                                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                                {t.history.win_of_day}
                            </p>
                            <p className="text-sm text-foreground">{reflection.winOfDay}</p>
                        </div>
                    )}

                    {reflection.hurdle && (
                        <div>
                            <p className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1">
                                <Construction className="w-3.5 h-3.5 text-orange-500" />
                                {t.history.hurdle}
                            </p>
                            <p className="text-sm text-foreground">{reflection.hurdle}</p>
                        </div>
                    )}

                    {reflection.priorities.some(p => p.trim()) && (
                        <div>
                            <p className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-2">
                                <Rocket className="w-3.5 h-3.5 text-primary" />
                                {t.history.priorities_set}
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {reflection.priorities.filter(p => p.trim()).map((priority, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm text-foreground">
                                        <span className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold text-primary">
                                            {i + 1}
                                        </span>
                                        {priority}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {reflection.smallChange && (
                        <div>
                            <p className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1">
                                <Sprout className="w-3.5 h-3.5 text-emerald-500" />
                                {t.history.small_change}
                            </p>
                            <p className="text-sm text-foreground">{reflection.smallChange}</p>
                        </div>
                    )}

                    {((reflection.imageIds?.length || 0) > 0 || (reflection.images?.length || 0) > 0) && (
                        <div>
                            <p className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-2">
                                <ImageIcon className="w-3.5 h-3.5 text-pink-500" />
                                {t.history.daily_photos}
                            </p>
                            <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
                                {/* New IDB Images */}
                                {reflection.imageIds?.map((id) => (
                                    <div key={id} className="flex-shrink-0 w-32 h-32 rounded-2xl overflow-hidden shadow-sm border border-border/50">
                                        <LazyImage imageId={id} className="w-full h-full object-cover" />
                                    </div>
                                ))}

                                {/* Cloud/Drive Links */}
                                {reflection.images?.map((img, i) => (
                                    <a
                                        key={i}
                                        href={img}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-shrink-0 w-32 h-32 rounded-2xl bg-secondary/30 border border-border/50 flex flex-col items-center justify-center gap-2 hover:bg-secondary/50 transition-colors group p-3 text-center"
                                    >
                                        <div className="p-2 rounded-full bg-background/50 group-hover:scale-110 transition-transform">
                                            <ExternalLink className="w-5 h-5 text-primary" />
                                        </div>
                                        <span className="text-[10px] font-medium text-muted-foreground line-clamp-2">
                                            {img.includes('drive.google.com') ? 'Buka Google Drive' : `Foto ${i + 1}`}
                                        </span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Snapshot: Today's Achievement */}
                    <div className="pt-4 border-t border-border space-y-4">
                        {reflection.todayPriorities && reflection.todayPriorities.length > 0 && (
                            <div>
                                <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-2">
                                    Status Prioritas Hari Ini
                                </p>
                                <div className="space-y-1.5">
                                    {reflection.todayPriorities.map((p) => (
                                        <div key={p.id} className="flex items-center justify-between p-2 rounded-xl bg-secondary/20 text-xs">
                                            <span className={cn(p.completed ? "text-foreground font-medium" : "text-muted-foreground/70")}>
                                                {p.text}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                {p.updatedAt && p.completed && (
                                                    <span className="text-[9px] text-muted-foreground">
                                                        {new Date(p.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                )}
                                                {p.completed ? (
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                                ) : (
                                                    <Circle className="w-3.5 h-3.5 text-muted-foreground/30" />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {reflection.todayRoutines && reflection.todayRoutines.length > 0 && (
                            <div>
                                <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-2">
                                    Log Rutinitas Harian
                                </p>
                                <div className="grid grid-cols-1 gap-1.5">
                                    {reflection.todayRoutines.map((r) => (
                                        <div key={r.id} className="flex items-center justify-between p-2 rounded-xl bg-muted/30 text-xs">
                                            <div className="flex flex-col">
                                                <span className={cn(r.completedAt ? "text-foreground font-medium" : "text-muted-foreground/70")}>
                                                    {r.activity}
                                                </span>
                                                <span className="text-[9px] text-muted-foreground">
                                                    {r.startTime} - {r.endTime}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {r.updatedAt && r.completedAt && (
                                                    <span className="text-[9px] text-muted-foreground">
                                                        {new Date(r.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                )}
                                                {r.completedAt ? (
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                                ) : (
                                                    <Circle className="w-3.5 h-3.5 text-muted-foreground/30" />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
});

export const ReflectionsList = ({ reflections, onLoadMore, hasMore }: ReflectionsListProps) => {
    const { t } = useLanguage();

    if (reflections.length === 0) return null;

    return (
        <Virtuoso
            useWindowScroll
            data={reflections}
            endReached={onLoadMore}
            itemContent={(index, reflection) => (
                <div className="pb-2">
                    <ReflectionCard reflection={reflection} index={index} />
                </div>
            )}
            style={{ margin: 0 }}
            components={{
                Footer: () => hasMore ? (
                    <div className="py-8 flex justify-center">
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled
                            className="animate-pulse text-muted-foreground"
                        >
                            Loading more...
                        </Button>
                    </div>
                ) : <div className="pb-24" /> // Spacing for FAB
            }}
        />
    );
};
