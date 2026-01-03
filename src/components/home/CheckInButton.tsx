import { useNavigate } from 'react-router-dom';
import { Moon, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';
import { isCheckinCompletedToday } from '@/lib/checkin-helper';
import { cn } from '@/lib/utils';

interface CheckInButtonProps {
    variant?: 'mobile' | 'desktop';
    currentDate: Date;
}

export const CheckInButton = ({ variant = 'mobile', currentDate }: CheckInButtonProps) => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const isDesktop = variant === 'desktop';

    // Only show if it's evening (after 17:00) and not checked in
    if (currentDate.getHours() < 17 || isCheckinCompletedToday()) {
        return null;
    }

    return (
        <section className={`${!isDesktop ? 'block md:hidden' : ''}`}>
            <Button
                onClick={() => navigate('/maghrib-checkin')}
                className={cn(
                    "w-full relative overflow-hidden group",
                    // Sticky note style
                    "bg-sticky-pink text-ink border-2 border-ink/10",
                    "shadow-[3px_3px_0_0_rgba(0,0,0,0.1)]",
                    "hover:shadow-[4px_4px_0_0_rgba(0,0,0,0.15)]",
                    "hover:-translate-y-0.5",
                    "transition-all duration-150",
                    "will-change-transform",
                    // Size variants
                    isDesktop
                        ? "h-24 rounded-sm text-xl font-handwriting gap-4 -rotate-1"
                        : "h-16 rounded-sm text-lg font-handwriting gap-3"
                )}
            >
                <Moon className={cn(
                    "fill-current",
                    isDesktop ? "w-8 h-8" : "w-6 h-6"
                )} />
                <div className={`flex flex-col items-start ${isDesktop ? 'gap-1' : ''}`}>
                    <span className="font-handwriting font-semibold">{t.home.start_checkin}</span>
                    <span className={cn(
                        "font-handwriting font-normal opacity-80",
                        isDesktop ? "text-base" : "text-xs"
                    )}>
                        Waktu refleksi malam ✨
                    </span>
                </div>
                {/* Decorative doodle */}
                <Sparkles className={cn(
                    "absolute opacity-20",
                    isDesktop ? "w-16 h-16 right-4 top-1" : "w-10 h-10 right-2 top-0"
                )} />
            </Button>
        </section>
    );
};
