# Pengaturan Aplikasi (Settings)

Dokumen ini menjelaskan implementasi halaman Pengaturan (`SettingsScreen.tsx`), yang berfungsi sebagai pusat konfigurasi aplikasi.

## Arsitektur Modular

Halaman pengaturan dibangun menggunakan pola **Komposisi Komponen**. Alih-alih satu file monolitik, setiap bagian pengaturan dipecah menjadi komponen terpisah yang diimpor ke dalam layout utama.

### Struktur Komponen
File utama: `src/components/screens/SettingsScreen.tsx`

Halaman ini merender komponen-komponen berikut secara berurutan:

1.  **`AuthSection`**:
    -   Menangani tampilan profil pengguna (jika login).
    -   Navigasi ke halaman Login/Register.
    
2.  **`PersonalNotesSection`**:
    -   Pengaturan keamanan untuk fitur Catatan Pribadi.
    -   Manajemen kata sandi/kunci enkripsi lokal.

3.  **`PreferencesSection`**:
    -   **Bahasa**: Switcher `LanguageProvider` (ID/EN).
    -   **Tema**: Switcher `ThemeProvider` (Light/Dark/System).

4.  **`CalendarSection`**:
    -   *Khusus Native (Android)*.
    -   Integrasi dengan kalender perangkat untuk sinkronisasi jadwal.
    
5.  **`CloudLegacySection`**:
    -   Fitur sinkronisasi data lama (opsional/legacy) menggunakan Google Sheets.

6.  **`DataBackupSection`**:
    -   **Backup**: Mengekspor seluruh data LocalStorage & IndexedDB ke file JSON.
    -   **Restore**: Membaca file JSON backup dan menimpa database lokal.
    -   Sangat krusial karena aplikasi bersifat *Local-First*.

## Footer & Informasi
-   Menampilkan versi aplikasi (diambil dari `package.json`).
-   Navigasi ke halaman **Tentang** (`AboutPage`).
-   Kredit pengembang ("Made with Vibe Coding").

## Desain Visual
Mengikuti tema "Jurnal":
-   Header dengan efek kertas robek/garis putus-putus.
-   Ikon kategori settings dibungkus dalam kotak gaya stiker (`bg-sticky-pink`, `rotate-2`).
-   Animasi transisi halus saat navigasi.
