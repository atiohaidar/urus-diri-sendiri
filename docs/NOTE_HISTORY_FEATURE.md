# 📜 Fitur Note History - Version Tracking untuk Catatan

## 🎯 Tujuan
Fitur ini memungkinkan pengguna untuk melihat riwayat perubahan setiap catatan yang disimpan. Setiap kali note di-update, sistem akan menyimpan snapshot dari versi sebelumnya sehingga pengguna dapat:
- Melihat perubahan apa saja yang terjadi
- Membandingkan versi lama dengan versi terkini
- Tracking progress penulisan catatan

## 🏗️ Arsitektur

### 1. **Type Definition** (`src/lib/types.ts`)
```typescript
export interface NoteHistory {
    id: string;
    noteId: string;
    title: string;
    content: string; // Snapshot of content at this version
    savedAt: string; // ISO timestamp when this version was saved
    createdAt: string;
    updatedAt?: string;
    deletedAt?: string | null;
}
```

### 2. **Storage Layer**

#### Local Storage (`src/lib/storage-modules/note-histories.ts`)
- `getNoteHistories(noteId?)` - Get histories, optionally filtered by noteId
- `saveNoteHistory(noteId, title, content)` - Save new history entry
- `deleteNoteHistory(id)` - Soft delete history entry
- `deleteNoteHistoriesByNoteId(noteId)` - Delete all histories for a note

#### IndexedDB (`src/lib/idb.ts`)
- Added `NOTE_HISTORIES` store
- DB version bumped to 5
- Stores histories locally for offline access

### 3. **Cloud Sync** (`src/lib/providers/supabase-handlers/note-histories.ts`)
- `fetchNoteHistories(userId, since?)` - Fetch from Supabase
- `syncNoteHistory(userId, history)` - Upsert to Supabase
- Supports incremental sync with `since` parameter

### 4. **UI Components**

#### `NoteHistoryDialog.tsx`
Dialog component yang menampilkan:
- **List View**: Daftar semua versi dengan timestamp
- **Diff View**: Perbandingan antara versi lama dan terkini
- Menggunakan `DiffViewer` component untuk visualisasi perubahan
- Styling dengan tema notebook/handwriting

#### Integration di `NoteEditorPage.tsx`
- Tombol "Riwayat" di header (hanya untuk existing notes)
- Badge menampilkan jumlah history entries
- Auto-save history saat note di-update (jika ada perubahan)

### 5. **Hook** (`src/hooks/useNoteHistories.ts`)
```typescript
const { histories, isLoading, refresh } = useNoteHistories(noteId);
```
- Auto-refresh saat storage berubah
- Filter by noteId
- Sorted by savedAt (newest first)

## 📊 Database Schema (Supabase)

```sql
CREATE TABLE note_histories (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    note_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    saved_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
```

**Indexes:**
- `idx_note_histories_user_id`
- `idx_note_histories_note_id`
- `idx_note_histories_saved_at`
- `idx_note_histories_updated_at`

**RLS Policies:**
- Users can only view/insert/update/delete their own histories

## 🔄 Flow Diagram

```
User edits note → Save button clicked
    ↓
Check hasChanges
    ↓ (if true)
updateNote() → saveNoteHistory()
    ↓              ↓
Update cache   Save to IndexedDB
    ↓              ↓
Sync to        Queue for Supabase sync
Supabase       (if online)
```

## 🎨 UI/UX Features

1. **History Button**
   - Icon: Clock (⏰)
   - Badge dengan jumlah history entries
   - Hanya muncul untuk existing notes (bukan new notes)

2. **History Dialog**
   - **Current Version** (highlighted dengan warna hijau)
   - **History List** (sorted by date, newest first)
   - Click item → Show diff comparison
   - Timestamp dengan format "X waktu yang lalu" (locale Indonesia)

3. **Diff Viewer**
   - Side-by-side comparison
   - Highlight additions (green) and deletions (red)
   - Support HTML content stripping untuk plain text comparison

## 🔐 Security & Privacy

1. **Encryption Support**
   - History menyimpan **plaintext** content (sebelum encryption)
   - Ini memungkinkan diff comparison yang akurat
   - Encrypted notes tetap aman karena history hanya accessible oleh user yang sama

2. **RLS (Row Level Security)**
   - Setiap user hanya bisa akses history mereka sendiri
   - Cascade delete saat user dihapus

## 📝 Usage Example

```typescript
// Di NoteEditorPage
const { histories } = useNoteHistories(noteId);

// Saat save note
if (hasChanges) {
    updateNote(existingNote.id, { title, content, category });
    saveNoteHistory(existingNote.id, title, content);
}

// Show history dialog
<NoteHistoryDialog
    open={showHistoryDialog}
    onClose={() => setShowHistoryDialog(false)}
    histories={histories}
    currentTitle={title}
    currentContent={content}
/>
```

## 🚀 Future Enhancements

1. **Restore Version**
   - Tombol untuk restore ke versi tertentu
   - Confirmation dialog sebelum restore

2. **History Limit**
   - Batasi jumlah history per note (misal max 50 versions)
   - Auto-cleanup old histories

3. **Compression**
   - Compress content untuk save storage
   - Delta encoding (hanya simpan perubahan)

4. **Search in History**
   - Search content dalam history
   - Filter by date range

5. **Export History**
   - Export semua versions ke file
   - Format: JSON, Markdown, atau PDF

## 🐛 Known Limitations

1. History hanya disimpan saat **ada perubahan** (hasChanges = true)
2. Tidak ada limit jumlah history entries (bisa membengkak untuk note yang sering di-edit)
3. Plaintext content disimpan untuk encrypted notes (trade-off untuk diff functionality)

## 🧪 Testing Checklist

- [ ] Create note → Edit → Save → Check history muncul
- [ ] Multiple edits → Check multiple history entries
- [ ] View diff → Check comparison akurat
- [ ] Offline mode → History tersimpan di IndexedDB
- [ ] Online sync → History sync ke Supabase
- [ ] Delete note → Histories ikut ter-delete (soft delete)
- [ ] Encrypted note → History tetap bisa di-view
- [ ] Multi-device → History sync across devices

## 📚 Related Files

**Core:**
- `src/lib/types.ts` - Type definitions
- `src/lib/storage-modules/note-histories.ts` - Storage logic
- `src/lib/providers/supabase-handlers/note-histories.ts` - Cloud sync

**UI:**
- `src/components/NoteHistoryDialog.tsx` - Dialog component
- `src/pages/NoteEditorPage.tsx` - Integration
- `src/hooks/useNoteHistories.ts` - React hook

**Database:**
- `supabase/migrations/create_note_histories_table.sql` - Schema migration

---

**Created:** 2026-01-20  
**Version:** 1.0.0  
**Status:** ✅ Implemented
