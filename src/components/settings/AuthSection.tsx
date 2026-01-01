import { useState, useEffect } from 'react';
import { Cloud, LogOut, LogIn, Mail, Sparkles, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase, signInWithGoogle, signInWithEmail, verifyEmailOtp, signOut, isSupabaseConfigured } from '@/lib/supabase';
import { useLanguage } from '@/i18n/LanguageContext';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export const AuthSection = () => {
    const { t } = useLanguage();
    const [user, setUser] = useState<any>(null);
    const [loginLoading, setLoginLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [showOtpInput, setShowOtpInput] = useState(false);

    useEffect(() => {
        if (!isSupabaseConfigured) return;

        // Initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogin = async () => {
        if (!isSupabaseConfigured) {
            toast.error("Supabase not configured");
            return;
        }
        setLoginLoading(true);
        try {
            await signInWithGoogle();
        } catch (error: any) {
            toast.error(error.message || "Failed to login");
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
        } catch (error: any) {
            toast.error(error.message || "Failed to send code");
        } finally {
            setLoginLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!email || !otp) return;
        setLoginLoading(true);
        try {
            await verifyEmailOtp(email, otp);
            toast.success("Login successful!");
            // Dialog will close automatically as user state updates
        } catch (error: any) {
            toast.error(error.message || "Invalid code");
        } finally {
            setLoginLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut();
            toast.success("Signed out successfully");
            setTimeout(() => window.location.reload(), 500);
        } catch (error: any) {
            toast.error(error.message || "Failed to logout");
        }
    };

    return (
        <section className="bg-card rounded-3xl p-6 border border-border/50 shadow-sm overflow-hidden relative">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${user ? 'bg-primary/10' : 'bg-muted'}`}>
                        <Cloud className={`w-5 h-5 ${user ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold">{t.settings.account_title}</h2>
                        <p className="text-xs text-muted-foreground">
                            {user ? t.settings.account_sync_active : t.settings.account_guest}
                        </p>
                    </div>
                </div>

                {user && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleLogout}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                    >
                        <LogOut className="w-5 h-5" />
                    </Button>
                )}
            </div>

            {user ? (
                <div className="flex items-center gap-4 bg-primary/5 p-4 rounded-2xl border border-primary/10">
                    {user.user_metadata?.avatar_url ? (
                        <img
                            src={user.user_metadata.avatar_url}
                            alt="Profile"
                            className="w-12 h-12 rounded-full ring-2 ring-primary/20"
                        />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                            <Mail className="w-6 h-6 text-primary" />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground truncate">{user.user_metadata?.full_name || user.email}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Connected</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="bg-muted/30 p-4 rounded-2xl border border-dashed border-border flex items-center gap-3">
                        <Sparkles className="w-5 h-5 text-amber-500" />
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Sync your data across devices seamlessly with Supabase Cloud.
                        </p>
                    </div>

                    {!isSupabaseConfigured ? (
                        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3">
                            <p className="text-[10px] text-destructive font-semibold flex items-center gap-1.5">
                                ⚠️ Login tidak tersedia (ENV belum di-setting)
                            </p>
                        </div>
                    ) : (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    className="w-full h-12 rounded-2xl shadow-lg shadow-primary/20 gap-3 font-bold"
                                    disabled={loginLoading}
                                >
                                    <LogIn className="w-5 h-5" />
                                    {t.settings.account_login}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-3xl border-border/50 max-w-sm">
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="text-xl font-bold flex items-center gap-2">
                                        <Cloud className="w-6 h-6 text-primary" />
                                        {t.settings.account_login}
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="text-base text-muted-foreground pt-2">
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
                                                className="h-12 rounded-xl gap-3 font-semibold border-2 hover:bg-muted"
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
                                                    <span className="w-full border-t" />
                                                </div>
                                                <div className="relative flex justify-center text-xs uppercase">
                                                    <span className="bg-background px-2 text-muted-foreground">{t.settings.login_with_email}</span>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Input
                                                    placeholder="name@example.com"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    className="h-11 rounded-xl"
                                                />
                                                <Button
                                                    onClick={handleSendOtp}
                                                    className="w-full h-11 rounded-xl font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                                    disabled={loginLoading || !email}
                                                >
                                                    <Mail className="w-4 h-4 mr-2" />
                                                    {t.settings.send_code}
                                                </Button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                                            <div className="space-y-2">
                                                <Input
                                                    placeholder="12345678"
                                                    value={otp}
                                                    onChange={(e) => setOtp(e.target.value)}
                                                    className="h-14 text-center text-xl tracking-[0.3em] font-mono rounded-xl"
                                                    maxLength={8}
                                                />
                                                <p className="text-xs text-center text-muted-foreground">
                                                    {t.settings.check_email_for_code.replace('{email}', email)}
                                                </p>
                                            </div>
                                            <Button
                                                onClick={handleVerifyOtp}
                                                className="w-full h-12 rounded-xl font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                                disabled={loginLoading || otp.length < 8}
                                            >
                                                {t.settings.verify_login}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                className="w-full h-10"
                                                onClick={() => setShowOtpInput(false)}
                                            >
                                                {t.common.back}
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                <AlertDialogFooter className="sm:justify-center">
                                    <AlertDialogCancel className="w-full h-11 rounded-xl font-medium border-0 text-muted-foreground hover:bg-transparent hover:text-foreground">
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
