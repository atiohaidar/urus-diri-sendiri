import type { Note } from '@/lib/storage';
import { getRelativeDate } from '@/lib/storage';
import { useLanguage } from '@/i18n/LanguageContext';
import { cn } from '@/lib/utils';

interface NoteCardProps {
  note: Note;
  onClick: () => void;
  index: number;
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

const NoteCard = ({ note, onClick, index }: NoteCardProps) => {
  const { language } = useLanguage();
  const colorIndex = index % stickyColors.length;
  const rotation = rotations[index % rotations.length];

  // Strip HTML tags and entities for preview
  const plainText = note.content
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const snippet = plainText.length > 80
    ? plainText.substring(0, 80) + '...'
    : plainText;

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
          <h3 className="font-handwriting text-lg font-semibold text-ink mb-1 truncate">
            {note.title || 'Catatan tanpa judul'}
          </h3>
          <p className="text-sm text-pencil line-clamp-2 italic">
            "{snippet || 'Catatan kosong...'}"
          </p>
        </div>
        <span className="text-xs text-pencil/70 whitespace-nowrap font-handwriting">
          {getRelativeDate(note.updatedAt, language)}
        </span>
      </div>
    </button>
  );
};

export default NoteCard;
