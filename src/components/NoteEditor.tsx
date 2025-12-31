import { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { Note } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';

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

  useEffect(() => {
    setTitle(note?.title || '');
    setContent(note?.content || '');
  }, [note]);

  const handleSave = () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please add a title for your note.",
        variant: "destructive",
      });
      return;
    }

    onSave(title, content);
    toast({
      title: note ? "Note updated! ✨" : "Note saved! 💡",
      description: "Your idea is safely stored.",
    });
    onClose();
  };

  const handleDelete = () => {
    if (note && onDelete) {
      onDelete(note.id);
      toast({
        title: "Note deleted",
        description: "Your note has been removed.",
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background animate-slide-up">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <button 
            onClick={onClose}
            className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <span className="font-medium">{note ? 'Edit Note' : 'New Note'}</span>
          <div className="w-9" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="container max-w-md mx-auto space-y-4">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note title..."
              className="text-lg font-semibold bg-transparent border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
            />
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your thoughts..."
              className="min-h-[300px] bg-transparent border-0 resize-none px-0 focus-visible:ring-0"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border safe-bottom">
          <div className="container max-w-md mx-auto flex gap-3">
            {note && onDelete && (
              <Button
                variant="outline"
                onClick={handleDelete}
                className="h-12 px-4 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            )}
            <Button 
              onClick={handleSave}
              className="flex-1 h-12 rounded-xl font-semibold"
            >
              {note ? 'Update Note' : 'Save Note'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteEditor;
