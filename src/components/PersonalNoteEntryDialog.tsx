import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';

interface PersonalNoteEntryDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (label: string, value: string) => void;
    initialLabel?: string;
    initialValue?: string;
    isEdit?: boolean;
}

export const PersonalNoteEntryDialog = ({
    open,
    onClose,
    onSave,
    initialLabel = '',
    initialValue = '',
    isEdit = false,
}: PersonalNoteEntryDialogProps) => {
    const { t } = useLanguage();
    const [label, setLabel] = useState(initialLabel);
    const [value, setValue] = useState(initialValue);
    const [error, setError] = useState('');

    useEffect(() => {
        if (open) {
            setLabel(initialLabel);
            setValue(initialValue);
            setError('');
        }
    }, [open, initialLabel, initialValue]);

    const handleSave = () => {
        if (!label.trim()) {
            setError('Label tidak boleh kosong');
            return;
        }
        if (!value.trim()) {
            setError('Nilai tidak boleh kosong');
            return;
        }

        onSave(label.trim(), value.trim());
        handleClose();
    };

    const handleClose = () => {
        setLabel('');
        setValue('');
        setError('');
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? t.personal_notes.entry_dialog_edit_title : t.personal_notes.entry_dialog_add_title}
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        {isEdit ? 'Edit your existing personal note entry' : 'Add a new personal note entry'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-4">
                    {/* Label Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            {t.personal_notes.table_label}
                        </label>
                        <Input
                            value={label}
                            onChange={(e) => {
                                setLabel(e.target.value);
                                setError('');
                            }}
                            placeholder={t.personal_notes.entry_label_placeholder}
                            autoFocus
                        />
                    </div>

                    {/* Value Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            {t.personal_notes.table_value}
                        </label>
                        <textarea
                            value={value}
                            onChange={(e) => {
                                setValue(e.target.value);
                                setError('');
                            }}
                            placeholder={t.personal_notes.entry_value_placeholder}
                            className="w-full min-h-[100px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-y"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.ctrlKey) {
                                    handleSave();
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
                            onClick={handleSave}
                            className="flex-1"
                        >
                            {t.common.save}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
