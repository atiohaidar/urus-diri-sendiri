import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { useLanguage } from '@/i18n/LanguageContext';

export const PreferencesSection = () => {
    const { setTheme, theme } = useTheme();
    const { language, setLanguage, t } = useLanguage();

    return (
        <div className="space-y-6">
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
        </div>
    );
};
