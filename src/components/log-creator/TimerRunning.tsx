import { cn } from '@/lib/utils';

interface TimerRunningProps {
    statusColor: { text: string };
    timeLeft: number;
    timerDuration: number;
    caption: string;
    formatTime: (s: number) => string;
}

export const TimerRunning = ({
    statusColor,
    timeLeft,
    timerDuration,
    caption,
    formatTime
}: TimerRunningProps) => {

    return (
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
                        className={cn("opacity-20", statusColor.text)}
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
                                : cn(statusColor.text, "drop-shadow-lg")
                        )}
                    />
                </svg>

                {/* Timer text in center */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <h1 className={cn(
                        "text-7xl font-black tracking-tight tabular-nums drop-shadow-xl transition-all duration-300",
                        timeLeft <= 5 && timeLeft > 0 ? "scale-125 text-red-500 animate-pulse" : statusColor.text
                    )}>
                        {formatTime(timeLeft)}
                    </h1>
                </div>
            </div>
            <p className={cn(
                "mt-10 text-xl font-handwriting text-center max-w-xs opacity-60",
                statusColor.text
            )}>{caption}</p>
        </div>
    );
};
