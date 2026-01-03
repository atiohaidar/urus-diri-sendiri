import { useState } from 'react';
import { Download, Upload, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { exportData, importData } from '@/lib/backup';
import { useLanguage } from '@/i18n/LanguageContext';
import { cn } from '@/lib/utils';

export const DataBackupSection = () => {
    const { t } = useLanguage();
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
        <section className="bg-card rounded-sm p-6 border-2 border-paper-lines/50 shadow-notebook">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-sm bg-sticky-green shadow-tape -rotate-2">
                    <HardDrive className="w-5 h-5 text-ink" />
                </div>
                <h2 className="font-handwriting text-xl text-ink">{t.settings.data_management} 💾</h2>
            </div>
            <div className="space-y-3">
                {/* Export button */}
                <Button
                    variant="outline"
                    className={cn(
                        "w-full justify-start gap-3 h-14 rounded-sm",
                        "border-2 border-dashed border-pencil/40",
                        "hover:bg-paper-lines/20 font-handwriting"
                    )}
                    onClick={handleExport}
                >
                    <div className="p-2 rounded-sm bg-sticky-blue/50 -rotate-2">
                        <Download className="w-5 h-5 text-ink" />
                    </div>
                    <div className="flex flex-col items-start text-left">
                        <span className="font-handwriting text-ink">{t.settings.backup_title}</span>
                        <span className="text-xs font-handwriting text-pencil">{t.settings.backup_desc}</span>
                    </div>
                </Button>

                {/* Import button */}
                <div className="relative">
                    <Button
                        variant="outline"
                        className={cn(
                            "w-full justify-start gap-3 h-14 rounded-sm",
                            "border-2 border-dashed border-pencil/40",
                            "hover:bg-paper-lines/20 font-handwriting"
                        )}
                        disabled={importing}
                    >
                        <div className="p-2 rounded-sm bg-sticky-pink/50 rotate-2">
                            <Upload className="w-5 h-5 text-ink" />
                        </div>
                        <div className="flex flex-col items-start text-left">
                            <span className="font-handwriting text-ink">{t.settings.restore_title}</span>
                            <span className="text-xs font-handwriting text-pencil">{t.settings.restore_desc}</span>
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
    );
};
