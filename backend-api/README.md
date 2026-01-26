# Urus Diri Sendiri API

Backend API menggunakan Hono framework dengan Cloudflare D1 database.

## Setup

### 1. Install Dependencies

```bash
cd backend-api
npm install
```

### 2. Create D1 Database

```bash
# Create D1 database
wrangler d1 create urus-diri-db

# Copy the database_id from the output and update wrangler.toml
```

### 3. Run Migrations

```bash
# For local development
npm run db:migrate:local

# For production
npm run db:migrate
```

### 4. Set JWT Secret

```bash
wrangler secret put JWT_SECRET
# Enter a secure random string when prompted
```

### 5. Development

```bash
npm run dev
```

Server akan berjalan di `http://localhost:8787`

### 6. Deploy

```bash
npm run deploy
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register user baru
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Data (Requires Authentication)

- `GET/PUT /api/priorities` - Priorities CRUD
- `GET/PUT /api/routines` - Routines CRUD
- `GET/PUT /api/notes` - Notes CRUD
- `GET/PUT /api/note-histories` - Note histories CRUD
- `GET/PUT /api/reflections` - Reflections CRUD
- `GET/PUT /api/logs` - Activity logs CRUD
- `GET/PUT /api/habits` - Habits CRUD
- `GET/PUT /api/habit-logs` - Habit logs CRUD
- `GET/PUT /api/personal-notes` - Personal notes CRUD

## Incremental Sync

Semua endpoint GET mendukung query parameter `?since=<ISO timestamp>` untuk mendapatkan data yang diupdate sejak waktu tertentu.

## Environment Variables

- `JWT_SECRET` - Secret key untuk JWT tokens (set via `wrangler secret put`)
- `ENVIRONMENT` - "development" atau "production"
