import { useState, useEffect } from 'react';
import { Clock, Plus, StickyNote, Camera, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';
import { cn } from '@/lib/utils';
import { getLogsAsync, deleteLog, ActivityLog, getReflectionsAsync, Reflection, initializeStorage, registerListener } from '@/lib/storage';
import { ReflectionsList } from '@/components/history/ReflectionsList';
import { LogsList } from '@/components/history/LogsList';
import { LazyImage } from '@/components/history/LazyImage';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { ReflectionSkeleton } from '@/components/history/ReflectionSkeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ITEMS_PER_PAGE = 10;

const HistoryScreen = () => {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [activeTab, setActiveTab] = useState<'reflections' | 'logs'>('reflections');
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLogId, setDeleteLogId] = useState<string | null>(null);
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      setLoading(true);
      await initializeStorage();
      if (isMounted) await refreshData();
      if (isMounted) setLoading(false);
    };
    init();

    // Event-driven update: Only triggers when data actually changes/syncs
    const unsubscribe = registerListener(() => {
      if (!isMounted) return;
      console.log("♻️ UI: History updated from storage event");
      refreshData();
    });

    return () => { isMounted = false; unsubscribe(); };
  }, [activeTab]);

  const refreshData = async () => {
    if (activeTab === 'reflections') {
      const data = await getReflectionsAsync();
      setReflections(data);
    } else {
      const data = await getLogsAsync();
      setLogs(data);
    }
  };

  const handleDeleteLog = (id: string) => {
    setDeleteLogId(id);
  };

  const confirmDeleteLog = async () => {
    if (deleteLogId) {
      await deleteLog(deleteLogId);
      await refreshData();
      setDeleteLogId(null);
    }
  };

  const visibleReflections = reflections.slice(0, visibleCount);
  const hasMore = visibleCount < reflections.length;

  const loadMore = () => {
    setVisibleCount(prev => prev + ITEMS_PER_PAGE);
  };

  return (
    <>
      <PullToRefresh onRefresh={refreshData} className="min-h-screen pb-24 md:pb-8">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 pt-safe">
          <div className="container md:max-w-5xl mx-auto px-4 py-4 space-y-4">
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
                {t.history.reflections_tab}
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={cn(
                  "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                  activeTab === 'logs' ? "bg-background shadow text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t.history.activity_log_tab}
              </button>
            </div>
          </div>
        </header>

        <main className="container md:max-w-5xl mx-auto px-4 py-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <ReflectionSkeleton key={i} />
              ))}
            </div>
          ) : activeTab === 'reflections' ? (
            reflections.length > 0 ? (
              <ReflectionsList
                reflections={visibleReflections}
                onLoadMore={loadMore}
                hasMore={hasMore}
              />
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
            )
          ) : (
            <LogsList logs={logs} onDeleteLog={handleDeleteLog} />
          )}
        </main>

        {/* Floating Action Button (FAB) for Maghrib Check-in */}
        <div className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] right-4 md:bottom-8 md:right-8 z-50">
          <Button
            onClick={() => navigate('/maghrib-checkin')}
            size="icon"
            className="h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground border-4 border-background/20 backdrop-blur-sm animate-in zoom-in duration-300"
          >
            <Plus className="w-8 h-8" />
            <span className="sr-only">New Check-in</span>
          </Button>
        </div>
      </PullToRefresh>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteLogId} onOpenChange={(open) => !open && setDeleteLogId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus log ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Log yang dihapus tidak dapat dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteLog}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default HistoryScreen;
