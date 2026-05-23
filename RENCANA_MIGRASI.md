# ✅ Migrasi Selesai: Supabase → Hono + Cloudflare D1

> **Status: SELESAI** — Semua fase migrasi telah dieksekusi. Dokumen ini disimpan sebagai catatan historis.

## Status Saat Ini

### ✅ Yang Sudah Jadi (Backend Hono)

| Komponen | Status | Detail |
|----------|--------|--------|
| **Auth (register/login/logout/me)** | ✅ Selesai | JWT custom via Web Crypto, sessions di D1 |
| **Priorities CRUD** | ✅ Selesai | GET (since), PUT (batch upsert), DELETE (soft) |
| **Routines CRUD** | ✅ Selesai | Pola sama dengan priorities |
| **Notes CRUD + single** | ✅ Selesai | Batch + single upsert, soft delete |
| **Note Histories** | ✅ Selesai | GET + PUT batch |
| **Reflections** | ✅ Selesai | GET + PUT |
| **Logs** | ✅ Selesai | GET + PUT + DELETE |
| **Habits** | ✅ Selesai | GET + PUT |
| **Habit Logs** | ✅ Selesai | GET + PUT |
| **Personal Notes** | ✅ Selesai | GET + PUT (encrypted blob) |
| **Sync endpoint** | ✅ Selesai | `/api/sync/all` — fetch semua tabel sekaligus + incremental |
| **DB Schema (D1)** | ✅ Selesai | 2 migration files, semua tabel + index |
| **OpenAPI + Scalar docs** | ✅ Selesai | Auto-generated API reference |
| **Auth middleware** | ✅ Selesai | `authMiddleware` + `optionalAuthMiddleware` |

### ✅ Yang Sudah Jadi (Frontend Integration)

| Komponen | Status | Detail |
|----------|--------|--------|
| **RPC Client** | ✅ Selesai | `rpc-client.ts` — typed Hono client + auto auth header |
| **Cloudflare API Client** | ✅ Selesai | `cloudflare-api.ts` — semua entity API (priorities, routines, notes, dll) |
| **CloudflareD1Provider** | ✅ Selesai | Implementasi `IStorageProvider` lengkap, offline queue, auth error handling |
| **Cloudflare Auth module** | ✅ Selesai | `cloudflare-auth.ts` — login, register, logout, listener pattern |
| **Auth Sync Manager** | ✅ Selesai | State machine idle→syncing→ready/error |
| **useAuthSync hook** | ✅ Selesai | React hook terpusat, bersih dari Supabase |
| **AuthSection UI** | ⚠️ Dual | Sudah handle Cloudflare mode, tapi masih ada fallback Supabase |
| **Provider switching** | ⚠️ Dual | `core.ts` masih import keduanya, logic dual backend |

---

## 🎯 Yang Harus Dilakukan (Rencana Migrasi)

### Fase 1: Bersihkan Dual-Backend di Frontend (Effort: Sedang)

Ini inti utamanya. Frontend masih punya logic "kalau ada VITE_API_URL pakai Cloudflare, kalau tidak fallback ke Supabase". Setelah migrasi total, Cloudflare jadi **satu-satunya** backend.

#### 1.1 — `src/lib/storage-modules/core.ts` ⭐ PRIORITAS UTAMA

**Masalah:**
```typescript
// Baris 4-6: Masih import Supabase
import { SupabaseProvider } from '../providers/supabase-provider';
import { supabase, isSupabaseConfigured } from '../supabase';

// Baris 15-16: Logic dual backend
const useCloudflareBackend = isCloudflareConfigured;
const useSupabaseBackend = !useCloudflareBackend && isSupabaseConfigured;

// Baris ~475-491: Listener masih dual
if (useCloudflareBackend) {
    onCloudflareAuthChange(...)
} else if (useSupabaseBackend) {
    supabase.auth.onAuthStateChange(...)
}
```

