import { X, FileText, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

    // Get the note data to display
    const displayNote = isShowingCurrentNote
        ? {
            title: currentTitle || '',
            content: currentContent || '',
            isLive: true
        }
        : (() => {
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
                        {(t.note_editor as any).reference_panel_title || 'Catatan Referensi'}
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
                        <SelectValue placeholder={(t.note_editor as any).select_reference_note || 'Pilih catatan...'} />
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
                                    {(t.note_editor as any).live_preview || 'Live Preview'}
                                </span>
                            </div>
                        </SelectItem>

                        {/* Separator */}
                        {otherNotes.length > 0 && (
                            <div className="px-2 py-1.5 text-xs text-pencil/60 border-t border-paper-lines/30 mt-1">
                                {(t.note_editor as any).other_notes || 'Catatan Lain'}
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
            <ScrollArea className="flex-1 p-4">
                {displayNote ? (
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
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center py-12">
                        <div className="w-16 h-16 bg-sticky-blue/30 rounded-sm flex items-center justify-center mb-4 rotate-3">
                            <FileText className="w-8 h-8 text-doodle-primary" />
                        </div>
                        <p className="font-handwriting text-pencil text-sm">
                            {(t.note_editor as any).select_reference_note || 'Pilih catatan untuk ditampilkan'}
                        </p>
                    </div>
                )}
            </ScrollArea>
        </div>
    );
};

export { CURRENT_NOTE_VALUE };
export default NoteReferencePanel;
