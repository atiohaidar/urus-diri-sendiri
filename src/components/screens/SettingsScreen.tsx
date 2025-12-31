import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Moon, Sun, Download, Upload, Monitor, Settings as SettingsIcon, Cloud, CloudUpload, CloudDownload, Key, Link as LinkIcon, Sparkles, ChevronRight, LogOut, LogIn, Mail, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { exportData, importData } from '@/lib/backup';
import { getCloudConfig, saveCloudConfig, pushToCloud, pullFromCloud, getIsCloudActive } from '@/lib/storage';
import { useTheme } from '@/components/theme-provider';
import { useLanguage } from '@/i18n/LanguageContext';
import { toast } from 'sonner';
import { supabase, signInWithGoogle, signOut } from '@/lib/supabase';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const SettingsScreen = () => {
    const navigate = useNavigate();
    const { setTheme, theme } = useTheme();
    const { language, setLanguage, t } = useLanguage();
    const [importing, setImporting] = useState(false);
    const [sheetUrl, setSheetUrl] = useState(getCloudConfig().sheetUrl);
    const [folderUrl, setFolderUrl] = useState(getCloudConfig().folderUrl);
    const [isSyncing, setIsSyncing] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [loginLoading, setLoginLoading] = useState(false);

    useEffect(() => {
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
        setLoginLoading(true);
        try {
            await signInWithGoogle();
        } catch (error: any) {
            toast.error(error.message || "Failed to login");
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

    const handleExport = () => {
        if (exportData()) {
            toast.success(t.settings.backup_success);
        } else {
            toast.error(t.settings.backup_error);
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImporting(true);
        try {
            await importData(file);
            toast.success(t.settings.import_success);
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } catch (error) {
            toast.error(t.settings.import_error);
            setImporting(false);
        }
    };

    const handleCloudSave = () => {
        saveCloudConfig(sheetUrl, folderUrl);
        toast.success(t.settings.cloud_save_config);
    };

    const handlePush = async () => {
        if (!sheetUrl) {
            toast.error("Isi Link Spreadsheet terlebih dahulu!");
            return;
        }
        setIsSyncing(true);
        try {
            saveCloudConfig(sheetUrl, folderUrl);
            const success = await pushToCloud(sheetUrl, folderUrl);
            if (success) {
                toast.success(t.settings.cloud_success_push);
            } else {
                throw new Error(t.settings.cloud_error_permission);
            }
        } catch (error: any) {
            toast.error(error.message || t.settings.import_error);
        } finally {
            setIsSyncing(false);
        }
    };

    const handlePull = async () => {
        if (!sheetUrl) {
            toast.error("Isi Link Spreadsheet terlebih dahulu!");
            return;
        }
        setIsSyncing(true);
        try {
            saveCloudConfig(sheetUrl, folderUrl);
            await pullFromCloud(sheetUrl);
            toast.success(t.settings.cloud_success_pull);
            setTimeout(() => window.location.reload(), 1500);
        } catch (error: any) {
            toast.error(error.message || t.settings.import_error);
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="min-h-screen pb-24 md:pb-8">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
                <div className="container max-w-md md:max-w-5xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/10">
                            <SettingsIcon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-foreground">{t.settings.title}</h1>
                            <p className="text-sm text-muted-foreground hidden md:block">{t.settings.data_management}</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container max-w-md md:max-w-5xl mx-auto px-4 py-6 space-y-6">
                {/* Cloud Account Section */}
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
                                <AlertDialogContent className="rounded-3xl border-border/50">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="text-xl font-bold flex items-center gap-2">
                                            <Cloud className="w-6 h-6 text-primary" />
                                            {t.settings.account_warning_title}
                                        </AlertDialogTitle>
                                        <AlertDialogDescription className="text-base text-muted-foreground pt-2">
                                            {t.settings.account_warning_desc}
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="flex-col sm:flex-row gap-2 pt-4">
                                        <AlertDialogCancel className="h-12 rounded-2xl font-bold">
                                            {t.common.cancel}
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={handleLogin}
                                            className="h-12 rounded-2xl font-bold bg-primary shadow-lg shadow-primary/20"
                                        >
                                            {t.settings.account_login}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    )}
                </section>
                {/* Language Section */}
                <section className="bg-card rounded-3xl p-6 border border-border/50 shadow-sm">
                    <h2 className="text-lg font-semibold mb-4">{t.settings.language}</h2>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setLanguage("id")}
                            className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${language === 'id' ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-muted'
                                }`}
                        >
                            <span className="text-2xl">🇮🇩</span>
                            <span className="text-xs font-medium">Bahasa Indonesia</span>
                        </button>
                        <button
                            onClick={() => setLanguage("en")}
                            className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${language === 'en' ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-muted'
                                }`}
                        >
                            <span className="text-2xl">🇬🇧</span>
                            <span className="text-xs font-medium">English</span>
                        </button>
                    </div>
                </section>

                {/* Theme Section */}
                <section className="bg-card rounded-3xl p-6 border border-border/50 shadow-sm">
                    <h2 className="text-lg font-semibold mb-4">{t.settings.theme}</h2>
                    <div className="grid grid-cols-3 gap-3">
                        <button
                            onClick={() => setTheme("light")}
                            className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${theme === 'light' ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-muted'
                                }`}
                        >
                            <Sun className="w-6 h-6" />
                            <span className="text-xs font-medium">{t.settings.light_mode}</span>
                        </button>
                        <button
                            onClick={() => setTheme("dark")}
                            className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${theme === 'dark' ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-muted'
                                }`}
                        >
                            <Moon className="w-6 h-6" />
                            <span className="text-xs font-medium">{t.settings.dark_mode}</span>
                        </button>
                        <button
                            onClick={() => setTheme("system")}
                            className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${theme === 'system' ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-muted'
                                }`}
                        >
                            <Monitor className="w-6 h-6" />
                            <span className="text-xs font-medium">{t.settings.system}</span>
                        </button>
                    </div>
                </section>

                {/* Cloud Sync Section */}
                <section className="bg-card rounded-3xl p-6 border border-border/50 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Cloud className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-semibold">{t.settings.cloud_title}</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 space-y-2">
                            <p className="text-xs text-primary font-medium leading-relaxed">
                                {t.settings.cloud_help}
                            </p>
                            <p className="text-[10px] text-primary/70 leading-relaxed italic">
                                {t.settings.cloud_folder_help}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                                <LinkIcon className="w-3 h-3" />
                                {t.settings.cloud_sheet_url}
                            </label>
                            <Input
                                value={sheetUrl}
                                onChange={(e) => setSheetUrl(e.target.value)}
                                placeholder="https://docs.google.com/spreadsheets/d/..."
                                className="h-11 rounded-xl bg-muted/30 border-0 focus-visible:ring-primary/30"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                                <LinkIcon className="w-3 h-3" />
                                {t.settings.cloud_folder_url}
                            </label>
                            <Input
                                value={folderUrl}
                                onChange={(e) => setFolderUrl(e.target.value)}
                                placeholder="https://drive.google.com/drive/folders/..."
                                className="h-11 rounded-xl bg-muted/30 border-0 focus-visible:ring-primary/30"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <Button
                                variant="outline"
                                onClick={handlePull}
                                disabled={isSyncing || !import.meta.env.VITE_CENTRAL_PROXY_URL}
                                className="h-12 rounded-xl border-dashed border-2 gap-2"
                            >
                                <CloudDownload className="w-4 h-4" />
                                {t.settings.cloud_pull}
                            </Button>
                            <Button
                                onClick={handlePush}
                                disabled={isSyncing || !import.meta.env.VITE_CENTRAL_PROXY_URL}
                                className="h-12 rounded-xl shadow-lg shadow-primary/20 gap-2"
                            >
                                <CloudUpload className="w-4 h-4" />
                                {t.settings.cloud_push}
                            </Button>
                        </div>

                        {!import.meta.env.VITE_CENTRAL_PROXY_URL && (
                            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3">
                                <p className="text-[10px] text-destructive font-semibold flex items-center gap-1.5">
                                    ⚠️ Belum bisa dipake, soalnya ENV nya belum di setting
                                </p>
                            </div>
                        )}

                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-xs text-muted-foreground hover:text-primary"
                            onClick={handleCloudSave}
                        >
                            {t.settings.cloud_save_config}
                        </Button>
                    </div>
                </section>

                {/* Data Section */}
                <section className="bg-card rounded-3xl p-6 border border-border/50 shadow-sm">
                    <h2 className="text-lg font-semibold mb-4">{t.settings.data_management}</h2>
                    <div className="space-y-3">
                        <Button
                            variant="outline"
                            className="w-full justify-start gap-3 h-12 rounded-xl"
                            onClick={handleExport}
                        >
                            <Download className="w-5 h-5 text-muted-foreground" />
                            <div className="flex flex-col items-start text-left">
                                <span className="font-medium">{t.settings.backup_title}</span>
                                <span className="text-xs text-muted-foreground">{t.settings.backup_desc}</span>
                            </div>
                        </Button>

                        <div className="relative">
                            <Button
                                variant="outline"
                                className="w-full justify-start gap-3 h-12 rounded-xl"
                                disabled={importing}
                            >
                                <Upload className="w-5 h-5 text-muted-foreground" />
                                <div className="flex flex-col items-start text-left">
                                    <span className="font-medium">{t.settings.restore_title}</span>
                                    <span className="text-xs text-muted-foreground">{t.settings.restore_desc}</span>
                                </div>
                            </Button>
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleImport}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                disabled={importing}
                            />
                        </div>
                    </div>
                </section>

                <div className="flex flex-col items-center gap-4 py-10">
                    <button
                        onClick={() => navigate('/about')}
                        className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-all group scale-95 hover:scale-100"
                    >
                        <div className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center font-serif italic font-black text-lg">
                            !
                        </div>
                        <span className="text-sm font-bold tracking-tight uppercase">
                            {t.about.title}
                        </span>
                    </button>

                    <div className="text-center space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground/40 tracking-widest uppercase">
                            UrusDiriSendiri v1.1.0
                        </p>
                        <p className="text-[10px] text-muted-foreground/30">
                            © 2025 • Made with Vibe Coding
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SettingsScreen;
