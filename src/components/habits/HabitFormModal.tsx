import { useState, useEffect } from 'react';
import { X, Check, Sparkles } from 'lucide-react';
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
    { value: 0, label: 'Min' },
    { value: 1, label: 'Sen' },
    { value: 2, label: 'Sel' },
    { value: 3, label: 'Rab' },
    { value: 4, label: 'Kam' },
    { value: 5, label: 'Jum' },
    { value: 6, label: 'Sab' },
];

const FREQUENCY_OPTIONS: { value: HabitFrequency; label: string; description: string }[] = [
    { value: 'daily', label: 'Harian', description: 'Setiap hari' },
    { value: 'weekly', label: 'Mingguan', description: 'Sekali seminggu' },
    { value: 'every_n_days', label: 'Tiap N hari', description: 'Interval kustom' },
    { value: 'specific_days', label: 'Hari tertentu', description: 'Pilih hari' },
];

const HabitFormModal = ({ open, onOpenChange, habit, onSave }: HabitFormModalProps) => {
    const isEditing = !!habit;

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [icon, setIcon] = useState('💪');
    const [frequency, setFrequency] = useState<HabitFrequency>('daily');
    const [interval, setInterval] = useState(2);
    const [specificDays, setSpecificDays] = useState<number[]>([1, 3, 5]);
    const [allowedDayOff, setAllowedDayOff] = useState(1);

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
                    <DialogTitle className="font-handwriting text-xl text-ink flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-sticky-yellow" />
                        {isEditing ? 'Edit Kebiasaan' : 'Kebiasaan Baru'} 📝
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Name & Icon */}
                    <div className="space-y-2">
                        <Label className="font-handwriting text-pencil">Nama</Label>
                        <div className="flex gap-2">
                            <div className="flex-shrink-0">
                                <button
                                    type="button"
                                    className="w-12 h-12 rounded-sm bg-sticky-yellow shadow-tape flex items-center justify-center text-2xl hover:rotate-3 transition-transform"
                                >
                                    {icon}
                                </button>
                            </div>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Olahraga Pagi"
                                variant="notebook"
                                className="flex-1 font-handwriting"
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
                                        "w-9 h-9 rounded-sm flex items-center justify-center text-lg transition-all",
                                        icon === emoji
                                            ? "bg-sticky-yellow shadow-tape ring-2 ring-doodle-primary rotate-3"
                                            : "bg-paper-lines/20 hover:bg-paper-lines/40"
                                    )}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label className="font-handwriting text-pencil">Deskripsi (opsional)</Label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Kenapa kebiasaan ini penting?"
                            variant="notebook"
                            className="font-handwriting"
                            rows={2}
                        />
                    </div>

                    {/* Frequency */}
                    <div className="space-y-3">
                        <Label className="font-handwriting text-pencil">Frekuensi</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {FREQUENCY_OPTIONS.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setFrequency(option.value)}
                                    className={cn(
                                        "p-3 rounded-sm text-left transition-all border-2",
                                        frequency === option.value
                                            ? "border-doodle-primary bg-doodle-primary/5"
                                            : "border-dashed border-paper-lines/50 hover:border-paper-lines"
                                    )}
                                >
                                    <div className="font-handwriting text-sm text-ink">{option.label}</div>
                                    <div className="font-handwriting text-xs text-pencil">{option.description}</div>
                                </button>
                            ))}
                        </div>

                        {/* Every N Days Slider */}
                        {frequency === 'every_n_days' && (
                            <div className="space-y-2 p-4 bg-sticky-yellow/20 rounded-sm border-2 border-dashed border-sticky-yellow/50">
                                <div className="flex justify-between font-handwriting text-sm text-ink">
                                    <span>Interval</span>
                                    <span className="font-medium">Setiap {interval} hari</span>
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
                            <div className="flex gap-1.5 p-4 bg-sticky-blue/20 rounded-sm border-2 border-dashed border-sticky-blue/50 justify-center">
                                {DAY_OPTIONS.map((day) => (
                                    <button
                                        key={day.value}
                                        type="button"
                                        onClick={() => toggleDay(day.value)}
                                        className={cn(
                                            "w-10 h-10 rounded-full font-handwriting text-xs transition-all",
                                            specificDays.includes(day.value)
                                                ? "bg-doodle-primary text-white"
                                                : "bg-card border-2 border-dashed border-paper-lines hover:border-doodle-primary/50"
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
                            <Label className="font-handwriting text-pencil">Hari Libur yang Diizinkan</Label>
                            <span className="font-handwriting text-sm text-ink">
                                {allowedDayOff} hari
                            </span>
                        </div>
                        <p className="font-handwriting text-xs text-pencil">
                            Berapa hari bisa dilewati tanpa memutus streak?
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
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="font-handwriting rounded-sm border-2 border-dashed border-pencil/40"
                    >
                        Batal
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!name.trim()}
                        className="font-handwriting rounded-sm bg-doodle-primary hover:bg-doodle-primary/90 text-white shadow-notebook"
                    >
                        {isEditing ? 'Simpan' : 'Buat Kebiasaan'} ✓
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default HabitFormModal;
