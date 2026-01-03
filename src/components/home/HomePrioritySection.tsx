import { useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Star } from 'lucide-react';
import PriorityItem from '@/components/PriorityItem';
import { useLanguage } from '@/i18n/LanguageContext';
import { PriorityTask } from '@/lib/storage';
import { cn } from '@/lib/utils';

interface HomePrioritySectionProps {
    priorities: PriorityTask[];
    onToggle: (id: string, completed: boolean, note?: string) => void;
    onDelete: (id: string) => void;
    onUpdate: (id: string, text: string) => void;
    onAdd: (text: string) => void;
    variant?: 'mobile' | 'desktop';
    className?: string;
}

export const HomePrioritySection = ({
    priorities,
    onToggle,
    onDelete,
    onUpdate,
    onAdd,
    variant = 'mobile',
    className
}: HomePrioritySectionProps) => {
    const { t } = useLanguage();
    const isDesktop = variant === 'desktop';
    const inputRef = useRef<HTMLInputElement>(null);

    // Helper handling input submission
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const val = e.currentTarget.value.trim();
            if (val) {
                onAdd(val);
                e.currentTarget.value = '';
            }
        }
    };

    const handleButtonClick = () => {
        if (inputRef.current && inputRef.current.value.trim()) {
            onAdd(inputRef.current.value.trim());
            inputRef.current.value = '';
            inputRef.current.focus();
        }
    };

    return (
        <section className={cn(
            isDesktop && "bg-paper/50 rounded-sm p-6 border-2 border-dashed border-paper-lines h-full shadow-notebook",
            className
        )}>
            {/* Section Header - Notebook style */}
            <div className={`flex items-center justify-between ${isDesktop ? 'mb-6' : 'mb-4'}`}>
                <h2 className={cn(
                    "font-handwriting text-ink flex items-center gap-2",
                    isDesktop ? "text-2xl" : "text-xl"
                )}>
                    <span className="underline-squiggle">{t.home.priorities_title}</span>
                    <Star className="w-4 h-4 text-sticky-yellow fill-sticky-yellow" />
                </h2>
                {/* Progress badge - Grade circle style */}
                <span className={cn(
                    "font-handwriting rounded-full px-3 py-1",
                    "bg-paper-lines/20 text-pencil border-2 border-dashed border-pencil/30",
                    isDesktop ? "text-base" : "text-sm"
                )}>
                    {priorities.filter(p => p.completed).length}/{priorities.length} ✓
                </span>
            </div>

            {priorities.length > 0 ? (
                <div className="space-y-4">
                    <div className={`grid ${isDesktop ? 'grid-cols-1 gap-3' : 'grid-cols-1 lg:grid-cols-2 gap-3'}`}>
                        {priorities.map((priority, index) => (
                            <PriorityItem
                                key={`${variant}-${priority.id}`}
                                priority={priority}
                                index={index}
                                onToggle={onToggle}
                                onDelete={onDelete}
                                onUpdate={onUpdate}
                            />
                        ))}
                    </div>

                    {/* Add Priority Input - Notebook style */}
                    <div className={`flex gap-2 ${!isDesktop ? '' : 'pt-4'}`}>
                        <Input
                            ref={inputRef}
                            placeholder={t.home.add_priority_placeholder}
                            variant="notebook"
                            className={cn(
                                "font-handwriting",
                                isDesktop ? "h-14 text-lg" : "h-12"
                            )}
                            onKeyDown={handleKeyDown}
                        />
                        <Button
                            variant="outline"
                            className={cn(
                                "rounded-sm border-2 border-dashed border-pencil/40",
                                "hover:border-doodle-primary hover:bg-doodle-primary/10",
                                isDesktop ? "h-14 w-14" : "h-12 w-12"
                            )}
                            onClick={handleButtonClick}
                            aria-label={t.home.add_priority_placeholder}
                        >
                            <Plus className={isDesktop ? "w-6 h-6" : "w-5 h-5"} />
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Empty state - Notebook doodle style */}
                    <div className={cn(
                        "bg-sticky-yellow/20 rounded-sm text-center",
                        "border-2 border-dashed border-sticky-yellow/50",
                        isDesktop ? "p-12" : "p-8"
                    )}>
                        <p className={cn(
                            "font-handwriting text-ink mb-2",
                            isDesktop ? "text-xl" : "text-lg"
                        )}>
                            {t.home.no_priorities_title} 📝
                        </p>
                        <p className={cn(
                            "font-handwriting text-pencil italic",
                            isDesktop ? "text-base" : "text-sm"
                        )}>
                            "{t.home.no_priorities_desc}"
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Input
                            ref={inputRef}
                            placeholder={t.home.first_priority_placeholder}
                            variant="notebook"
                            className={cn(
                                "font-handwriting",
                                isDesktop ? "h-14 text-lg" : "h-12"
                            )}
                            onKeyDown={handleKeyDown}
                        />
                    </div>
                </div>
            )}
        </section>
    );
};
