import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { AuthSection } from '@/components/settings/AuthSection';
import { PreferencesSection } from '@/components/settings/PreferencesSection';
import { CloudLegacySection } from '@/components/settings/CloudLegacySection';
import { DataBackupSection } from '@/components/settings/DataBackupSection';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import packageJson from '../../../package.json';

const SettingsScreen = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();

    const handleRefresh = async () => {
        // Force re-render by triggering a small state update
        // In a real app, this could sync with cloud or reload settings
        window.location.reload();
    };

    return (
        <PullToRefresh onRefresh={handleRefresh} className="min-h-screen pb-24 md:pb-8">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
                <div className="container md:max-w-5xl mx-auto px-4 py-4">
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

            <main className="container md:max-w-5xl mx-auto px-4 py-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* Auth & Account */}
                <AuthSection />

                {/* Theme & Language */}
                <PreferencesSection />

                {/* Legacy Cloud Sync (Google Sheets) */}
                <CloudLegacySection />

                {/* Local Data Backup */}
                <DataBackupSection />

                {/* Footer / About */}
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
                            UrusDiriSendiri v{packageJson.version}
                        </p>
                        <p className="text-[10px] text-muted-foreground/30">
                            © 2025 • Made with Vibe Coding
                        </p>
                    </div>
                </div>
            </main>
        </PullToRefresh>
    );
};

export default SettingsScreen;

