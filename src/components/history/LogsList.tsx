import { ActivityLog } from '@/lib/storage';
import { LazyImage } from '@/components/history/LazyImage';
import { Camera, Trash2, StickyNote } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Virtuoso } from 'react-virtuoso';
import { memo } from 'react';

interface LogsListProps {
    logs: ActivityLog[];
    onDeleteLog: (id: string) => void;
}

// Optimized LogItem without framer-motion - uses CSS animations instead
const LogItem = memo(({ log, onDeleteLog, index }: { log: ActivityLog; onDeleteLog: (id: string) => void; index: number }) => {
    return (
        <div
            className="relative pl-6 md:pl-8 group pb-6 animate-in fade-in slide-in-from-left-2 duration-200"
            style={{ animationDelay: `${Math.min(index * 30, 150)}ms` }}
        >
            {/* Timeline Dot - Hand-drawn style */}
            <div className={cn(
                "absolute -left-[9px] top-0 w-4 h-4 border-4 border-paper",
                "rounded-full",
                log.type === 'photo' ? "bg-sticky-pink" : "bg-sticky-green"
            )} />

            {/* Time Label */}
            <div className="text-xs font-handwriting text-pencil mb-2 flex items-center gap-2">
                [ {new Date(log.timestamp).toLocaleDateString([], { weekday: 'short', day: 'numeric' })}
                <span>•</span>
                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ]
            </div>

            {/* Card Content - Notebook paper style */}
            <div className={cn(
                "bg-card rounded-sm overflow-hidden",
                "border-2 shadow-notebook",
                "hover:shadow-notebook-hover transition-shadow duration-150"
            )}>
                {/* Image Content */}
                {log.mediaId && (
                    <div className="w-full aspect-video bg-paper-lines/20 relative">
                        <LazyImage imageId={log.mediaId} className="w-full h-full object-cover" />
                        <div className="absolute top-2 right-2 bg-sticky-pink/90 rounded-sm p-1.5 shadow-tape -rotate-3">
                            <Camera className="w-3 h-3 text-ink" />
                        </div>
                    </div>
                )}

                {/* Text Content */}
                <div className="p-4">
                    {log.content && (
                        <p className={cn(
                            "font-handwriting text-ink",
                            log.mediaId ? "text-base" : "text-lg"
                        )}>
                            {log.content}
                        </p>
                    )}

                    {/* Tags & Action */}
                    <div className="flex items-center justify-between mt-3">
                        <div className="flex gap-2">
                            {log.category && (
                                <span className="text-xs px-2 py-0.5 rounded-sm bg-sticky-yellow/50 text-ink font-handwriting shadow-tape -rotate-1">
                                    {log.category}
                                </span>
                            )}
                        </div>
                        <button
                            onClick={() => onDeleteLog(log.id)}
                            className="p-1.5 text-pencil hover:text-doodle-red opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
});

LogItem.displayName = "LogItem";

export const LogsList = ({ logs, onDeleteLog }: LogsListProps) => {
    if (logs.length === 0) {
        return (
            <div className="text-center py-12 ml-[-12px]">
                <div className="w-16 h-16 rounded-sm bg-sticky-blue shadow-sticky mx-auto mb-4 flex items-center justify-center rotate-2">
                    <StickyNote className="w-8 h-8 text-ink" />
                </div>
                <p className="font-handwriting text-lg text-ink mb-1">Belum ada log 📝</p>
                <p className="font-handwriting text-sm text-pencil">Tap + untuk menangkap momen!</p>
            </div>
        );
    }

    return (
        <div className="relative border-l-2 border-dashed border-paper-lines ml-3 md:ml-6">
            <Virtuoso
                useWindowScroll
                data={logs}
                itemContent={(index, log) => (
                    <LogItem
                        key={log.id}
                        log={log}
                        onDeleteLog={onDeleteLog}
                        index={index}
                    />
                )}
                // Add some padding at the bottom of the list for FAB
                components={{
                    Footer: () => <div className="h-24" />
                }}
            />
        </div>
    );
};
