import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface TimerInputProps {
    statusColor: { text: string };
    caption: string;
    setCaption: (v: string) => void;
    timerDuration: number;
    setTimerDuration: (v: number) => void;
    customMinutes: number;
    setCustomMinutes: (v: number | ((prev: number) => number)) => void;
    customSeconds: number;
    setCustomSeconds: (v: number | ((prev: number) => number)) => void;
    triggerHaptic: () => void;
    formatDuration: (s: number) => string;
}

export const TimerInput = ({
    statusColor,
    caption,
    setCaption,
    timerDuration,
    setTimerDuration,
    customMinutes,
    setCustomMinutes,
    customSeconds,
    setCustomSeconds,
    triggerHaptic,
    formatDuration
}: TimerInputProps) => {

    return (
        <div className="w-full h-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-5">
            <div className="w-full flex flex-col items-center gap-8 mt-[8dvh]">
                <div className="space-y-3 text-center w-full">
                    <div className="inline-block px-4 py-1 bg-ink/10 rounded-full mb-2">
                        <h2 className={cn(
                            "text-xs uppercase tracking-widest font-handwriting",
                            statusColor.text,
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
                            statusColor.text,
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
                                            statusColor.text,
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
                        statusColor.text
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
                                statusColor.text
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
                                        statusColor.text,
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
                                    statusColor.text,
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
                                        statusColor.text,
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
                            statusColor.text
                        )}>:</span>

                        {/* Seconds Stepper */}
                        <div className="flex flex-col items-center gap-2">
                            <span className={cn(
                                "text-xs font-handwriting opacity-60",
                                statusColor.text
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
                                        statusColor.text,
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
                                    statusColor.text,
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
                                        statusColor.text,
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
                        statusColor.text,
                        "border-current/30 bg-current/5"
                    )}>
                        <span className="font-handwriting text-sm opacity-70">Total: </span>
                        <span className="font-handwriting font-bold">
                            {formatDuration(timerDuration)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
