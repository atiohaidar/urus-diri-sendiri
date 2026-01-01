import { useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { exportData, importData } from '@/lib/backup';
import { useLanguage } from '@/i18n/LanguageContext';

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
    );
};
