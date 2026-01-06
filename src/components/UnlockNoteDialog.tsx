import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock, Unlock } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

interface UnlockNoteDialogProps {
    open: boolean;
    onClose: () => void;
    onUnlock: (password: string) => Promise<boolean>; // Returns true if password is correct
    noteTitle: string;
}

export const UnlockNoteDialog = ({ open, onClose, onUnlock, noteTitle }: UnlockNoteDialogProps) => {
    const { t } = useLanguage();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isUnlocking, setIsUnlocking] = useState(false);

    const handleUnlock = async () => {
        if (!password.trim()) {
            setError(t.note_editor.password_required);
            return;
        }

        setIsUnlocking(true);
        setError('');

        try {
            const success = await onUnlock(password);

            if (success) {
                handleClose();
            } else {
                setError(t.note_editor.wrong_password);
                setPassword('');
            }
        } catch (err) {
            setError(t.note_editor.wrong_password);
            setPassword('');
        } finally {
            setIsUnlocking(false);
        }
    };

    const handleClose = () => {
        setPassword('');
        setError('');
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-md bg-paper border-2 border-dashed border-paper-lines shadow-notebook">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 font-handwriting text-2xl text-ink">
                        <Lock className="w-6 h-6 text-doodle-primary" />
                        {t.note_editor.locked_content}
                    </DialogTitle>
                    <DialogDescription className="font-handwriting text-ink/70">
                        "{noteTitle}"
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-4">
                    {/* Password Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-handwriting text-ink/80">
                            {t.note_editor.enter_password}
                        </label>
                        <Input
                            type="password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setError('');
                            }}
                            placeholder={t.note_editor.password_placeholder}
                            className="font-handwriting border-2 border-dashed border-paper-lines focus-visible:border-doodle-primary"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleUnlock();
                                }
                            }}
                            disabled={isUnlocking}
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-doodle-red/10 border-2 border-dashed border-doodle-red/30 rounded-sm p-3">
                            <p className="text-sm text-doodle-red font-handwriting">
                                🔒 {error}
                            </p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                        <Button
                            variant="outline"
                            onClick={handleClose}
                            className="flex-1 font-handwriting border-2 border-dashed border-paper-lines hover:bg-paper-lines/20"
                            disabled={isUnlocking}
                        >
                            {t.note_editor.cancel}
                        </Button>
                        <Button
                            onClick={handleUnlock}
                            className="flex-1 font-handwriting bg-doodle-primary hover:bg-doodle-primary/90 text-white shadow-notebook"
                            disabled={isUnlocking}
                        >
                            <Unlock className="w-4 h-4 mr-2" />
                            {isUnlocking ? '...' : t.note_editor.unlock}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
