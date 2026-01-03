import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, Trash2, Save, ArrowLeft, PenLine } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useNotes } from '@/hooks/useNotes';
import { useToast } from '@/hooks/use-toast';
import { triggerHaptic } from '@/lib/haptics';
import { useLanguage } from '@/i18n/LanguageContext';
import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const LazyEditor = lazy(() => import('@/components/ui/LazyEditor'));
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

    useEffect(() => {
        if (!isNew && existingNote && !hasInitialized.current) {
            setTitle(existingNote.title);
            setContent(existingNote.content);
            hasInitialized.current = true;
        }
    }, [isNew, existingNote]);

    const handleSave = (silent = false) => {
        if (!title.trim() && !content.trim()) {
            return;
        }

        let finalTitle = title;
        if (!finalTitle.trim() && content.trim()) {
            const plainContent = content.replace(/<[^>]*>/g, ' ').trim();
            finalTitle = plainContent.substring(0, 30) + (plainContent.length > 30 ? '...' : '');
        }

        if (isNew) {
            saveNote(finalTitle, content);
            if (!silent) {
                toast({ title: t.note_editor.toast_saved });
                triggerHaptic();
            }
        } else if (existingNote) {
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
        handleSave(true);
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
            navigate(-1);
        }
    };

    return (
        <div className="min-h-screen bg-notebook flex flex-col">
            {/* Header - Notebook style */}
            <div className="sticky top-0 z-10 bg-paper border-b-2 border-dashed border-paper-lines p-4 flex items-center justify-between pt-safe">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBack}
                    className="-ml-2 rounded-sm bg-sticky-yellow shadow-tape -rotate-3"
                >
                    <X className="w-6 h-6 text-ink" />
                </Button>
                <h1 className="font-handwriting text-xl text-ink">
                    {isNew ? t.note_editor.new_title : t.note_editor.edit_title} 📝
                </h1>
                <div className="w-10 flex justify-end">
                    {!isNew && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-doodle-red hover:text-doodle-red hover:bg-doodle-red/10 rounded-sm"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="font-handwriting text-xl text-ink">
                                        {t.note_editor.delete_dialog_title}
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="font-handwriting text-pencil">
                                        {t.note_editor.delete_dialog_desc}
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel className="font-handwriting rounded-sm">
                                        {t.common.cancel}
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleDelete}
                                        className="bg-doodle-red text-white hover:bg-doodle-red/90 font-handwriting rounded-sm"
                                    >
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
                    className={cn(
                        "text-2xl font-handwriting text-ink border-0 border-b-2 border-dashed border-paper-lines",
                        "focus-visible:border-doodle-primary rounded-none px-0 bg-transparent h-auto py-2",
                        "focus-visible:ring-0 placeholder:text-pencil/50"
                    )}
                />

                {/* Timestamp Metadata */}
                <div className="font-handwriting text-xs text-pencil flex items-center gap-2">
                    {isNew ? (
                        <span>📅 {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</span>
                    ) : (
                        <span>
                            {existingNote?.updatedAt
                                ? `✏️ ${t.note_editor.edited_prefix} ${new Date(existingNote.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
                                : `📅 ${t.note_editor.created_prefix} ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}`
                            }
                        </span>
                    )}
                </div>

                <div className="flex-1 min-h-[60vh] bg-card rounded-sm border-2 border-paper-lines/50 shadow-notebook p-4">
                    <Suspense fallback={
                        <div className="h-full flex items-center justify-center">
                            <div className="w-12 h-12 bg-sticky-yellow shadow-sticky rounded-sm flex items-center justify-center animate-pulse">
                                <PenLine className="w-6 h-6 text-ink" />
                            </div>
                        </div>
                    }>
                        <LazyEditor
                            theme="snow"
                            value={content}
                            onChange={setContent}
                            modules={{
                                toolbar: [
                                    [{ 'header': [1, 2, false] }],
                                    ['bold', 'italic', 'underline', 'strike'],
                                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                    ['link', 'clean']
                                ],
                            }}
                            placeholder={t.note_editor.placeholder_content}
                            className="h-full flex flex-col font-handwriting"
                        />
                    </Suspense>
                </div>
            </div>

            {/* Save Button - Notebook style */}
            <div className="p-4 border-t-2 border-dashed border-paper-lines sticky bottom-0 bg-paper pb-safe">
                <Button
                    onClick={handleBack}
                    className={cn(
                        "w-full h-12 rounded-sm font-handwriting text-lg",
                        "bg-doodle-primary hover:bg-doodle-primary/90 text-white shadow-notebook",
                        "md:max-w-md md:mx-auto block"
                    )}
                >
                    {t.note_editor.done} ✓
                </Button>
            </div>
        </div>
    );
};

export default NoteEditorPage;
