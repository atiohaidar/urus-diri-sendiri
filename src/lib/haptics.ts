import { Haptics, ImpactStyle } from '@capacitor/haptics';

export const triggerHaptic = async (style: ImpactStyle = ImpactStyle.Light) => {
    try {
        await Haptics.impact({ style });
    } catch (e) {
        // Fallback for web if needed, or ignore
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(10);
        }
    }
};

export const triggerSuccessHaptic = async () => {
    try {
        await Haptics.notification({ type: 'SUCCESS' as any }); // Type cast if needed depending on version
    } catch (e) {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([50, 50, 50]);
        }
    }
};
