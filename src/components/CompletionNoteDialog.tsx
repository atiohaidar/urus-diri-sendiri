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
    const [note, setNote] = useState(initialNote || '');

    useEffect(() => {
        if (isOpen) {
            setNote(initialNote || '');
        }
    }, [isOpen, initialNote]);

    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <AlertDialogContent className="max-w-[85vw] rounded-sm">
                <AlertDialogHeader>
                    <AlertDialogTitle className="font-handwriting text-xl text-ink">
                        ✓ {title}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="font-handwriting text-pencil">
                        Tambahkan catatan opsional untuk aktivitas ini.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-2">
                    <Textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Ada catatan khusus? (Opsional) ✏️"
                        variant="notebook"
                        className="min-h-[100px]"
                        autoFocus
                    />
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel
                        onClick={onClose}
                        className="font-handwriting rounded-sm border-2 border-dashed border-pencil/40"
                    >
                        Batal
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => onSave(note)}
                        className="font-handwriting rounded-sm bg-doodle-primary hover:bg-doodle-primary/90 shadow-notebook"
                    >
                        ✓ Simpan
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
