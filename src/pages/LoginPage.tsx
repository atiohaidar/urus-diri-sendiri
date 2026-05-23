import { useState } from 'react';
import { Cloud, Mail, Sparkles, Loader2, Eye, EyeOff, UserPlus, LogIn } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { signInWithEmail as cfSignIn, registerWithEmail as cfRegister } from '@/lib/cloudflare-auth';
import { useLanguage } from '@/i18n/LanguageContext';
import { cn } from '@/lib/utils';
import { waitForAuthSync } from '@/lib/auth-sync-manager';

export const LoginPage = () => {
    const { t } = useLanguage();
    const [loginLoading, setLoginLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isRegisterMode, setIsRegisterMode] = useState(false);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;

        setLoginLoading(true);
        const loadingToast = toast.loading(isRegisterMode ? "Membuat akun..." : "Sedang masuk...");

        try {
            const response = isRegisterMode
                ? await cfRegister(email, password)
                : await cfSignIn(email, password);

            toast.dismiss(loadingToast);

            if (response.success) {
                toast.success(isRegisterMode ? "Registrasi berhasil! ☁️" : "Login berhasil! Selamat datang kembali ✨");
                // Wait for the storage cache to fully sync
                await waitForAuthSync();
            } else {
                let errorMsg = "Autentikasi gagal";
                if (response.error) {
                    if (typeof response.error === 'string') {
                        errorMsg = response.error;
                    } else if (typeof response.error === 'object') {
                        if (response.error.name === 'ZodError' && typeof response.error.message === 'string') {
                            try {
                                const parsed = JSON.parse(response.error.message);
                                if (Array.isArray(parsed) && parsed.length > 0) {
                                    errorMsg = parsed.map((issue: any) => issue.message).join(', ');
                                } else {
                                    errorMsg = response.error.message;
                                }
                            } catch (e) {
                                errorMsg = response.error.message;
                            }
                        } else {
                            errorMsg = response.error.message || response.error.error || JSON.stringify(response.error);
                        }
                    }
                }
                toast.error(errorMsg);
            }
        } catch (error) {
            toast.dismiss(loadingToast);
            toast.error(error instanceof Error ? error.message : "Terjadi kesalahan sistem");
        } finally {
            setLoginLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            {/* Centered paper card */}
            <div className="w-full max-w-md bg-paper border-2 border-paper-lines rounded-sm p-8 shadow-notebook relative overflow-hidden">
                {/* Decorative Tape style */}
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-32 h-8 bg-sticky-yellow/40 shadow-tape -rotate-1 z-10" />

                <div className="flex flex-col items-center text-center mt-4 mb-8">
                    <div className="p-3 bg-sticky-blue rounded-sm shadow-tape rotate-3 mb-4">
                        <Cloud className="w-8 h-8 text-ink animate-pulse" />
                    </div>
                    <h1 className="font-handwriting text-3xl text-ink font-bold tracking-tight">
                        Urus Diri Sendiri ☁️
                    </h1>
                    <p className="text-sm font-handwriting text-pencil mt-2 max-w-xs">
                        Jurnal harian, prioritas, & jadwal dalam genggaman. Simpan aman di server cloud Anda.
                    </p>
                </div>

                <form onSubmit={handleAuth} className="space-y-6">
                    {/* Toggle tab */}
                    <div className="flex bg-paper-lines/10 p-1 rounded-sm border-2 border-dashed border-paper-lines/30">
                        <button
                            type="button"
                            onClick={() => setIsRegisterMode(false)}
                            className={cn(
                                "flex-1 py-2.5 font-handwriting text-sm rounded-sm transition-all duration-200",
                                !isRegisterMode ? "bg-white text-ink shadow-tape rotate-1 font-bold" : "text-pencil hover:text-ink"
                            )}
                        >
                            Masuk (Login)
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsRegisterMode(true)}
                            className={cn(
                                "flex-1 py-2.5 font-handwriting text-sm rounded-sm transition-all duration-200",
                                isRegisterMode ? "bg-white text-ink shadow-tape -rotate-1 font-bold" : "text-pencil hover:text-ink"
                            )}
                        >
                            Buat Akun
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* Info tip */}
                        <div className="bg-sticky-yellow/20 p-3 rounded-sm border-2 border-dashed border-sticky-yellow/30 flex items-start gap-2.5">
                            <Sparkles className="w-4 h-4 text-sticky-yellow mt-0.5 flex-shrink-0" />
                            <p className="text-xs font-handwriting text-pencil leading-relaxed">
                                {isRegisterMode 
                                    ? "Buat akun baru untuk mulai menata jurnal dan kebiasaan harian Anda dengan aman."
                                    : "Koneksi cloud wajib aktif untuk menyinkronkan seluruh lembar catatan dan rutinitas."
                                }
                            </p>
                        </div>

                        {/* Input Fields */}
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-xs font-handwriting text-pencil uppercase tracking-wider block ml-1">
                                    Email
                                </label>
                                <Input
                                    type="email"
                                    placeholder="nama@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    variant="notebook"
                                    className="font-handwriting h-11"
                                    required
                                    disabled={loginLoading}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-handwriting text-pencil uppercase tracking-wider block ml-1">
                                    Password
                                </label>
                                <div className="relative">
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        variant="notebook"
                                        className="font-handwriting pr-10 h-11"
                                        required
                                        disabled={loginLoading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-3 text-pencil hover:text-ink transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className={cn(
                            "w-full h-12 rounded-sm font-handwriting text-base gap-2.5",
                            "bg-doodle-primary hover:bg-doodle-primary/90 text-white",
                            "shadow-notebook transition-all duration-200"
                        )}
                        disabled={loginLoading || !email || !password}
                    >
                        {loginLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : isRegisterMode ? (
                            <>
                                <UserPlus className="w-5 h-5" />
                                Buat Akun & Masuk
                            </>
                        ) : (
                            <>
                                <LogIn className="w-5 h-5" />
                                Masuk ke Aplikasi
                            </>
                        )}
                    </Button>
                </form>

                <div className="mt-8 text-center text-xs font-handwriting text-pencil border-t border-dashed border-paper-lines/30 pt-4">
                    Urus Diri Sendiri v1.2.0 • Online-Only Mode
                </div>
            </div>
        </div>
    );
};
