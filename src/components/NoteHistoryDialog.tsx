import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { NoteHistory } from '@/lib/types';
import { DiffViewer } from './DiffViewer';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Clock, FileText } from 'lucide-react';

interface NoteHistoryDialogProps {
    open: boolean;
    onClose: () => void;
    histories: NoteHistory[];
    currentTitle: string;
    currentContent: string;
}

export function NoteHistoryDialog({
    open,
    onClose,
    histories,
    currentTitle,
    currentContent
}: NoteHistoryDialogProps) {
    const [selectedHistory, setSelectedHistory] = useState<NoteHistory | null>(null);
    const [showDiff, setShowDiff] = useState(false);

    const handleViewHistory = (history: NoteHistory) => {
        setSelectedHistory(history);
        setShowDiff(true);
    };

    const handleBack = () => {
        setShowDiff(false);
        setSelectedHistory(null);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-notebook">
                <DialogHeader>
                    <DialogTitle className="font-handwriting text-2xl text-ink flex items-center gap-2">
                        <Clock className="w-6 h-6" />
                        📜 Riwayat Perubahan
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        Lihat riwayat perubahan catatan dan bandingkan versi lama dengan versi terkini.
                    </DialogDescription>
                </DialogHeader>

                {!showDiff ? (
                    <div className="space-y-3 mt-4">
                        {histories.length === 0 ? (
                            <div className="text-center py-12 text-pencil font-handwriting">
                                <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
                                <p>Belum ada riwayat perubahan</p>
                                <p className="text-sm mt-2">Riwayat akan tersimpan setiap kali Anda menyimpan catatan</p>
                            </div>
                        ) : (
                            <>
                                {/* Current Version */}
                                <div className="bg-doodle-green/10 border-2 border-doodle-green/30 rounded-sm p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-handwriting font-bold text-doodle-green">
                                                ✨ Versi Terkini
                                            </span>
                                        </div>
                                        <span className="text-xs font-handwriting text-pencil">
                                            Sekarang
                                        </span>
                                    </div>
                                    <h3 className="font-handwriting text-ink font-bold">
                                        {currentTitle || '(Tanpa Judul)'}
                                    </h3>
                                    <p className="text-sm text-pencil font-handwriting line-clamp-2 mt-1">
                                        {currentContent.replace(/<[^>]*>/g, ' ').substring(0, 100)}...
                                    </p>
                                </div>

                                {/* History List */}
                                {histories.map((history, index) => (
                                    <div
                                        key={history.id}
                                        className="bg-paper border-2 border-dashed border-paper-lines rounded-sm p-4 hover:shadow-sticky transition-shadow cursor-pointer"
                                        onClick={() => handleViewHistory(history)}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="font-handwriting font-bold text-ink">
                                                    Versi #{histories.length - index}
                                                </span>
                                            </div>
                                            <span className="text-xs font-handwriting text-pencil">
                                                {formatDistanceToNow(new Date(history.savedAt), {
                                                    addSuffix: true,
                                                    locale: localeId
                                                })}
                                            </span>
                                        </div>
                                        <h3 className="font-handwriting text-ink font-bold">
                                            {history.title || '(Tanpa Judul)'}
                                        </h3>
                                        <p className="text-sm text-pencil font-handwriting line-clamp-2 mt-1">
                                            {history.content.replace(/<[^>]*>/g, ' ').substring(0, 100)}...
                                        </p>
                                        <div className="mt-3 flex justify-end">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="font-handwriting text-xs"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleViewHistory(history);
                                                }}
                                            >
                                                🔍 Lihat Perubahan
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                ) : (
                    <div className="mt-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleBack}
                            className="mb-4 font-handwriting"
                        >
                            ← Kembali ke Daftar
                        </Button>

                        {selectedHistory && (
                            <>
                                <div className="mb-4 p-3 bg-sticky-yellow/20 border-2 border-dashed border-sticky-yellow rounded-sm">
                                    <p className="font-handwriting text-sm text-ink">
                                        <strong>Perbandingan:</strong> Versi{' '}
                                        {formatDistanceToNow(new Date(selectedHistory.savedAt), {
                                            addSuffix: true,
                                            locale: localeId
                                        })}{' '}
                                        vs Versi Terkini
                                    </p>
                                </div>
                                <DiffViewer
                                    oldTitle={selectedHistory.title}
                                    oldContent={selectedHistory.content}
                                    newTitle={currentTitle}
                                    newContent={currentContent}
                                />
                            </>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
