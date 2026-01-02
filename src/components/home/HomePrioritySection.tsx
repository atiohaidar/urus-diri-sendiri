import { useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import PriorityItem from '@/components/PriorityItem';
import { useLanguage } from '@/i18n/LanguageContext';
import { PriorityTask } from '@/lib/storage';

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
        <section className={`${isDesktop ? 'bg-card/50 rounded-3xl p-6 border border-border/50 h-full' : ''} ${className}`}>
            <div className={`flex items-center justify-between ${isDesktop ? 'mb-6' : 'mb-4'}`}>
                <h2 className={`${isDesktop ? 'text-2xl' : 'text-lg md:text-xl'} font-bold text-foreground`}>
                    {t.home.priorities_title}
                </h2>
                <span className={`${isDesktop ? 'text-base' : 'text-sm md:text-base'} text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full`}>
                    {priorities.filter(p => p.completed).length}/{priorities.length} {t.home.priorities_done_suffix}
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

                    {/* Add Priority Input */}
                    <div className={`flex gap-2 ${!isDesktop ? 'animate-in fade-in slide-in-from-top-2 duration-300' : 'pt-4'}`}>
                        <Input
                            ref={inputRef}
                            placeholder={t.home.add_priority_placeholder}
                            className={`${isDesktop ? 'h-14 text-lg' : 'h-12'} bg-card rounded-xl border-dashed border-2 border-border/50 focus-visible:ring-primary/30`}
                            onKeyDown={handleKeyDown}
                        />
                        <Button
                            variant="outline"
                            className={`${isDesktop ? 'h-14 w-14' : 'h-12 w-12'} rounded-xl border-dashed border-2`}
                            onClick={handleButtonClick}
                            aria-label={t.home.add_priority_placeholder}
                        >
                            <Plus className={`${isDesktop ? 'w-6 h-6' : 'w-5 h-5'}`} />
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className={`bg-card rounded-3xl ${isDesktop ? 'p-12' : 'p-8'} text-center card-elevated border-2 border-dashed border-border/50`}>
                        <p className={`text-muted-foreground mb-2 font-medium ${isDesktop ? 'text-xl' : 'text-lg'}`}>
                            {t.home.no_priorities_title}
                        </p>
                        <p className={`text-muted-foreground/70 ${isDesktop ? 'text-base' : 'text-sm'}`}>
                            {t.home.no_priorities_desc}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Input
                            ref={inputRef}
                            placeholder={t.home.first_priority_placeholder}
                            className={`${isDesktop ? 'h-14 text-lg' : 'h-12'} bg-card rounded-xl border-dashed border-2 border-border/50`}
                            onKeyDown={handleKeyDown}
                        />
                    </div>
                </div>
            )}
        </section>
    );
};
