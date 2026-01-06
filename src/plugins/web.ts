import { WebPlugin } from '@capacitor/core';
import type { AppUpdaterPlugin } from './appUpdater';

export class AppUpdaterWeb extends WebPlugin implements AppUpdaterPlugin {
    async installApk(): Promise<{ success: boolean }> {
        console.warn('AppUpdater.installApk() is not available on web');
        return { success: false };
    }
}
