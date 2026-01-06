import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

interface SetupPersonalNotesDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (password: string) => void;
}

export const SetupPersonalNotesDialog = ({ open, onClose, onConfirm }: SetupPersonalNotesDialogProps) => {
    const { t } = useLanguage();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleConfirm = () => {
        // Validate password length
        if (password.length < 8) {
            setError('Password minimal 8 karakter');
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
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Lock className="w-5 h-5" />
                        {t.personal_notes.setup_title}
                    </DialogTitle>
                    <DialogDescription>
                        {t.personal_notes.setup_description}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-4">
                    {/* Password Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
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
                            autoFocus
                        />
                    </div>

                    {/* Confirm Password Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
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
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleConfirm();
                                }
                            }}
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <p className="text-sm text-destructive">
                            {error}
                        </p>
                    )}

                    {/* Warning */}
                    <div className="bg-destructive/10 border-2 border-destructive/20 rounded-md p-3">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-destructive font-medium">
                                {t.personal_notes.setup_warning}
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                        <Button
                            variant="outline"
                            onClick={handleClose}
                            className="flex-1"
                        >
                            {t.common.cancel}
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            className="flex-1"
                        >
                            <Lock className="w-4 h-4 mr-2" />
                            {t.personal_notes.setup_button}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
