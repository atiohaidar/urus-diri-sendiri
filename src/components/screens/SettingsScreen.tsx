import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Moon, Sun, Download, Upload, Monitor, Settings as SettingsIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportData, importData } from '@/lib/backup';
import { useTheme } from '@/components/theme-provider';
import { useLanguage } from '@/i18n/LanguageContext';
import { toast } from 'sonner';

const SettingsScreen = () => {
    const navigate = useNavigate();
    const { setTheme, theme } = useTheme();
    const { language, setLanguage, t } = useLanguage();
    const [importing, setImporting] = useState(false);

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

                <div className="text-center text-xs text-muted-foreground pt-8">
                    <p>UrusDiri v1.0.0</p>
                </div>
            </main>
        </div>
    );
};

export default SettingsScreen;
