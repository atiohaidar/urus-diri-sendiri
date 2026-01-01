import { useState, useEffect, useRef } from 'react';
import { Camera, Send, X, Image as ImageIcon, Type, Sparkles, ChevronLeft, FlipHorizontal, Palette, Check } from 'lucide-react';
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

const LogCreatorPage = () => {
    const navigate = useNavigate();
    const [caption, setCaption] = useState('');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('environment');
    const [flashEffect, setFlashEffect] = useState(false);
    const [showExitDialog, setShowExitDialog] = useState(false);

    // Status-specific states
    const statusColors = [
        'bg-slate-600',
        'bg-rose-600',
        'bg-teal-700',
        'bg-amber-600',
        'bg-indigo-700',
        'bg-emerald-700',
        'bg-purple-700',
        'bg-sky-700'
    ];
    const [bgColor, setBgColor] = useState(statusColors[0]);

    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const { toast } = useToast();

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

    // Cleanup camera on unmount
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const handleBack = () => {
        // Only trigger dialog if there is content AND it is not submitting AND not successfully saved
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
                if (showCamera) {
                    stopCamera();
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
    }, [caption, imagePreview, showCamera, showSuccess, showExitDialog]);


    const startCamera = async (facing: 'user' | 'environment') => {
        try {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
                audio: false
            });

            streamRef.current = stream;
            if (videoRef.current) videoRef.current.srcObject = stream;
            setShowCamera(true);
        } catch (error) {
            toast({ title: "Kamera tidak dapat diakses", variant: "destructive" });
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        setShowCamera(false);
    };

    const capturePhoto = async () => {
        if (!videoRef.current) return;
        setFlashEffect(true);
        setTimeout(() => setFlashEffect(false), 150);
        triggerHaptic();

        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            if (cameraFacing === 'user') {
                ctx.translate(canvas.width, 0);
                ctx.scale(-1, 1);
            }
            ctx.drawImage(video, 0, 0);
            const base64 = canvas.toDataURL('image/jpeg', 0.85);
            const compressed = await compressImage(base64, 1080, 0.7);
            setImagePreview(compressed);
            stopCamera();
        }
    };

    const nextBgColor = () => {
        const currentIndex = statusColors.indexOf(bgColor);
        const nextIndex = (currentIndex + 1) % statusColors.length;
        setBgColor(statusColors[nextIndex]);
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
                if (showCamera) stopCamera();
            }
        } catch (e) {
            console.log('Pick cancelled');
        }
    };

    const handleSubmit = async () => {
        if (!caption.trim() && !imagePreview) return;
        setIsSubmitting(true);
        triggerHaptic();
        try {
            let mediaId;
            if (imagePreview) {
                mediaId = await saveImage(imagePreview);
            }
            saveLog({
                type: imagePreview ? 'photo' : 'text',
                content: caption,
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
            toast({ title: "Gagal menyimpan", variant: "destructive" });
            setIsSubmitting(false);
        }
    };

    return (
        <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
            <div className={cn(
                "fixed inset-0 z-50 flex flex-col transition-colors duration-500 overflow-hidden",
                imagePreview ? "bg-black" : bgColor
            )}>
                {/* Success Overlay */}
                {showSuccess && (
                    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="flex flex-col items-center animate-in zoom-in-50 duration-500 slide-in-from-bottom-10">
                            <div className="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center shadow-2xl shadow-emerald-500/50 mb-4">
                                <Check className="w-12 h-12 text-white animate-in zoom-in duration-300 delay-200" strokeWidth={3} />
                            </div>
                            <h2 className="text-2xl font-bold text-white tracking-tight animate-in fade-in slide-in-from-bottom-2 delay-300">
                                Saved!
                            </h2>
                        </div>
                    </div>
                )}

                {/* Native Camera View */}
                {showCamera && (
                    <div className="absolute inset-0 z-10 bg-black">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className={cn("w-full h-full object-cover", cameraFacing === 'user' && "scale-x-[-1]")}
                        />
                        {flashEffect && <div className="absolute inset-0 bg-white z-20" />}

                        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-30 safe-top">
                            <button onClick={stopCamera} className="p-3 bg-black/30 backdrop-blur-md rounded-full text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 p-12 flex justify-around items-center z-30 safe-bottom">
                            <button onClick={handlePickGallery} className="p-4 bg-white/10 backdrop-blur-md rounded-full text-white active:scale-90 transition-transform">
                                <ImageIcon className="w-7 h-7" />
                            </button>

                            <button
                                onClick={capturePhoto}
                                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1 active:scale-95 transition-all shadow-xl"
                            >
                                <div className="w-full h-full bg-white rounded-full" />
                            </button>

                            <button
                                onClick={() => {
                                    const next = cameraFacing === 'user' ? 'environment' : 'user';
                                    setCameraFacing(next);
                                    startCamera(next);
                                }}
                                className="p-4 bg-white/10 backdrop-blur-md rounded-full text-white active:scale-90 transition-transform"
                            >
                                <FlipHorizontal className="w-7 h-7" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Header Controls */}
                {!showCamera && (
                    <div className="relative z-30 px-6 py-4 flex items-center justify-between safe-top">
                        <Button variant="ghost" size="icon" onClick={handleBack} className="rounded-full text-white hover:bg-white/10 h-12 w-12">
                            <ChevronLeft className="w-8 h-8" strokeWidth={2.5} />
                        </Button>

                        <div className="flex items-center gap-3">
                            {!imagePreview && (
                                <Button variant="ghost" size="icon" onClick={nextBgColor} className="rounded-full text-white hover:bg-white/10 h-10 w-10">
                                    <Palette className="w-6 h-6" />
                                </Button>
                            )}
                            {imagePreview && (
                                <Button variant="ghost" size="icon" onClick={() => setImagePreview(null)} className="rounded-full text-white hover:bg-white/10 h-10 w-10">
                                    <X className="w-6 h-6" />
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {/* Immersive Canvas Area */}
                {!showCamera && (
                    <div className="flex-1 relative flex flex-col items-center pt-10 px-6 md:px-8">
                        {imagePreview && (
                            <img
                                src={imagePreview}
                                className="absolute inset-0 w-full h-full object-cover animate-in fade-in zoom-in-105 duration-700"
                                alt="Preview"
                            />
                        )}

                        {/* Immersive Floating Textarea with Keyboard Avoidance */}
                        <div
                            className="relative z-20 w-full flex flex-col items-center transition-all duration-300 pointer-events-none"
                            style={{
                                marginTop: imagePreview ? 'auto' : '15dvh',
                                marginBottom: imagePreview ? `${Math.max(120, keyboardHeight + 20)}px` : '0px'
                            }}
                        >
                            <Textarea
                                autoFocus
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                placeholder={imagePreview ? "Tambah keterangan..." : "Ada cerita apa?"}
                                className={cn(
                                    "w-full text-center text-white placeholder:text-white/30 border-none bg-transparent resize-none focus-visible:ring-0 leading-snug transition-all duration-300 pointer-events-auto",
                                    imagePreview
                                        ? "text-lg font-medium bg-black/50 backdrop-blur-xl p-6 min-h-[60px] rounded-[2rem] border border-white/10 max-w-sm shadow-2xl"
                                        : "text-3xl font-bold min-h-[250px]"
                                )}
                                style={{ textShadow: imagePreview ? '0 2px 10px rgba(0,0,0,0.5)' : 'none' }}
                            />
                        </div>
                    </div>
                )}

                {/* Bottom Floating Post Area */}
                {!showCamera && (
                    <div className="relative z-30 p-8 flex items-end justify-between safe-bottom">
                        <div className="flex gap-4">
                            <button
                                onClick={() => startCamera(cameraFacing)}
                                className="p-5 bg-white/10 backdrop-blur-2xl rounded-full text-white border border-white/20 shadow-xl active:scale-90 transition-all hover:bg-white/20"
                            >
                                <Camera className="w-7 h-7" />
                            </button>
                            <button
                                onClick={handlePickGallery}
                                className="p-5 bg-white/10 backdrop-blur-2xl rounded-full text-white border border-white/20 shadow-xl active:scale-90 transition-all hover:bg-white/20"
                            >
                                <ImageIcon className="w-7 h-7" />
                            </button>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || (!caption.trim() && !imagePreview)}
                            className={cn(
                                "w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90",
                                (caption.trim() || imagePreview)
                                    ? "bg-primary text-primary-foreground scale-110 shadow-primary/40"
                                    : "bg-white/10 text-white/20"
                            )}
                        >
                            {isSubmitting ? (
                                <Sparkles className="w-7 h-7 animate-spin" />
                            ) : (
                                <Send className="w-7 h-7 ml-0.5" />
                            )}
                        </button>
                    </div>
                )}
            </div>

            <AlertDialogContent className="rounded-2xl max-w-[80vw]">
                <AlertDialogHeader>
                    <AlertDialogTitle>Hapus perubahan?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Tulisan atau foto yang belum disimpan akan hilang jika Anda keluar.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={() => navigate(-1)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Keluar
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default LogCreatorPage;
