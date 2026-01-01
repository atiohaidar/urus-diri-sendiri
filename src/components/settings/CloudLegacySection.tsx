import { useState } from 'react';
import { Cloud, CloudUpload, CloudDownload, Link as LinkIcon, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { getCloudConfig, saveCloudConfig, pushToCloud, pullFromCloud } from '@/lib/storage';
import { useLanguage } from '@/i18n/LanguageContext';

export const CloudLegacySection = () => {
    const { t } = useLanguage();
    const [sheetUrl, setSheetUrl] = useState(getCloudConfig().sheetUrl);
    const [folderUrl, setFolderUrl] = useState(getCloudConfig().folderUrl);
    const [isSyncing, setIsSyncing] = useState(false);

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
    );
};
