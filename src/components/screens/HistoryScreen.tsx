import { useState, useEffect } from 'react';
import { Clock, Trophy, Construction, Rocket, Sprout, ChevronDown, ChevronUp, CheckCircle2, Circle } from 'lucide-react';
import { useReflections } from '@/hooks/useReflections';
import { formatDate } from '@/lib/time-utils';
import { useLanguage } from '@/i18n/LanguageContext';
import { cn } from '@/lib/utils';

const HistoryScreen = () => {
  const { reflections } = useReflections();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { t } = useLanguage();

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container max-w-md md:max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{t.history.title}</h1>
              <p className="text-sm text-muted-foreground hidden md:block">{t.history.subtitle}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-md md:max-w-5xl mx-auto px-4 py-6">
        {reflections.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reflections.map((reflection, index) => (
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
        )}
      </main>
    </div>
  );
};

export default HistoryScreen;
