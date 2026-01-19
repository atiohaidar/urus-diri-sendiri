import { useState, useEffect } from 'react';
import { Camera, Send, X, Image as ImageIcon, Type, Sparkles, ChevronLeft, FlipHorizontal, Palette, Check, Timer, Play, CircleStop, History, Feather } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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

    // Hooks - must be declared before being used in effects
    const camera = useCamera({ initialFacing: 'environment' });
    const { toast } = useToast();
    const { t } = useLanguage();

    // Request notification permission and register actions on mount
    useEffect(() => {
        requestNotificationPermission();
        registerNotificationActions(); // Register inline reply actions for GT5!
    }, []);

    // Listen for notification action performed (inline reply from GT5!)
    useEffect(() => {
        let listenerHandle: any;

        const setupListener = async () => {
            listenerHandle = await LocalNotifications.addListener(
                'localNotificationActionPerformed',
                (notification) => {
                    const { actionId, inputValue, notification: notif } = notification;

                    // Handle inline reply from notification (GT5 smartwatch!)
                    if (actionId === 'reply' && inputValue) {
                        // User typed reality from GT5!
                        setReality(inputValue);
                        setIsTimerMode(true);
                        setTimerStatus('finished');
                        setCaption(notif.extra?.intention || '');

                        toast({
                            title: '✅ Realita diterima dari notifikasi!',
                            description: inputValue
                        });
                    }
                    // Handle "Buka App" button
                    else if (actionId === 'open') {
                        setIsTimerMode(true);
                        setTimerStatus('finished');
                        setCaption(notif.extra?.intention || '');
                    }
                    // Handle "Stop" from ongoing notification
                    else if (actionId === 'stop_timer') {
                        cancelOngoingNotification();
                        cancelTimerNotification();
                        setTimerStatus('finished');
                        setIsTimerMode(true);
                        setCaption(notif.extra?.intention || '');
                        // Note: unable to calculate exact actualDuration here due to closure, 
                        // but user can edit report.
                    }
                }
            );
        };

        setupListener();

        return () => {
            if (listenerHandle) {
                listenerHandle.remove();
            }
        };
    }, [toast]);

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
        await scheduleTimerNotification(caption, targetDate);

        // Show Sticky Notification
        await showOngoingNotification(caption, targetDate);
    };

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

    // Keyboard handling for mobile
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    useEffect(() => {
        if (!window.visualViewport) return;
        const handleResize = () => {
            const viewport = window.visualViewport;
            if (viewport) {
                const heightDiff = window.innerHeight - viewport.height;
                setKeyboardHeight(heightDiff > 100 ? heightDiff : 0);
            }
        };
        window.visualViewport.addEventListener('resize', handleResize);
        return () => window.visualViewport?.removeEventListener('resize', handleResize);
    }, []);

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
                {/* Success Overlay */}
                {showSuccess && (
                    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="flex flex-col items-center animate-in zoom-in-50 duration-500 slide-in-from-bottom-10">
                            <div className="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center shadow-2xl shadow-emerald-500/50 mb-4">
                                <Check className="w-12 h-12 text-white animate-in zoom-in duration-300 delay-200" strokeWidth={3} />
                            </div>
                            <h2 className="text-2xl font-bold text-white tracking-tight animate-in fade-in slide-in-from-bottom-2 delay-300">
                                {t.log_creator.saved}
                            </h2>
                        </div>
                    </div>
                )}

                {/* Native Camera View */}
                {camera.isActive && (
                    <div className="absolute inset-0 z-10 bg-black">
                        <video
                            ref={camera.videoRef}
                            autoPlay
                            playsInline
                            className={cn("w-full h-full object-cover", camera.facing === 'user' && "scale-x-[-1]")}
                        />
                        {flashEffect && <div className="absolute inset-0 bg-white z-20" />}

                        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-30 safe-top">
                            <button onClick={camera.stop} className="p-3 bg-black/30 backdrop-blur-md rounded-full text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 p-12 flex justify-around items-center z-30 safe-bottom">
                            <button onClick={handlePickGallery} className="p-4 bg-white/10 backdrop-blur-md rounded-full text-white active:scale-90 transition-transform">
                                <ImageIcon className="w-7 h-7" />
                            </button>

                            <button
                                onClick={handleCapturePhoto}
                                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1 active:scale-95 transition-all shadow-xl"
                            >
                                <div className="w-full h-full bg-white rounded-full" />
                            </button>

                            <button
                                onClick={camera.switchCamera}
                                className="p-4 bg-white/10 backdrop-blur-md rounded-full text-white active:scale-90 transition-transform"
                            >
                                <FlipHorizontal className="w-7 h-7" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Header Controls - Notebook Style */}
                {!camera.isActive && (
                    <div className="relative z-30 px-6 py-4 flex items-center justify-between safe-top">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleBack}
                            className={cn(
                                "rounded-full h-12 w-12 border-2 backdrop-blur-sm transition-all active:scale-95",
                                imagePreview
                                    ? "text-white hover:bg-white/20 border-white/30"
                                    : cn(
                                        statusColors[colorIndex].text,
                                        "hover:bg-current/10 border-current/30"
                                    )
                            )}
                        >
                            <ChevronLeft className="w-7 h-7" strokeWidth={2.5} />
                        </Button>

                        <div className="flex items-center gap-2">
                            {!imagePreview && (
                                <>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                            setIsTimerMode(!isTimerMode);
                                            setTimerStatus('input');
                                            setCaption('');
                                            setImagePreview(null);
                                            setTimerStartTime(null);
                                            setReality('');
                                            setActualDuration(0);
                                            setCustomMinutes(10);
                                            setCustomSeconds(0);
                                        }}
                                        className={cn(
                                            "rounded-full h-11 w-11 border-2 backdrop-blur-sm transition-all active:scale-95",
                                            statusColors[colorIndex].text,
                                            isTimerMode
                                                ? "bg-ink text-paper border-ink shadow-md"
                                                : "hover:bg-current/10 border-current/30"
                                        )}
                                    >
                                        <Timer className="w-5 h-5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={nextBgColor}
                                        className={cn(
                                            "rounded-full h-11 w-11 border-2 backdrop-blur-sm transition-all active:scale-95",
                                            statusColors[colorIndex].text,
                                            "hover:bg-current/10 border-current/30"
                                        )}
                                    >
                                        <Palette className="w-5 h-5" />
                                    </Button>
                                </>
                            )}
                            {imagePreview && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setImagePreview(null)}
                                    className="rounded-full text-white hover:bg-white/20 h-11 w-11 border-2 border-white/30 backdrop-blur-sm transition-all active:scale-95"
                                >
                                    <X className="w-6 h-6" />
                                </Button>
                            )}
                        </div>
                    </div>
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

                                {/* Text Input Area - Notebook Style */}
                                <div
                                    className="relative z-20 w-full flex flex-col items-center transition-all duration-300 pointer-events-none"
                                    style={{
                                        marginTop: imagePreview ? 'auto' : '10dvh',
                                        marginBottom: imagePreview ? `${Math.max(120, keyboardHeight + 20)}px` : '0px'
                                    }}
                                >
                                    {!imagePreview && (
                                        <div className="mb-4 flex items-center gap-2 opacity-70 animate-pulse pointer-events-none">
                                            <Feather className={cn("w-5 h-5", statusColors[colorIndex].text)} />
                                            <span className={cn("font-handwriting text-sm", statusColors[colorIndex].text)}>
                                                Tulis ceritamu di sini...
                                            </span>
                                        </div>
                                    )}

                                    <Textarea
                                        autoFocus
                                        value={caption}
                                        onChange={(e) => setCaption(e.target.value)}
                                        placeholder={imagePreview ? t.log_creator.placeholder_caption : "Ada cerita apa?"}
                                        className={cn(
                                            "w-full resize-none focus-visible:ring-2 leading-relaxed transition-all duration-300 pointer-events-auto font-handwriting",
                                            imagePreview
                                                ? "text-lg text-white placeholder:text-white/60 bg-black/60 backdrop-blur-xl p-6 min-h-[80px] rounded-2xl border border-white/20 max-w-sm shadow-2xl focus-visible:ring-white/40"
                                                : cn(
                                                    "text-2xl min-h-[300px] p-6 rounded-xl border-2 border-dashed shadow-lg",
                                                    statusColors[colorIndex].text,
                                                    "placeholder:opacity-60",
                                                    "bg-transparent border-current/20 focus-visible:ring-current/30 focus-visible:border-current/40"
                                                )
                                        )}
                                        style={{
                                            textShadow: imagePreview ? '0 2px 10px rgba(0,0,0,0.5)' : 'none',
                                            lineHeight: '1.8'
                                        }}
                                    />

                                    {/* Character count hint */}
                                    {!imagePreview && caption.length > 0 && (
                                        <div className={cn(
                                            "mt-2 text-xs font-handwriting opacity-50",
                                            statusColors[colorIndex].text
                                        )}>
                                            {caption.length} karakter
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-5">
                                {timerStatus === 'input' && (
                                    <div className="w-full flex flex-col items-center gap-8 mt-[8dvh]">
                                        <div className="space-y-3 text-center w-full">
                                            <div className="inline-block px-4 py-1 bg-ink/10 rounded-full mb-2">
                                                <h2 className={cn(
                                                    "text-xs uppercase tracking-widest font-handwriting",
                                                    statusColors[colorIndex].text,
                                                    "opacity-70"
                                                )}>✨ Niat Fokus</h2>
                                            </div>
                                            <Textarea
                                                autoFocus
                                                value={caption}
                                                onChange={(e) => setCaption(e.target.value)}
                                                placeholder="Mau ngapain 10 menit ini?"
                                                className={cn(
                                                    "w-full text-center text-2xl font-handwriting resize-none focus-visible:ring-2 min-h-[140px] p-6 rounded-xl border-2 border-dashed leading-relaxed",
                                                    statusColors[colorIndex].text,
                                                    "placeholder:opacity-50 bg-transparent border-current/20 focus-visible:ring-current/30"
                                                )}
                                            />
                                        </div>

                                        <div className="flex flex-col gap-4 items-center w-full">
                                            {/* Quick Presets */}
                                            <div className="flex flex-wrap gap-2 justify-center">
                                                {[1, 5, 10, 15, 20, 30].map(mins => (
                                                    <button
                                                        key={mins}
                                                        onClick={() => {
                                                            setTimerDuration(mins * 60);
                                                            setCustomMinutes(mins);
                                                            setCustomSeconds(0);
                                                            triggerHaptic();
                                                        }}
                                                        className={cn(
                                                            "px-4 py-2 rounded-lg text-sm font-handwriting font-bold transition-all active:scale-95 border-2",
                                                            timerDuration === mins * 60
                                                                ? "bg-ink text-paper shadow-md scale-105 border-ink"
                                                                : cn(
                                                                    statusColors[colorIndex].text,
                                                                    "bg-transparent border-current/20 hover:border-current/50 hover:bg-current/5"
                                                                )
                                                        )}
                                                    >
                                                        {mins}m
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Divider */}
                                            <div className={cn(
                                                "w-full flex items-center gap-3 opacity-40",
                                                statusColors[colorIndex].text
                                            )}>
                                                <div className="flex-1 h-px bg-current"></div>
                                                <span className="text-xs font-handwriting">atau atur manual</span>
                                                <div className="flex-1 h-px bg-current"></div>
                                            </div>

                                            {/* Stepper Controls */}
                                            <div className="flex gap-6 items-center">
                                                {/* Minutes Stepper */}
                                                <div className="flex flex-col items-center gap-2">
                                                    <span className={cn(
                                                        "text-xs font-handwriting opacity-60",
                                                        statusColors[colorIndex].text
                                                    )}>Menit</span>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => {
                                                                if (customMinutes > 0) {
                                                                    setCustomMinutes(prev => prev - 1);
                                                                    setTimerDuration((customMinutes - 1) * 60 + customSeconds);
                                                                    triggerHaptic();
                                                                }
                                                            }}
                                                            className={cn(
                                                                "w-10 h-10 rounded-lg font-bold text-xl transition-all active:scale-95 border-2",
                                                                statusColors[colorIndex].text,
                                                                customMinutes > 0
                                                                    ? "border-current/30 hover:bg-current/10"
                                                                    : "opacity-30 cursor-not-allowed border-current/10"
                                                            )}
                                                            disabled={customMinutes === 0}
                                                        >
                                                            −
                                                        </button>
                                                        <div className={cn(
                                                            "w-16 h-12 flex items-center justify-center text-3xl font-bold rounded-lg border-2",
                                                            statusColors[colorIndex].text,
                                                            "border-current/20 bg-transparent"
                                                        )}>
                                                            {customMinutes.toString().padStart(2, '0')}
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                if (customMinutes < 99) {
                                                                    setCustomMinutes(prev => prev + 1);
                                                                    setTimerDuration((customMinutes + 1) * 60 + customSeconds);
                                                                    triggerHaptic();
                                                                }
                                                            }}
                                                            className={cn(
                                                                "w-10 h-10 rounded-lg font-bold text-xl transition-all active:scale-95 border-2",
                                                                statusColors[colorIndex].text,
                                                                customMinutes < 99
                                                                    ? "border-current/30 hover:bg-current/10"
                                                                    : "opacity-30 cursor-not-allowed border-current/10"
                                                            )}
                                                            disabled={customMinutes === 99}
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Separator */}
                                                <span className={cn(
                                                    "text-3xl font-bold opacity-30",
                                                    statusColors[colorIndex].text
                                                )}>:</span>

                                                {/* Seconds Stepper */}
                                                <div className="flex flex-col items-center gap-2">
                                                    <span className={cn(
                                                        "text-xs font-handwriting opacity-60",
                                                        statusColors[colorIndex].text
                                                    )}>Detik</span>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => {
                                                                const newSeconds = customSeconds - 15;
                                                                if (newSeconds >= 0) {
                                                                    setCustomSeconds(newSeconds);
                                                                    setTimerDuration(customMinutes * 60 + newSeconds);
                                                                    triggerHaptic();
                                                                }
                                                            }}
                                                            className={cn(
                                                                "w-10 h-10 rounded-lg font-bold text-xl transition-all active:scale-95 border-2",
                                                                statusColors[colorIndex].text,
                                                                customSeconds >= 15
                                                                    ? "border-current/30 hover:bg-current/10"
                                                                    : "opacity-30 cursor-not-allowed border-current/10"
                                                            )}
                                                            disabled={customSeconds < 15}
                                                        >
                                                            −
                                                        </button>
                                                        <div className={cn(
                                                            "w-16 h-12 flex items-center justify-center text-3xl font-bold rounded-lg border-2",
                                                            statusColors[colorIndex].text,
                                                            "border-current/20 bg-transparent"
                                                        )}>
                                                            {customSeconds.toString().padStart(2, '0')}
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                const newSeconds = customSeconds + 15;
                                                                if (newSeconds <= 45) {
                                                                    setCustomSeconds(newSeconds);
                                                                    setTimerDuration(customMinutes * 60 + newSeconds);
                                                                    triggerHaptic();
                                                                }
                                                            }}
                                                            className={cn(
                                                                "w-10 h-10 rounded-lg font-bold text-xl transition-all active:scale-95 border-2",
                                                                statusColors[colorIndex].text,
                                                                customSeconds <= 30
                                                                    ? "border-current/30 hover:bg-current/10"
                                                                    : "opacity-30 cursor-not-allowed border-current/10"
                                                            )}
                                                            disabled={customSeconds > 30}
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Total Duration Display */}
                                            <div className={cn(
                                                "px-4 py-2 rounded-xl border-2 border-dashed",
                                                statusColors[colorIndex].text,
                                                "border-current/30 bg-current/5"
                                            )}>
                                                <span className="font-handwriting text-sm opacity-70">Total: </span>
                                                <span className="font-handwriting font-bold">
                                                    {formatDuration(timerDuration)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {timerStatus === 'running' && (
                                    <div className="flex flex-col items-center justify-center h-full pb-32">
                                        <div className="relative flex items-center justify-center">
                                            {/* Circular Progress Ring */}
                                            <svg className="w-72 h-72 transform -rotate-90" viewBox="0 0 100 100">
                                                {/* Background circle */}
                                                <circle
                                                    cx="50"
                                                    cy="50"
                                                    r="42"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="3"
                                                    className={cn("opacity-20", statusColors[colorIndex].text)}
                                                />
                                                {/* Progress circle */}
                                                <circle
                                                    cx="50"
                                                    cy="50"
                                                    r="42"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="3"
                                                    strokeLinecap="round"
                                                    strokeDasharray={`${2 * Math.PI * 42}`}
                                                    strokeDashoffset={`${2 * Math.PI * 42 * (1 - timeLeft / timerDuration)}`}
                                                    className={cn(
                                                        "transition-all duration-1000 ease-linear",
                                                        timeLeft <= 5 && timeLeft > 0
                                                            ? "text-red-500 animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                                                            : cn(statusColors[colorIndex].text, "drop-shadow-lg")
                                                    )}
                                                />
                                            </svg>

                                            {/* Timer text in center */}
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <h1 className={cn(
                                                    "text-7xl font-black tracking-tight tabular-nums drop-shadow-xl transition-all duration-300",
                                                    timeLeft <= 5 && timeLeft > 0 ? "scale-125 text-red-500 animate-pulse" : statusColors[colorIndex].text
                                                )}>
                                                    {formatTime(timeLeft)}
                                                </h1>
                                            </div>
                                        </div>
                                        <p className={cn(
                                            "mt-10 text-xl font-handwriting text-center max-w-xs opacity-60",
                                            statusColors[colorIndex].text
                                        )}>{caption}</p>
                                    </div>
                                )}

                                {timerStatus === 'finished' && (
                                    <div className="w-full flex flex-col items-center gap-8 mt-[5dvh]">
                                        <div className="text-center space-y-2">
                                            <div className={cn(
                                                "inline-block p-3 rounded-full mb-2 border-2",
                                                "bg-transparent",
                                                "border-current/30",
                                                statusColors[colorIndex].text
                                            )}>
                                                <History className="w-8 h-8" />
                                            </div>
                                            <h2 className={cn(
                                                "text-2xl font-handwriting font-bold",
                                                statusColors[colorIndex].text
                                            )}>Sesi Selesai ✓</h2>
                                            <p className={cn(
                                                "font-handwriting opacity-60",
                                                statusColors[colorIndex].text
                                            )}>Niat: {caption}</p>
                                        </div>

                                        <div className="w-full space-y-3">
                                            <label className={cn(
                                                "text-xs uppercase tracking-widest font-handwriting pl-4 opacity-70",
                                                statusColors[colorIndex].text
                                            )}>📝 Realita</label>
                                            <Textarea
                                                autoFocus
                                                value={reality}
                                                onChange={(e) => setReality(e.target.value)}
                                                placeholder="Apa yang sebenarnya terjadi?"
                                                className={cn(
                                                    "w-full text-center text-xl font-handwriting resize-none focus-visible:ring-2 min-h-[160px] rounded-xl p-6 border-2 border-dashed leading-relaxed",
                                                    statusColors[colorIndex].text,
                                                    "placeholder:opacity-50 bg-transparent border-current/20 focus-visible:ring-current/30"
                                                )}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Bottom Action Buttons - Notebook Style */}
                {!camera.isActive && (
                    <div className="relative z-30 p-6 pb-8 flex items-end justify-between safe-bottom w-full max-w-lg mx-auto">
                        {!isTimerMode ? (
                            <>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => camera.start()}
                                        className={cn(
                                            "p-5 rounded-2xl backdrop-blur-xl border-2 shadow-lg transition-all active:scale-95 hover:scale-105",
                                            imagePreview
                                                ? "bg-white/10 text-white border-white/30 hover:bg-white/20"
                                                : cn(
                                                    statusColors[colorIndex].text,
                                                    "bg-transparent border-current/30 hover:bg-current/10 hover:border-current/50"
                                                )
                                        )}
                                    >
                                        <Camera className="w-6 h-6" />
                                    </button>
                                    <button
                                        onClick={handlePickGallery}
                                        className={cn(
                                            "p-5 rounded-2xl backdrop-blur-xl border-2 shadow-lg transition-all active:scale-95 hover:scale-105",
                                            imagePreview
                                                ? "bg-white/10 text-white border-white/30 hover:bg-white/20"
                                                : cn(
                                                    statusColors[colorIndex].text,
                                                    "bg-transparent border-current/30 hover:bg-current/10 hover:border-current/50"
                                                )
                                        )}
                                    >
                                        <ImageIcon className="w-6 h-6" />
                                    </button>
                                </div>

                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || (!caption.trim() && !imagePreview)}
                                    className={cn(
                                        "w-[72px] h-[72px] rounded-2xl flex items-center justify-center transition-all font-handwriting border-2",
                                        (caption.trim() || imagePreview)
                                            ? "bg-ink text-paper scale-110 shadow-xl shadow-ink/30 active:scale-105 border-ink hover:shadow-2xl"
                                            : cn(
                                                "opacity-40 cursor-not-allowed border-current/20",
                                                imagePreview ? "text-white" : statusColors[colorIndex].text
                                            )
                                    )}
                                >
                                    {isSubmitting ? (
                                        <Sparkles className="w-7 h-7 animate-spin" />
                                    ) : (
                                        <Send className="w-7 h-7 ml-0.5" />
                                    )}
                                </button>
                            </>
                        ) : (
                            <div className="w-full flex items-center justify-center">
                                {timerStatus === 'input' && (
                                    <button
                                        onClick={startTimer}
                                        disabled={!caption.trim() || timerDuration <= 0}
                                        className={cn(
                                            "w-24 h-24 rounded-2xl flex items-center justify-center shadow-xl transition-all font-handwriting border-2",
                                            (caption.trim() && timerDuration > 0)
                                                ? "bg-doodle-green text-white shadow-doodle-green/30 active:scale-95 hover:scale-105 border-doodle-green"
                                                : cn(
                                                    "opacity-40 cursor-not-allowed border-current/20",
                                                    statusColors[colorIndex].text
                                                )
                                        )}
                                    >
                                        <Play className="w-10 h-10 ml-1" fill="currentColor" />
                                    </button>
                                )}

                                {timerStatus === 'running' && (
                                    <button
                                        onClick={stopTimer}
                                        className="w-24 h-24 rounded-2xl bg-doodle-red text-white flex items-center justify-center shadow-xl shadow-doodle-red/30 transition-all active:scale-95 hover:scale-105 border-2 border-doodle-red"
                                    >
                                        <CircleStop className="w-10 h-10" />
                                    </button>
                                )}

                                {timerStatus === 'finished' && (
                                    <button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting || !reality.trim()}
                                        className={cn(
                                            "w-full py-5 font-handwriting font-bold text-lg rounded-2xl shadow-lg transition-all border-2",
                                            (isSubmitting || !reality.trim())
                                                ? cn("opacity-50 cursor-not-allowed border-current/20", statusColors[colorIndex].text)
                                                : "bg-ink text-paper active:scale-95 hover:shadow-xl border-ink"
                                        )}
                                    >
                                        {isSubmitting ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <Sparkles className="w-5 h-5 animate-spin" />
                                                <span>Menyimpan...</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center gap-2">
                                                <Check className="w-5 h-5" />
                                                <span>Simpan Refleksi</span>
                                            </div>
                                        )}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
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
