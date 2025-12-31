import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Construction, Rocket, Sprout, ArrowRight, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { saveReflection } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';

const MaghribCheckinPage = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
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
            title: "Reflection saved! 🌙",
            description: "Your priorities for tomorrow are set.",
        });

        navigate('/');
    };

    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'short'
    });

    return (
        <div className="min-h-screen bg-background pb-24 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="container max-w-md mx-auto px-4 py-6">
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
                    <span className="font-medium">Evening Reflection</span>
                    <span className="text-sm text-primary font-medium">{today}</span>
                </div>

                {/* Title */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-foreground mb-2">Maghrib Check-in</h1>
                    <p className="text-muted-foreground">Take a moment to close your day.</p>
                </div>

                {/* Win of the Day */}
                <div className="mb-6 animate-fade-in" style={{ animationDelay: '50ms' }}>
                    <label className="flex items-center gap-2 text-sm font-semibold mb-3">
                        <Trophy className="w-4 h-4 text-amber-500" />
                        Win of the Day
                    </label>
                    <Textarea
                        value={winOfDay}
                        onChange={(e) => setWinOfDay(e.target.value)}
                        placeholder="What went well today? What are you grateful for?"
                        className="min-h-[100px] bg-card rounded-2xl border-0 resize-none card-elevated focus-visible:ring-primary"
                    />
                </div>

                {/* The Hurdle */}
                <div className="mb-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
                    <label className="flex items-center gap-2 text-sm font-semibold mb-3">
                        <Construction className="w-4 h-4 text-orange-500" />
                        The Hurdle
                    </label>
                    <Textarea
                        value={hurdle}
                        onChange={(e) => setHurdle(e.target.value)}
                        placeholder="What was challenging? What held you back?"
                        className="min-h-[100px] bg-card rounded-2xl border-0 resize-none card-elevated focus-visible:ring-primary"
                    />
                </div>

                {/* Top 3 Priorities */}
                <div className="mb-6 animate-fade-in" style={{ animationDelay: '150ms' }}>
                    <label className="flex items-center gap-2 text-sm font-semibold mb-3">
                        <Rocket className="w-4 h-4 text-primary" />
                        Top 3 Priorities Tomorrow
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
                                    placeholder={index === 0 ? 'Most important task' : index === 1 ? 'Secondary task' : 'Final priority'}
                                    className="bg-card rounded-xl border-0 h-11 card-elevated focus-visible:ring-primary"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* One Small Change */}
                <div className="mb-8 animate-fade-in" style={{ animationDelay: '200ms' }}>
                    <label className="flex items-center gap-2 text-sm font-semibold mb-3">
                        <Sprout className="w-4 h-4 text-emerald-500" />
                        One Small Change
                    </label>
                    <Textarea
                        value={smallChange}
                        onChange={(e) => setSmallChange(e.target.value)}
                        placeholder="What can I do 1% better tomorrow?"
                        className="min-h-[80px] bg-card rounded-2xl border-0 resize-none card-elevated focus-visible:ring-primary"
                    />
                </div>

                {/* Decorative leaf */}
                <div className="flex justify-center mb-6">
                    <Leaf className="w-6 h-6 text-primary/40" />
                </div>
            </div>

            {/* Save Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-lg border-t border-border safe-bottom">
                <div className="container max-w-md mx-auto">
                    <Button
                        onClick={handleSave}
                        className="w-full h-14 rounded-2xl text-base font-semibold gap-2 shadow-lg shadow-primary/20"
                    >
                        Save Reflection
                        <ArrowRight className="w-5 h-5" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default MaghribCheckinPage;
