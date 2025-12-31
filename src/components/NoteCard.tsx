import type { Note } from '@/lib/storage';
import { getRelativeDate } from '@/lib/storage';

interface NoteCardProps {
  note: Note;
  onClick: () => void;
  index: number;
}

const NoteCard = ({ note, onClick, index }: NoteCardProps) => {
  const snippet = note.content.length > 80 
    ? note.content.substring(0, 80) + '...' 
    : note.content;

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-card rounded-3xl p-4 card-elevated hover:scale-[1.01] transition-all duration-200 animate-fade-in"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground mb-1 truncate">{note.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{snippet}</p>
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {getRelativeDate(note.updatedAt)}
        </span>
      </div>
    </button>
  );
};

export default NoteCard;
