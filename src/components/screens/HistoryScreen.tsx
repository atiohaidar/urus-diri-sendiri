import { useState } from 'react';
import { Clock, Trophy, Construction, Rocket, Sprout, ChevronDown, ChevronUp, CheckCircle2, Circle, Image as ImageIcon, ExternalLink, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useReflections } from '@/hooks/useReflections';
import { formatDate } from '@/lib/time-utils';
import { useLanguage } from '@/i18n/LanguageContext';
import { cn } from '@/lib/utils';
import { LazyImage } from '@/components/history/LazyImage';
import { getGoogleDriveDirectLink } from '@/lib/image-utils';
import { getLogs, deleteLog, ActivityLog } from '@/lib/storage';
import { Calendar, Trash2, Camera, StickyNote } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

const HistoryScreen = () => {
  const { reflections } = useReflections();
  const [activeTab, setActiveTab] = useState<'reflections' | 'logs'>('reflections');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Load logs when tab changes or on mount
  useState(() => {
    setLogs(getLogs());
  });

  // Refresh logs when focusing/switching tabs - simplified for now
  const refreshLogs = () => {
    setLogs(getLogs());
  };

  const handleDeleteLog = (id: string) => {
    if (confirm('Delete this log?')) {
      deleteLog(id);
      refreshLogs();
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const visibleReflections = reflections.slice(0, visibleCount);
  const hasMore = visibleCount < reflections.length;

  const loadMore = () => {
    setVisibleCount(prev => prev + ITEMS_PER_PAGE);
  };

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container max-w-md md:max-w-5xl mx-auto px-4 py-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{t.history.title}</h1>
              <p className="text-sm text-muted-foreground hidden md:block">{t.history.subtitle}</p>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex p-1 bg-secondary/50 rounded-xl">
            <button
              onClick={() => setActiveTab('reflections')}
              className={cn(
                "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                activeTab === 'reflections' ? "bg-background shadow text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Reflections
            </button>
            <button
              onClick={() => { setActiveTab('logs'); refreshLogs(); }}
              className={cn(
                "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                activeTab === 'logs' ? "bg-background shadow text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Activity Log
            </button>
          </div>
        </div>
      </header>

      <main className="container max-w-md md:max-w-5xl mx-auto px-4 py-6">
        {activeTab === 'reflections' && (
          reflections.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleReflections.map((reflection, index) => (
                  <div
                    key={reflection.id}
                    className="bg-card rounded-3xl card-elevated overflow-hidden animate-fade-in hover:shadow-lg transition-shadow duration-300"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Header */}
                    <button
                      onClick={() => toggleExpand(reflection.id)}
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
                        {expandedId === reflection.id ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </button>

                    {/* Expanded Content */}
                    {expandedId === reflection.id && (
                      <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
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
                ))}
              </div>

              {hasMore && (
                <div className="mt-8 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    className="rounded-2xl px-8 h-12 border-primary/20 hover:bg-primary/5 text-primary font-semibold"
                  >
                    {t.history.load_more}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 md:py-24">
              <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-secondary mx-auto mb-6 flex items-center justify-center">
                <Clock className="w-8 h-8 md:w-12 md:h-12 text-primary" />
              </div>
              <h3 className="font-semibold text-lg md:text-xl text-foreground mb-2">{t.history.no_reflections_title}</h3>
              <p className="text-sm md:text-base text-muted-foreground">
                {t.history.no_reflections_desc}
              </p>
            </div>
          ))}

        {activeTab === 'logs' && (
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
                        onClick={() => handleDeleteLog(log.id)}
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
        )}
      </main >

      {/* Floating Action Button (FAB) for Maghrib Check-in */}
      < div className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-50" >
        <Button
          onClick={() => navigate('/maghrib-checkin')}
          size="icon"
          className="h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground border-4 border-background/20 backdrop-blur-sm animate-in zoom-in duration-300"
        >
          <Plus className="w-8 h-8" />
          <span className="sr-only">New Check-in</span>
        </Button>
      </div >

    </div >
  );
};

export default HistoryScreen;
