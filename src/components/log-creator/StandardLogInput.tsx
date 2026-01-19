import { Feather } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n/LanguageContext';

interface StandardLogInputProps {
    imagePreview: string | null;
    statusColor: { text: string };
    caption: string;
    setCaption: (v: string) => void;
}

export const StandardLogInput = ({
    imagePreview,
    statusColor,
    caption,
    setCaption
}: StandardLogInputProps) => {
    const { t } = useLanguage();

    return (
        <div
            className="relative z-20 w-full flex flex-col items-center transition-all duration-300 pointer-events-none"
            style={{
                marginTop: imagePreview ? 'auto' : '10dvh',
                marginBottom: imagePreview ? '24px' : '0px'
            }}
        >
            {!imagePreview && (
                <div className="mb-4 flex items-center gap-2 opacity-70 animate-pulse pointer-events-none">
                    <Feather className={cn("w-5 h-5", statusColor.text)} />
                    <span className={cn("font-handwriting text-sm", statusColor.text)}>
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
                            statusColor.text,
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
                    statusColor.text
                )}>
                    {caption.length} karakter
                </div>
            )}
        </div>
    );
};
