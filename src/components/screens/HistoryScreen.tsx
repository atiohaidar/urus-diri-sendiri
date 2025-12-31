import { useState, useEffect } from 'react';
import { Clock, Trophy, Construction, Rocket, Sprout, ChevronDown, ChevronUp } from 'lucide-react';
import { getReflections, formatDate, type Reflection } from '@/lib/storage';

const HistoryScreen = () => {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setReflections(getReflections());
  }, []);

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
              <h1 className="text-xl font-bold text-foreground">Reflection History</h1>
              <p className="text-sm text-muted-foreground hidden md:block">Track your daily progress</p>
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
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {formatDate(reflection.date)}
                    </p>
                    <p className="font-semibold text-foreground line-clamp-1">
                      {reflection.winOfDay || 'Evening Reflection'}
                    </p>
                  </div>
                  {expandedId === reflection.id ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>

                {/* Expanded Content */}
                {expandedId === reflection.id && (
                  <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
                    {reflection.winOfDay && (
                      <div>
                        <p className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1">
                          <Trophy className="w-3.5 h-3.5 text-amber-500" />
                          Win of the Day
                        </p>
                        <p className="text-sm text-foreground">{reflection.winOfDay}</p>
                      </div>
                    )}

                    {reflection.hurdle && (
                      <div>
                        <p className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1">
                          <Construction className="w-3.5 h-3.5 text-orange-500" />
                          The Hurdle
                        </p>
                        <p className="text-sm text-foreground">{reflection.hurdle}</p>
                      </div>
                    )}

                    {reflection.priorities.some(p => p.trim()) && (
                      <div>
                        <p className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-2">
                          <Rocket className="w-3.5 h-3.5 text-primary" />
                          Priorities Set
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
                          Small Change
                        </p>
                        <p className="text-sm text-foreground">{reflection.smallChange}</p>
                      </div>
                    )}
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
            <h3 className="font-semibold text-lg md:text-xl text-foreground mb-2">No reflections yet</h3>
            <p className="text-sm md:text-base text-muted-foreground">
              Complete your first Maghrib Check-in to start tracking your journey
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default HistoryScreen;
