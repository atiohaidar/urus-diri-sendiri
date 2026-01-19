import { useState, useEffect } from 'react';
import { Clock, Plus, BookOpen, FileText } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';
import { cn } from '@/lib/utils';
import { getLogsAsync, deleteLog, ActivityLog, getReflectionsAsync, Reflection, initializeStorage, registerListener } from '@/lib/storage';
import { ReflectionsList } from '@/components/history/ReflectionsList';
import { LogsList } from '@/components/history/LogsList';
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
  const navigate = useNavigate();
  const location = useLocation();
  const [reflections, setReflections] = useState<Reflection[]>([]);

  // Initialize tab from navigation state if available, default to 'reflections'
  const [activeTab, setActiveTab] = useState<'reflections' | 'logs'>(
    (location.state as any)?.tab === 'logs' ? 'logs' : 'reflections'
  );

  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLogId, setDeleteLogId] = useState<string | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      setLoading(true);
      await initializeStorage();
      if (isMounted) await refreshData();
      if (isMounted) setLoading(false);
    };
    init();

    const unsubscribe = registerListener(() => {
      if (!isMounted) return;
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
      <div className="pb-24 md:pb-8 bg-notebook">
        {/* Header - Notebook style */}
        <header className="sticky top-0 z-40 bg-paper border-b-2 border-dashed border-paper-lines pt-safe">
          <div className="container md:max-w-5xl mx-auto px-4 py-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-sm bg-sticky-blue shadow-sticky rotate-2">
                <Clock className="w-6 h-6 text-doodle-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-handwriting text-ink">
                  <span className="highlight-blue">{t.history.title}</span> 📖
                </h1>
                <p className="text-sm font-handwriting text-pencil hidden md:block">{t.history.subtitle}</p>
              </div>
            </div>

            {/* Tab Switcher - Sticky note tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('reflections')}
                className={cn(
                  "flex-1 py-2.5 px-4 text-sm font-handwriting rounded-sm transition-all duration-150",
                  activeTab === 'reflections'
                    ? "bg-sticky-yellow text-ink shadow-sticky -rotate-1"
                    : "text-pencil hover:text-ink hover:bg-paper-lines/20 border-2 border-dashed border-paper-lines"
                )}
              >
                <BookOpen className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
                {t.history.reflections_tab}
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={cn(
                  "flex-1 py-2.5 px-4 text-sm font-handwriting rounded-sm transition-all duration-150",
                  activeTab === 'logs'
                    ? "bg-sticky-pink text-ink shadow-sticky rotate-1"
                    : "text-pencil hover:text-ink hover:bg-paper-lines/20 border-2 border-dashed border-paper-lines"
                )}
              >
                <FileText className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
                {t.history.activity_log_tab}
              </button>
            </div>
          </div>
        </header>

        <main className="container md:max-w-5xl mx-auto px-4 py-6">
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
              /* Empty State - Notebook doodle style */
              <div className="text-center py-12 md:py-24">
                <div className="w-20 h-20 md:w-28 md:h-28 rounded-sm bg-sticky-blue shadow-sticky mx-auto mb-6 flex items-center justify-center -rotate-3">
                  <Clock className="w-10 h-10 md:w-14 md:h-14 text-doodle-primary" />
                </div>
                <h3 className="font-handwriting text-2xl text-ink mb-2">
                  {t.history.no_reflections_title} 📝
                </h3>
                <p className="font-handwriting text-base text-pencil max-w-sm mx-auto">
                  {t.history.no_reflections_desc}
                </p>
              </div>
            )
          ) : (
            <LogsList logs={logs} onDeleteLog={handleDeleteLog} />
          )}
        </main>

        {/* FAB - Pencil button style */}
        <div className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] right-4 md:bottom-8 md:right-8 z-50">
          <Button
            onClick={() => navigate('/maghrib-checkin')}
            className={cn(
              "h-14 w-14 rounded-full",
              "bg-doodle-primary text-white",
              "shadow-[3px_3px_0_0_rgba(0,0,0,0.15)]",
              "border-2 border-ink/20",
              "hover:scale-105 active:scale-95 transition-transform duration-150",
              "will-change-transform"
            )}
          >
            <Plus className="w-7 h-7" strokeWidth={2.5} />
            <span className="sr-only">New Check-in</span>
          </Button>
        </div>
      </div>

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
