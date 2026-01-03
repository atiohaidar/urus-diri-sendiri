import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Check, Trash2, Save } from 'lucide-react';
import type { PriorityTask } from '@/lib/storage';
import { Input } from '@/components/ui/input';
import { CompletionNoteDialog } from '@/components/CompletionNoteDialog';

interface PriorityItemProps {
  priority: PriorityTask;
  index: number;
  onToggle: (id: string, completed: boolean, note?: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, text: string) => void;
}

const PriorityItem = ({ priority, index, onToggle, onDelete, onUpdate }: PriorityItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(priority.text);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editText.trim()) {
      onUpdate(priority.id, editText.trim());
      setIsEditing(false);
    } else {
      setEditText(priority.text);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditText(priority.text);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleToggle = () => {
    if (priority.completed) {
      onToggle(priority.id, false);
    } else {
      setShowNoteDialog(true);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 p-3 bg-card rounded-sm border-2 border-dashed border-doodle-primary shadow-notebook">
        <Input
          ref={inputRef}
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          variant="notebook"
          className="h-10 bg-transparent text-ink font-handwriting"
        />
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleSave}
          className="p-2 text-doodle-primary hover:bg-doodle-primary/10 rounded-sm transition-colors"
        >
          <Save className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <>
      <CompletionNoteDialog
        isOpen={showNoteDialog}
        onClose={() => setShowNoteDialog(false)}
        onSave={(note) => {
          onToggle(priority.id, true, note);
          setShowNoteDialog(false);
        }}
        title={priority.text}
        initialNote={priority.completionNote}
      />
      <div
        className={cn(
          // Base notebook paper style
          "group flex items-center gap-3 p-4 rounded-sm font-handwriting",
          "bg-card border-2",
          "shadow-notebook",
          "transition-all duration-150",
          "hover:shadow-notebook-hover",
          // Completed state
          priority.completed
            ? "border-paper-lines/50 opacity-70"
            : "border-paper-lines/30"
        )}
        style={{ animationDelay: `${index * 50}ms` }}
      >
        {/* Hand-drawn checkbox */}
        <button
          onClick={handleToggle}
          className={cn(
            "w-6 h-6 rounded-none border-2 border-dashed flex items-center justify-center transition-all duration-150 shrink-0",
            priority.completed
              ? "bg-doodle-green/20 border-solid border-doodle-green text-doodle-green"
              : "border-ink/40 hover:border-ink/60"
          )}
        >
          {priority.completed && (
            <Check className="w-4 h-4" strokeWidth={3} />
          )}
        </button>

        {/* Priority number badge - Doodle circle */}
        <span className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center text-sm font-handwriting font-semibold shrink-0",
          "border-2 border-dashed",
          priority.completed
            ? "border-paper-lines text-pencil"
            : "border-doodle-primary text-doodle-primary"
        )}>
          {index + 1}
        </span>

        {/* Priority text */}
        <div className="flex-1 min-w-0" onClick={() => setIsEditing(true)}>
          <span className={cn(
            "font-handwriting text-lg cursor-text truncate block",
            priority.completed
              ? "line-through text-pencil decoration-2 decoration-doodle-red/50"
              : "text-ink"
          )}>
            {priority.text}
          </span>
        </div>

        {/* Delete button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(priority.id);
          }}
          className="opacity-0 group-hover:opacity-100 p-2 text-pencil hover:text-doodle-red hover:bg-doodle-red/10 rounded-sm transition-all duration-150 focus:opacity-100"
          aria-label="Delete priority"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </>
  );
};

export default PriorityItem;
