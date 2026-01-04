import { useState, useMemo, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Lightbulb, PenLine } from 'lucide-react';
import { Input } from '@/components/ui/input';
import NoteCard from '@/components/NoteCard';
import { useNotes } from '@/hooks/useNotes';
import { type Note } from '@/lib/storage';
import { useLanguage } from '@/i18n/LanguageContext';
import { VirtuosoGrid } from 'react-virtuoso';
import { cn } from '@/lib/utils';

// Custom components for VirtuosoGrid to maintain Tailwind styling
const ListComponent = forwardRef<HTMLDivElement, any>(({ style, children, ...props }, ref) => (
  <div
    {...props}
    ref={ref}
    style={style}
    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
  >
    {children}
  </div>
));

const ItemComponent = ({ children, ...props }: any) => (
  <div {...props} className="w-full">
    {children}
  </div>
);

const ParkingLotScreen = () => {
  const navigate = useNavigate();
  const { notes } = useNotes();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes;
    const query = searchQuery.toLowerCase();
    return notes.filter(
      note =>
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query)
    );
  }, [notes, searchQuery]);

  const openNewNote = () => {
    navigate('/note-editor/new');
  };

  const openEditNote = (note: Note) => {
    navigate(`/note-editor/${note.id}`);
  };

  return (
    <div className="pb-24 md:pb-8 bg-notebook">
      {/* Header - Notebook style */}
      <header className="sticky top-0 z-40 bg-paper border-b-2 border-dashed border-paper-lines pt-safe">
        <div className="container max-w-md md:max-w-5xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-sm bg-sticky-green shadow-sticky -rotate-2">
                <Lightbulb className="w-6 h-6 text-doodle-green" />
              </div>
              <div>
                <h1 className="text-2xl font-handwriting text-ink flex items-center gap-2">
                  <span className="highlight">{t.ideas.title}</span> 💡
                </h1>
                <p className="text-sm font-handwriting text-pencil hidden md:block">{t.ideas.subtitle}</p>
              </div>
            </div>

            {/* Search - Notebook line style */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pencil" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.ideas.search_placeholder}
                variant="notebook"
                className="pl-10 font-handwriting"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-md md:max-w-5xl mx-auto px-4 py-6 md:py-8">
        {filteredNotes.length > 0 ? (
          <VirtuosoGrid
            useWindowScroll
            data={filteredNotes}
            components={{
              List: ListComponent,
              Item: ItemComponent as any
            }}
            itemContent={(index, note) => (
              <NoteCard
                note={note}
                onClick={() => openEditNote(note)}
                index={index}
              />
            )}
            style={{ minHeight: '400px' }}
          />
        ) : (
          /* Empty State - Notebook doodle style */
          <div className="text-center py-12 md:py-24">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-sm bg-sticky-green shadow-sticky mx-auto mb-6 flex items-center justify-center rotate-3">
              <Lightbulb className="w-12 h-12 md:w-16 md:h-16 text-doodle-green" />
            </div>
            <h3 className="font-handwriting text-2xl text-ink mb-2">
              {searchQuery ? t.ideas.no_results_title : t.ideas.empty_title} 📝
            </h3>
            <p className="font-handwriting text-base text-pencil max-w-sm mx-auto">
              {searchQuery
                ? t.ideas.no_results_desc
                : t.ideas.empty_desc}
            </p>
          </div>
        )}
      </main>

      {/* FAB - Pencil button style */}
      <button
        onClick={openNewNote}
        className={cn(
          "fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] right-4 md:bottom-12 md:right-12",
          "w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center",
          "bg-doodle-primary text-white",
          "shadow-[3px_3px_0_0_rgba(0,0,0,0.15)]",
          "border-2 border-ink/20",
          "hover:scale-105 active:scale-95 transition-transform duration-150",
          "will-change-transform z-40"
        )}
      >
        <PenLine className="w-6 h-6 md:w-7 md:h-7" />
      </button>
    </div>
  );
};

export default ParkingLotScreen;
