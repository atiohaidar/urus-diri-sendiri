import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sparkles, X } from 'lucide-react';
import { Habit } from '@/lib/types';

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

    // Reset state when modal opens
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
                    <div className="mx-auto w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-3">
                        <Sparkles className="w-6 h-6 text-orange-500" />
                    </div>
                    <DialogTitle className="text-center">Great Job!</DialogTitle>
                    <DialogDescription className="text-center">
                        You've completed <span className="font-semibold text-foreground">"{habitName}"</span>. Want to add a note?
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="note" className="sr-only">Note</Label>
                        <Textarea
                            id="note"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="e.g. Ran 5km in 25 mins, Read chapter 3, etc."
                            className="resize-none"
                            autoFocus
                        />
                    </div>
                </div>

                <DialogFooter className="sm:justify-between gap-2 sm:gap-0 flex-col-reverse sm:flex-row">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={handleSkip}
                        className="w-full sm:w-auto text-muted-foreground"
                    >
                        Skip
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSubmit}
                        className="w-full sm:w-auto gap-2 bg-gradient-to-tr from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-0"
                    >
                        Save Note
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default HabitCompletionModal;
