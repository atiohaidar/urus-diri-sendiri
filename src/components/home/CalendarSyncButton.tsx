/**
 * Calendar Sync Button Component
 * Tombol untuk sinkronisasi jadwal hari ini ke native calendar
 * Dengan smart sync: update jika berubah, hapus jika di-delete
 */

import { useState } from 'react';
import { CalendarSync, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { isNativePlatform, smartSyncTodayToCalendar, clearTodayCalendarEvents } from '@/lib/calendar-sync';
import { cn } from '@/lib/utils';

interface CalendarSyncButtonProps {
    variant?: 'icon' | 'full';
    className?: string;
}

export const CalendarSyncButton = ({ variant = 'icon', className }: CalendarSyncButtonProps) => {
    const [isSyncing, setIsSyncing] = useState(false);
    const [showDialog, setShowDialog] = useState(false);

    // Don't render on web
    if (!isNativePlatform()) {
        return null;
    }

    const handleSync = async () => {
        setIsSyncing(true);
        setShowDialog(false);

        try {
            const result = await smartSyncTodayToCalendar();

            if (result.success) {
                const parts = [];
                if (result.created > 0) parts.push(`${result.created} baru`);
                if (result.updated > 0) parts.push(`${result.updated} diperbarui`);
                if (result.deleted > 0) parts.push(`${result.deleted} dihapus`);

                if (parts.length === 0) {
                    toast.success('Calendar sudah sinkron! ✓', {
                        description: 'Tidak ada perubahan'
                    });
                } else {
                    toast.success('Sinkronisasi berhasil! 📅', {
                        description: parts.join(', ')
                    });
                }
            } else if (result.created > 0 || result.updated > 0) {
                toast.warning('Sinkronisasi sebagian berhasil', {
                    description: `${result.created} baru, ${result.updated} diperbarui. ${result.errors.length} gagal.`
                });
            } else {
                toast.error('Sinkronisasi gagal', {
                    description: result.errors[0] || 'Terjadi kesalahan'
                });
            }
        } catch (error) {
            console.error('Sync error:', error);
            toast.error('Gagal sinkronisasi', {
                description: 'Pastikan izin calendar sudah diberikan'
            });
        } finally {
            setIsSyncing(false);
        }
    };

    const handleClear = async () => {
        setIsSyncing(true);
        setShowDialog(false);

        try {
            const result = await clearTodayCalendarEvents();
            if (result.success) {
                toast.success(`${result.deleted} event dihapus dari calendar`, {
                    description: 'Sinkronisasi telah direset'
                });
            } else {
                toast.error('Gagal menghapus event');
            }
        } catch (error) {
            toast.error('Gagal menghapus event');
        } finally {
            setIsSyncing(false);
        }
    };

    if (variant === 'icon') {
        return (
            <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
                <AlertDialogTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "rounded-sm text-pencil hover:text-ink hover:bg-paper-lines/20",
                            className
                        )}
                        disabled={isSyncing}
                    >
                        {isSyncing ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <CalendarSync className="w-5 h-5" />
                        )}
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-paper border-2 border-paper-lines">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-handwriting text-ink flex items-center gap-2">
                            <CalendarSync className="w-5 h-5" />
                            Sync ke Calendar
                        </AlertDialogTitle>
                        <AlertDialogDescription className="font-handwriting text-pencil space-y-2">
                            <p>
                                Sinkronisasi rutinitas dan prioritas hari ini ke calendar HP.
                            </p>
                            <div className="bg-sticky-yellow/30 p-3 rounded-sm text-xs space-y-1">
                                <p>✨ <strong>Smart Sync:</strong></p>
                                <ul className="list-disc list-inside space-y-0.5 ml-2">
                                    <li>Event baru akan dibuat</li>
                                    <li>Event yang berubah akan diperbarui</li>
                                    <li>Event yang dihapus akan dihapus</li>
                                </ul>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                        <Button
                            variant="outline"
                            onClick={handleClear}
                            className="font-handwriting gap-2 text-doodle-red border-doodle-red/30 hover:bg-doodle-red/10"
                            disabled={isSyncing}
                        >
                            <Trash2 className="w-4 h-4" />
                            Hapus Semua
                        </Button>
                        <div className="flex gap-2 flex-1 justify-end">
                            <AlertDialogCancel className="font-handwriting">Batal</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleSync}
                                className="font-handwriting bg-doodle-primary hover:bg-doodle-primary/90"
                            >
                                <CalendarSync className="w-4 h-4 mr-2" />
                                Sync Sekarang
                            </AlertDialogAction>
                        </div>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        );
    }

    // Full button variant
    return (
        <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
            <AlertDialogTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "font-handwriting gap-2 border-2 border-dashed border-paper-lines",
                        "hover:border-doodle-primary hover:bg-doodle-primary/10",
                        className
                    )}
                    disabled={isSyncing}
                >
                    {isSyncing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <CalendarSync className="w-4 h-4" />
                    )}
                    Sync ke Calendar
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-paper border-2 border-paper-lines">
                <AlertDialogHeader>
                    <AlertDialogTitle className="font-handwriting text-ink flex items-center gap-2">
                        <CalendarSync className="w-5 h-5" />
                        Sync ke Calendar
                    </AlertDialogTitle>
                    <AlertDialogDescription className="font-handwriting text-pencil space-y-2">
                        <p>
                            Sinkronisasi rutinitas dan prioritas hari ini ke calendar HP.
                        </p>
                        <div className="bg-sticky-yellow/30 p-3 rounded-sm text-xs space-y-1">
                            <p>✨ <strong>Smart Sync:</strong></p>
                            <ul className="list-disc list-inside space-y-0.5 ml-2">
                                <li>Event baru akan dibuat</li>
                                <li>Event yang berubah akan diperbarui</li>
                                <li>Event yang dihapus akan dihapus</li>
                            </ul>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                    <Button
                        variant="outline"
                        onClick={handleClear}
                        className="font-handwriting gap-2 text-doodle-red border-doodle-red/30 hover:bg-doodle-red/10"
                        disabled={isSyncing}
                    >
                        <Trash2 className="w-4 h-4" />
                        Hapus Semua
                    </Button>
                    <div className="flex gap-2 flex-1 justify-end">
                        <AlertDialogCancel className="font-handwriting">Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleSync}
                            className="font-handwriting bg-doodle-primary hover:bg-doodle-primary/90"
                        >
                            <CalendarSync className="w-4 h-4 mr-2" />
                            Sync Sekarang
                        </AlertDialogAction>
                    </div>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
