import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Download, Smartphone, Calendar } from 'lucide-react';
import { UpdateInfo, formatFileSize } from '@/lib/updateChecker';
import { useLanguage } from '@/i18n/LanguageContext';
import { format } from 'date-fns';

interface UpdateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    updateInfo: UpdateInfo | null;
    onDownload: () => void;
    downloading: boolean;
    downloadProgress: number;
}

export const UpdateDialog = ({
    open,
    onOpenChange,
    updateInfo,
    onDownload,
    downloading,
    downloadProgress,
}: UpdateDialogProps) => {
    const { t } = useLanguage();

    if (!updateInfo || !updateInfo.available) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Smartphone className="w-5 h-5 text-primary" />
                        {t.updates.new_version}
                    </DialogTitle>
                    <DialogDescription>
                        {t.updates.current_version}: v{updateInfo.currentVersion}
                        <br />
                        {t.updates.new_version}: v{updateInfo.latestVersion}
                        {updateInfo.buildNumber && ` (Build ${updateInfo.buildNumber})`}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* File Info */}
                    <div className="flex items-center justify-between text-sm">
                        {updateInfo.fileSize && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Download className="w-4 h-4" />
                                <span>{t.updates.file_size}: {formatFileSize(updateInfo.fileSize)}</span>
                            </div>
                        )}
                    </div>

                    {/* Release Notes */}
                    {updateInfo.releaseNotes && (
                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold">{t.updates.whats_new}</h4>
                            <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3 max-h-32 overflow-y-auto">
                                {updateInfo.releaseNotes}
                            </div>
                        </div>
                    )}

                    {/* Download Progress */}
                    {downloading && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">{t.updates.downloading}</span>
                                <span className="font-medium">{downloadProgress}%</span>
                            </div>
                            <Progress value={downloadProgress} className="h-2" />
                        </div>
                    )}
                </div>

                <DialogFooter className="flex-row gap-2 sm:gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={downloading}
                        className="flex-1"
                    >
                        {t.updates.cancel_button}
                    </Button>
                    <Button
                        onClick={onDownload}
                        disabled={downloading || !updateInfo.downloadUrl}
                        className="flex-1"
                    >
                        {downloading ? t.updates.downloading : t.updates.download_button}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
