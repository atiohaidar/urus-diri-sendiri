import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { type Habit, type HabitFrequency } from '@/lib/storage';

interface HabitFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    habit?: Habit | null;
    onSave: (habit: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'> | Partial<Habit>) => void;
}

const EMOJI_OPTIONS = ['💪', '📚', '🧘', '🏃', '💧', '🎯', '✍️', '🛏️', '🍎', '💊', '🎸', '🌱'];

const DAY_OPTIONS = [
    { value: 0, label: 'Sun' },
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' },
];

const FREQUENCY_OPTIONS: { value: HabitFrequency; label: string; description: string }[] = [
    { value: 'daily', label: 'Daily', description: 'Every day' },
    { value: 'weekly', label: 'Weekly', description: 'Once a week' },
    { value: 'every_n_days', label: 'Every N days', description: 'Custom interval' },
    { value: 'specific_days', label: 'Specific days', description: 'Choose days' },
];

const HabitFormModal = ({ open, onOpenChange, habit, onSave }: HabitFormModalProps) => {
    const isEditing = !!habit;

    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [icon, setIcon] = useState('💪');
    const [frequency, setFrequency] = useState<HabitFrequency>('daily');
    const [interval, setInterval] = useState(2);
    const [specificDays, setSpecificDays] = useState<number[]>([1, 3, 5]); // Mon, Wed, Fri
    const [allowedDayOff, setAllowedDayOff] = useState(1);

    // Reset form when modal opens/closes or habit changes
    useEffect(() => {
        if (open && habit) {
            setName(habit.name);
            setDescription(habit.description || '');
            setIcon(habit.icon || '💪');
            setFrequency(habit.frequency);
            setInterval(habit.interval || 2);
            setSpecificDays(habit.specificDays || [1, 3, 5]);
            setAllowedDayOff(habit.allowedDayOff ?? 1);
        } else if (open && !habit) {
            // Reset to defaults for new habit
            setName('');
            setDescription('');
            setIcon('💪');
            setFrequency('daily');
            setInterval(2);
            setSpecificDays([1, 3, 5]);
            setAllowedDayOff(1);
        }
    }, [open, habit]);

    const toggleDay = (day: number) => {
        setSpecificDays(prev =>
            prev.includes(day)
                ? prev.filter(d => d !== day)
                : [...prev, day].sort((a, b) => a - b)
        );
    };

    const handleSubmit = () => {
        if (!name.trim()) return;

        const habitData = {
            name: name.trim(),
            description: description.trim() || undefined,
            icon,
            frequency,
            interval: frequency === 'every_n_days' ? interval : undefined,
            specificDays: frequency === 'specific_days' ? specificDays : undefined,
            allowedDayOff,
        };

        onSave(habitData);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Edit Habit' : 'New Habit'}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Name & Icon */}
                    <div className="space-y-2">
                        <Label>Name</Label>
                        <div className="flex gap-2">
                            <div className="flex-shrink-0">
                                <div className="relative">
                                    <button
                                        type="button"
                                        className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-2xl hover:bg-secondary/80 transition-colors"
                                    >
                                        {icon}
                                    </button>
                                </div>
                            </div>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Morning Exercise"
                                className="flex-1"
                            />
                        </div>

                        {/* Emoji Picker */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {EMOJI_OPTIONS.map((emoji) => (
                                <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => setIcon(emoji)}
                                    className={cn(
                                        "w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all",
                                        icon === emoji
                                            ? "bg-primary/20 ring-2 ring-primary"
                                            : "bg-muted hover:bg-muted/80"
                                    )}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label>Description (optional)</Label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Why is this habit important to you?"
                            rows={2}
                        />
                    </div>

                    {/* Frequency */}
                    <div className="space-y-3">
                        <Label>Frequency</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {FREQUENCY_OPTIONS.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setFrequency(option.value)}
                                    className={cn(
                                        "p-3 rounded-xl text-left transition-all border-2",
                                        frequency === option.value
                                            ? "border-primary bg-primary/5"
                                            : "border-border/50 hover:border-border"
                                    )}
                                >
                                    <div className="font-medium text-sm">{option.label}</div>
                                    <div className="text-xs text-muted-foreground">{option.description}</div>
                                </button>
                            ))}
                        </div>

                        {/* Every N Days Slider */}
                        {frequency === 'every_n_days' && (
                            <div className="space-y-2 p-4 bg-muted/50 rounded-xl">
                                <div className="flex justify-between text-sm">
                                    <span>Interval</span>
                                    <span className="font-medium">Every {interval} days</span>
                                </div>
                                <Slider
                                    value={[interval]}
                                    onValueChange={([val]) => setInterval(val)}
                                    min={2}
                                    max={14}
                                    step={1}
                                />
                            </div>
                        )}

                        {/* Specific Days Selector */}
                        {frequency === 'specific_days' && (
                            <div className="flex gap-1.5 p-4 bg-muted/50 rounded-xl justify-center">
                                {DAY_OPTIONS.map((day) => (
                                    <button
                                        key={day.value}
                                        type="button"
                                        onClick={() => toggleDay(day.value)}
                                        className={cn(
                                            "w-10 h-10 rounded-full text-xs font-medium transition-all",
                                            specificDays.includes(day.value)
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-background border border-border hover:border-primary/50"
                                        )}
                                    >
                                        {day.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Day Off Allowance */}
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Label>Allowed Day Off</Label>
                            <span className="text-sm text-muted-foreground">
                                {allowedDayOff} day{allowedDayOff !== 1 ? 's' : ''}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            How many scheduled days can you skip without breaking your streak?
                        </p>
                        <Slider
                            value={[allowedDayOff]}
                            onValueChange={([val]) => setAllowedDayOff(val)}
                            min={0}
                            max={3}
                            step={1}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={!name.trim()}>
                        {isEditing ? 'Save Changes' : 'Create Habit'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default HabitFormModal;
