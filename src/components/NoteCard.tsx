import type { Note } from '@/lib/storage';
import { getRelativeDate } from '@/lib/storage';
import { useLanguage } from '@/i18n/LanguageContext';
import { cn } from '@/lib/utils';
import { Tag, Lock } from 'lucide-react';

interface NoteCardProps {
  note: Note;
  onClick: () => void;
  index: number;
  title?: string;
  content?: string;
}

// Sticky note colors for varied appearance
const stickyColors = [
  'bg-sticky-yellow',
  'bg-sticky-pink',
  'bg-sticky-blue',
  'bg-sticky-green',
];

// Rotation variations
const rotations = ['rotate-[-1deg]', 'rotate-[1deg]', 'rotate-[-0.5deg]', 'rotate-[1.5deg]'];

const NoteCard = ({ note, onClick, index, title, content }: NoteCardProps) => {
  const { language } = useLanguage();
  const colorIndex = index % stickyColors.length;
  const rotation = rotations[index % rotations.length];

  const displayTitle = title ?? (note.title || 'Catatan tanpa judul');
  // Content used to be HTML, but we are just showing title here. 
  // If we want preview later, we can use content.

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-4 rounded-sm font-handwriting",
        // Sticky note style
        stickyColors[colorIndex],
        "shadow-sticky",
        rotation,
        // GPU-optimized transitions
        "transition-transform duration-150 will-change-transform",
        "hover:scale-[1.02] hover:rotate-0",
        "active:scale-[0.98]"
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-handwriting text-lg font-semibold text-ink truncate">
              {displayTitle}
            </h3>
            {/* Encrypted Badge */}
            {note.isEncrypted && (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-doodle-primary/10 border border-dashed border-doodle-primary/30 rounded-sm flex-shrink-0">
                <Lock className="w-3 h-3 text-doodle-primary" />
                <span className="text-xs text-doodle-primary font-medium">🔒</span>
              </div>
            )}
          </div>
          {/* Category Badge */}
          {note.category && (
            <div className="mt-2 flex items-center gap-1">
              <Tag className="w-3 h-3 text-ink/60" />
              <span className="text-xs text-ink/70 font-medium">
                {note.category}
              </span>
            </div>
          )}
        </div>
        <span className="text-xs text-pencil/70 whitespace-nowrap font-handwriting">
          {getRelativeDate(note.updatedAt || note.createdAt, language)}
        </span>
      </div>
    </button>
  );
};

export default NoteCard;
