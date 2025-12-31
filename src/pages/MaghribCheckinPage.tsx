import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Construction, Rocket, Sprout, ArrowRight, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { saveReflection } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/i18n/LanguageContext';

const MaghribCheckinPage = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { t, language } = useLanguage();
    const [winOfDay, setWinOfDay] = useState('');
    const [hurdle, setHurdle] = useState('');
    const [priorities, setPriorities] = useState(['', '', '']);
    const [smallChange, setSmallChange] = useState('');

    const updatePriority = (index: number, value: string) => {
        const updated = [...priorities];
        updated[index] = value;
        setPriorities(updated);
    };

    const handleSave = () => {
        saveReflection({
            date: new Date().toISOString(),
            winOfDay,
            hurdle,
            priorities,
            smallChange,
        });

        toast({
            title: t.checkin.save_toast_title,
            description: t.checkin.save_toast_desc,
        });

        navigate('/');
    };

    const today = new Date().toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'short'
    });

    return (
        <div className="min-h-screen bg-background pb-24 md:pb-8 animate-in fade-in slide-in-from-bottom-4 duration-300 md:pl-64">
            <div className="container max-w-4xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="-ml-2 rounded-full"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <span className="font-medium">{t.checkin.title}</span>
                    <span className="text-sm text-primary font-medium">{today}</span>
                </div>

                {/* Title */}
                <div className="mb-8 text-center md:text-left">
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{t.checkin.title}</h1>
                    <p className="text-muted-foreground">{t.checkin.subtitle}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                    {/* Left Column */}
                    <div className="space-y-6">
                        {/* Win of the Day */}
                        <div className="animate-fade-in" style={{ animationDelay: '50ms' }}>
                            <label className="flex items-center gap-2 text-sm font-semibold mb-3">
                                <Trophy className="w-4 h-4 text-amber-500" />
                                {t.checkin.win_of_day}
                            </label>
                            <Textarea
                                value={winOfDay}
                                onChange={(e) => setWinOfDay(e.target.value)}
                                placeholder={t.checkin.win_placeholder}
                                className="min-h-[120px] bg-card rounded-2xl border-0 resize-none card-elevated focus-visible:ring-primary"
                            />
                        </div>

                        {/* The Hurdle */}
                        <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
                            <label className="flex items-center gap-2 text-sm font-semibold mb-3">
                                <Construction className="w-4 h-4 text-orange-500" />
                                {t.checkin.hurdle}
                            </label>
                            <Textarea
                                value={hurdle}
                                onChange={(e) => setHurdle(e.target.value)}
                                placeholder={t.checkin.hurdle_placeholder}
                                className="min-h-[120px] bg-card rounded-2xl border-0 resize-none card-elevated focus-visible:ring-primary"
                            />
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        {/* Top 3 Priorities */}
                        <div className="animate-fade-in" style={{ animationDelay: '150ms' }}>
                            <label className="flex items-center gap-2 text-sm font-semibold mb-3">
                                <Rocket className="w-4 h-4 text-primary" />
                                {t.checkin.priorities}
                            </label>
                            <div className="space-y-3">
                                {priorities.map((priority, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                        <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                                            {index + 1}
                                        </span>
                                        <Input
                                            value={priority}
                                            onChange={(e) => updatePriority(index, e.target.value)}
                                            placeholder={index === 0 ? t.checkin.priority_1_placeholder : index === 1 ? t.checkin.priority_2_placeholder : t.checkin.priority_3_placeholder}
                                            className="bg-card rounded-xl border-0 h-11 card-elevated focus-visible:ring-primary"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* One Small Change */}
                        <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
                            <label className="flex items-center gap-2 text-sm font-semibold mb-3">
                                <Sprout className="w-4 h-4 text-emerald-500" />
                                {t.checkin.small_change}
                            </label>
                            <Textarea
                                value={smallChange}
                                onChange={(e) => setSmallChange(e.target.value)}
                                placeholder={t.checkin.small_change_placeholder}
                                className="min-h-[80px] bg-card rounded-2xl border-0 resize-none card-elevated focus-visible:ring-primary"
                            />
                        </div>
                    </div>
                </div>

                {/* Decorative leaf */}
                <div className="flex justify-center my-8">
                    <Leaf className="w-6 h-6 text-primary/40" />
                </div>
            </div>

            {/* Save Button */}
            <div className="fixed bottom-0 left-0 right-0 md:left-64 p-4 bg-background/80 backdrop-blur-lg border-t border-border safe-bottom md:static md:bg-transparent md:border-0 md:p-0 md:mt-4">
                <div className="container max-w-4xl mx-auto md:px-4">
                    <Button
                        onClick={handleSave}
                        className="w-full h-14 rounded-2xl text-base font-semibold gap-2 shadow-lg shadow-primary/20 md:w-auto md:px-8 md:float-right"
                    >
                        {t.checkin.save}
                        <ArrowRight className="w-5 h-5" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default MaghribCheckinPage;
