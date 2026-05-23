# UrusDiriSendiri

Aplikasi manajemen diri sederhana untuk membantu Anda tetap fokus pada rutinitas dan prioritas harian.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS + shadcn/ui
- **Backend**: Hono (Cloudflare Workers) + D1 Database
- **Mobile**: Capacitor 8 (Android)
- **Auth**: Custom JWT (HMAC SHA-256) + PBKDF2 password hashing

## Setup

### Frontend

```bash
npm install
npm run dev
```

### Backend

```bash
cd backend-api
npm install
npm run dev   # wrangler dev
```

### Environment Variables

Copy `.env.example` to `.env`:

```bash
VITE_API_URL=http://localhost:8787
```

## Architecture

- **Storage**: Cloud-first — `CloudflareD1Provider` (Hono RPC)
- **Online-only**: Semua data disimpan langsung ke cloud, mewajibkan masuk (login) dan koneksi internet aktif untuk mencegah konflik sinkronisasi.
- **Auth flow**: `verifySession()` → `initializeStorage()` → `onCloudflareAuthChange` → `handleAuthStateChange` → sync
