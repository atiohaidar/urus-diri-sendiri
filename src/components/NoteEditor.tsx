import { useState, useEffect } from 'react';
import { X, Trash2, PenLine } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { Note } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const LazyEditor = lazy(() => import('@/components/ui/LazyEditor'));

interface NoteEditorProps {
  note?: Note | null;
  onClose: () => void;
  onSave: (title: string, content: string) => void;
  onDelete?: (id: string) => void;
}

const NoteEditor = ({ note, onClose, onSave, onDelete }: NoteEditorProps) => {
  const { toast } = useToast();
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link', 'clean']
    ],
  };

  useEffect(() => {
    setTitle(note?.title || '');
    setContent(note?.content || '');
  }, [note]);

  const handleSave = () => {
    if (!title.trim()) {
      toast({
        title: "Judul diperlukan",
        description: "Tambahkan judul untuk catatanmu.",
        variant: "destructive",
      });
      return;
    }

    onSave(title, content);
    toast({
      title: note ? "Catatan diupdate! ✨" : "Catatan disimpan! 💡",
      description: "Idemu tersimpan dengan aman.",
    });
    onClose();
  };

  const handleDelete = () => {
    if (note && onDelete) {
      onDelete(note.id);
      toast({
        title: "Catatan dihapus",
        description: "Catatanmu sudah dihapus.",
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-notebook">
      <div className="h-full flex flex-col">
        {/* Header - Notebook style */}
        <div className="flex items-center justify-between p-4 border-b-2 border-dashed border-paper-lines bg-paper">
          <button
            onClick={onClose}
            className="p-2 -ml-2 hover:bg-sticky-yellow rounded-sm transition-colors shadow-tape -rotate-3"
          >
            <X className="w-5 h-5 text-ink" />
          </button>
          <span className="font-handwriting text-lg text-ink">
            {note ? 'Edit Catatan' : 'Catatan Baru'} 📝
          </span>
          <div className="w-9" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="container max-w-md mx-auto space-y-4 pt-4">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Judul catatan..."
              className={cn(
                "text-xl font-handwriting text-ink bg-transparent border-0 border-b-2 border-dashed border-paper-lines",
                "rounded-none px-0 focus-visible:ring-0 focus-visible:border-doodle-primary shrink-0"
              )}
            />
            <div className="flex-1 min-h-[400px] bg-card rounded-sm border-2 border-paper-lines/50 shadow-notebook p-4">
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
                  modules={modules}
                  placeholder="Tulis pikiranmu..."
                  className="h-full flex flex-col font-handwriting"
                />
              </Suspense>
            </div>
          </div>
        </div>

        {/* Footer - Notebook style */}
        <div className="p-4 border-t-2 border-dashed border-paper-lines safe-bottom bg-paper z-20">
          <div className="container max-w-md mx-auto flex gap-3">
            {note && onDelete && (
              <Button
                variant="outline"
                onClick={handleDelete}
                className="h-12 px-4 rounded-sm font-handwriting border-2 border-dashed border-doodle-red/30 text-doodle-red hover:bg-doodle-red/10"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            )}
            <Button
              onClick={handleSave}
              className="flex-1 h-12 rounded-sm font-handwriting text-lg bg-doodle-primary hover:bg-doodle-primary/90 text-white shadow-notebook"
            >
              {note ? 'Update' : 'Simpan'} ✓
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteEditor;
