import { useState, useEffect } from 'react';

import { saveImage } from '@/lib/idb';
import { saveLog } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { triggerHaptic, triggerSuccessHaptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { useNavigate } from 'react-router-dom';
import { compressImage } from '@/lib/image-utils';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useCamera } from '@/hooks/useCamera';
import { useLanguage } from '@/i18n/LanguageContext';
import { triggerTimerFinished, requestNotificationPermission, registerNotificationActions, scheduleTimerNotification, cancelTimerNotification, showOngoingNotification, cancelOngoingNotification } from '@/lib/notification-utils';
import { LocalNotifications } from '@capacitor/local-notifications';
import { LogSuccess } from '@/components/log-creator/LogSuccess';
import { LogCameraView } from '@/components/log-creator/LogCameraView';
import { LogHeader } from '@/components/log-creator/LogHeader';
import { StandardLogInput } from '@/components/log-creator/StandardLogInput';
import { TimerInput } from '@/components/log-creator/TimerInput';
import { TimerRunning } from '@/components/log-creator/TimerRunning';
import { TimerFinished } from '@/components/log-creator/TimerFinished';
import { LogActionControls } from '@/components/log-creator/LogActionControls';

const LogCreatorPage = () => {
    const navigate = useNavigate();
    const [caption, setCaption] = useState('');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [flashEffect, setFlashEffect] = useState(false);
    const [showExitDialog, setShowExitDialog] = useState(false);

    // Notebook-themed status colors using app design tokens
    const statusColors = [
        { bg: 'bg-sticky-yellow', text: 'text-ink', name: 'Kuning' },
        { bg: 'bg-sticky-pink', text: 'text-ink', name: 'Pink' },
        { bg: 'bg-sticky-blue', text: 'text-ink', name: 'Biru' },
        { bg: 'bg-sticky-green', text: 'text-ink', name: 'Hijau' },
        { bg: 'bg-[hsl(var(--paper))]', text: 'text-ink', name: 'Putih' },
        { bg: 'bg-[hsl(30_70%_85%)]', text: 'text-ink', name: 'Krem' }
    ];
    const [colorIndex, setColorIndex] = useState(0);

    // Timer Mode State
    const [isTimerMode, setIsTimerMode] = useState(false);
    const [timerStatus, setTimerStatus] = useState<'input' | 'running' | 'finished'>('input');
    const [timerDuration, setTimerDuration] = useState(600); // in seconds (10 minutes default)
    const [timeLeft, setTimeLeft] = useState(0);
    const [reality, setReality] = useState('');
    const [timerStartTime, setTimerStartTime] = useState<Date | null>(null);
    const [timerTargetTime, setTimerTargetTime] = useState<Date | null>(null); // New: Target completion time
    const [actualDuration, setActualDuration] = useState(0); // Actual time spent in seconds

    // Stepper state for custom time
    const [customMinutes, setCustomMinutes] = useState(10);
    const [customSeconds, setCustomSeconds] = useState(0);

    // Zen Mode State (Auto-hide UI)
    const [isControlsVisible, setIsControlsVisible] = useState(true);

    useEffect(() => {
        if (timerStatus !== 'running') {
            setIsControlsVisible(true);
            return;
        }

        let timeout: NodeJS.Timeout;
        const resetTimer = () => {
            setIsControlsVisible(true);
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                setIsControlsVisible(false);
            }, 3000); // Hide after 3 seconds of inactivity
        };

        const events = ['mousemove', 'click', 'touchstart', 'keydown'];
        events.forEach(event => window.addEventListener(event, resetTimer));

        resetTimer();

        return () => {
            clearTimeout(timeout);
            events.forEach(event => window.removeEventListener(event, resetTimer));
        };
    }, [timerStatus]);

    // Hooks - must be declared before being used in effects
    const camera = useCamera({ initialFacing: 'environment' });
    const { toast } = useToast();
    const { t } = useLanguage();

    // Request notification permission and register actions on mount
    useEffect(() => {
        requestNotificationPermission();
        registerNotificationActions(); // Register inline reply actions for GT5!
    }, []);

    // Note: Notification listener moved to Global AppNotificationListener
    // to support auto-reply from anywhere in the app!

    // Robust Timer Logic
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isTimerMode && timerStatus === 'running' && timerTargetTime) {
            // Update time left every second based on target time
            interval = setInterval(() => {
                const now = new Date();
                const secondsLeft = Math.ceil((timerTargetTime.getTime() - now.getTime()) / 1000);

                if (secondsLeft <= 0) {
                    setTimeLeft(0);
                    setTimerStatus('finished');
                    // No need to trigger notification here mechanically as it was scheduled upfront!
                    // But we still play sound/haptic for foreground user
                    triggerSuccessHaptic();
                    cancelOngoingNotification(); // Clear the "Running" notification

                    // Clear the scheduled notification to avoid double trigger if user is staring at screen? 
                    // No, let it be. System handles it. But we might want to ensure sound plays.
                } else {
                    setTimeLeft(secondsLeft);
                }
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [isTimerMode, timerStatus, timerTargetTime]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.max(0, seconds % 60); // Prevent negative seconds
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const startTimer = async () => {
        if (!caption.trim()) return;

        // Web Permission Validity Check
        if (!Capacitor.isNativePlatform() && 'Notification' in window) {
            if (Notification.permission === 'denied') {
                toast({
                    title: "Notifikasi Diblokir",
                    description: "Mohon izinkan notifikasi via ikon Gembok di URL browser agar timer berjalan optimal.",
                    variant: "destructive"
                });
                // We let them continue, but warned them
            } else if (Notification.permission === 'default') {
                const result = await Notification.requestPermission();
                if (result !== 'granted') {
                    toast({
                        title: "Notifikasi Tidak Diizinkan",
                        description: "Timer akan berjalan tanpa notifikasi desktop.",
                        variant: "destructive"
                    });
                }
            }
        }

        const now = new Date();
        const targetDate = new Date(now.getTime() + timerDuration * 1000);

        setTimeLeft(timerDuration);
        setTimerStartTime(now);
        setTimerTargetTime(targetDate);
        setTimerStatus('running');
        triggerHaptic();

        // Schedule Notification Upfront!
        // This guarantees it fires even if phone sleeps or app backgrounded
        await scheduleTimerNotification(caption, targetDate, timerDuration);

        // NOTE: We don't show sticky notification immediately anymore (Smart Notification)
        // It will be triggered by appStateChange if user goes to background
    };

    // Smart Notification: Only show "Focusing" notification when app is in background
    useEffect(() => {
        let listener: any;

        const setupListener = async () => {
            listener = await CapacitorApp.addListener('appStateChange', async ({ isActive }) => {
                if (timerStatus === 'running' && timerTargetTime) {
                    if (!isActive) {
                        // App goes background -> Show Notification
                        await showOngoingNotification(caption, timerTargetTime);
                    } else {
                        // App comes foreground -> Hide Notification for cleaner UI
                        await cancelOngoingNotification();
                    }
                }
            });
        };

        setupListener();

        // Also handle Web visibility change (tab switch)
        const handleVisibilityChange = () => {
            if (timerStatus === 'running' && timerTargetTime) {
                if (document.hidden) {
                    showOngoingNotification(caption, timerTargetTime);
                } else {
                    cancelOngoingNotification();
                }
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            if (listener) listener.remove();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            cancelOngoingNotification(); // Cleanup when component unmounts
        };
    }, [timerStatus, timerTargetTime, caption]);


    const stopTimer = () => {
        // Calculate actual duration when stopped early
        const actualTimeSpent = timerDuration - timeLeft;
        setActualDuration(actualTimeSpent);
        setTimerStatus('finished'); // Go to finished state to input reality
        triggerHaptic();

        // Cancel the scheduled notification because user stopped it manually!
        cancelTimerNotification();
        cancelOngoingNotification();
    };

    // Format duration untuk display yang bagus
    const formatDuration = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;

        if (mins === 0) {
            return `${secs} detik`;
        } else if (secs === 0) {
            return `${mins} menit`;
        } else {
            return `${mins} menit ${secs} detik`;
        }
    };



    // Show error if camera access failed
    useEffect(() => {
        if (camera.error) {
            toast({ title: camera.error, variant: "destructive" });
        }
    }, [camera.error, toast]);

    const handleBack = () => {
        const isDirty = (
            (caption.trim().length > 0 || imagePreview !== null) ||
            (isTimerMode && (timerStatus === 'running' || timerStatus === 'finished'))
        );

        if (isDirty && !isSubmitting && !showSuccess) {
            setShowExitDialog(true);
        } else {
            navigate(-1);
        }
    };

    // Hardware Back Button Listener
    useEffect(() => {
        let listener: any;
        const setupListener = async () => {
            listener = await CapacitorApp.addListener('backButton', () => {
                if (camera.isActive) {
                    camera.stop();
                } else if (showExitDialog) {
                    setShowExitDialog(false);
                } else {
                    handleBack();
                }
            });
        };
        setupListener();

        return () => {
            if (listener) listener.remove();
        };
    }, [caption, imagePreview, camera.isActive, showSuccess, showExitDialog, isTimerMode, timerStatus]);

    // Prevent accidental back/reload when timer is active
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            const isRunning = isTimerMode && (timerStatus === 'running' || timerStatus === 'finished');
            const hasContent = caption.trim().length > 0 || imagePreview !== null;

            if (isRunning || (hasContent && !isSubmitting && !showSuccess)) {
                e.preventDefault();
                e.returnValue = ''; // Trigger browser confirmation dialog
                return '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isTimerMode, timerStatus, caption, imagePreview, isSubmitting, showSuccess]);
    const handleCapturePhoto = async () => {
        setFlashEffect(true);
        setTimeout(() => setFlashEffect(false), 150);
        triggerHaptic();

        const base64 = await camera.capturePhoto(0.85);
        if (base64) {
            const compressed = await compressImage(base64, 1080, 0.7);
            setImagePreview(compressed);
            camera.stop();
        }
    };

    const nextBgColor = () => {
        setColorIndex((prev) => (prev + 1) % statusColors.length);
        triggerHaptic();
    };

    const handlePickGallery = async () => {
        try {
            const image = await CapacitorCamera.getPhoto({
                quality: 80,
                allowEditing: false,
                resultType: CameraResultType.Base64,
                source: CameraSource.Photos,
            });
            if (image.base64String) {
                const base64Data = `data:image/${image.format};base64,${image.base64String}`;
                const compressed = await compressImage(base64Data, 1080, 0.7);
                setImagePreview(compressed);
                if (camera.isActive) camera.stop();
            }
        } catch (e) {
            console.log('Pick cancelled');
        }
    };

    const handleSubmit = async () => {
        if (!isTimerMode && !caption.trim() && !imagePreview) return;
        if (isTimerMode && (!caption.trim() || !reality.trim())) return;

        setIsSubmitting(true);
        triggerHaptic();
        try {
            let mediaId;
            if (imagePreview) {
                mediaId = await saveImage(imagePreview);
            }

            let logContent = caption;
            if (isTimerMode && timerStartTime) {
                // Format waktu mulai
                const startTimeFormatted = timerStartTime.toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
                const dateFormatted = timerStartTime.toLocaleDateString('id-ID', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                });

                // Determine actual duration (could be stopped early or completed)
                const finalDuration = actualDuration > 0 ? actualDuration : timerDuration;
                const wasStoppedEarly = actualDuration > 0 && actualDuration < timerDuration;

                logContent = `⏱️ Sesi Fokus${wasStoppedEarly ? ' (Dihentikan Lebih Awal)' : ''}\n` +
                    `📅 ${dateFormatted}\n` +
                    `🕐 Mulai: ${startTimeFormatted}\n` +
                    `🎯 Target: ${formatDuration(timerDuration)}\n` +
                    `⏰ Realisasi: ${formatDuration(finalDuration)}${wasStoppedEarly ? ' ⚠️' : ' ✅'}\n\n` +
                    `💭 Niat:\n${caption}\n\n` +
                    `✍️ Realita:\n${reality}`;
            }

            saveLog({
                type: imagePreview ? 'photo' : 'text',
                content: logContent,
                mediaId: mediaId,
            });

            // Show Success Animation
            setShowSuccess(true);
            triggerSuccessHaptic();

            // Wait for animation before closing
            setTimeout(() => {
                navigate('/history', { state: { tab: 'logs' }, replace: true });
            }, 1200);

        } catch (e) {
            toast({ title: t.log_creator.save_error, variant: "destructive" });
            setIsSubmitting(false);
        }
    };

    return (
        <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
            <div className={cn(
                "fixed inset-0 z-50 flex flex-col transition-colors duration-500 overflow-hidden",
                imagePreview ? "bg-black" : statusColors[colorIndex].bg
            )}>
                <LogSuccess show={showSuccess} />

                <LogCameraView
                    camera={camera}
                    flashEffect={flashEffect}
                    onPickGallery={handlePickGallery}
                    onCapture={handleCapturePhoto}
                />

                {!camera.isActive && (
                    <LogHeader
                        isControlsVisible={isControlsVisible}
                        timerStatus={timerStatus}
                        onBack={handleBack}
                        imagePreview={imagePreview}
                        statusColor={statusColors[colorIndex]}
                        isTimerMode={isTimerMode}
                        setIsTimerMode={setIsTimerMode}
                        onResetTimer={() => {
                            setTimerStatus('input');
                            setCaption('');
                            setImagePreview(null);
                            setTimerStartTime(null);
                            setReality('');
                            setActualDuration(0);
                            setCustomMinutes(10);
                            setCustomSeconds(0);
                        }}
                        onNextColor={nextBgColor}
                        onClearImage={() => setImagePreview(null)}
                    />
                )}

                {/* Main Content Canvas Area - Notebook Style */}
                {!camera.isActive && (
                    <div className="flex-1 relative flex flex-col items-center pt-8 px-6 md:px-8 w-full max-w-lg mx-auto overflow-y-auto">
                        {!isTimerMode ? (
                            <>
                                {imagePreview && (
                                    <img
                                        src={imagePreview}
                                        className="absolute inset-0 w-full h-full object-cover animate-in fade-in zoom-in-105 duration-700"
                                        alt="Preview"
                                        style={{ filter: 'brightness(0.7)' }}
                                    />
                                )}

                                <StandardLogInput
                                    imagePreview={imagePreview}
                                    statusColor={statusColors[colorIndex]}
                                    caption={caption}
                                    setCaption={setCaption}
                                />
                            </>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-5">
                                {timerStatus === 'input' && (
                                    <TimerInput
                                        statusColor={statusColors[colorIndex]}
                                        caption={caption}
                                        setCaption={setCaption}
                                        timerDuration={timerDuration}
                                        setTimerDuration={setTimerDuration}
                                        customMinutes={customMinutes}
                                        setCustomMinutes={setCustomMinutes}
                                        customSeconds={customSeconds}
                                        setCustomSeconds={setCustomSeconds}
                                        triggerHaptic={triggerHaptic}
                                        formatDuration={formatDuration}
                                    />
                                )}

                                {timerStatus === 'running' && (
                                    <TimerRunning
                                        statusColor={statusColors[colorIndex]}
                                        timeLeft={timeLeft}
                                        timerDuration={timerDuration}
                                        caption={caption}
                                        formatTime={formatTime}
                                    />
                                )}

                                {timerStatus === 'finished' && (
                                    <TimerFinished
                                        statusColor={statusColors[colorIndex]}
                                        caption={caption}
                                        reality={reality}
                                        setReality={setReality}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Bottom Action Buttons - Notebook Style */}
                <LogActionControls
                    isControlsVisible={isControlsVisible}
                    timerStatus={timerStatus}
                    isTimerMode={isTimerMode}
                    camera={camera}
                    imagePreview={imagePreview}
                    statusColor={statusColors[colorIndex]}
                    isSubmitting={isSubmitting}
                    caption={caption}
                    reality={reality}
                    timerDuration={timerDuration}
                    onPickGallery={handlePickGallery}
                    onSubmit={handleSubmit}
                    onStartTimer={startTimer}
                    onStopTimer={stopTimer}
                />
            </div>

            <AlertDialogContent className="rounded-2xl max-w-[80vw]">
                <AlertDialogHeader>
                    <AlertDialogTitle>{t.log_creator.discard_title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t.log_creator.discard_desc}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => {
                        cancelTimerNotification();
                        cancelOngoingNotification();
                        navigate(-1);
                    }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        {t.log_creator.discard_confirm}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default LogCreatorPage;
