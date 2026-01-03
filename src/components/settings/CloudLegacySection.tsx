import { useState } from 'react';
import { Cloud, CloudUpload, CloudDownload, Link as LinkIcon, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { getCloudConfig, saveCloudConfig, pushToCloud, pullFromCloud } from '@/lib/storage';
import { useLanguage } from '@/i18n/LanguageContext';
import { cn } from '@/lib/utils';

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
        <section className="bg-card rounded-sm p-6 border-2 border-paper-lines/50 shadow-notebook">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-sm bg-sticky-blue shadow-tape rotate-2">
                    <Cloud className="w-5 h-5 text-ink" />
                </div>
                <h2 className="font-handwriting text-xl text-ink">{t.settings.cloud_title} 📝</h2>
            </div>

            <div className="space-y-4">
                {/* Help box - Sticky note style */}
                <div className="bg-sticky-yellow/20 border-2 border-dashed border-sticky-yellow/50 rounded-sm p-4 space-y-2">
                    <p className="text-sm font-handwriting text-ink">
                        {t.settings.cloud_help}
                    </p>
                    <p className="text-xs font-handwriting text-pencil italic">
                        "{t.settings.cloud_folder_help}"
                    </p>
                </div>

                {/* Sheet URL */}
                <div className="space-y-2">
                    <label className="flex items-center gap-1.5 font-handwriting text-sm text-pencil">
                        <LinkIcon className="w-3 h-3" />
                        {t.settings.cloud_sheet_url}
                    </label>
                    <Input
                        value={sheetUrl}
                        onChange={(e) => setSheetUrl(e.target.value)}
                        placeholder="https://docs.google.com/spreadsheets/d/..."
                        variant="notebook"
                        className="font-handwriting"
                    />
                </div>

                {/* Folder URL */}
                <div className="space-y-2">
                    <label className="flex items-center gap-1.5 font-handwriting text-sm text-pencil">
                        <LinkIcon className="w-3 h-3" />
                        {t.settings.cloud_folder_url}
                    </label>
                    <Input
                        value={folderUrl}
                        onChange={(e) => setFolderUrl(e.target.value)}
                        placeholder="https://drive.google.com/drive/folders/..."
                        variant="notebook"
                        className="font-handwriting"
                    />
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                    <Button
                        variant="outline"
                        onClick={handlePull}
                        disabled={isSyncing || !import.meta.env.VITE_CENTRAL_PROXY_URL}
                        className="h-12 rounded-sm border-2 border-dashed border-pencil/40 gap-2 font-handwriting hover:bg-paper-lines/20"
                    >
                        <CloudDownload className="w-4 h-4" />
                        {t.settings.cloud_pull}
                    </Button>
                    <Button
                        onClick={handlePush}
                        disabled={isSyncing || !import.meta.env.VITE_CENTRAL_PROXY_URL}
                        className="h-12 rounded-sm gap-2 font-handwriting bg-doodle-primary hover:bg-doodle-primary/90 text-white shadow-notebook"
                    >
                        <CloudUpload className="w-4 h-4" />
                        {t.settings.cloud_push}
                    </Button>
                </div>

                {/* Warning */}
                {!import.meta.env.VITE_CENTRAL_PROXY_URL && (
                    <div className="bg-doodle-red/10 border-2 border-dashed border-doodle-red/30 rounded-sm p-3">
                        <p className="text-sm font-handwriting text-doodle-red flex items-center gap-1.5">
                            ⚠️ Belum bisa dipake, ENV nya belum di setting
                        </p>
                    </div>
                )}

                {/* Save config button */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full font-handwriting text-sm text-pencil hover:text-ink"
                    onClick={handleCloudSave}
                >
                    💾 {t.settings.cloud_save_config}
                </Button>
            </div>
        </section>
    );
};
