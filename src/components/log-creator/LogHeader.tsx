import { ChevronLeft, Timer, Palette, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LogHeaderProps {
    isControlsVisible: boolean;
    timerStatus: 'input' | 'running' | 'finished';
    onBack: () => void;
    imagePreview: string | null;
    statusColor: { text: string };
    isTimerMode: boolean;
    setIsTimerMode: (v: boolean) => void;
    onResetTimer: () => void;
    onNextColor: () => void;
    onClearImage: () => void;
}

export const LogHeader = ({
    isControlsVisible,
    timerStatus,
    onBack,
    imagePreview,
    statusColor,
    isTimerMode,
    setIsTimerMode,
    onResetTimer,
    onNextColor,
    onClearImage
}: LogHeaderProps) => {

    return (
        <div className={cn(
            "relative z-30 px-6 py-4 flex items-center justify-between safe-top transition-opacity duration-500",
            !isControlsVisible && timerStatus === 'running' ? "opacity-0 pointer-events-none" : "opacity-100"
        )}>
            <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className={cn(
                    "rounded-full h-12 w-12 border-2 backdrop-blur-sm transition-all active:scale-95",
                    imagePreview
                        ? "text-white hover:bg-white/20 border-white/30"
                        : cn(
                            statusColor.text,
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
                                onResetTimer();
                            }}
                            className={cn(
                                "rounded-full h-11 w-11 border-2 backdrop-blur-sm transition-all active:scale-95",
                                statusColor.text,
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
                            onClick={onNextColor}
                            className={cn(
                                "rounded-full h-11 w-11 border-2 backdrop-blur-sm transition-all active:scale-95",
                                statusColor.text,
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
                        onClick={onClearImage}
                        className="rounded-full text-white hover:bg-white/20 h-11 w-11 border-2 border-white/30 backdrop-blur-sm transition-all active:scale-95"
                    >
                        <X className="w-6 h-6" />
                    </Button>
                )}
            </div>
        </div>
    );
};
