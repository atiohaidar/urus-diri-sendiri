import { useState, useMemo } from 'react';
import { Search, Plus, Lightbulb } from 'lucide-react';
import { Input } from '@/components/ui/input';
import NoteCard from '@/components/NoteCard';
import NoteEditor from '@/components/NoteEditor';
import { useNotes } from '@/hooks/useNotes';
import { type Note } from '@/lib/storage';

const ParkingLotScreen = () => {
  const { notes, saveNote, updateNote, deleteNote } = useNotes();
  const [searchQuery, setSearchQuery] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes;
    const query = searchQuery.toLowerCase();
    return notes.filter(
      note =>
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query)
    );
  }, [notes, searchQuery]);

  const handleSaveNote = (title: string, content: string) => {
    if (editingNote) {
      updateNote(editingNote.id, { title, content });
    } else {
      saveNote(title, content);
    }
    setEditingNote(null);
  };

  const handleDeleteNote = (id: string) => {
    deleteNote(id);
    setEditingNote(null);
  };

  const openNewNote = () => {
    setEditingNote(null);
    setShowEditor(true);
  };

  const openEditNote = (note: Note) => {
    setEditingNote(note);
    setShowEditor(true);
  };

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container max-w-md md:max-w-5xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Lightbulb className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Parking Lot</h1>
                <p className="text-sm text-muted-foreground hidden md:block">Capture ideas for later</p>
              </div>
            </div>

            {/* Search */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search thoughts..."
                className="pl-11 h-11 bg-card border-0 rounded-xl shadow-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-md md:max-w-5xl mx-auto px-4 py-6 md:py-8">
        {filteredNotes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotes.map((note, index) => (
              <NoteCard
                key={note.id}
                note={note}
                onClick={() => openEditNote(note)}
                index={index}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 md:py-24">
            <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-secondary mx-auto mb-6 flex items-center justify-center">
              <Lightbulb className="w-8 h-8 md:w-12 md:h-12 text-primary" />
            </div>
            <h3 className="font-semibold text-lg md:text-xl text-foreground mb-2">
              {searchQuery ? 'No matching notes' : 'No ideas yet'}
            </h3>
            <p className="text-sm md:text-base text-muted-foreground">
              {searchQuery
                ? 'Try a different search term'
                : 'Capture your sudden thoughts and ideas here'}
            </p>
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <button
        onClick={openNewNote}
        className="fixed bottom-24 right-4 md:bottom-12 md:right-12 w-14 h-14 md:w-16 md:h-16 bg-primary rounded-full shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-40 hover:bg-primary/90"
      >
        <Plus className="w-6 h-6 md:w-8 md:h-8 text-primary-foreground" />
      </button>

      {/* Note Editor */}
      {showEditor && (
        <NoteEditor
          note={editingNote}
          onClose={() => {
            setShowEditor(false);
            setEditingNote(null);
          }}
          onSave={handleSaveNote}
          onDelete={handleDeleteNote}
        />
      )}
    </div>
  );
};

export default ParkingLotScreen;
