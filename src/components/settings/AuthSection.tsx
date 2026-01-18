import { useState } from 'react';
import { Cloud, LogOut, LogIn, Mail, Sparkles, CheckCircle2, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { signInWithGoogle, signInWithEmail, verifyEmailOtp, signOut, isSupabaseConfigured } from '@/lib/supabase';
import { useLanguage } from '@/i18n/LanguageContext';
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';
import { useAuthSync } from '@/hooks/useAuthSync';
import { waitForAuthSync } from '@/lib/auth-sync-manager';

export const AuthSection = () => {
    const { t } = useLanguage();
    // Menggunakan hook terpusat untuk auth state - tidak ada lagi duplicate listeners!
    const { user, isLoading: isSyncing, isCloudMode } = useAuthSync();
    const [loginLoading, setLoginLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [showOtpInput, setShowOtpInput] = useState(false);

    const handleLogin = async () => {
        if (!isSupabaseConfigured) {
            toast.error("Supabase not configured");
            return;
        }
        setLoginLoading(true);
        try {
            await signInWithGoogle();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to login");
            setLoginLoading(false);
        }
    };

    const handleSendOtp = async () => {
        if (!email) return;
        setLoginLoading(true);
        try {
            await signInWithEmail(email);
            toast.success("Code sent! Check your email.");
            setShowOtpInput(true);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to send code");
        } finally {
            setLoginLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!email || !otp) return;
        setLoginLoading(true);
        try {
            await verifyEmailOtp(email, otp);
            // Tunggu auth sync selesai sebelum menampilkan pesan sukses
            const status = await waitForAuthSync();
            if (status.state === 'ready') {
                toast.success("Login successful! Data synced.");
            } else {
                toast.warning("Login successful, but sync failed. Try refreshing.");
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Invalid code");
        } finally {
            setLoginLoading(false);
        }
    };

    const handleLogout = async () => {
        setLoginLoading(true);
        try {
            await signOut();
            // Tunggu auth sync selesai (switch ke local mode)
            await waitForAuthSync();
            toast.success("Signed out successfully");
            // Reload untuk memastikan state bersih
            setTimeout(() => window.location.reload(), 300);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to logout");
        } finally {
            setLoginLoading(false);
        }
    };

    return (
        <section className="bg-card rounded-sm p-6 border-2 border-paper-lines/50 shadow-notebook overflow-hidden relative">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "p-2 rounded-sm shadow-tape -rotate-2",
                        user ? "bg-sticky-green" : "bg-sticky-blue"
                    )}>
                        <Cloud className={cn("w-5 h-5", user ? "text-ink" : "text-ink")} />
                    </div>
                    <div>
                        <h2 className="font-handwriting text-xl text-ink">{t.settings.account_title} ☁️</h2>
                        <p className="text-xs font-handwriting text-pencil flex items-center gap-1">
                            {isSyncing ? (
                                <><Loader2 className="w-3 h-3 animate-spin" /> Syncing...</>
                            ) : user ? (
                                t.settings.account_sync_active
                            ) : (
                                t.settings.account_guest
                            )}
                        </p>
                    </div>
                </div>

                {user && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleLogout}
                        className="text-pencil hover:text-doodle-red hover:bg-doodle-red/10 rounded-sm"
                    >
                        <LogOut className="w-5 h-5" />
                    </Button>
                )}
            </div>

            {user ? (
                <div className="flex items-center gap-4 bg-sticky-green/20 p-4 rounded-sm border-2 border-dashed border-sticky-green/50">
                    {user.user_metadata?.avatar_url ? (
                        <img
                            src={user.user_metadata.avatar_url}
                            alt="Profile"
                            className="w-12 h-12 rounded-sm border-2 border-ink/20"
                        />
                    ) : (
                        <div className="w-12 h-12 rounded-sm bg-sticky-yellow flex items-center justify-center shadow-tape rotate-2">
                            <Mail className="w-6 h-6 text-ink" />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="font-handwriting text-lg text-ink truncate">
                            {user.user_metadata?.full_name || user.email}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <CheckCircle2 className="w-4 h-4 text-doodle-green" />
                            <span className="text-xs font-handwriting text-doodle-green">Connected ✓</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="bg-sticky-yellow/20 p-4 rounded-sm border-2 border-dashed border-sticky-yellow/50 flex items-center gap-3">
                        <Sparkles className="w-5 h-5 text-sticky-yellow" />
                        <p className="text-sm font-handwriting text-ink">
                            Sync data ke cloud dengan Supabase! ☁️
                        </p>
                    </div>

                    {!isSupabaseConfigured ? (
                        <div className="bg-doodle-red/10 border-2 border-dashed border-doodle-red/30 rounded-sm p-3">
                            <p className="text-sm font-handwriting text-doodle-red flex items-center gap-1.5">
                                ⚠️ Login tidak tersedia (ENV belum di-setting)
                            </p>
                        </div>
                    ) : (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    className={cn(
                                        "w-full h-12 rounded-sm font-handwriting text-base gap-3",
                                        "bg-doodle-primary hover:bg-doodle-primary/90 text-white",
                                        "shadow-notebook"
                                    )}
                                    disabled={loginLoading}
                                >
                                    <LogIn className="w-5 h-5" />
                                    {t.settings.account_login}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="max-w-sm">
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="font-handwriting text-xl text-ink flex items-center gap-2">
                                        <Cloud className="w-6 h-6 text-doodle-primary" />
                                        {t.settings.account_login}
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="font-handwriting text-base text-pencil pt-2">
                                        {showOtpInput
                                            ? t.settings.enter_code_desc
                                            : t.settings.account_warning_desc}
                                    </AlertDialogDescription>
                                </AlertDialogHeader>

                                <div className="flex flex-col gap-4 py-4">
                                    {!showOtpInput ? (
                                        <>
                                            <Button
                                                onClick={handleLogin}
                                                variant="outline"
                                                className="h-12 rounded-sm gap-3 font-handwriting border-2 border-dashed hover:bg-paper-lines/20"
                                                disabled={loginLoading}
                                            >
                                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                                </svg>
                                                {t.settings.login_with_google}
                                            </Button>

                                            <div className="relative">
                                                <div className="absolute inset-0 flex items-center">
                                                    <span className="w-full border-t-2 border-dashed border-paper-lines" />
                                                </div>
                                                <div className="relative flex justify-center">
                                                    <span className="bg-paper px-2 text-xs font-handwriting text-pencil uppercase">
                                                        {t.settings.login_with_email}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Input
                                                    placeholder="name@example.com"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    variant="notebook"
                                                    className="font-handwriting"
                                                />
                                                <Button
                                                    onClick={handleSendOtp}
                                                    className="w-full h-11 rounded-sm font-handwriting bg-doodle-primary text-white shadow-notebook"
                                                    disabled={loginLoading || !email}
                                                >
                                                    <Mail className="w-4 h-4 mr-2" />
                                                    {t.settings.send_code}
                                                </Button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Input
                                                    placeholder="12345678"
                                                    value={otp}
                                                    onChange={(e) => setOtp(e.target.value)}
                                                    className="h-14 text-center text-xl tracking-[0.3em] font-handwriting rounded-sm border-2 border-dashed"
                                                    maxLength={8}
                                                />
                                                <p className="text-xs text-center font-handwriting text-pencil">
                                                    {t.settings.check_email_for_code.replace('{email}', email)}
                                                </p>
                                            </div>
                                            <Button
                                                onClick={handleVerifyOtp}
                                                className="w-full h-12 rounded-sm font-handwriting bg-doodle-primary text-white shadow-notebook"
                                                disabled={loginLoading || otp.length < 8}
                                            >
                                                {t.settings.verify_login} ✓
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                className="w-full h-10 font-handwriting"
                                                onClick={() => setShowOtpInput(false)}
                                            >
                                                {t.common.back}
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                <AlertDialogFooter className="sm:justify-center">
                                    <AlertDialogCancel className="w-full h-11 rounded-sm font-handwriting border-2 border-dashed border-pencil/40 text-pencil hover:bg-transparent hover:text-ink">
                                        {t.common.cancel}
                                    </AlertDialogCancel>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
            )}
        </section>
    );
};
