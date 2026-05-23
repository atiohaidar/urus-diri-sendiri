#!/usr/bin/env bash
set -euo pipefail

# ============================================
# Script untuk menjalankan Frontend + Backend
# Jalankan: bash jalankan-dev.sh
# ============================================

# Warna untuk output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

printf "${GREEN}========================================${NC}\n"
printf "${GREEN}  Urus Diri Sendiri - Dev Server${NC}\n"
printf "${GREEN}========================================${NC}\n"
printf "\n"

# Dapatkan direktori script ini
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ---- Naikkan inotify limit (agar Vite tidak ENOSPC) ----
CURRENT_WATCHES=$(cat /proc/sys/fs/inotify/max_user_watches 2>/dev/null || echo "0")
if [ "$CURRENT_WATCHES" -lt 524288 ]; then
    printf "${YELLOW}[System]   inotify watches rendah (%s), menaikkan ke 524288...${NC}\n" "$CURRENT_WATCHES"
    sudo sysctl -q fs.inotify.max_user_watches=524288 2>/dev/null || \
        printf "${RED}[System]   Gagal set inotify. Jalankan manual: sudo sysctl fs.inotify.max_user_watches=524288${NC}\n"
fi

# ---- Kill port yang mungkin masih dipakai ----
kill_port() {
    local port=$1
    local pids
    pids=$(lsof -t -i:"$port" 2>/dev/null || true)
    if [ -n "$pids" ]; then
        printf "${YELLOW}[System]   Port %s masih dipakai (PID: %s), mematikan...${NC}\n" "$port" "$pids"
        kill $pids 2>/dev/null || true
        sleep 0.5
    fi
}

kill_port 8787
kill_port 8080

# Fungsi untuk cleanup saat script dihentikan (Ctrl+C)
cleanup() {
    printf "\n"
    printf "${YELLOW}Menghentikan semua proses...${NC}\n"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    wait $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    printf "${GREEN}Semua proses sudah dihentikan.${NC}\n"
    exit 0
}

trap cleanup SIGINT SIGTERM

# ---- Cek dependencies ----
if [ ! -d "node_modules" ]; then
    printf "${YELLOW}[Frontend] node_modules belum ada, menjalankan npm install...${NC}\n"
    npm install
fi

if [ ! -d "backend-api/node_modules" ]; then
    printf "${YELLOW}[Backend]  node_modules belum ada, menjalankan npm install...${NC}\n"
    (cd backend-api && npm install)
fi

# ---- Jalankan Backend (Hono + Wrangler) ----
printf "${BLUE}[Backend]  Memulai backend API (Hono/Wrangler) di port 8787...${NC}\n"
(cd backend-api && npm run dev) 2>&1 | sed "s/^/[Backend]  /" &
BACKEND_PID=$!

# Tunggu sebentar biar backend mulai duluan
sleep 2

# ---- Jalankan Frontend (Vite) ----
printf "${BLUE}[Frontend] Memulai frontend (Vite) di port 8080...${NC}\n"
npm run dev 2>&1 | sed "s/^/[Frontend] /" &
FRONTEND_PID=$!

printf "\n"
printf "${GREEN}========================================${NC}\n"
printf "${GREEN}  Kedua server sudah berjalan!${NC}\n"
printf "${GREEN}  Frontend: http://localhost:8080${NC}\n"
printf "${GREEN}  Backend:  http://localhost:8787${NC}\n"
printf "${GREEN}  Tekan Ctrl+C untuk menghentikan${NC}\n"
printf "${GREEN}========================================${NC}\n"
printf "\n"

# Tunggu sampai salah satu proses selesai atau di-kill
wait $BACKEND_PID $FRONTEND_PID
