import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNoteHistories } from '@/hooks/useNoteHistories';
import { useNotes } from '@/hooks/useNotes';
import { NoteHistory } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow, format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Clock, FileText, ArrowLeft, Loader2, Calendar } from 'lucide-react';
import { triggerHaptic } from '@/lib/haptics';
import 'react-quill/dist/quill.snow.css';

export default function NoteHistoryPage() {
    const { noteId } = useParams<{ noteId: string }>();
    const navigate = useNavigate();

    const { histories, isLoading: historyLoading } = useNoteHistories(noteId);
    const { notes } = useNotes();

    const currentNote = useMemo(() =>
        notes.find(n => n.id === noteId),
        [notes, noteId]);

    const [selectedHistory, setSelectedHistory] = useState<NoteHistory | null>(null);
    const [isViewingVersion, setIsViewingVersion] = useState(false);

    const handleBack = () => {
        triggerHaptic();
        if (isViewingVersion) {
            setIsViewingVersion(false);
            setSelectedHistory(null);
        } else {
            navigate(-1);
        }
    };

    const handleViewHistory = (history: NoteHistory) => {
        triggerHaptic();
        setSelectedHistory(history);
        setIsViewingVersion(true);
    };

    if (historyLoading || !currentNote) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-notebook p-4">
                <Loader2 className="w-8 h-8 animate-spin text-pencil mb-2" />
                <p className="font-handwriting text-pencil">Memuat data...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-notebook flex flex-col transition-colors duration-300">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-notebook/95 backdrop-blur-md border-b-2 border-dashed border-paper-lines p-4 shadow-sm">
                <div className="max-w-3xl mx-auto flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleBack}
                        className="rounded-full hover:bg-paper-lines/20"
                    >
                        <ArrowLeft className="w-5 h-5 text-ink" />
                    </Button>
                    <div>
                        <h1 className="font-handwriting text-xl font-bold text-ink flex items-center gap-2">
                            <Clock className="w-5 h-5 text-doodle-primary" />
                            {isViewingVersion ? 'Detail Versi Riwayat' : 'Riwayat Perubahan'}
                        </h1>
                        <p className="font-handwriting text-xs text-pencil truncate max-w-[200px] sm:max-w-md">
                            {isViewingVersion && selectedHistory ?
                                `Arsip: ${format(new Date(selectedHistory.savedAt), 'dd MMM yyyy, HH:mm', { locale: localeId })}` :
                                currentNote.title || 'Tanpa Judul'
                            }
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20">
                <div className="max-w-3xl mx-auto">
                    {!isViewingVersion ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {histories.length === 0 ? (
                                <div className="text-center py-24 text-pencil font-handwriting">
                                    <FileText className="w-20 h-20 mx-auto mb-4 opacity-20" />
                                    <p className="text-xl">Belum ada riwayat</p>
                                    <p className="text-sm mt-2 opacity-60">Riwayat tersimpan otomatis saat Anda menyimpan perubahan.</p>
                                </div>
                            ) : (
                                <>
                                    {/* Current Version Card */}
                                    <div className="bg-doodle-green/10 dark:bg-doodle-green/20 border-2 border-doodle-green/40 dark:border-doodle-green/60 rounded-2xl p-6 relative overflow-hidden shadow-notebook">
                                        <div className="absolute top-0 right-0 bg-doodle-green px-4 py-1.5 rounded-bl-2xl shadow-md z-10">
                                            <span className="text-[10px] font-bold text-white uppercase tracking-widest">AKTIF</span>
                                        </div>

                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-2.5 h-2.5 rounded-full bg-doodle-green animate-pulse" />
                                            <span className="font-handwriting font-bold text-doodle-green text-xl">
                                                Versi Terkini
                                            </span>
                                        </div>

                                        <div className="space-y-3">
                                            <h3 className="font-handwriting text-ink font-bold text-2xl leading-none">
                                                {currentNote.title || '(Tanpa Judul)'}
                                            </h3>

                                            <div className="bg-paper p-4 rounded-xl border border-doodle-green/20 dark:border-doodle-green/30 max-h-64 overflow-y-auto shadow-inner">
                                                <div
                                                    className="ql-editor !p-0 !min-h-0 font-sans text-[15px] text-ink leading-relaxed [&_p]:my-1 [&_h1]:my-2 [&_h2]:my-2 [&_h3]:my-2 [&_ul]:my-1 [&_ol]:my-1"
                                                    dangerouslySetInnerHTML={{ __html: currentNote.content }}
                                                />
                                            </div>

                                            <div className="flex justify-between items-center mt-5 pt-4 border-t border-paper-lines/30 text-xs text-pencil font-handwriting">
                                                <span className="flex items-center gap-1.5 italic">
                                                    <Clock className="w-3.5 h-3.5 opacity-60" />
                                                    Terakhir diubah: {formatDistanceToNow(new Date(currentNote.updatedAt), { addSuffix: true, locale: localeId })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="relative pt-6">
                                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-paper-lines/30" />

                                        {/* History List */}
                                        <div className="space-y-6 relative">
                                            {histories.map((history, index) => (
                                                <div key={history.id} className="relative pl-10 group">
                                                    {/* Timeline Dot */}
                                                    <div className="absolute left-[11px] top-8 w-3 h-3 rounded-full bg-paper dark:bg-card border-2 border-paper-lines group-hover:bg-doodle-primary group-hover:scale-125 transition-all z-10" />

                                                    <div
                                                        onClick={() => handleViewHistory(history)}
                                                        className="bg-card border-2 border-dashed border-paper-lines rounded-2xl p-5 hover:shadow-sticky hover:border-doodle-primary/50 transition-all cursor-pointer transform hover:-translate-y-1 backdrop-blur-sm"
                                                    >
                                                        <div className="flex items-start justify-between mb-3 leading-none">
                                                            <div className="space-y-1">
                                                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground uppercase tracking-widest">
                                                                    RIWAYAT #{histories.length - index}
                                                                </span>
                                                                <h3 className="font-handwriting text-ink font-bold text-xl">
                                                                    {history.title || '(Tanpa Judul)'}
                                                                </h3>
                                                            </div>
                                                            <span className="text-[11px] font-handwriting text-pencil bg-paper/50 dark:bg-black/20 px-2 py-1 rounded-md border border-paper-lines/10">
                                                                {formatDistanceToNow(new Date(history.savedAt), {
                                                                    addSuffix: true,
                                                                    locale: localeId
                                                                })}
                                                            </span>
                                                        </div>

                                                        <div className="relative max-h-32 overflow-hidden rounded-lg border border-paper-lines/10 p-3 bg-paper/30 dark:bg-black/10">
                                                            <div
                                                                className="ql-editor !p-0 !min-h-0 font-sans text-sm text-ink/80 dark:text-ink/90 leading-snug [&_p]:my-1 [&_h1]:my-1 [&_h2]:my-1 [&_h3]:my-1 [&_ul]:my-0.5 [&_ol]:my-0.5"
                                                                dangerouslySetInnerHTML={{ __html: history.content }}
                                                            />
                                                            <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-card via-card/90 to-transparent pointer-events-none" />
                                                        </div>

                                                        <div className="mt-4 flex justify-end">
                                                            <span className="font-handwriting text-xs text-doodle-primary underline decoration-dashed">
                                                                Klik untuk melihat konten utuh →
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="animate-in fade-in zoom-in-95 duration-300">
                            {selectedHistory && (
                                <article className="bg-card border-2 border-paper-lines rounded-3xl p-6 sm:p-10 shadow-sticky min-h-[60vh] relative overflow-hidden">
                                    {/* Paper Decoration */}
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <FileText className="w-24 h-24 rotate-12" />
                                    </div>

                                    <div className="flex flex-col gap-6 relative z-10">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-paper-lines/30 pb-6">
                                            <div>
                                                <h1 className="font-handwriting text-3xl font-bold text-ink mb-2">
                                                    {selectedHistory.title || '(Tanpa Judul)'}
                                                </h1>
                                                <div className="flex items-center gap-3 text-pencil font-handwriting">
                                                    <span className="flex items-center gap-1.5 bg-paper/80 px-2 py-1 rounded-md text-xs">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        {format(new Date(selectedHistory.savedAt), 'EEEE, d MMMM yyyy', { locale: localeId })}
                                                    </span>
                                                    <span className="flex items-center gap-1.5 bg-paper/80 px-2 py-1 rounded-md text-xs">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {format(new Date(selectedHistory.savedAt), 'HH:mm', { locale: localeId })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="prose prose-stone dark:prose-invert max-w-none">
                                            <div
                                                className="ql-editor !p-0 !min-h-0 font-sans text-lg text-ink leading-relaxed"
                                                dangerouslySetInnerHTML={{ __html: selectedHistory.content }}
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-12 pt-8 border-t-2 border-dashed border-paper-lines/30 text-center">
                                        <p className="font-handwriting text-pencil text-sm italic">
                                            Ini adalah arsip riwayat catatan Anda.
                                        </p>
                                    </div>
                                </article>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
