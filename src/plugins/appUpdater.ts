import { registerPlugin } from '@capacitor/core';

export interface AppUpdaterPlugin {
    /**
     * Install an APK file
     * @param options - Object containing the file path
     * @returns Promise that resolves when installation is triggered
     */
    installApk(options: { filePath: string }): Promise<{ success: boolean }>;
}

const AppUpdater = registerPlugin<AppUpdaterPlugin>('AppUpdater', {
    web: () => import('@/plugins/web').then(m => new m.AppUpdaterWeb()),
});

export default AppUpdater;
