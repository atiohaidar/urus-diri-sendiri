import { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Lightbulb } from 'lucide-react';
import { Input } from '@/components/ui/input';
import NoteCard from '@/components/NoteCard';
import NoteEditor from '@/components/NoteEditor';
import { getNotes, saveNote, updateNote, deleteNote, type Note } from '@/lib/storage';

const ParkingLotScreen = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  useEffect(() => {
    setNotes(getNotes());
  }, []);

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
      const updated = updateNote(editingNote.id, { title, content });
      setNotes(updated);
    } else {
      saveNote({ title, content });
      setNotes(getNotes());
    }
    setEditingNote(null);
  };

  const handleDeleteNote = (id: string) => {
    const updated = deleteNote(id);
    setNotes(updated);
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
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <Lightbulb className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Parking Lot</h1>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search thoughts..."
              className="pl-11 h-11 bg-card border-0 rounded-xl"
            />
          </div>
        </div>
      </header>

      <main className="container max-w-md mx-auto px-4 py-6">
        {filteredNotes.length > 0 ? (
          <div className="space-y-3">
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
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-secondary mx-auto mb-4 flex items-center justify-center">
              <Lightbulb className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">
              {searchQuery ? 'No matching notes' : 'No ideas yet'}
            </h3>
            <p className="text-sm text-muted-foreground">
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
        className="fixed bottom-24 right-4 w-14 h-14 bg-primary rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-40"
      >
        <Plus className="w-6 h-6 text-primary-foreground" />
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
