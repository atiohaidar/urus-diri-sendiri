import { History } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface TimerFinishedProps {
    statusColor: { text: string };
    caption: string;
    reality: string;
    setReality: (v: string) => void;
}

export const TimerFinished = ({
    statusColor,
    caption,
    reality,
    setReality
}: TimerFinishedProps) => {

    return (
        <div className="w-full flex flex-col items-center gap-8 mt-[5dvh]">
            <div className="text-center space-y-2">
                <div className={cn(
                    "inline-block p-3 rounded-full mb-2 border-2",
                    "bg-transparent",
                    "border-current/30",
                    statusColor.text
                )}>
                    <History className="w-8 h-8" />
                </div>
                <h2 className={cn(
                    "text-2xl font-handwriting font-bold",
                    statusColor.text
                )}>Sesi Selesai ✓</h2>
                <p className={cn(
                    "font-handwriting opacity-60",
                    statusColor.text
                )}>Niat: {caption}</p>
            </div>

            <div className="w-full space-y-3">
                <label className={cn(
                    "text-xs uppercase tracking-widest font-handwriting pl-4 opacity-70",
                    statusColor.text
                )}>📝 Realita</label>
                <Textarea
                    autoFocus
                    value={reality}
                    onChange={(e) => setReality(e.target.value)}
                    placeholder="Apa yang sebenarnya terjadi?"
                    className={cn(
                        "w-full text-center text-xl font-handwriting resize-none focus-visible:ring-2 min-h-[160px] rounded-xl p-6 border-2 border-dashed leading-relaxed",
                        statusColor.text,
                        "placeholder:opacity-50 bg-transparent border-current/20 focus-visible:ring-current/30"
                    )}
                />
            </div>
        </div>
    );
};
