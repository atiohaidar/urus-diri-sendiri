import { useState, useEffect } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";

interface CompletionNoteDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (note: string) => void;
    initialNote?: string;
    title: string;
}

export const CompletionNoteDialog = ({
    isOpen,
    onClose,
    onSave,
    initialNote = '',
    title
}: CompletionNoteDialogProps) => {
    const [note, setNote] = useState(initialNote);

    useEffect(() => {
        if (isOpen) {
            setNote(initialNote || '');
        }
    }, [isOpen, initialNote]);

    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <AlertDialogContent className="max-w-[85vw] rounded-2xl">
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        Tambahkan catatan opsional untuk aktivitas ini.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-2">
                    <Textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Ada catatan kusus? (Opsional)"
                        className="bg-secondary/30 min-h-[100px] resize-none focus-visible:ring-primary"
                        autoFocus
                    />
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onClose}>Batal</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => onSave(note)}
                        className="bg-primary hover:bg-primary/90"
                    >
                        Simpan
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
