import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, Trash2, Save, ArrowLeft, PenLine, Tag, ChevronDown, Plus, PanelRightOpen, PanelRightClose } from 'lucide-react';
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
import { useDebounce } from '@/hooks/useDebounce';
import { saveDraft, loadDraft, clearDraft, hasDraft, cleanupOldDrafts } from '@/lib/draft-storage';
import { DiffViewer } from '@/components/DiffViewer';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import NoteReferencePanel, { CURRENT_NOTE_VALUE } from '@/components/NoteReferencePanel';

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
    const { notes, saveNote, updateNote, deleteNote, getUniqueCategories } = useNotes();
    const { toast } = useToast();
    const { t } = useLanguage();

    const isNew = id === 'new';
    const existingNote = notes.find(n => n.id === id);

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState<string | null>(null);
    const [newCategoryInput, setNewCategoryInput] = useState('');
    const [showCategoryPopover, setShowCategoryPopover] = useState(false);
    const hasInitialized = useRef(false);
    const [showDraftRecovery, setShowDraftRecovery] = useState(false);
    const [draftData, setDraftData] = useState<{ title: string; content: string } | null>(null);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [showDiff, setShowDiff] = useState(false);
    const [wordCount, setWordCount] = useState(0);
    const [combo, setCombo] = useState(0);
    const [lastTyped, setLastTyped] = useState(0);
    const editorRef = useRef<any>(null);

    // Split view state
    const [showSplitView, setShowSplitView] = useState(false);
    const [referenceNoteId, setReferenceNoteId] = useState<string | null>(CURRENT_NOTE_VALUE);

    // Get unique categories
    const categories = useMemo(() => getUniqueCategories(), [getUniqueCategories]);

    // Cleanup old drafts on mount (once)
    useEffect(() => {
        cleanupOldDrafts();
    }, []);

    // Reset initialization when id changes (navigating to different note)
    useEffect(() => {
        hasInitialized.current = false;
    }, [id]);

    // Initialize from existing note or draft
    useEffect(() => {
        // Don't initialize if already done
        if (hasInitialized.current) return;

        const noteId = id || 'new';

        // For existing notes, wait until existingNote is loaded
        if (!isNew && !existingNote) {
            return; // Wait for note to load
        }

        // Load existing note first
        if (!isNew && existingNote) {
            setTitle(existingNote.title || '');
            setContent(existingNote.content || '');
            setCategory(existingNote.category ?? null);

            // Then check for newer draft
            if (hasDraft(noteId)) {
                const draft = loadDraft(noteId);
                if (draft) {
                    const noteTimestamp = new Date(existingNote.updatedAt || existingNote.createdAt).getTime();
                    if (draft.timestamp > noteTimestamp) {
                        // Check if there are actual changes
                        const hasChanges =
                            draft.title !== existingNote.title ||
                            draft.content !== existingNote.content;

                        if (hasChanges) {
                            // Draft is newer and has changes, offer recovery
                            setDraftData({ title: draft.title, content: draft.content });
                            setShowDraftRecovery(true);
                        } else {
                            // No actual changes, just clear the draft
                            clearDraft(noteId);
                        }
                    } else {
                        // Note is newer, clear old draft
                        clearDraft(noteId);
                    }
                }
            }
            hasInitialized.current = true;
        } else if (isNew) {
            // New note - check for draft
            if (hasDraft(noteId)) {
                const draft = loadDraft(noteId);
                if (draft) {
                    setTitle(draft.title);
                    setContent(draft.content);
                }
            }
            hasInitialized.current = true;
        }
    }, [id, isNew, existingNote]);

    // Auto-save draft with debounce (1 second)
    const autoSaveDraft = useDebounce(() => {
        const noteId = id || 'new';
        if (title.trim() || content.trim()) {
            setSaveStatus('saving');
            const success = saveDraft(noteId, title, content);
            if (success) {
                setSaveStatus('saved');
                // Reset to idle after 2 seconds
                setTimeout(() => setSaveStatus('idle'), 2000);
            } else {
                setSaveStatus('idle');
            }
        }
    }, 1000);

    // Update word count, combo, and trigger auto-save when title or content changes
    useEffect(() => {
        // Update word count (strip HTML first) - Always keep this sync
        const plainText = content.replace(/<[^>]*>/g, ' ').trim();
        const words = plainText ? plainText.split(/\s+/).length : 0;
        setWordCount(words);

        // Increment combo on typing
        if (hasInitialized.current) {
            setCombo(prev => Math.min(prev + 2, 100));
            setLastTyped(Date.now());
        }

        if (hasInitialized.current && (title || content)) {
            autoSaveDraft();
        }
    }, [title, content]);

    // Combo Decay Logic
    useEffect(() => {
        const interval = setInterval(() => {
            setCombo(prev => {
                if (prev <= 0) return 0;
                // Decay faster if not typed recently
                const timeSinceLastTyped = Date.now() - lastTyped;
                const decayRate = timeSinceLastTyped > 2000 ? 2 : 0.5;
                return Math.max(prev - decayRate, 0);
            });
        }, 100);

        return () => clearInterval(interval);
    }, [lastTyped]);

    const getComboLabel = (val: number) => {
        if (val >= 95) return "🔥 WADiDAW!";
        if (val >= 80) return "🚀 MANTAP!";
        if (val >= 60) return "✨ HEBAT!";
        if (val >= 40) return "✍️ LANJUT!";
        if (val >= 20) return "💪 SEMANGAT!";
        return "✍️ Ayo tulis!";
    };

    const getComboColor = (val: number) => {
        if (val >= 90) return "bg-doodle-red";
        if (val >= 60) return "bg-highlighter-yellow";
        if (val >= 30) return "bg-doodle-primary";
        return "bg-pencil/30";
    };

    const handleSave = useCallback((silent = false) => {
        if (!title.trim() && !content.trim()) {
            return;
        }

        let finalTitle = title;
        if (!finalTitle.trim() && content.trim()) {
            const plainContent = content.replace(/<[^>]*>/g, ' ').trim();
            finalTitle = plainContent.substring(0, 30) + (plainContent.length > 30 ? '...' : '');
        }

        const noteId = id || 'new';

        if (isNew) {
            const newNote = saveNote(finalTitle, content, category);
            clearDraft(noteId); // Clear draft after successful save
            if (!silent) {
                toast({ title: t.note_editor.toast_saved });
                triggerHaptic();
            }
            // Navigate to the new note's URL so subsequent saves are updates, not creates
            navigate(`/notes/${newNote.id}`, { replace: true });
        } else if (existingNote) {
            const hasChanges =
                existingNote.title !== finalTitle ||
                existingNote.content !== content ||
                existingNote.category !== category;

            if (hasChanges) {
                updateNote(existingNote.id, { title: finalTitle, content, category });
                clearDraft(noteId); // Clear draft after successful save
                if (!silent) {
                    toast({ title: t.note_editor.toast_updated });
                    triggerHaptic();
                }
            }
        }
    }, [title, content, category, id, isNew, existingNote, saveNote, updateNote, t.note_editor, toast]);

    const handleBack = useCallback(() => {
        handleSave(true);
        triggerHaptic();
        navigate(-1);
    }, [handleSave, navigate]);

    // Ctrl+S Keyboard Shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleSave();
                toast({
                    title: "Saved",
                    description: "Your note has been saved manually.",
                    duration: 2000,
                });
            } else if (e.key === 'Escape') {
                e.preventDefault();
                handleBack();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleBack]);

    // Hardware Back Button (Capacitor)
    useEffect(() => {
        let backListener: any;
        const setupListener = async () => {
            try {
                const { App } = await import('@capacitor/app');
                backListener = await App.addListener('backButton', () => {
                    // Just trigger save and haptic, let the global listener handle navigation
                    // to avoid "double-back" issues.
                    handleSave(true);
                    triggerHaptic();
                });
            } catch (e) {
                // Ignore if not in Capacitor
            }
        };
        setupListener();
        return () => {
            if (backListener) backListener.remove();
        };
    }, [handleSave]);

    // Unified scroll function - handles both window scroll and container scroll in split view
    const scrollCursorIntoView = useCallback(() => {
        const quill = editorRef.current?.getEditor();
        if (!quill) return;

        const range = quill.getSelection();
        if (range) {
            const bounds = quill.getBounds(range.index);
            const editorElement = quill.container;
            const editorRect = editorElement.getBoundingClientRect();

            // Actual cursor position relative to viewport
            const cursorBottom = editorRect.top + bounds.bottom;

            if (showSplitView) {
                // In split view, find the scrollable container (parent with overflow-y-auto)
                const scrollContainer = editorElement.closest('.overflow-y-auto');
                if (scrollContainer) {
                    const containerRect = scrollContainer.getBoundingClientRect();
                    const cursorRelativeToContainer = cursorBottom - containerRect.top;
                    const containerHeight = containerRect.height;

                    // Keep cursor at least 100px from the bottom
                    const threshold = containerHeight - 100;

                    if (cursorRelativeToContainer > threshold) {
                        const scrollNeeded = cursorRelativeToContainer - threshold;
                        scrollContainer.scrollBy({
                            top: scrollNeeded,
                            behavior: 'smooth'
                        });
                    }
                }
            } else {
                // Normal mode - scroll window
                const viewportHeight = window.visualViewport?.height || window.innerHeight;
                const threshold = viewportHeight - 150;

                if (cursorBottom > threshold) {
                    const scrollNeeded = cursorBottom - threshold;
                    window.scrollBy({
                        top: scrollNeeded,
                        behavior: 'smooth'
                    });
                }
            }
        }
    }, [editorRef, showSplitView]);

    // Auto-scroll when typing
    useEffect(() => {
        if (hasInitialized.current && content) {
            const timeoutId = setTimeout(scrollCursorIntoView, 100);
            return () => clearTimeout(timeoutId);
        }
    }, [content, scrollCursorIntoView]);

    const handleSelectionChange = () => {
        // Debounce selection change scroll slightly to allow virtual viewport to settle
        setTimeout(scrollCursorIntoView, 50);
    };

    const handleDelete = () => {
        if (!isNew && id) {
            deleteNote(id);
            clearDraft(id); // Clear draft when deleting
            toast({ title: t.note_editor.toast_deleted });
            triggerHaptic();
            navigate(-1);
        } else {
            const noteId = id || 'new';
            clearDraft(noteId); // Clear draft when canceling new note
            navigate(-1);
        }
    };

    const handleRecoverDraft = () => {
        if (draftData) {
            setTitle(draftData.title);
            setContent(draftData.content);
            setShowDraftRecovery(false);
            toast({ title: "📝 Draft recovered!" });
        }
    };

    const handleDiscardDraft = () => {
        const noteId = id || 'new';
        clearDraft(noteId);
        setShowDraftRecovery(false);
    };

    const handleSelectCategory = (cat: string | null) => {
        setCategory(cat);
        setShowCategoryPopover(false);
        triggerHaptic();
    };

    const handleCreateCategory = () => {
        if (newCategoryInput.trim()) {
            setCategory(newCategoryInput.trim());
            setNewCategoryInput('');
            setShowCategoryPopover(false);
            triggerHaptic();
        }
    };

    return (
        <div className={cn(
            "bg-notebook flex flex-col",
            showSplitView ? "h-screen overflow-hidden" : "min-h-screen"
        )}>
            {/* Draft Recovery Dialog */}
            <AlertDialog open={showDraftRecovery} onOpenChange={(open) => {
                setShowDraftRecovery(open);
                if (!open) setShowDiff(false); // Reset diff view when closing
            }}>
                <AlertDialogContent className="max-w-3xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-handwriting text-xl text-ink">
                            📝 Unsaved Draft Found
                        </AlertDialogTitle>
                        <AlertDialogDescription className="font-handwriting text-pencil">
                            We found an unsaved draft that's newer than the saved version. Would you like to recover it?
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {/* Show Diff Button */}
                    {!showDiff && draftData && existingNote && (
                        <div className="flex justify-center py-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowDiff(true)}
                                className="font-handwriting gap-2"
                            >
                                <span>🔍</span> Show Differences
                            </Button>
                        </div>
                    )}

                    {/* Diff Viewer */}
                    {showDiff && draftData && existingNote && (
                        <div className="border-2 border-dashed border-paper-lines rounded-sm p-4 bg-notebook">
                            <DiffViewer
                                oldTitle={existingNote.title}
                                oldContent={existingNote.content}
                                newTitle={draftData.title}
                                newContent={draftData.content}
                            />
                        </div>
                    )}

                    <AlertDialogFooter>
                        <AlertDialogCancel
                            onClick={handleDiscardDraft}
                            className="font-handwriting rounded-sm"
                        >
                            Discard Draft
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleRecoverDraft}
                            className="bg-doodle-primary text-white hover:bg-doodle-primary/90 font-handwriting rounded-sm"
                        >
                            Recover Draft
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Header - Notebook style */}
            <div className="sticky top-0 z-20 bg-paper border-b-2 border-dashed border-paper-lines p-4 flex items-center justify-between pt-safe">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBack}
                    className="-ml-2 rounded-sm bg-sticky-yellow shadow-tape -rotate-3"
                >
                    <X className="w-6 h-6 text-ink" />
                </Button>
                <div className="flex items-center gap-2">
                    <h1 className="font-handwriting text-xl text-ink">
                        {isNew ? t.note_editor.new_title : t.note_editor.edit_title} 📝
                    </h1>
                    {/* Auto-save indicator */}
                    {saveStatus !== 'idle' && (
                        <span className={cn(
                            "text-xs font-handwriting transition-opacity duration-200 hidden sm:inline",
                            saveStatus === 'saving' ? "text-pencil/60" : "text-doodle-green"
                        )}>
                            {saveStatus === 'saving' ? '💾 Saving...' : '✓ Saved'}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {/* Split View Toggle - Hidden on mobile */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setShowSplitView(!showSplitView);
                            triggerHaptic();
                        }}
                        className={cn(
                            "hidden md:flex gap-1.5 font-handwriting text-sm rounded-sm",
                            showSplitView
                                ? "bg-doodle-primary/10 text-doodle-primary"
                                : "text-pencil hover:text-ink"
                        )}
                    >
                        {showSplitView ? (
                            <PanelRightClose className="w-4 h-4" />
                        ) : (
                            <PanelRightOpen className="w-4 h-4" />
                        )}
                        <span className="hidden lg:inline">
                            {t.note_editor.split_view_toggle}
                        </span>
                    </Button>

                    {/* Delete Button */}
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
                    {/* Done Button */}
                    <Button
                        onClick={handleBack}
                        variant="ghost"
                        size="sm"
                        className="font-handwriting text-doodle-primary hover:text-doodle-primary hover:bg-doodle-primary/10 rounded-sm"
                    >
                        {t.note_editor.done} ✓
                    </Button>


                </div>
            </div>

            {/* Content - Wrapped in ResizablePanelGroup when split view is active */}
            {showSplitView ? (
                <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
                    <ResizablePanel defaultSize={55} minSize={35} className="overflow-hidden">
                        <div className="h-full overflow-y-auto">
                            <div className="container max-w-2xl mx-auto p-4 pb-8 space-y-4">
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
                                            ref={editorRef}
                                            theme="snow"
                                            value={content}
                                            onChange={setContent}
                                            onChangeSelection={handleSelectionChange}
                                            modules={{
                                                toolbar: [
                                                    [{ 'header': [1, 2, false] }],
                                                    ['bold', 'italic', 'underline', 'strike'],
                                                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                                    ['link', 'clean']
                                                ],
                                            }}
                                            placeholder={t.note_editor.placeholder_content}
                                            className="h-full flex flex-col font-handwriting ql-typewriter"
                                        />
                                    </Suspense>
                                </div>

                                {/* Writing Stats */}
                                <div className="flex flex-row items-center gap-1.5 px-1 py-2">
                                    <div className="flex-1 flex items-center gap-3 bg-card/50 backdrop-blur-sm px-4 py-2 rounded-xl border-2 border-paper-lines/30 shadow-sm">
                                        <span className="font-handwriting text-xs text-pencil/80 border-r-2 border-paper-lines/20 pr-3 leading-none whitespace-nowrap">
                                            {wordCount} {wordCount === 1 ? 'word' : 'words'}
                                        </span>
                                        <div className="flex-1 h-2 bg-paper-lines/20 rounded-full overflow-hidden relative">
                                            <div
                                                className={cn(
                                                    "h-full transition-all duration-150 ease-out rounded-full",
                                                    getComboColor(combo),
                                                    combo >= 90 && "animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                                                )}
                                                style={{ width: `${combo}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className={cn(
                                        "font-handwriting text-xs font-bold transition-all duration-300 transform opacity-100 scale-100 translate-y-0",
                                        combo >= 90 ? "text-doodle-red animate-bounce" : "text-pencil"
                                    )}>
                                        {getComboLabel(combo)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ResizablePanel>

                    <ResizableHandle withHandle className="bg-paper-lines/30 hover:bg-doodle-primary/30 transition-colors" />

                    <ResizablePanel defaultSize={45} minSize={25} className="overflow-hidden">
                        <NoteReferencePanel
                            notes={notes}
                            currentNoteId={id}
                            currentTitle={title}
                            currentContent={content}
                            selectedNoteId={referenceNoteId}
                            onSelectNote={setReferenceNoteId}
                            onClose={() => setShowSplitView(false)}
                        />
                    </ResizablePanel>
                </ResizablePanelGroup>
            ) : (
                /* Original Content without split view */
                <div className="flex-1 container max-w-2xl mx-auto p-4 pb-8 space-y-4">
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

                    {/* Category Selector */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <Tag className="w-4 h-4 text-pencil flex-shrink-0" />
                        <span className="font-handwriting text-sm text-pencil">Kategori:</span>

                        <Popover open={showCategoryPopover} onOpenChange={setShowCategoryPopover}>
                            <PopoverTrigger asChild>
                                <button
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-handwriting transition-all",
                                        "border-2 border-dashed",
                                        category
                                            ? "bg-doodle-primary/10 text-doodle-primary border-doodle-primary/50"
                                            : "bg-paper text-pencil border-paper-lines hover:border-doodle-primary/50"
                                    )}
                                >
                                    {category || "Tanpa Kategori"}
                                    <ChevronDown className="w-3 h-3" />
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-2" align="start">
                                <div className="space-y-2">
                                    {/* No category option */}
                                    <button
                                        onClick={() => handleSelectCategory(null)}
                                        className={cn(
                                            "w-full text-left px-3 py-2 rounded-sm text-sm font-handwriting transition-colors",
                                            category === null
                                                ? "bg-doodle-primary/10 text-doodle-primary"
                                                : "hover:bg-paper-lines/20 text-pencil"
                                        )}
                                    >
                                        Tanpa Kategori
                                    </button>

                                    {/* Existing categories */}
                                    {categories.length > 0 && (
                                        <div className="border-t border-paper-lines/50 pt-2">
                                            {categories.map(cat => (
                                                <button
                                                    key={cat}
                                                    onClick={() => handleSelectCategory(cat)}
                                                    className={cn(
                                                        "w-full text-left px-3 py-2 rounded-sm text-sm font-handwriting transition-colors",
                                                        category === cat
                                                            ? "bg-doodle-primary/10 text-doodle-primary"
                                                            : "hover:bg-paper-lines/20 text-ink"
                                                    )}
                                                >
                                                    {cat}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Create new category */}
                                    <div className="border-t border-paper-lines/50 pt-2">
                                        <div className="flex gap-2">
                                            <Input
                                                value={newCategoryInput}
                                                onChange={(e) => setNewCategoryInput(e.target.value)}
                                                placeholder="Kategori baru..."
                                                className="h-8 text-sm font-handwriting"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleCreateCategory();
                                                    }
                                                }}
                                            />
                                            <Button
                                                size="sm"
                                                onClick={handleCreateCategory}
                                                disabled={!newCategoryInput.trim()}
                                                className="h-8 px-2"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>

                        {/* Clear category button */}
                        {category && (
                            <button
                                onClick={() => {
                                    setCategory(null);
                                    triggerHaptic();
                                }}
                                className="text-pencil/60 hover:text-doodle-red transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

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
                                ref={editorRef}
                                theme="snow"
                                value={content}
                                onChange={setContent}
                                onChangeSelection={handleSelectionChange}
                                modules={{
                                    toolbar: [
                                        [{ 'header': [1, 2, false] }],
                                        ['bold', 'italic', 'underline', 'strike'],
                                        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                        ['link', 'clean']
                                    ],
                                }}
                                placeholder={t.note_editor.placeholder_content}
                                className="h-full flex flex-col font-handwriting ql-typewriter"
                            />
                        </Suspense>
                    </div>

                    {/* Writing Stats (Word Count & Combo Meter) - Moved outside to prevent overlap */}
                    <div className="flex flex-row items-center gap-1.5 px-1 py-2">

                        <div className="flex-1 flex items-center gap-3 bg-card/50 backdrop-blur-sm px-4 py-2 rounded-xl border-2 border-paper-lines/30 shadow-sm">
                            {/* Word Count */}
                            <span className="font-handwriting text-xs text-pencil/80 border-r-2 border-paper-lines/20 pr-3 leading-none whitespace-nowrap">
                                {wordCount} {wordCount === 1 ? 'word' : 'words'}
                            </span>

                            {/* Combo Progress Bar */}
                            <div className="flex-1 h-2 bg-paper-lines/20 rounded-full overflow-hidden relative">
                                <div
                                    className={cn(
                                        "h-full transition-all duration-150 ease-out rounded-full",
                                        getComboColor(combo),
                                        combo >= 90 && "animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                                    )}
                                    style={{ width: `${combo}%` }}
                                />
                            </div>
                        </div>
                        {/* Appreciation Label */}
                        <div className={cn(
                            "font-handwriting text-xs font-bold transition-all duration-300 transform opacity-100 scale-100 translate-y-0",
                            combo >= 90 ? "text-doodle-red animate-bounce" : "text-pencil"
                        )}>
                            {getComboLabel(combo)}
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default NoteEditorPage;
