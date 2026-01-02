# Changelog - Session 2 Januari 2026

## 🔧 Perbaikan Bug Kritis (5 Issues)

### 1. Race Condition Timer - `useRoutines.ts`
- Timer dioptimalkan dari 1 detik → 60 detik interval
- Mengurangi 60x unnecessary re-renders per menit

### 2. Fire-and-Forget Save Pattern - `core.ts`, `priorities.ts`, `notes.ts`, `routines.ts`
- Menambahkan `handleSaveError()` helper dengan toast notification
- User sekarang diberi feedback saat save gagal + opsi retry

### 3. Priority Overwrite Bug - `reflections.ts`
- Fixed: Prioritas baru dari refleksi sekarang di-merge, bukan overwrite semua

### 4. Memory Leak Camera - `LogCreatorPage.tsx`
- Cleanup kamera diperbaiki: stop tracks + null ref + null srcObject

### 5. Hybrid Storage - `local-storage-provider.ts`
- Ditambahkan TODO comment untuk future migration ke IndexedDB penuh

---

## 🔧 Perbaikan Bug Medium (7 Issues)

### 6. DOM Manipulation Anti-Pattern - `HomePrioritySection.tsx`
- `document.getElementById` diganti dengan `useRef`

### 7. Sync Token Edge Case - `core.ts`
- Ditambahkan 1 second buffer untuk menghindari missing concurrent updates

### 8. Provider Switch Queue Drain - `core.ts`
- Clear offline queue saat logout
- Clear sync tokens untuk user sebelumnya

### 9. Deep Link Validation - `App.tsx`
- Ditambahkan validasi URL scheme (urusdiri, http, https)
- Ditambahkan host whitelist (localhost, 127.0.0.1, urusdiri.app)

### 10. Priority Reset Logic Bug - `priorities.ts`
- Fixed: Hanya reset item yang outdated secara individual

### 11. Native confirm() Usage - `HistoryScreen.tsx`
- Diganti dengan `AlertDialog` component dari Shadcn UI

### 12. Fake Refresh - `SettingsScreen.tsx`
- Implementasi actual page reload
- Version sekarang sync dengan `package.json`

---

## 🔧 Perbaikan Bug Low Priority (4 Issues)

### 13. Version Hardcoded - `SettingsScreen.tsx`
- Sekarang import dari `package.json`

### 14. useNotes Stale Read - `useNotes.ts`
- Ditambahkan `useCallback`, `isLoading` state, `refreshNotes` method

### 15. i18n Hardcoded Strings - `HomeRoutineSection.tsx`
- Ditambahkan translation keys untuk empty routines state

### 16. Timer Cleanup Fix - `useRoutines.ts`
- Menggunakan `useRef` untuk store interval ID, bukan `window` object
- Menghindari global namespace pollution

### 17. Fix `any` Types - `AuthSection.tsx`
- Mengganti `any` dengan proper `User` type dari Supabase
- Error handling yang lebih type-safe (`instanceof Error`)

### 18. Deprecated API Fix - `idb.ts`
- Mengganti `substr()` (deprecated) dengan `substring()`

---

## 📁 Refactoring - File Baru

### `src/lib/providers/offline-queue.ts` (NEW)
- Extracted offline queue logic dari `supabase-provider.ts`
- ~130 lines, reusable singleton instance
- API: `add()`, `process()`, `executeOrQueue()`, `clear()`

### `src/hooks/useCamera.ts` (NEW)
- Extracted camera logic dari `LogCreatorPage.tsx`
- ~125 lines, handles camera lifecycle
- API: `start()`, `stop()`, `switchCamera()`, `capturePhoto()`

---

## 🌐 i18n Updates

### `types.ts`, `en.ts`, `id.ts`
- Ditambahkan keys:
  - `home.no_routines_title`, `home.no_routines_desc`, `home.create_first_routine`
  - `checkin.add_priority`
  - `history.reflections_tab`, `history.activity_log_tab`
  - `log_creator.*` (8 keys untuk LogCreatorPage)

### `HistoryScreen.tsx`
- Tab names sekarang menggunakan i18n

### `LogCreatorPage.tsx`
- Semua hardcoded strings sekarang menggunakan i18n

---

## 📄 Dokumentasi Baru

### `FUTURE_REFACTORING.md` (NEW)
- Roadmap untuk refactoring arsitektur masa depan
- Termasuk migrasi IndexedDB, optimasi performa, testing strategy

---

## 📊 Summary

| Kategori         | Jumlah |
| ---------------- | ------ |
| Bug Fixes        | 18     |
| New Files        | 3      |
| Refactored Files | 8      |
| i18n Keys Added  | 25+    |
| Lines Removed    | ~120   |