**Yang harus dilakukan:**
- Hapus semua import Supabase
- Hapus variable `useSupabaseBackend`
- Hardcode `useCloudflareBackend = true` (atau langsung hapus variable-nya)
- Di `handleAuthStateChange`, hapus `SupabaseProvider` dari condition
- Di listener section, hapus branch `else if (useSupabaseBackend)`
- Di `getIsCloudActive`, hapus check `SupabaseProvider`

#### 1.2 — `src/hooks/useAppInit.ts`

**Masalah:**
```typescript
// Baris 3: Import Supabase
import { supabase } from '@/lib/supabase';

// Baris 60: Deep link handler pakai Supabase auth
const { error } = await supabase.auth.exchangeCodeForSession(code);

// Baris 85: Implicit flow pakai Supabase
const { error } = await supabase.auth.setSession({ access_token, refresh_token });
```

**Yang harus dilakukan:**
- Hapus import supabase
- Deep link handler: Untuk Hono backend, deep link flow berbeda. Kamu pakai email+password, bukan OAuth redirect. Jadi **hapus semua deep link auth handling** yang spesifik Supabase. Kalau nanti mau tambah OAuth, buat flow baru yang lewat Hono backend.
- Sisakan logic `initializeStorage()` dan `waitForAuthSync()` yang sudah clean

#### 1.3 — `src/components/settings/AuthSection.tsx`

**Masalah:**
```typescript
// Baris 6: Import Supabase functions
import { signInWithGoogle, signOut as supabaseSignOut, isSupabaseConfigured } from '@/lib/supabase';

// Baris 33-41: handleLogin pakai signInWithGoogle
// Baris 74-78: handleLogout masih cek Supabase fallback
// Baris 179-193: Else branch render Google login + Email OTP (Supabase)
```

**Yang harus dilakukan:**
- Hapus semua import dari `@/lib/supabase`
- Hapus `handleLogin` (Google OAuth)
- `handleLogout`: Cukup panggil `cfSignOut()`
- Hapus branch else di dialog yang render Google login + Email OTP
- Buat Cloudflare login (email+password) jadi **satu-satunya** UI login
- Hapus check `!isSupabaseConfigured && !isCloudflareConfigured` — ganti cek `!isCloudflareConfigured` saja

#### 1.4 — Teks i18n

**File:** `src/i18n/locales/id.ts` dan `src/i18n/locales/en.ts`

**Masalah:** Masih sebut "Supabase Cloud" di beberapa string.

**Yang harus dilakukan:**
- Ganti `"Akun Cloud (Supabase)"` → `"Akun Cloud"`
- Ganti `"Data Anda akan dicadangkan ke Supabase Cloud"` → `"Data Anda akan dicadangkan ke Cloud"`

---

### Fase 2: Hapus File Supabase (Effort: Ringan)

Setelah Fase 1 selesai dan tidak ada lagi import ke file-file ini:

| File/Folder | Aksi |
|-------------|------|
| `src/lib/supabase.ts` | 🗑️ Hapus |
| `src/lib/providers/supabase-provider.ts` | 🗑️ Hapus |
| `src/lib/providers/supabase-handlers/` (9 file) | 🗑️ Hapus seluruh folder |
| `supabase_setup.sql` | 🗑️ Hapus |
| `supabase_habits_migration.sql` | 🗑️ Hapus |
| `supabase_setup_personal_notes.sql` | 🗑️ Hapus |

**package.json:**
- Hapus dependency `@supabase/supabase-js`

**.env.example:**
- Hapus `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`
- Jadikan `VITE_API_URL` **wajib** (bukan opsional)

---

### Fase 3: Perbaiki Bug Auth/Login (Effort: Sedang-Tinggi)

Ini yang disebut di README: *"masih ada masalah serius di loginnya"*

#### 3.1 — Token Persistence & Validation

