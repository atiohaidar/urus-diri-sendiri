# Dokumentasi Teknis Urus Diri Sendiri

Dokumentasi ini berisi penjelasan teknis mengenai arsitektur, fitur, dan implementasi kode dari proyek Urus Diri Sendiri. Dokumentasi ini ditujukan untuk pengembang yang ingin memahami struktur proyek dan cara kerja fitur-fitur yang ada.

## Daftar Isi

### Arsitektur & Core
1.  [Arsitektur Aplikasi](architecture.md)
    Penjelasan mengenai struktur utama, context providers, dan routing.
2.  [Dasbor Utama (Dashboard)](dashboard.md)
    Implementasi halaman beranda, ringkasan hari ini, dan widget prioritas.

### Fitur Utama
3.  [Sistem Kebiasaan (Habits)](habits_list.md)
    Manajemen daftar kebiasaan, CRUD, dan logika penilaian harian.
    -   [Detail & Statistik Kebiasaan](habits.md) (Penjelasan halaman detail statistik).

4.  [Manajemen Rutinitas (Schedule)](edit_schedule.md)
    Editor jadwal harian, validasi waktu, dan fitur impor massal.

5.  [Sistem Pencatatan Log (Logs)](logs.md)
    Pembuatan log aktivitas, timer fokus, dan integrasi kamera.

6.  [Sistem Ide & Catatan (Notes)](notes.md)
    Fitur "Parking Lot" untuk ide, editor teks kaya (Rich Text), draf otomatis, dan enkripsi catatan.

7.  [Catatan Pribadi (Secure Diary)](personal_notes.md)
    Modul catatan harian terpisah dengan autentikasi sederhana.

### Refleksi & Riwayat
8.  [Check-in Maghrib](maghrib_checkin.md)
    Fitur refleksi harian (Jurnal Syukur/Evaluasi).

9.  [Riwayat & Arsip](history_list.md)
    Daftar gabungan riwayat refleksi dan log aktivitas.
    -   [Detail Refleksi](reflection_detail.md) (Tampilan arsip refleksi masa lalu).

### Konfigurasi
10. [Pengaturan (Settings)](settings.md)
    Manajemen bahasa, tema, backup/restore data, dan akun.

11. [Tentang Aplikasi (About)](about.md)
    Halaman informasi dan kredit.

---

## Stack Teknologi

-   **Framework**: React (Vite)
-   **Bahasa**: TypeScript
-   **UI**: Tailwind CSS, shadcn/ui
-   **Ikon**: Lucide React
-   **Mobile**: Capacitor (Android/iOS)
-   **State**: React Query, React Context
-   **Storage**: IndexedDB (Dexie), LocalStorage
-   **Editor**: React Quill

## Struktur Direktori Utama

-   `/src/components/screens`: Komponen halaman utama (Lazy loaded).
-   `/src/pages`: Halaman-halaman fitur spesifik.
-   `/src/hooks`: Logika bisnis yang dapat digunakan kembali.
-   `/src/lib`: Utilitas, konfigurasi storage, dan helper.
