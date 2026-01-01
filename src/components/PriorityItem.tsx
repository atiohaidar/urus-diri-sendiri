import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Check, Trash2, X, Save } from 'lucide-react';
import type { PriorityTask } from '@/lib/storage';
import { Input } from '@/components/ui/input';

interface PriorityItemProps {
  priority: PriorityTask;
  index: number;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, text: string) => void;
}

const PriorityItem = ({ priority, index, onToggle, onDelete, onUpdate }: PriorityItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(priority.text);
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
      // If empty, maybe revert or delete? Let's just revert to original if empty for safety
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

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 p-2 bg-card rounded-3xl card-elevated border-2 border-primary/20 animate-in fade-in zoom-in-95 duration-200">
        <Input
          ref={inputRef}
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave} // Save on blur is usually good UX
          className="h-10 bg-transparent border-none shadow-none focus-visible:ring-0 text-foreground font-medium"
        />
        <button onMouseDown={(e) => e.preventDefault()} onClick={handleSave} className="p-2 text-primary hover:bg-primary/10 rounded-full">
          <Save className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group flex items-center gap-3 p-4 bg-card rounded-3xl card-elevated transition-all duration-300 animate-fade-in hover:shadow-md",
        priority.completed && "opacity-70"
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <button
        onClick={() => onToggle(priority.id, !priority.completed)}
        className={cn(
          "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 shrink-0",
          priority.completed
            ? "bg-primary border-primary"
            : "border-muted-foreground/30 hover:border-primary"
        )}
      >
        {priority.completed && (
          <Check className="w-4 h-4 text-primary-foreground animate-check" />
        )}
      </button>

      <div className="flex items-center gap-3 flex-1 min-w-0" onClick={() => setIsEditing(true)}>
        <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold text-primary shrink-0">
          {index + 1}
        </span>
        <span className={cn(
          "flex-1 font-medium transition-all duration-300 cursor-text truncate select-none",
          priority.completed && "line-through-animated text-muted-foreground"
        )}>
          {priority.text}
        </span>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(priority.id);
        }}
        className="opacity-0 group-hover:opacity-100 p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-all duration-200 focus:opacity-100"
        aria-label="Delete priority"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};

export default PriorityItem;
