import { useState } from 'react';
import { Cloud, LogOut, Mail, CheckCircle2, Loader2, Info, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { signOut as cfSignOut } from '@/lib/cloudflare-auth';
import { useLanguage } from '@/i18n/LanguageContext';
import { cn } from '@/lib/utils';
import { useAuthSync } from '@/hooks/useAuthSync';
import { waitForAuthSync } from '@/lib/auth-sync-manager';
import { hydrateCache } from '@/lib/storage';

export const AuthSection = () => {
    const { t } = useLanguage();
    const { user, isLoading: isSyncing } = useAuthSync();
    const [loginLoading, setLoginLoading] = useState(false);

    const handleLogout = async () => {
        setLoginLoading(true);
        try {
            await cfSignOut();
            await waitForAuthSync();
            toast.success("Berhasil keluar");
            setTimeout(() => window.location.reload(), 300);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Gagal logout");
        } finally {
            setLoginLoading(false);
        }
    };

    const handleForceRefresh = async () => {
        setLoginLoading(true);
        toast.loading("Mengambil ulang semua data...");
        try {
            await hydrateCache(true);
            toast.dismiss();
            toast.success("Data berhasil diperbarui!");
        } catch (error) {
            toast.dismiss();
            toast.error("Gagal memperbarui data");
        } finally {
            setLoginLoading(false);
        }
    };

    // If user is not logged in for any reason (though guarded by router), render nothing or fallback info
    if (!user) {
        return null;
    }

    return (
        <section className="bg-card rounded-sm p-6 border-2 border-paper-lines/50 shadow-notebook overflow-hidden relative animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-sm shadow-tape -rotate-2 bg-sticky-green">
                        <Cloud className="w-5 h-5 text-ink" />
                    </div>
                    <div>
                        <h2 className="font-handwriting text-xl text-ink">{t.settings.account_title} ☁️</h2>
                        <p className="text-xs font-handwriting text-pencil flex items-center gap-1">
                            {isSyncing ? (
                                <><Loader2 className="w-3 h-3 animate-spin" /> Syncing...</>
                            ) : (
                                t.settings.account_sync_active
                            )}
                        </p>
                    </div>
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    className="text-pencil hover:text-doodle-red hover:bg-doodle-red/10 rounded-sm"
                    disabled={loginLoading}
                >
                    <LogOut className="w-5 h-5" />
                </Button>
            </div>

            <div className="flex items-center gap-4 bg-sticky-green/20 p-4 rounded-sm border-2 border-dashed border-sticky-green/50">
                <div className="w-12 h-12 rounded-sm bg-sticky-yellow flex items-center justify-center shadow-tape rotate-2">
                    <Mail className="w-6 h-6 text-ink" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-handwriting text-lg text-ink truncate">
                        {user.email}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <CheckCircle2 className="w-4 h-4 text-doodle-green" />
                        <span className="text-xs font-handwriting text-doodle-green">Connected ✓</span>
                    </div>
                </div>
            </div>

            {/* Manual Sync / Troubleshooting Section */}
            <div className="mt-6 pt-6 border-t-2 border-dashed border-paper-lines/30">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-handwriting text-sm text-ink group flex items-center gap-2">
                            Troubleshooting <Info className="w-3 h-3 text-pencil" />
                        </p>
                        <p className="text-[10px] font-handwriting text-pencil">Data tidak sinkron? Coba paksa pembaruan.</p>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleForceRefresh}
                        className="font-handwriting text-xs gap-2 text-pencil hover:text-ink hover:bg-paper-lines/20"
                        disabled={loginLoading}
                    >
                        <RotateCcw className={cn("w-3 h-3", loginLoading && "animate-spin")} />
                        Refresh Data
                    </Button>
                </div>
            </div>
        </section>
    );
};
