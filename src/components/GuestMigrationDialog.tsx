import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { useAuthSync } from "@/hooks/useAuthSync";
import { dismissMigrationDialog } from "@/lib/auth-sync-manager";
import { clearAllData, hydrateCache, cache } from "@/lib/storage";
import { toast } from "sonner";
import { Cloud, Sparkles, Trash2, ListChecks, Calendar, FileText, Activity, History, Dumbbell } from "lucide-react";

export const GuestMigrationDialog = () => {
    const { showMigrationDialog, migrationStats } = useAuthSync();

    const handleKeepData = () => {
        toast.success("Data tamu telah digabungkan dengan akun Anda.");
        dismissMigrationDialog();
    };

    const handleDiscardGuestData = async () => {
        const loadingToast = toast.loading("Membersihkan data tamu dan memuat ulang data akun...");
        try {
            // Wipe local IndexedDB
            await clearAllData();

            // Clear memory cache
            Object.keys(cache).forEach(key => {
                // @ts-ignore
                cache[key] = null;
            });

            // Force refetch from Cloud (since provider is already cloud-active)
            await hydrateCache(true);

            toast.dismiss(loadingToast);
            toast.success("Data tamu dibersihkan. Memulai sesi baru.");
            dismissMigrationDialog();
        } catch (error) {
            toast.dismiss(loadingToast);
            toast.error("Gagal membersihkan data.");
            console.error(error);
        }
    };

    if (!showMigrationDialog) return null;

    const statSpecs = [
        { label: 'Prioritas', count: migrationStats?.priorities, icon: ListChecks, color: 'text-amber-500' },
        { label: 'Rutinitas', count: migrationStats?.routines, icon: Calendar, color: 'text-doodle-primary' },
        { label: 'Catatan', count: migrationStats?.notes, icon: FileText, color: 'text-sticky-pink' },
        { label: 'Kebiasaan', count: migrationStats?.habits, icon: Dumbbell, color: 'text-doodle-green' },
        { label: 'Refleksi', count: migrationStats?.reflections, icon: History, color: 'text-pencil' },
        { label: 'Log Aktif', count: migrationStats?.logs, icon: Activity, color: 'text-ink' },
    ].filter(s => (s.count || 0) > 0);

    return (
        <AlertDialog open={showMigrationDialog}>
            <AlertDialogContent className="max-w-[90vw] md:max-w-md rounded-sm border-2 border-dashed border-paper-lines shadow-notebook bg-paper max-h-[90vh] overflow-y-auto">
                <AlertDialogHeader>
                    <div className="flex justify-center mb-2">
                        <div className="p-4 bg-sticky-yellow shadow-tape rotate-2 rounded-sm relative">
                            <Cloud className="w-10 h-10 text-ink" />
                            <Sparkles className="w-4 h-4 text-doodle-primary absolute -top-1 -right-1 animate-pulse" />
                        </div>
                    </div>
                    <AlertDialogTitle className="font-handwriting text-2xl text-center text-ink mt-2">
                        Data Sesi Tamu Ditemukan! ☁️
                    </AlertDialogTitle>
                    <AlertDialogDescription className="font-handwriting text-base text-pencil text-center space-y-4 pt-2">
                        <p>
                            Kami menemukan data dari sesi tamu Anda. Agar tidak hilang, data berikut telah didekatkan ke akun Anda:
                        </p>

                        <div className="grid grid-cols-2 gap-2 my-4">
                            {statSpecs.map(stat => (
                                <div key={stat.label} className="flex items-center gap-2 p-2 rounded-sm border-2 border-dashed border-paper-lines/20 bg-paper-lines/5">
                                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                                    <div className="text-left leading-none">
                                        <div className="text-[10px] text-pencil uppercase font-bold">{stat.label}</div>
                                        <div className="text-sm font-bold text-ink">{stat.count} item</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="text-sm border-2 border-dashed border-paper-lines/30 p-4 rounded-sm bg-paper-lines/5 text-left">
                            <p className="font-bold text-ink mb-1 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-sticky-yellow" />
                                Keputusan Anda?
                            </p>
                            <p className="text-xs text-pencil italic">
                                Anda bisa menyimpan data ini atau menghapusnya jika ini bukan milik Anda.
                            </p>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex flex-col sm:flex-row gap-3 mt-4">
                    <button
                        onClick={handleDiscardGuestData}
                        className="flex-1 px-4 py-3 rounded-sm font-handwriting text-doodle-red border-2 border-dashed border-doodle-red/30 hover:bg-doodle-red/5 transition-colors flex items-center justify-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" />
                        Hapus
                    </button>
                    <button
                        onClick={handleKeepData}
                        className="flex-1 px-4 py-3 rounded-sm font-handwriting bg-doodle-primary text-white shadow-notebook hover:bg-doodle-primary/90 transition-colors flex items-center justify-center gap-2"
                    >
                        <Sparkles className="w-4 h-4" />
                        Simpan
                    </button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
