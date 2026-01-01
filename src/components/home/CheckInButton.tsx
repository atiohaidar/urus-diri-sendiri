import { useNavigate } from 'react-router-dom';
import { Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';
import { isCheckinCompletedToday } from '@/lib/checkin-helper';

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
        <section className={`animate-in slide-in-from-top-4 duration-500 ${!isDesktop ? 'block md:hidden' : ''}`}>
            <Button
                onClick={() => navigate('/maghrib-checkin')}
                className={`w-full gap-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-xl shadow-indigo-500/20 text-white relative overflow-hidden group 
        ${isDesktop
                        ? 'h-24 rounded-3xl text-2xl font-bold shadow-2xl transform hover:scale-[1.02] transition-all duration-300 gap-4'
                        : 'h-16 rounded-2xl text-lg font-bold'}`}
            >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <Moon className={`${isDesktop ? 'w-10 h-10' : 'w-6 h-6'} fill-current animate-pulse`} />
                <div className={`flex flex-col items-start ${isDesktop ? 'gap-1' : ''}`}>
                    <span>{t.home.start_checkin}</span>
                    <span className={`${isDesktop ? 'text-base' : 'text-xs'} font-normal opacity-90`}>
                        Time for evening reflection
                    </span>
                </div>
            </Button>
        </section>
    );
};