**Masalah potensial:**
- Token disimpan di `localStorage` (`cloudflare_auth_token`). Kalau user buka app setelah token expired (30 hari), tidak ada auto-refresh.
- `getSession()` di `cloudflare-auth.ts` memanggil `authApi.getCurrentUser()` untuk verifikasi, tapi kalau network error → user dianggap logged out.

**Solusi:**
- Tambahkan logic token refresh di backend (misal endpoint `/api/auth/refresh`)
- Atau: di frontend, saat API return 401, coba re-login otomatis dari stored credentials (kalau diizinkan) — atau minimal clear state dan redirect ke login
- `handleAuthError` di `CloudflareD1Provider` sudah ada dasar handling-nya (toast + reload), tapi perlu lebih robust

#### 3.2 — Race Condition saat App Init

**Masalah potensial:**
- `useAppInit` punya timeout 6 detik. Kalau auth sync lambat → app ready tapi data belum sync
- `cloudflare-auth.ts` → `onAuthStateChange` langsung panggil callback dengan `getStoredUser()`. Tapi user bisa punya token yang expired. Perlu server verification dulu.

**Solusi:**
- Buat flow startup yang jelas:
  1. Cek ada token? → Verifikasi ke server (`/api/auth/me`)
  2. Token valid → set user, trigger sync
  3. Token invalid → clear, masuk guest mode
  4. Baru set `isReady = true`

#### 3.3 — Offline Queue Error Handling

**Masalah potensial:**
- Jika token expired saat queue processing, semua item gagal tanpa recovery
- Queue processor di `CloudflareD1Provider` constructor tidak handle auth errors

**Solusi:**
- Tambah auth check sebelum process queue
- Jika 401, stop processing dan notify user untuk re-login

---

### Fase 4: Backend Hardening (Effort: Sedang)

#### 4.1 — Wrangler Configuration
- `database_id` di `wrangler.toml` masih `"placeholder-run-wrangler-d1-create"` → harus di-setup sebelum deploy
- `JWT_SECRET` perlu di-set via `wrangler secret put JWT_SECRET`

#### 4.2 — CORS Configuration
- Backend perlu CORS yang proper untuk production domain
- Saat ini tidak terlihat CORS middleware (mungkin perlu dicek di `index.ts`)

#### 4.3 — Rate Limiting
- Tidak ada rate limiting di auth endpoints → rentan brute force
- Pertimbangkan Cloudflare Rate Limiting rules

#### 4.4 — Password Security
- Backend pakai SHA-256 untuk hash password (`utils.ts`). Ini **KURANG AMAN** — idealnya pakai bcrypt/scrypt/argon2
- Di Cloudflare Workers, bisa pakai Web Crypto API dengan PBKDF2 sebagai alternatif

---

### Fase 5: Cleanup & Polish (Effort: Ringan)

- Update `README.md` — hapus catatan masalah login lama, dokumentasikan backend Hono
- Update `PERUBAHAN.md` — catat migrasi
- Hapus komentar-komentar yang masih sebut Supabase di kode
- Hapus `supabase/` folder di root (jika ada config Supabase lama)

---

## 📋 Urutan Pengerjaan (Rekomendasi)

```
1. [Fase 1.1] core.ts — bersihkan dual-backend logic         (30 menit)
2. [Fase 1.2] useAppInit.ts — hapus Supabase deep link        (15 menit)
3. [Fase 1.3] AuthSection.tsx — simplify ke Cloudflare only    (20 menit)
4. [Fase 1.4] i18n strings                                    (5 menit)
5. [Fase 2]   Hapus file + dependency Supabase                 (10 menit)
6. [Fase 3.2] Fix app init flow (startup race condition)       (45 menit)
7. [Fase 3.1] Token validation & refresh                       (1 jam)
8. [Fase 3.3] Offline queue auth handling                      (30 menit)
9. [Fase 4]   Backend hardening (CORS, password hash, config)  (2 jam)
10.[Fase 5]   Cleanup docs & comments                          (15 menit)
```

