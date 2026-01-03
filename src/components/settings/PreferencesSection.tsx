import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { useLanguage } from '@/i18n/LanguageContext';
import { cn } from '@/lib/utils';

export const PreferencesSection = () => {
    const { setTheme, theme } = useTheme();
    const { language, setLanguage, t } = useLanguage();

    return (
        <div className="space-y-6">
            {/* Language Section - Sticky note style */}
            <section className="bg-card rounded-sm p-6 border-2 border-paper-lines/50 shadow-notebook">
                <h2 className="font-handwriting text-xl text-ink mb-4">{t.settings.language} 🌍</h2>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => setLanguage("id")}
                        className={cn(
                            "flex flex-col items-center gap-2 p-4 rounded-sm transition-all duration-150 font-handwriting",
                            language === 'id'
                                ? "bg-sticky-yellow text-ink shadow-sticky -rotate-1"
                                : "border-2 border-dashed border-paper-lines hover:bg-paper-lines/20"
                        )}
                    >
                        <span className="text-3xl">🇮🇩</span>
                        <span className="text-sm">Bahasa Indonesia</span>
                    </button>
                    <button
                        onClick={() => setLanguage("en")}
                        className={cn(
                            "flex flex-col items-center gap-2 p-4 rounded-sm transition-all duration-150 font-handwriting",
                            language === 'en'
                                ? "bg-sticky-blue text-ink shadow-sticky rotate-1"
                                : "border-2 border-dashed border-paper-lines hover:bg-paper-lines/20"
                        )}
                    >
                        <span className="text-3xl">🇬🇧</span>
                        <span className="text-sm">English</span>
                    </button>
                </div>
            </section>

            {/* Theme Section - Sticky note style */}
            <section className="bg-card rounded-sm p-6 border-2 border-paper-lines/50 shadow-notebook">
                <h2 className="font-handwriting text-xl text-ink mb-4">{t.settings.theme} 🎨</h2>
                <div className="grid grid-cols-3 gap-3">
                    <button
                        onClick={() => setTheme("light")}
                        className={cn(
                            "flex flex-col items-center gap-2 p-3 rounded-sm transition-all duration-150 font-handwriting",
                            theme === 'light'
                                ? "bg-sticky-yellow text-ink shadow-sticky"
                                : "border-2 border-dashed border-paper-lines hover:bg-paper-lines/20"
                        )}
                    >
                        <Sun className="w-6 h-6" />
                        <span className="text-xs">{t.settings.light_mode}</span>
                    </button>
                    <button
                        onClick={() => setTheme("dark")}
                        className={cn(
                            "flex flex-col items-center gap-2 p-3 rounded-sm transition-all duration-150 font-handwriting",
                            theme === 'dark'
                                ? "bg-sticky-pink text-ink shadow-sticky"
                                : "border-2 border-dashed border-paper-lines hover:bg-paper-lines/20"
                        )}
                    >
                        <Moon className="w-6 h-6" />
                        <span className="text-xs">{t.settings.dark_mode}</span>
                    </button>
                    <button
                        onClick={() => setTheme("system")}
                        className={cn(
                            "flex flex-col items-center gap-2 p-3 rounded-sm transition-all duration-150 font-handwriting",
                            theme === 'system'
                                ? "bg-sticky-blue text-ink shadow-sticky"
                                : "border-2 border-dashed border-paper-lines hover:bg-paper-lines/20"
                        )}
                    >
                        <Monitor className="w-6 h-6" />
                        <span className="text-xs">{t.settings.system}</span>
                    </button>
                </div>
            </section>
        </div>
    );
};
