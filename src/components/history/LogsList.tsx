import { ActivityLog } from '@/lib/storage';
import { LazyImage } from '@/components/history/LazyImage';
import { Camera, Trash2, StickyNote } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogsListProps {
    logs: ActivityLog[];
    onDeleteLog: (id: string) => void;
}

export const LogsList = ({ logs, onDeleteLog }: LogsListProps) => {
    return (
        <div className="relative border-l-2 border-border/60 ml-3 md:ml-6 space-y-8 pb-12">
            {logs.length > 0 ? logs.map((log) => (
                <div key={log.id} className="relative pl-6 md:pl-8 group">
                    {/* Timeline Dot */}
                    <div className={cn(
                        "absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 border-background",
                        log.type === 'photo' ? "bg-indigo-500" : "bg-emerald-500"
                    )} />

                    {/* Time Label */}
                    <div className="text-[10px] font-bold text-muted-foreground mb-2 flex items-center gap-2">
                        {new Date(log.timestamp).toLocaleDateString([], { weekday: 'short', day: 'numeric' })}
                        <span>•</span>
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>

                    {/* Card Content */}
                    <div className="bg-card rounded-2xl overflow-hidden card-elevated border border-border/50 hover:shadow-md transition-shadow">
                        {/* Image Content */}
                        {log.mediaId && (
                            <div className="w-full aspect-video bg-secondary/30 relative">
                                <LazyImage imageId={log.mediaId} className="w-full h-full object-cover" />
                                <div className="absolute top-2 right-2 bg-black/40 backdrop-blur rounded-full p-1.5 text-white">
                                    <Camera className="w-3 h-3" />
                                </div>
                            </div>
                        )}

                        {/* Text Content */}
                        <div className="p-4">
                            {log.content && (
                                <p className={cn("text-foreground", log.mediaId ? "text-sm" : "text-base font-medium")}>
                                    {log.content}
                                </p>
                            )}

                            {/* Tags & Action */}
                            <div className="flex items-center justify-between mt-3">
                                <div className="flex gap-2">
                                    {log.category && (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium border border-border">
                                            {log.category}
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => onDeleteLog(log.id)}
                                    className="p-1.5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )) : (
                <div className="text-center py-12 ml-[-12px]">
                    <div className="w-12 h-12 rounded-full bg-secondary mx-auto mb-4 flex items-center justify-center">
                        <StickyNote className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground text-sm">No logs yet. Tap + to capture a moment!</p>
                </div>
            )}
        </div>
    );
};