**Total estimasi: ~5-6 jam kerja**

---

## 🏗️ Arsitektur Setelah Migrasi

```
┌─────────────────────────────────────────────┐
│                   Frontend                   │
│  React + Vite + Capacitor                   │
│                                             │
│  ┌─────────────┐   ┌────────────────────┐   │
│  │ AuthSection  │   │  useAuthSync hook  │   │
│  │ (email+pass) │   │  (state machine)   │   │
│  └──────┬───────┘   └────────┬───────────┘   │
│         │                    │               │
│  ┌──────▼────────────────────▼───────────┐   │
│  │         cloudflare-auth.ts            │   │
│  │   (login, register, logout, listen)   │   │
│  └──────────────┬────────────────────────┘   │
│                 │                             │
│  ┌──────────────▼────────────────────────┐   │
│  │        storage-modules/core.ts        │   │
│  │  handleAuthStateChange → switch       │   │
│  │  provider based on login state        │   │
│  └──────┬───────────────┬────────────────┘   │
│         │               │                    │
│  ┌──────▼──────┐ ┌──────▼───────────────┐   │
│  │ LocalStorage│ │ CloudflareD1Provider  │   │
│  │  Provider   │ │ (+ offline queue)     │   │
│  │ (IndexedDB) │ │                       │   │
│  └─────────────┘ └──────────┬────────────┘   │
│                             │                │
│  ┌──────────────────────────▼────────────┐   │
│  │   cloudflare-api.ts (typed wrappers)  │   │
│  └──────────────────────────┬────────────┘   │
│                             │                │
│  ┌──────────────────────────▼────────────┐   │
│  │   rpc-client.ts (Hono typed client)   │   │
│  │   + auto Bearer token injection       │   │
│  └──────────────────────────┬────────────┘   │
└─────────────────────────────┼───────────────┘
                              │ HTTPS
┌─────────────────────────────▼───────────────┐
│          Hono on Cloudflare Workers          │
│                                             │
│  ┌─────────────┐  ┌──────────────────────┐  │
│  │ Auth Routes  │  │  Entity Routes       │  │
│  │ /api/auth/*  │  │  /api/priorities/*   │  │
│  │              │  │  /api/routines/*     │  │
│  │ register     │  │  /api/notes/*        │  │
│  │ login        │  │  /api/reflections/*  │  │
│  │ logout       │  │  /api/logs/*         │  │
│  │ me           │  │  /api/habits/*       │  │
│  └──────────────┘  │  /api/habit-logs/*   │  │
│                    │  /api/personal-notes/*│  │
│  ┌─────────────┐  │  /api/note-histories/*│  │
│  │ Sync Route  │  └──────────────────────┘  │
│  │ /api/sync/* │                            │
│  └─────────────┘  ┌──────────────────────┐  │
│                    │ Auth Middleware       │  │
│                    │ JWT verify + userId   │  │
│                    └──────────────────────┘  │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │            Cloudflare D1              │   │
│  │  (SQLite-compatible database)         │   │
│  │  users, sessions, priorities,         │   │
│  │  routines, notes, note_histories,     │   │
│  │  reflections, logs, habits,           │   │
│  │  habit_logs, personal_notes           │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

---

## ⚠️ Catatan Penting

1. **Data Migration**: Jika ada user yang sudah pakai Supabase, perlu strategi migrasi data ke D1. Bisa manual export-import atau buat one-time migration script.

2. **OAuth**: Setelah hapus Supabase, login hanya via email+password. Kalau mau tambah Google OAuth nanti, harus implement sendiri di Hono backend (pakai Google OAuth2 API → generate JWT sendiri).

3. **Email OTP**: Hilang setelah hapus Supabase. Kalau mau, perlu integrate email service (Resend, SendGrid, dll) di Cloudflare Worker.

4. **Testing**: Tidak ada test infrastructure. Sangat disarankan tambah minimal integration tests untuk auth flow sebelum migrasi.
