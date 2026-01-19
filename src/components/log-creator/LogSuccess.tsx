import { Check } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

interface LogSuccessProps {
    show: boolean;
}

export const LogSuccess = ({ show }: LogSuccessProps) => {
    const { t } = useLanguage();

    if (!show) return null;

    return (
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
    );
};
