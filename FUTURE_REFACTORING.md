# Future Refactoring Roadmap

## Overview
Dokumen ini berisi daftar perbaikan arsitektur dan refactoring yang direncanakan untuk meningkatkan kualitas kode dan performa aplikasi.

**Recent Progress (2 Jan 2026):**
- ✅ Extracted `offline-queue.ts` from `supabase-provider.ts`
- ✅ Extracted `useCamera.ts` from `LogCreatorPage.tsx`
- ✅ Fixed critical sync & race conditions

---

## Priority 1: Storage Architecture Migration

### 🔄 Migrasi ke IndexedDB Penuh
**Status**: Planned  
**Estimated Effort**: 2-3 sprint

**Current State**:
- Priorities, Notes, Routines → localStorage (sync)
- Reflections, Logs, Images → IndexedDB (async)

**Target State**:
- All data → IndexedDB (async, consistent API)

**Benefits**:
- Konsistensi API (semua async)
- Kapasitas storage lebih besar (bukan 5-10MB limit)
- Better crash recovery dengan transaction support
- Improved performance untuk large datasets

**Migration Steps**:
1. Create new IDB stores untuk priorities, notes, routines
2. Update LocalStorageProvider untuk menggunakan IDB
3. Create migration script untuk data existing
4. Update semua consumer untuk handle async operations
5. Remove localStorage usage

---

## Priority 1.5: Component Decomposition (Bloated Files)

### 🧩 `supabase-provider.ts` Decomposition
**Status**: In Progress  
**Size**: ~560 lines (was 613)

- **Done**: Extracted `offline-queue` logic.
- **Next**: Split entities into separate files/modules (e.g., `SupabasePriorities`, `SupabaseReflections`) to follow Single Responsibility Principle.

### 🧩 `MaghribCheckinPage.tsx` Refactoring
**Status**: Planned  
**Size**: ~420 lines

- Extract form sections into sub-components.
- Separate business logic into custom hooks (e.g., `useCheckinLogic`).

### 🧩 `core.ts` Modularization
**Status**: Planned  
**Size**: ~317 lines

- Split distinct responsibilities:
  - Authentication state management
  - Cache management
  - Synchronization logic

---

## Priority 2: Performance Optimizations

### ⚡ React Query Integration
**Status**: Partial (already using for some features)

- Migrate storage hooks ke React Query
- Get benefit dari caching, background refetch, optimistic updates
- Reduce custom state management code

### ⚡ Bundle Splitting
**Status**: Partial

- Lazy load `react-quill` hanya saat NoteEditor dibuka
- Consider lazy loading Recharts untuk History page
- Code split per-route

---

## Priority 3: Code Quality

### 🧹 Standardize Error Handling
**Status**: Started (added `handleSaveError`)
- Create centralized error handler
- Integrate dengan error monitoring (Sentry/LogRocket)
- Standardize toast messages

### 🧹 Remove Console Logs
- Create logger service
- Auto-disable in production
- Keep useful debugging for development

### 🧹 TypeScript Strict Mode
- Enable strict mode
- Remove `any` types
- Better type inference

---

## Priority 4: UX Improvements

### 🎨 Accessibility Audit
- Add aria-labels ke semua interactive elements
- Keyboard navigation support
- Screen reader testing

### 🎨 Complete i18n
**Status**: In Progress (Recently updated `LogCreator`, `History`, `Home`)
- Move semua hardcoded strings ke translation files
- Add RTL support (future if needed)

---

## Priority 5: Testing

### 🧪 Add Unit Tests
- Storage modules
- Utility functions
- Hooks

### 🧪 Add E2E Tests
- Critical user flows
- Offline functionality
- Sync scenarios

---

## Notes
- Priorities dapat berubah berdasarkan feedback user
- Setiap refactoring harus backward compatible
- Test thoroughly sebelum deploy
