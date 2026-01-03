import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sparkles, Trophy, PenLine } from 'lucide-react';
import { Habit } from '@/lib/types';
import { cn } from '@/lib/utils';

interface HabitCompletionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    habitName: string;
    onSave: (note: string) => void;
}

const HabitCompletionModal = ({
    open,
    onOpenChange,
    habitName,
    onSave,
}: HabitCompletionModalProps) => {
    const [note, setNote] = useState('');

    useEffect(() => {
        if (open) {
            setNote('');
        }
    }, [open]);

    const handleSubmit = () => {
        onSave(note);
        onOpenChange(false);
    };

    const handleSkip = () => {
        onSave('');
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="mx-auto w-16 h-16 rounded-sm bg-sticky-yellow shadow-sticky flex items-center justify-center mb-3 rotate-6">
                        <Trophy className="w-8 h-8 text-ink" />
                    </div>
                    <DialogTitle className="text-center font-handwriting text-2xl text-ink">
                        Keren! 🎉
                    </DialogTitle>
                    <DialogDescription className="text-center font-handwriting text-base text-pencil">
                        Kamu telah menyelesaikan <span className="font-semibold text-ink">"{habitName}"</span>. Mau tambahkan catatan?
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="note" className="sr-only">Note</Label>
                        <Textarea
                            id="note"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="e.g. Lari 5km dalam 25 menit, Baca bab 3, dll."
                            variant="notebook"
                            className="resize-none font-handwriting"
                            autoFocus
                        />
                    </div>
                </div>

                <DialogFooter className="sm:justify-between gap-2 sm:gap-0 flex-col-reverse sm:flex-row">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={handleSkip}
                        className="w-full sm:w-auto font-handwriting text-pencil rounded-sm"
                    >
                        Lewati
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSubmit}
                        className={cn(
                            "w-full sm:w-auto gap-2 font-handwriting rounded-sm",
                            "bg-doodle-primary hover:bg-doodle-primary/90 text-white shadow-notebook"
                        )}
                    >
                        <PenLine className="w-4 h-4" />
                        Simpan Catatan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default HabitCompletionModal;
