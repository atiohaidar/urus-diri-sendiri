import { useState, useMemo, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Lightbulb, PenLine, ArrowUpDown, Tag, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
  const { notes, getUniqueCategories } = useNotes();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null); // null = "Semua", "uncategorized" = "Tanpa Kategori"
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [showSecureNotes, setShowSecureNotes] = useState(false); // Toggle untuk menampilkan notes yang secure

  // Get unique categories from notes
  const categories = useMemo(() => getUniqueCategories(), [getUniqueCategories]);

  const filteredAndSortedNotes = useMemo(() => {
    let result = notes;

    // Filter out secure/encrypted notes by default
    if (!showSecureNotes) {
      result = result.filter(note => !note.isEncrypted);
    }

    // Filter by category
    if (selectedCategory === 'uncategorized') {
      // Show only notes without category
      result = result.filter(note => !note.category || note.category.trim() === '');
    } else if (selectedCategory !== null) {
      // Show notes with specific category
      result = result.filter(note => note.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        note =>
          note.title.toLowerCase().includes(query) ||
          note.content.toLowerCase().includes(query)
      );
    }

    // Sort by time
    result = [...result].sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [notes, searchQuery, selectedCategory, sortOrder, showSecureNotes]);

  const openNewNote = () => {
    navigate('/note-editor/new');
  };

  const openEditNote = (note: Note) => {
    navigate(`/note-editor/${note.id}`);
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest');
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

          {/* Category Filter Chips + Sort Toggle + Secure Toggle */}
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Category Chips */}
            <div className="flex-1 flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
              <Tag className="w-4 h-4 text-pencil flex-shrink-0" />
              <button
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  "px-3 py-1 rounded-full text-sm font-handwriting whitespace-nowrap transition-all",
                  "border-2 border-dashed",
                  selectedCategory === null
                    ? "bg-doodle-primary text-white border-doodle-primary"
                    : "bg-paper text-pencil border-paper-lines hover:border-doodle-primary/50"
                )}
              >
                Semua
              </button>
              <button
                onClick={() => setSelectedCategory('uncategorized')}
                className={cn(
                  "px-3 py-1 rounded-full text-sm font-handwriting whitespace-nowrap transition-all",
                  "border-2 border-dashed",
                  selectedCategory === 'uncategorized'
                    ? "bg-doodle-primary text-white border-doodle-primary"
                    : "bg-paper text-pencil border-paper-lines hover:border-doodle-primary/50"
                )}
              >
                Tanpa Kategori
              </button>
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    "px-3 py-1 rounded-full text-sm font-handwriting whitespace-nowrap transition-all",
                    "border-2 border-dashed",
                    selectedCategory === category
                      ? "bg-doodle-primary text-white border-doodle-primary"
                      : "bg-paper text-pencil border-paper-lines hover:border-doodle-primary/50"
                  )}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Controls: Secure Toggle + Sort Toggle */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Secure Notes Toggle */}
              <Button
                variant={showSecureNotes ? "default" : "ghost"}
                size="sm"
                onClick={() => setShowSecureNotes(!showSecureNotes)}
                className={cn(
                  "font-handwriting gap-1.5",
                  showSecureNotes
                    ? "bg-doodle-primary text-white hover:bg-doodle-primary/90"
                    : "text-pencil hover:text-ink"
                )}
              >
                <Lock className="w-4 h-4" />
                {showSecureNotes ? 'Sembunyikan Secure' : 'Tampilkan Secure'}
              </Button>

              {/* Sort Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSortOrder}
                className="font-handwriting text-pencil hover:text-ink gap-1.5"
              >
                <ArrowUpDown className="w-4 h-4" />
                {sortOrder === 'newest' ? 'Terbaru' : 'Terlama'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-md md:max-w-5xl mx-auto px-4 py-6 md:py-8">
        {filteredAndSortedNotes.length > 0 ? (
          <VirtuosoGrid
            useWindowScroll
            data={filteredAndSortedNotes}
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
              {searchQuery || selectedCategory ? t.ideas.no_results_title : t.ideas.empty_title} 📝
            </h3>
            <p className="font-handwriting text-base text-pencil max-w-sm mx-auto">
              {searchQuery || selectedCategory
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
