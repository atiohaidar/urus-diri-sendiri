import { X, FileText, Eye, ExternalLink, AlertCircle, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { Note } from '@/lib/storage';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n/LanguageContext';
import { useState, useEffect } from 'react';

interface NoteReferencePanelProps {
    notes: Note[];
    currentNoteId?: string;
    // Current note's live data (for preview mode)
    currentTitle?: string;
    currentContent?: string;
    selectedNoteId: string | null;
    onSelectNote: (noteId: string | null) => void;
    onClose: () => void;
}

const CURRENT_NOTE_VALUE = '__current__';
const CUSTOM_URL_VALUE = '__custom_url__';

const CustomURLPortal = ({ initialUrl }: { initialUrl?: string }) => {
    const { t } = useLanguage();
    const [url, setUrl] = useState(initialUrl || '');
    const [loadedUrl, setLoadedUrl] = useState('');
    const [iframeError, setIframeError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (initialUrl && initialUrl !== loadedUrl) {
            handleLoadUrl(initialUrl);
        }
    }, [initialUrl]);

    const handleLoadUrl = (urlToLoad: string = url) => {
        if (!urlToLoad.trim()) return;

        // Add https:// if no protocol specified
        let finalUrl = urlToLoad.trim();
        if (!finalUrl.match(/^https?:\/\//i)) {
            finalUrl = 'https://' + finalUrl;
        }

        setLoadedUrl(finalUrl);
        setIframeError(false);
        setIsLoading(true);

        // Set a timeout to detect if iframe fails to load
        setTimeout(() => {
            setIsLoading(false);
        }, 3000);
    };

    const handleIframeError = () => {
        setIframeError(true);
        setIsLoading(false);
    };

    const handleOpenInNewTab = () => {
        window.open(loadedUrl, '_blank');
    };

    if (iframeError && loadedUrl) {
        // Fallback UI when iframe is blocked
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-6 animate-in fade-in zoom-in duration-300">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 bg-doodle-primary/10 text-doodle-primary">
                    <Link2 className="w-10 h-10" />
                </div>

                <div className="space-y-2">
                    <h3 className="font-handwriting text-2xl text-ink break-all px-4">{new URL(loadedUrl).hostname}</h3>
                    <div className="flex items-center gap-2 justify-center text-amber-600">
                        <AlertCircle className="w-4 h-4" />
                        <p className="font-handwriting text-xs">{t.note_editor.iframe_blocked}</p>
                    </div>
                </div>

                <Button
                    onClick={handleOpenInNewTab}
                    className="font-handwriting rounded-sm gap-2 w-full bg-doodle-primary hover:bg-doodle-primary/90"
                >
                    <ExternalLink className="w-4 h-4" />
                    {t.note_editor.open_in_new_tab}
                </Button>

                <Button
                    onClick={() => {
                        setLoadedUrl('');
                        setIframeError(false);
                        setUrl('');
                    }}
                    variant="outline"
                    size="sm"
                    className="font-handwriting rounded-sm"
                >
                    ← {t.common.back}
                </Button>
            </div>
        );
    }

    if (loadedUrl && !iframeError) {
        return (
            <div className="h-full flex flex-col relative">
                {/* Loading indicator */}
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-notebook/80 backdrop-blur-sm z-10">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg animate-pulse bg-doodle-primary/10 text-doodle-primary">
                                <Link2 className="w-8 h-8" />
                            </div>
                            <p className="font-handwriting text-sm text-pencil">Loading...</p>
                        </div>
                    </div>
                )}

                {/* Iframe */}
                <iframe
                    src={loadedUrl}
                    className="w-full h-full border-0 rounded-sm"
                    title="Custom URL"
                    onError={handleIframeError}
                    onLoad={() => setIsLoading(false)}
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
                />

                {/* Fallback button overlay */}
                {!isLoading && (
                    <div className="absolute bottom-4 right-4 z-20 flex gap-2">
                        <Button
                            onClick={() => {
                                setLoadedUrl('');
                                setUrl('');
                            }}
                            size="sm"
                            variant="outline"
                            className="font-handwriting rounded-sm shadow-lg bg-paper"
                        >
                            ← {t.common.back}
                        </Button>
                        <Button
                            onClick={handleOpenInNewTab}
                            size="sm"
                            className="font-handwriting rounded-sm gap-2 shadow-lg bg-doodle-primary hover:bg-doodle-primary/90"
                        >
                            <ExternalLink className="w-3 h-3" />
                            {t.note_editor.open_in_new_tab}
                        </Button>
                    </div>
                )}
            </div>
        );
    }

    // Input form
    return (
        <div className="h-full flex flex-col items-center justify-center p-6 space-y-6">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3 bg-sticky-blue/30 text-doodle-primary">
                <Link2 className="w-10 h-10" />
            </div>

            <div className="space-y-2 text-center">
                <h3 className="font-handwriting text-2xl text-ink">{t.note_editor.custom_url}</h3>
                <p className="font-handwriting text-pencil text-sm leading-relaxed max-w-[250px]">
                    Wikipedia, dokumentasi, atau website apa saja
                </p>
            </div>

            <div className="w-full max-w-md space-y-3">
                <Input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder={t.note_editor.custom_url_placeholder}
                    className="font-handwriting text-sm"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            handleLoadUrl();
                        }
                    }}
                />
                <Button
                    onClick={() => handleLoadUrl()}
                    disabled={!url.trim()}
                    className="w-full font-handwriting rounded-sm gap-2 bg-doodle-primary hover:bg-doodle-primary/90"
                >
                    <Link2 className="w-4 h-4" />
                    {t.note_editor.load_url}
                </Button>
            </div>

            <div className="pt-4 border-t-2 border-dashed border-paper-lines/50 w-full max-w-md">
                <p className="font-handwriting text-[10px] text-pencil/50 italic text-center">
                    Tip: Beberapa website mungkin memblokir iframe. Kamu tetap bisa buka di tab baru.
                </p>
            </div>
        </div>
    );
};

