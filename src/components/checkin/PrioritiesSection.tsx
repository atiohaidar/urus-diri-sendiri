import { Rocket, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/i18n/LanguageContext';

interface PrioritiesSectionProps {
    priorities: string[];
    setPriorities: (val: string[]) => void;
}

export const PrioritiesSection = ({ priorities, setPriorities }: PrioritiesSectionProps) => {
    const { t } = useLanguage();

    const updatePriority = (index: number, value: string) => {
        const updated = [...priorities];
        updated[index] = value;
        setPriorities(updated);
    };

    const addPriorityRow = () => {
        setPriorities([...priorities, '']);
    };

    const removePriorityRow = (index: number) => {
        const updated = [...priorities];
        updated.splice(index, 1);
        setPriorities(updated);
    };

    return (
        <div className="bg-card rounded-sm p-4 border-2 border-paper-lines/50 shadow-notebook">
            <label className="flex items-center gap-2 font-handwriting text-base text-ink mb-3">
                <Rocket className="w-5 h-5 text-doodle-primary" />
                {t.checkin.priorities}
            </label>
            <div className="space-y-3">
                {priorities.map((priority, index) => (
                    <div key={index} className="flex items-center gap-3 group">
                        <span className="w-8 h-8 rounded-full border-2 border-dashed border-doodle-primary flex items-center justify-center text-sm font-handwriting text-doodle-primary shrink-0">
                            {index + 1}
                        </span>
                        <Input
                            value={priority}
                            onChange={(e) => updatePriority(index, e.target.value)}
                            placeholder={index === 0 ? t.checkin.priority_1_placeholder : index === 1 ? t.checkin.priority_2_placeholder : t.checkin.priority_3_placeholder}
                            variant="notebook"
                            className="font-handwriting"
                        />
                        {priorities.length > 1 && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="opacity-0 group-hover:opacity-100 transition-opacity rounded-sm hover:bg-doodle-red/10 hover:text-doodle-red"
                                onClick={() => removePriorityRow(index)}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                ))}
                <Button
                    variant="outline"
                    onClick={addPriorityRow}
                    className="w-full h-11 rounded-sm border-2 border-dashed border-doodle-primary/40 bg-transparent hover:bg-doodle-primary/10 gap-2 text-doodle-primary font-handwriting"
                >
                    <Plus className="w-4 h-4" />
                    {t.checkin.add_priority}
                </Button>
            </div>
        </div>
    );
};
