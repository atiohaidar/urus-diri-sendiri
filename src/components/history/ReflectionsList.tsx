import { Reflection } from '@/lib/storage';
import { formatDate } from '@/lib/time-utils';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { LazyImage } from '@/components/history/LazyImage';
import { Button } from '@/components/ui/button';
import { Rocket, CheckCircle2, Trophy, Construction, Sprout, ImageIcon, ExternalLink, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, memo } from 'react';
import { Virtuoso } from 'react-virtuoso';

interface ReflectionsListProps {
    reflections: Reflection[];
    onLoadMore?: () => void;
    hasMore?: boolean;
}

// Sticky note colors based on index
const cardColors = [
    { bg: 'bg-sticky-yellow', border: 'border-sticky-yellow/50' },
    { bg: 'bg-sticky-pink', border: 'border-sticky-pink/50' },
    { bg: 'bg-sticky-blue', border: 'border-sticky-blue/50' },
    { bg: 'bg-sticky-green', border: 'border-sticky-green/50' },
];

// Memoized Card Component for performance
const ReflectionCard = memo(({ reflection, index }: { reflection: Reflection, index: number }) => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [expanded, setExpanded] = useState(false);
    const colorIndex = index % cardColors.length;

    return (
        <div
            className={cn(
                "rounded-sm overflow-hidden font-handwriting mb-4",
                "bg-card border-2 shadow-notebook",
                "hover:shadow-notebook-hover transition-shadow duration-150"
            )}
        >
            {/* Header */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full p-4 flex items-center justify-between text-left"
            >
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-handwriting text-pencil">
                            [ {formatDate(reflection.date)} ]
                        </p>
                        {/* Achievement Badge (Summary) */}
                        {(reflection.todayRoutines || reflection.todayPriorities) && (
                            <div className="flex items-center gap-2">
                                {reflection.todayPriorities && reflection.todayPriorities.length > 0 && (
                                    <span className={cn(
                                        "flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-sm font-handwriting",
                                        "bg-sticky-yellow text-ink shadow-tape"
                                    )}>
                                        <Rocket className="w-2.5 h-2.5" />
                                        {Math.min(reflection.todayPriorities.filter(p => p.completed).length, reflection.todayPriorities.length)}/{reflection.todayPriorities.length}
                                    </span>
                                )}
                                {reflection.todayRoutines && reflection.todayRoutines.length > 0 && (
                                    <span className={cn(
                                        "flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-sm font-handwriting",
                                        "bg-sticky-green text-ink shadow-tape"
                                    )}>
                                        <CheckCircle2 className="w-2.5 h-2.5" />
                                        {Math.min(reflection.todayRoutines.filter(r => r.completedAt).length, reflection.todayRoutines.length)}/{reflection.todayRoutines.length}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                    <p className="font-handwriting text-lg text-ink line-clamp-1">
                        {reflection.winOfDay || t.history.evening_reflection}
                    </p>
                </div>
                <div className="ml-2">
                    {expanded ? (
                        <ChevronUp className="w-5 h-5 text-pencil" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-pencil" />
                    )}
                </div>
            </button>

            {/* Expanded Content */}
            {expanded && (
                <div className="px-4 pb-4 space-y-4 border-t-2 border-dashed border-paper-lines pt-4">
                    {reflection.winOfDay && (
                        <div>
                            <p className="flex items-center gap-2 text-xs font-handwriting text-pencil mb-1">
                                <Trophy className="w-3.5 h-3.5 text-sticky-yellow" />
                                {t.history.win_of_day}
                            </p>
                            <p className="text-base font-handwriting text-ink">{reflection.winOfDay}</p>
                        </div>
                    )}

                    {reflection.hurdle && (
                        <div>
                            <p className="flex items-center gap-2 text-xs font-handwriting text-pencil mb-1">
                                <Construction className="w-3.5 h-3.5 text-orange-500" />
                                {t.history.hurdle}
                            </p>
                            <p className="text-base font-handwriting text-ink">{reflection.hurdle}</p>
                        </div>
                    )}

                    {reflection.priorities.some(p => p.trim()) && (
                        <div>
                            <p className="flex items-center gap-2 text-xs font-handwriting text-pencil mb-2">
                                <Rocket className="w-3.5 h-3.5 text-doodle-primary" />
                                {t.history.priorities_set}
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {reflection.priorities.filter(p => p.trim()).map((priority, i) => (
                                    <div key={i} className="flex items-center gap-2 font-handwriting text-ink">
                                        <span className="w-6 h-6 rounded-full border-2 border-dashed border-doodle-primary flex items-center justify-center text-sm font-handwriting text-doodle-primary">
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
                            <p className="flex items-center gap-2 text-xs font-handwriting text-pencil mb-1">
                                <Sprout className="w-3.5 h-3.5 text-doodle-green" />
                                {t.history.small_change}
                            </p>
                            <p className="text-base font-handwriting text-ink">{reflection.smallChange}</p>
                        </div>
                    )}

                    {((reflection.imageIds?.length || 0) > 0 || (reflection.images?.length || 0) > 0) && (
                        <div>
                            <p className="flex items-center gap-2 text-xs font-handwriting text-pencil mb-2">
                                <ImageIcon className="w-3.5 h-3.5 text-sticky-pink" />
                                {t.history.daily_photos}
                            </p>
                            <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
                                {/* New IDB Images */}
                                {reflection.imageIds?.map((id) => (
                                    <div key={id} className="flex-shrink-0 w-28 h-28 rounded-sm overflow-hidden shadow-notebook border-2 border-paper-lines">
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
                                        className={cn(
                                            "flex-shrink-0 w-28 h-28 rounded-sm flex flex-col items-center justify-center gap-2 p-3 text-center",
                                            "bg-sticky-blue/20 border-2 border-dashed border-sticky-blue/50",
                                            "hover:bg-sticky-blue/30 transition-colors group"
                                        )}
                                    >
                                        <div className="p-2 rounded-sm bg-paper group-hover:scale-110 transition-transform">
                                            <ExternalLink className="w-5 h-5 text-doodle-primary" />
                                        </div>
                                        <span className="text-[10px] font-handwriting text-pencil line-clamp-2">
                                            {img.includes('drive.google.com') ? 'Buka Drive' : `Foto ${i + 1}`}
                                        </span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* View Detail Button */}
                    <div className="pt-4 border-t-2 border-dashed border-paper-lines mt-2">
                        <Button
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/reflection/${reflection.id}`);
                            }}
                            variant="outline"
                            className="w-full h-11 rounded-sm gap-2 font-handwriting border-2 border-dashed border-doodle-primary text-doodle-primary hover:bg-doodle-primary/10"
                        >
                            {t.history.view_detail}
                            <ExternalLink className="w-4 h-4" />
                        </Button>
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
                        <span className="font-handwriting text-pencil">
                            Memuat lebih banyak...
                        </span>
                    </div>
                ) : <div className="pb-24" /> // Spacing for FAB
            }}
        />
    );
};
