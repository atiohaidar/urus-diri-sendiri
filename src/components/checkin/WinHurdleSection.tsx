import { Trophy, Construction } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/i18n/LanguageContext';

interface WinHurdleSectionProps {
    winOfDay: string;
    setWinOfDay: (val: string) => void;
    hurdle: string;
    setHurdle: (val: string) => void;
}

export const WinHurdleSection = ({
    winOfDay,
    setWinOfDay,
    hurdle,
    setHurdle
}: WinHurdleSectionProps) => {
    const { t } = useLanguage();

    const handleAddChip = (chip: string) => {
        setHurdle(hurdle ? `${hurdle}, ${chip}` : chip);
    };

    const chips = [
        { label: t.checkin.chip_malas, value: t.checkin.chip_malas },
        { label: t.checkin.chip_lelah, value: t.checkin.chip_lelah },
        { label: t.checkin.chip_sakit, value: t.checkin.chip_sakit },
        { label: t.checkin.chip_sibuk, value: t.checkin.chip_sibuk },
        { label: t.checkin.chip_distraksi, value: t.checkin.chip_distraksi }
    ];

    return (
        <div className="space-y-6">
            {/* Win of Day */}
            <div className="bg-card rounded-sm p-4 border-2 border-paper-lines/50 shadow-notebook">
                <label className="flex items-center gap-2 font-handwriting text-base text-ink mb-3">
                    <Trophy className="w-5 h-5 text-sticky-yellow" />
                    {t.checkin.win_of_day}
                </label>
                <Textarea
                    value={winOfDay}
                    onChange={(e) => setWinOfDay(e.target.value)}
                    placeholder={t.checkin.win_placeholder}
                    variant="notebook"
                    className="min-h-[120px]"
                />
            </div>

            {/* Hurdle */}
            <div className="bg-card rounded-sm p-4 border-2 border-paper-lines/50 shadow-notebook">
                <label className="flex items-center gap-2 font-handwriting text-base text-ink mb-3">
                    <Construction className="w-5 h-5 text-orange-500" />
                    {t.checkin.hurdle}
                </label>
                <Textarea
                    value={hurdle}
                    onChange={(e) => setHurdle(e.target.value)}
                    placeholder={t.checkin.hurdle_placeholder}
                    variant="notebook"
                    className="min-h-[100px] mb-3"
                />
                <div className="flex flex-wrap gap-2">
                    {chips.map((chip) => (
                        <button
                            key={chip.value}
                            type="button"
                            onClick={() => handleAddChip(chip.value)}
                            className="px-3 py-1 bg-sticky-pink/50 hover:bg-sticky-pink text-ink text-xs rounded-sm font-handwriting transition-colors shadow-tape"
                        >
                            + {chip.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