const NoteReferencePanel = ({
    notes,
    currentNoteId,
    currentTitle,
    currentContent,
    selectedNoteId,
    onSelectNote,
    onClose,
}: NoteReferencePanelProps) => {
    const { t } = useLanguage();

    // All notes except current for "other notes" section
    const otherNotes = notes.filter(note => note.id !== currentNoteId);

    // Determine what to show based on selectedNoteId
    const isShowingCurrentNote = selectedNoteId === CURRENT_NOTE_VALUE || selectedNoteId === currentNoteId;
    const isCustomURL = selectedNoteId === CUSTOM_URL_VALUE;

    // Get the note data to display
    const displayNote = isShowingCurrentNote
        ? {
            title: currentTitle || '',
            content: currentContent || '',
            isLive: true
        }
        : (() => {
            if (isCustomURL) return null;
            const found = notes.find(note => note.id === selectedNoteId);
            return found
                ? { title: found.title, content: found.content, updatedAt: found.updatedAt, createdAt: found.createdAt, isLive: false }
                : null;
        })();

    return (
        <div className="h-full flex flex-col bg-notebook border-l-2 border-dashed border-paper-lines">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b-2 border-dashed border-paper-lines bg-paper shrink-0">
                <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-pencil" />
                    <span className="font-handwriting text-sm text-ink">
                        {t.note_editor.reference_panel_title}
                    </span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="h-7 w-7 rounded-sm hover:bg-sticky-yellow/50"
                >
                    <X className="w-4 h-4 text-ink" />
                </Button>
            </div>

            {/* Note Selector */}
            <div className="p-3 border-b border-paper-lines/50 shrink-0">
                <Select
                    value={isShowingCurrentNote ? CURRENT_NOTE_VALUE : (selectedNoteId || '')}
                    onValueChange={(value) => onSelectNote(value || null)}
                >
                    <SelectTrigger className="w-full font-handwriting text-sm border-2 border-dashed border-paper-lines rounded-sm bg-card">
                        <SelectValue placeholder={t.note_editor.select_reference_note} />
                    </SelectTrigger>
                    <SelectContent className="font-handwriting max-h-[300px]">
                        {/* Current Note Option - Live Preview */}
                        <SelectItem
                            value={CURRENT_NOTE_VALUE}
                            className="font-handwriting"
                        >
                            <div className="flex items-center gap-2">
                                <Eye className="w-3 h-3 text-doodle-primary" />
                                <span className="text-doodle-primary font-medium">
                                    {t.note_editor.live_preview}
                                </span>
                            </div>
                        </SelectItem>

                        {/* Custom URL Option */}
                        <div className="px-2 py-1.5 text-xs text-pencil/60 border-t border-paper-lines/30 mt-1">
                            {t.note_editor.custom_url}
                        </div>
                        <SelectItem value={CUSTOM_URL_VALUE} className="font-handwriting">
                            <div className="flex items-center gap-2">
                                <Link2 className="w-3 h-3 text-doodle-primary" />
                                <span>Buka URL Kustom</span>
                            </div>
                        </SelectItem>

                        {/* Separator */}
                        {otherNotes.length > 0 && (
                            <div className="px-2 py-1.5 text-xs text-pencil/60 border-t border-paper-lines/30 mt-1">
                                {t.note_editor.other_notes}
                            </div>
                        )}

                        {/* Other Notes */}
                        {otherNotes.map((note) => (
                            <SelectItem
                                key={note.id}
                                value={note.id}
                                className="font-handwriting"
                            >
                                <span className="truncate">
                                    {note.title || 'Untitled'}
                                </span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Note Content */}
            <div className="flex-1 overflow-hidden">
                {isCustomURL ? (
                    <CustomURLPortal />
                ) : displayNote ? (
                    <ScrollArea className="h-full p-4">
                        <div className="space-y-3">
                            {/* Live Preview Badge */}
                            {displayNote.isLive && (
                                <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-doodle-primary/10 rounded-sm text-xs font-handwriting text-doodle-primary">
                                    <Eye className="w-3 h-3" />
                                    <span>Live Preview</span>
                                </div>
                            )}

                            {/* Note Title */}
                            <h2 className="font-handwriting text-xl text-ink border-b-2 border-dashed border-paper-lines pb-2">
                                {displayNote.title || <span className="text-pencil/50 italic">Tanpa judul</span>}
                            </h2>

                            {/* Note Metadata - only for saved notes */}
                            {!displayNote.isLive && 'updatedAt' in displayNote && (
                                <div className="font-handwriting text-xs text-pencil">
                                    {displayNote.updatedAt
                                        ? `✏️ ${new Date(displayNote.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`
                                        : `📅 ${new Date(displayNote.createdAt!).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`
                                    }
                                </div>
                            )}

                            {/* Note Content - render HTML */}
                            <div
                                className="font-handwriting text-ink prose prose-sm max-w-none
                                           prose-headings:font-handwriting prose-headings:text-ink
                                           prose-p:text-ink prose-strong:text-ink
                                           prose-ul:text-ink prose-ol:text-ink
                                           prose-a:text-doodle-primary prose-a:no-underline
                                           ql-typewriter"
                                dangerouslySetInnerHTML={{
                                    __html: displayNote.content || '<p class="text-pencil/60 italic">Mulai menulis untuk melihat preview...</p>'
                                }}
                            />
                        </div>
                    </ScrollArea>
                ) : (
                    <ScrollArea className="h-full p-4">
                        <div className="h-full flex flex-col items-center justify-center text-center py-12">
                            <div className="w-16 h-16 bg-sticky-blue/30 rounded-sm flex items-center justify-center mb-4 rotate-3">
                                <FileText className="w-8 h-8 text-doodle-primary" />
                            </div>
                            <p className="font-handwriting text-pencil text-sm">
                                {t.note_editor.select_reference_note}
                            </p>
                        </div>
                    </ScrollArea>
                )}
            </div>
        </div>
    );
};

export { CURRENT_NOTE_VALUE, CUSTOM_URL_VALUE };
export default NoteReferencePanel;
