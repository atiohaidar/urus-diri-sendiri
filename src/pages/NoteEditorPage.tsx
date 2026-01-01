import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, Trash2, Save, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useNotes } from '@/hooks/useNotes';
import { useToast } from '@/hooks/use-toast';
import { triggerHaptic } from '@/lib/haptics';
import { useLanguage } from '@/i18n/LanguageContext';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const NoteEditorPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { notes, saveNote, updateNote, deleteNote } = useNotes();
    const { toast } = useToast();
    const { t } = useLanguage();

    const isNew = id === 'new';
    const existingNote = notes.find(n => n.id === id);

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const hasInitialized = useRef(false);

    // Initialize state from existing note
    useEffect(() => {
        if (!isNew && existingNote && !hasInitialized.current) {
            setTitle(existingNote.title);
            setContent(existingNote.content);
            hasInitialized.current = true;
        }
    }, [isNew, existingNote]);

    const handleSave = (silent = false) => {
        // Don't save empty notes
        if (!title.trim() && !content.trim()) {
            return;
        }

        // If title is empty but content exists, use truncated content as title
        let finalTitle = title;
        if (!finalTitle.trim() && content.trim()) {
            finalTitle = content.split('\n')[0].substring(0, 30) + '...';
        }

        if (isNew) {
            // Check if we just saved it (to avoid dupes if double triggered, purely defensive)
            saveNote(finalTitle, content);
            if (!silent) {
                toast({ title: t.note_editor.toast_saved });
                triggerHaptic();
            }
        } else if (existingNote) {
            // Only update if changed
            if (existingNote.title !== finalTitle || existingNote.content !== content) {
                updateNote(existingNote.id, { title: finalTitle, content });
                if (!silent) {
                    toast({ title: t.note_editor.toast_updated });
                    triggerHaptic();
                }
            }
        }
    };

    const handleBack = () => {
        handleSave(true); // Auto-save on back
        triggerHaptic();
        navigate(-1);
    };

    const handleDelete = () => {
        if (!isNew && id) {
            deleteNote(id);
            toast({ title: t.note_editor.toast_deleted });
            triggerHaptic();
            navigate(-1);
        } else {
            // If it's new and we discard, just go back
            navigate(-1);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col animate-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border p-4 flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={handleBack} className="-ml-2 rounded-full">
                    {/* User asked for 'X' behavior, but usually Back arrow is safer for full page. 
                        However, let's stick to X or ArrowLeft. X implies discard usually, but user explicitely asked for SAVE on X.
                        So X is fine. */}
                    <X className="w-6 h-6" />
                </Button>
                <h1 className="font-semibold text-lg">{isNew ? t.note_editor.new_title : t.note_editor.edit_title}</h1>
                <div className="w-10 flex justify-end">
                    {!isNew && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                    <Trash2 className="w-5 h-5" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>{t.note_editor.delete_dialog_title}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        {t.note_editor.delete_dialog_desc}
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                        {t.common.delete}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 container max-w-2xl mx-auto p-4 space-y-4">
                <Input
                    autoFocus={isNew}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t.note_editor.placeholder_title}
                    className="text-2xl font-bold border-0 border-b border-transparent focus-visible:border-primary/50 rounded-none px-0 bg-transparent h-auto py-2 focus-visible:ring-0 placeholder:text-muted-foreground/50"
                />

                {/* Timestamp Metadata */}
                <div className="text-xs font-medium text-muted-foreground/60 flex items-center gap-2">
                    {isNew ? (
                        <span>{new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</span>
                    ) : (
                        <span>
                            {existingNote?.updatedAt
                                ? `${t.note_editor.edited_prefix} ${new Date(existingNote.updatedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
                                : `${t.note_editor.created_prefix} ${new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long' })}`
                            }
                        </span>
                    )}
                </div>

                <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={t.note_editor.placeholder_content}
                    className="flex-1 min-h-[50vh] text-lg leading-relaxed border-0 resize-none p-0 bg-transparent focus-visible:ring-0 placeholder:text-muted-foreground/50"
                />
            </div>

            {/* Save Button (Optional, since X saves, but good for UX clarity) */}
            <div className="p-4 border-t border-border/50 sticky bottom-0 bg-background/80 backdrop-blur-md">
                <Button onClick={handleBack} className="w-full h-12 rounded-xl text-md font-semibold md:max-w-md md:mx-auto block">
                    {t.note_editor.done}
                </Button>
            </div>
        </div>
    );
};

export default NoteEditorPage;
