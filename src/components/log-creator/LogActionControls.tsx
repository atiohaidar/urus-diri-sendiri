import { Camera, Send, Image as ImageIcon, Sparkles, Check, Play, CircleStop } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UseCameraReturn } from '@/hooks/useCamera';

interface LogActionControlsProps {
    isControlsVisible: boolean;
    timerStatus: 'input' | 'running' | 'finished';
    isTimerMode: boolean;
    camera: UseCameraReturn;
    imagePreview: string | null;
    statusColor: { text: string };
    isSubmitting: boolean;
    caption: string;
    reality: string;
    timerDuration: number;
    onPickGallery: () => void;
    onSubmit: () => void;
    onStartTimer: () => void;
    onStopTimer: () => void;
}

export const LogActionControls = ({
    isControlsVisible,
    timerStatus,
    isTimerMode,
    camera,
    imagePreview,
    statusColor,
    isSubmitting,
    caption,
    reality,
    timerDuration,
    onPickGallery,
    onSubmit,
    onStartTimer,
    onStopTimer
}: LogActionControlsProps) => {

    if (camera.isActive) return null;

    return (
        <div className={cn(
            "relative z-30 p-6 pb-8 flex items-end justify-between safe-bottom w-full max-w-lg mx-auto transition-opacity duration-500",
            !isControlsVisible && timerStatus === 'running' ? "opacity-0 pointer-events-none" : "opacity-100"
        )}>
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
                                        statusColor.text,
                                        "bg-transparent border-current/30 hover:bg-current/10 hover:border-current/50"
                                    )
                            )}
                        >
                            <Camera className="w-6 h-6" />
                        </button>
                        <button
                            onClick={onPickGallery}
                            className={cn(
                                "p-5 rounded-2xl backdrop-blur-xl border-2 shadow-lg transition-all active:scale-95 hover:scale-105",
                                imagePreview
                                    ? "bg-white/10 text-white border-white/30 hover:bg-white/20"
                                    : cn(
                                        statusColor.text,
                                        "bg-transparent border-current/30 hover:bg-current/10 hover:border-current/50"
                                    )
                            )}
                        >
                            <ImageIcon className="w-6 h-6" />
                        </button>
                    </div>

                    <button
                        onClick={onSubmit}
                        disabled={isSubmitting || (!caption.trim() && !imagePreview)}
                        className={cn(
                            "w-[72px] h-[72px] rounded-2xl flex items-center justify-center transition-all font-handwriting border-2",
                            (caption.trim() || imagePreview)
                                ? "bg-ink text-paper scale-110 shadow-xl shadow-ink/30 active:scale-105 border-ink hover:shadow-2xl"
                                : cn(
                                    "opacity-40 cursor-not-allowed border-current/20",
                                    imagePreview ? "text-white" : statusColor.text
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
                            onClick={onStartTimer}
                            disabled={!caption.trim() || timerDuration <= 0}
                            className={cn(
                                "w-24 h-24 rounded-2xl flex items-center justify-center shadow-xl transition-all font-handwriting border-2",
                                (caption.trim() && timerDuration > 0)
                                    ? "bg-doodle-green text-white shadow-doodle-green/30 active:scale-95 hover:scale-105 border-doodle-green"
                                    : cn(
                                        "opacity-40 cursor-not-allowed border-current/20",
                                        statusColor.text
                                    )
                            )}
                        >
                            <Play className="w-10 h-10 ml-1" fill="currentColor" />
                        </button>
                    )}

                    {timerStatus === 'running' && (
                        <button
                            onClick={onStopTimer}
                            className="w-24 h-24 rounded-2xl bg-doodle-red text-white flex items-center justify-center shadow-xl shadow-doodle-red/30 transition-all active:scale-95 hover:scale-105 border-2 border-doodle-red"
                        >
                            <CircleStop className="w-10 h-10" />
                        </button>
                    )}

                    {timerStatus === 'finished' && (
                        <button
                            onClick={onSubmit}
                            disabled={isSubmitting || !reality.trim()}
                            className={cn(
                                "w-full py-5 font-handwriting font-bold text-lg rounded-2xl shadow-lg transition-all border-2",
                                (isSubmitting || !reality.trim())
                                    ? cn("opacity-50 cursor-not-allowed border-current/20", statusColor.text)
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
    );
};
