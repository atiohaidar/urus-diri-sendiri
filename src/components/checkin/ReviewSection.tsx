import { CheckCircle2 } from 'lucide-react';
import { getRoutines, getPriorities } from '@/lib/storage';
import { useLanguage } from '@/i18n/LanguageContext';

export const ReviewSection = () => {
    const { t } = useLanguage();

    // Note: getRoutines() and getPriorities() access localStorage synchronously.
    // In a reactive setup, we might want to pass these as props if they change dynamically,
    // but for the check-in page usage flow, direct access is acceptable as done in original file.

    const routines = getRoutines();
    const priorities = getPriorities();

    const completedRoutines = routines.filter(r => r.completedAt).length;
    const completedPriorities = priorities.filter(p => p.completed).length;

    return (
        <div className="bg-sticky-green/20 rounded-sm p-4 border-2 border-dashed border-sticky-green/50 shadow-notebook">
            <label className="flex items-center gap-2 font-handwriting text-base text-ink mb-3">
                <CheckCircle2 className="w-5 h-5 text-doodle-green" />
                {t.checkin.review_section_title}
            </label>
            <div className="space-y-2 font-handwriting">
                <div className="flex justify-between items-center">
                    <span className="text-pencil">{t.checkin.routines_completed}</span>
                    <span className="text-doodle-green font-semibold">
                        {completedRoutines}/{routines.length} ✓
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-pencil">{t.checkin.priorities_achieved}</span>
                    <span className="text-doodle-green font-semibold">
                        {completedPriorities}/{priorities.length} ✓
                    </span>
                </div>
            </div>
        </div>
    );
};
