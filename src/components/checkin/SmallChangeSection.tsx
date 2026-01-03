import { Sprout } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/i18n/LanguageContext';

interface SmallChangeSectionProps {
    smallChange: string;
    setSmallChange: (val: string) => void;
}

export const SmallChangeSection = ({ smallChange, setSmallChange }: SmallChangeSectionProps) => {
    const { t } = useLanguage();

    return (
        <div className="bg-card rounded-sm p-4 border-2 border-paper-lines/50 shadow-notebook">
            <label className="flex items-center gap-2 font-handwriting text-base text-ink mb-3">
                <Sprout className="w-5 h-5 text-doodle-green" />
                {t.checkin.small_change}
            </label>
            <Textarea
                value={smallChange}
                onChange={(e) => setSmallChange(e.target.value)}
                placeholder={t.checkin.small_change_placeholder}
                variant="notebook"
                className="min-h-[80px]"
            />
        </div>
    );
};
