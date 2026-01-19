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
import { useCamera } from '@/hooks/useCamera';
import { useLanguage } from '@/i18n/LanguageContext';

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
    const [timerDuration, setTimerDuration] = useState(10); // minutes
    const [timeLeft, setTimeLeft] = useState(0);
    const [reality, setReality] = useState('');
    const [showCustomTime, setShowCustomTime] = useState(false);
    const [customMinutes, setCustomMinutes] = useState('');
    const [customSeconds, setCustomSeconds] = useState('');

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isTimerMode && timerStatus === 'running' && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && timerStatus === 'running') {
            setTimerStatus('finished');
            triggerSuccessHaptic();
        }
        return () => clearInterval(interval);
    }, [isTimerMode, timerStatus, timeLeft]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const startTimer = () => {
        if (!caption.trim()) return;
        setTimeLeft(timerDuration * 60);
        setTimerStatus('running');
        triggerHaptic();
    };

    const stopTimer = () => {
        setTimerStatus('input');
        triggerHaptic();
    };

    // Use the camera hook
    const camera = useCamera({ initialFacing: 'environment' });
    const { toast } = useToast();
    const { t } = useLanguage();

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
        const isDirty = (caption.trim().length > 0 || imagePreview !== null);
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
    }, [caption, imagePreview, camera.isActive, showSuccess, showExitDialog]);

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
            if (isTimerMode) {
                logContent = `Niat: ${caption}\n\nRealita: ${reality}`;
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
                navigate(-1);
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
                                            setShowCustomTime(false);
                                            setCustomMinutes('');
                                            setCustomSeconds('');
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

                                        {!showCustomTime ? (
                                            <div className="flex flex-col gap-3 items-center">
                                                <div className="flex gap-3">
                                                    {[10, 20, 30].map(mins => (
                                                        <button
                                                            key={mins}
                                                            onClick={() => setTimerDuration(mins)}
                                                            className={cn(
                                                                "px-7 py-3 rounded-xl text-lg font-handwriting font-bold transition-all active:scale-95 border-2",
                                                                timerDuration === mins
                                                                    ? cn(
                                                                        "bg-ink text-paper shadow-lg scale-105 border-ink"
                                                                    )
                                                                    : cn(
                                                                        statusColors[colorIndex].text,
                                                                        "bg-transparent border-current/30 hover:border-current/60 hover:bg-current/5"
                                                                    )
                                                            )}
                                                        >
                                                            {mins}m
                                                        </button>
                                                    ))}
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setShowCustomTime(true);
                                                        triggerHaptic();
                                                    }}
                                                    className={cn(
                                                        "text-sm font-handwriting underline hover:no-underline transition-all opacity-60 hover:opacity-100",
                                                        statusColors[colorIndex].text
                                                    )}
                                                >
                                                    ⏱️ Atur waktu sendiri
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-4 items-center">
                                                <div className="flex gap-2 items-center">
                                                    <input
                                                        type="number"
                                                        value={customMinutes}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            if (val === '' || (parseInt(val) >= 0 && parseInt(val) <= 99)) {
                                                                setCustomMinutes(val);
                                                            }
                                                        }}
                                                        placeholder="00"
                                                        className={cn(
                                                            "w-20 px-4 py-3 text-center text-3xl font-bold rounded-xl border-2 focus:outline-none focus:ring-2 transition-all",
                                                            statusColors[colorIndex].text,
                                                            "bg-transparent border-current/30 focus:ring-current/30 placeholder:opacity-40"
                                                        )}
                                                        min="0"
                                                        max="99"
                                                    />
                                                    <span className={cn("text-2xl font-bold opacity-50", statusColors[colorIndex].text)}>:</span>
                                                    <input
                                                        type="number"
                                                        value={customSeconds}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            if (val === '' || (parseInt(val) >= 0 && parseInt(val) <= 59)) {
                                                                setCustomSeconds(val);
                                                            }
                                                        }}
                                                        placeholder="00"
                                                        className={cn(
                                                            "w-20 px-4 py-3 text-center text-3xl font-bold rounded-xl border-2 focus:outline-none focus:ring-2 transition-all",
                                                            statusColors[colorIndex].text,
                                                            "bg-transparent border-current/30 focus:ring-current/30 placeholder:opacity-40"
                                                        )}
                                                        min="0"
                                                        max="59"
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => {
                                                            const mins = parseInt(customMinutes) || 0;
                                                            const secs = parseInt(customSeconds) || 0;
                                                            if (mins > 0 || secs > 0) {
                                                                setTimerDuration(mins + secs / 60);
                                                                setShowCustomTime(false);
                                                            }
                                                            triggerHaptic();
                                                        }}
                                                        className="px-5 py-2 bg-ink text-paper rounded-xl text-sm font-handwriting font-bold active:scale-95 transition-all shadow-md"
                                                    >
                                                        ✓ Set Timer
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setShowCustomTime(false);
                                                            setCustomMinutes('');
                                                            setCustomSeconds('');
                                                            triggerHaptic();
                                                        }}
                                                        className={cn(
                                                            "px-5 py-2 rounded-xl text-sm font-handwriting font-bold active:scale-95 transition-all border-2",
                                                            statusColors[colorIndex].text,
                                                            "bg-transparent border-current/30"
                                                        )}
                                                    >
                                                        ← Kembali
                                                    </button>
                                                </div>
                                            </div>
                                        )}
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
                                                    strokeDashoffset={`${2 * Math.PI * 42 * (1 - timeLeft / (timerDuration * 60))}`}
                                                    className={cn(
                                                        "transition-all duration-1000 ease-linear drop-shadow-lg",
                                                        statusColors[colorIndex].text
                                                    )}
                                                />
                                            </svg>

                                            {/* Timer text in center */}
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <h1 className={cn(
                                                    "text-7xl font-black tracking-tight tabular-nums drop-shadow-xl",
                                                    statusColors[colorIndex].text
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
                                        disabled={!caption.trim()}
                                        className={cn(
                                            "w-24 h-24 rounded-2xl flex items-center justify-center shadow-xl transition-all font-handwriting border-2",
                                            caption.trim()
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
                    <AlertDialogAction onClick={() => navigate(-1)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        {t.log_creator.discard_confirm}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default LogCreatorPage;
