import { useState, useEffect } from 'react';
import { CalendarSync, Calendar, Settings, Loader2, Trash2, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import {
    isNativePlatform,
    smartSyncTodayToCalendar,
    clearTodayCalendarEvents,
    getSelectedCalendar,
    getAvailableCalendars,
    manualSetCalendar,
    checkCalendarPermission,
    requestCalendarPermission
} from '@/lib/calendar-sync';

export const CalendarSection = () => {
    const { t } = useLanguage();
    const [isNative, setIsNative] = useState(false);
    const [calendarInfo, setCalendarInfo] = useState<{ id?: string; name?: string }>({});
    const [isSyncing, setIsSyncing] = useState(false);
    const [hasPermission, setHasPermission] = useState(false);
    const [calendarList, setCalendarList] = useState<{ id: string; title: string }[]>([]);
    const [showSelectDialog, setShowSelectDialog] = useState(false);
    const [isLoadingCalendars, setIsLoadingCalendars] = useState(false);

    useEffect(() => {
        setIsNative(isNativePlatform());
        setCalendarInfo(getSelectedCalendar());
        checkPermission();
    }, []);

    const checkPermission = async () => {
        if (!isNativePlatform()) return;
        const permitted = await checkCalendarPermission();
        setHasPermission(permitted);
    };

    const requestPermission = async () => {
        const permitted = await requestCalendarPermission();
        setHasPermission(permitted);
        if (permitted) {
            toast.success('Izin kalender diberikan!');
        } else {
            toast.error('Izin kalender dibutuhkan untuk fitur ini.');
        }
    };

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            const result = await smartSyncTodayToCalendar();

            // Refresh calendar info in case it was auto-selected during sync
            setCalendarInfo(getSelectedCalendar());

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
            toast.error('Gagal sinkronisasi');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleClear = async () => {
        // Confirmation could be added here if needed, but for now direct action
        if (!confirm('Hapus semua event yang sudah disinkronkan ke kalender hari ini?')) return;

        setIsSyncing(true);
        try {
            const result = await clearTodayCalendarEvents();
            if (result.success) {
                toast.success(`${result.deleted} event dihapus dari calendar`);
            } else {
                toast.error('Gagal menghapus event');
            }
        } catch (error) {
            toast.error('Gagal menghapus event');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleOpenCalendarSelect = async () => {
        setIsLoadingCalendars(true);
        try {
            const calendars = await getAvailableCalendars();
            if (calendars.length === 0) {
                toast.error('Tidak ada kalender ditemukan di HP ini.', {
                    description: 'Pastikan aplikasi memiliki izin akses kalender.'
                });
                return;
            }
            setCalendarList(calendars);
            setShowSelectDialog(true);
        } catch (error) {
            toast.error('Gagal memuat daftar kalender');
        } finally {
            setIsLoadingCalendars(false);
        }
    };

    const handleSelectCalendar = (id: string, name: string) => {
        manualSetCalendar(id, name);
        setCalendarInfo(getSelectedCalendar());
        setShowSelectDialog(false);
        toast.success(`Kalender "${name}" dipilih`);
    };

    if (!isNative) return null;

    return (
        <section className="space-y-4">
            <h2 className="text-xl font-handwriting text-ink flex items-center gap-2">
                <span className="underline-squiggle">Integrasi Kalender</span>
                <Calendar className="w-5 h-5 text-doodle-primary" />
            </h2>

            <div className="bg-card/50 rounded-sm border-2 border-dashed border-paper-lines p-4 space-y-4">
                {/* Status & Configuration */}
                {!hasPermission ? (
                    <div className="flex flex-col gap-3 items-start">
                        <p className="font-handwriting text-pencil text-sm">
                            Izinkan aplikasi mengakses kalender HP Anda untuk sinkronisasi jadwal.
                        </p>
                        <Button
                            onClick={requestPermission}
                            variant="outline"
                            className="font-handwriting gap-2 border-paper-lines hover:bg-paper-lines/20"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            Berikan Izin Akses
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Selected Calendar Info */}
                        <div className="bg-paper-lines/10 p-3 rounded-sm border border-paper-lines/30 flex items-center justify-between">
                            <div className="space-y-0.5">
                                <p className="text-[10px] uppercase tracking-wider opacity-60 font-handwriting">Kalender Aktif</p>
                                <p className="text-ink font-bold text-sm font-handwriting flex items-center gap-2">
                                    {calendarInfo.name ? (
                                        <>
                                            <Calendar className="w-3 h-3 text-doodle-primary" />
                                            {calendarInfo.name}
                                        </>
                                    ) : (
                                        <span className="text-pencil italic">Belum dipilih (Akan otomatis)</span>
                                    )}
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleOpenCalendarSelect}
                                disabled={isLoadingCalendars}
                                className="h-8 px-3 text-xs gap-1 hover:bg-paper-lines/20 font-handwriting border border-dashed border-pencil/30"
                            >
                                {isLoadingCalendars ? <Loader2 className="w-3 h-3 animate-spin" /> : <Settings className="w-3 h-3" />}
                                {calendarInfo.name ? 'Ganti' : 'Pilih'}
                            </Button>
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                onClick={handleSync}
                                disabled={isSyncing}
                                className="font-handwriting bg-doodle-primary hover:bg-doodle-primary/90 text-white shadow-notebook"
                            >
                                {isSyncing ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <CalendarSync className="w-4 h-4 mr-2" />
                                )}
                                Sync Sekarang
                            </Button>

                            <Button
                                variant="outline"
                                onClick={handleClear}
                                disabled={isSyncing}
                                className="font-handwriting gap-2 text-doodle-red border-doodle-red/30 hover:bg-doodle-red/10"
                            >
                                <Trash2 className="w-4 h-4" />
                                Hapus Event Hari Ini
                            </Button>
                        </div>

                        {/* Helper Text */}
                        <div className="bg-sticky-yellow/20 p-3 rounded-sm">
                            <p className="text-xs font-handwriting text-pencil leading-relaxed">
                                ✨ <strong>Smart Sync:</strong> Event baru akan dibuat, yang berubah akan diupdate, dan yang dihapus dari aplikasi akan dihapus dari kalender HP.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Custom Calendar Selection Dialog */}
            <Dialog open={showSelectDialog} onOpenChange={setShowSelectDialog}>
                <DialogContent className="max-w-xs md:max-w-md bg-paper border-2 border-paper-lines font-handwriting">
                    <DialogHeader>
                        <DialogTitle className="text-ink flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            Pilih Kalender
                        </DialogTitle>
                        <DialogDescription className="text-pencil">
                            Pilih kalender tujuan sinkronisasi
                        </DialogDescription>
                    </DialogHeader>

                    <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-2 scrollbar-hide py-2">
                        {calendarList.map((cal) => (
                            <button
                                key={cal.id}
                                onClick={() => handleSelectCalendar(cal.id, cal.title)}
                                className={cn(
                                    "w-full text-left p-3 rounded-sm border-2 border-dashed transition-all",
                                    cal.id === calendarInfo.id
                                        ? "bg-doodle-primary/10 border-doodle-primary text-doodle-primary font-bold"
                                        : "border-paper-lines/50 hover:bg-paper-lines/20 text-ink"
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <span>{cal.title}</span>
                                    {cal.id === calendarInfo.id && <CheckCircle2 className="w-4 h-4 text-doodle-primary" />}
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button
                            variant="ghost"
                            onClick={() => setShowSelectDialog(false)}
                            className="font-handwriting text-pencil hover:text-ink"
                        >
                            Batal
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </section>
    );
};
