import { useState, useMemo, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Lightbulb } from 'lucide-react';
import { Input } from '@/components/ui/input';
import NoteCard from '@/components/NoteCard';
import { useNotes } from '@/hooks/useNotes';
import { type Note } from '@/lib/storage';
import { useLanguage } from '@/i18n/LanguageContext';
import { VirtuosoGrid } from 'react-virtuoso';

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
    <div className="min-h-screen pb-24 md:pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 pt-safe">
        <div className="container max-w-md md:max-w-5xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Lightbulb className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">{t.ideas.title}</h1>
                <p className="text-sm text-muted-foreground hidden md:block">{t.ideas.subtitle}</p>
              </div>
            </div>

            {/* Search */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.ideas.search_placeholder}
                className="pl-11 h-11 bg-card border-0 rounded-xl shadow-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
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
            // Add spacing for FAB at the bottom
            style={{ minHeight: '400px' }}
          />
        ) : (
          <div className="text-center py-12 md:py-24">
            <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-secondary mx-auto mb-6 flex items-center justify-center">
              <Lightbulb className="w-8 h-8 md:w-12 md:h-12 text-primary" />
            </div>
            <h3 className="font-semibold text-lg md:text-xl text-foreground mb-2">
              {searchQuery ? t.ideas.no_results_title : t.ideas.empty_title}
            </h3>
            <p className="text-sm md:text-base text-muted-foreground">
              {searchQuery
                ? t.ideas.no_results_desc
                : t.ideas.empty_desc}
            </p>
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <button
        onClick={openNewNote}
        className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] right-4 md:bottom-12 md:right-12 w-14 h-14 md:w-16 md:h-16 bg-primary rounded-full shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-40 hover:bg-primary/90"
      >
        <Plus className="w-6 h-6 md:w-8 md:h-8 text-primary-foreground" />
      </button>

    </div>
  );
};

export default ParkingLotScreen;
