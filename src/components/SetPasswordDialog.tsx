import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

interface SetPasswordDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (password: string) => void;
    isChanging?: boolean; // true if changing existing password
}

export const SetPasswordDialog = ({ open, onClose, onConfirm, isChanging = false }: SetPasswordDialogProps) => {
    const { t } = useLanguage();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleConfirm = () => {
        // Validate password length
        if (password.length < 8) {
            setError(t.note_editor.password_placeholder);
            return;
        }

        // Validate password match
        if (password !== confirmPassword) {
            setError(t.note_editor.passwords_dont_match);
            return;
        }

        onConfirm(password);
        handleClose();
    };

    const handleClose = () => {
        setPassword('');
        setConfirmPassword('');
        setError('');
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-md bg-paper border-2 border-dashed border-paper-lines shadow-notebook">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 font-handwriting text-2xl text-ink">
                        <Lock className="w-6 h-6 text-doodle-primary" />
                        {isChanging ? t.note_editor.change_password : t.note_editor.set_password}
                    </DialogTitle>
                    <DialogDescription className="font-handwriting text-ink/70">
                        {t.note_editor.password_required}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-4">
                    {/* Password Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-handwriting text-ink/80">
                            Password
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
                        />
                    </div>

                    {/* Confirm Password Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-handwriting text-ink/80">
                            {t.note_editor.confirm_password}
                        </label>
                        <Input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                setError('');
                            }}
                            placeholder={t.note_editor.confirm_password}
                            className="font-handwriting border-2 border-dashed border-paper-lines focus-visible:border-doodle-primary"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleConfirm();
                                }
                            }}
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <p className="text-sm text-doodle-red font-handwriting">
                            {error}
                        </p>
                    )}

                    {/* Warning */}
                    <div className="bg-sticky-yellow/20 border-2 border-dashed border-doodle-orange/30 rounded-sm p-3">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="w-5 h-5 text-doodle-orange flex-shrink-0 mt-0.5" />
                            <p className="text-sm font-handwriting text-ink">
                                {t.note_editor.password_warning}
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                        <Button
                            variant="outline"
                            onClick={handleClose}
                            className="flex-1 font-handwriting border-2 border-dashed border-paper-lines hover:bg-paper-lines/20"
                        >
                            {t.note_editor.cancel}
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            className="flex-1 font-handwriting bg-doodle-primary hover:bg-doodle-primary/90 text-white shadow-notebook"
                        >
                            <Lock className="w-4 h-4 mr-2" />
                            {isChanging ? t.common.save : t.note_editor.lock_note}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
