import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, ArrowLeft, Info } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { AuthSection } from '@/components/settings/AuthSection';
import { PreferencesSection } from '@/components/settings/PreferencesSection';
import { CloudLegacySection } from '@/components/settings/CloudLegacySection';
import { DataBackupSection } from '@/components/settings/DataBackupSection';
import { PersonalNotesSection } from '@/components/settings/PersonalNotesSection';
import { Button } from '@/components/ui/button';
import packageJson from '../../../package.json';
import { cn } from '@/lib/utils';

const SettingsScreen = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();

    return (
        <div className="min-h-screen pb-24 md:pb-8 bg-notebook">
            {/* Header - Notebook style */}
            <header className="sticky top-0 z-40 bg-paper border-b-2 border-dashed border-paper-lines pt-safe">
                <div className="container md:max-w-5xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="-ml-2 mr-1 text-pencil hover:text-ink"
                            onClick={() => navigate(-1)}
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div className="p-2 rounded-sm bg-sticky-pink shadow-sticky rotate-2">
                            <SettingsIcon className="w-6 h-6 text-doodle-red" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-handwriting text-ink">
                                <span className="highlight-pink">{t.settings.title}</span> ⚙️
                            </h1>
                            <p className="text-sm font-handwriting text-pencil hidden md:block">{t.settings.data_management}</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container md:max-w-5xl mx-auto px-4 py-6 space-y-6">

                {/* Auth & Account */}
                <AuthSection />

                {/* Theme & Language */}
                <PreferencesSection />

                {/* Legacy Cloud Sync (Google Sheets) */}
                <CloudLegacySection />

                {/* Personal Notes (Secure Storage) */}
                <PersonalNotesSection />

                {/* Local Data Backup */}
                <DataBackupSection />

                {/* Footer / About - Notebook doodle style */}
                <div className="flex flex-col items-center gap-4 py-10">
                    <button
                        onClick={() => navigate('/about')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-sm",
                            "bg-sticky-blue text-ink shadow-sticky -rotate-1",
                            "font-handwriting text-base",
                            "hover:rotate-0 transition-transform duration-150",
                            "will-change-transform"
                        )}
                    >
                        <Info className="w-4 h-4" />
                        <span>{t.about.title}</span>
                    </button>

                    {/* Version info - Handwritten note style */}
                    <div className="text-center space-y-1 font-handwriting">
                        <p className="text-sm text-pencil">
                            UrusDiriSendiri v{packageJson.version} ✏️
                        </p>
                        <p className="text-xs text-pencil/60 italic">
                            "© 2025 • Made with Vibe Coding"
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SettingsScreen;
