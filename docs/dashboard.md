# Dasbor Utama (Dashboard)

Dokumen ini menjelaskan implementasi halaman utama (`HomeScreen.tsx`), yang berfungsi sebagai pusat kendali (Mission Control) bagi pengguna.

## Ringkasan Fitur

Dasbor dirancang untuk memberikan ringkasan instan tentang hari pengguna, meliputi rutinitas saat ini, kebiasaan yang perlu dilakukan, dan manajemen prioritas utama.

## Implementasi Tata Letak (Responsive Layout)

Halaman ini menggunakan pendekatan *Mobile-First* dengan penyesuaian untuk layar besar (Desktop):
-   **Mobile**: Tata letak satu kolom vertikal (`space-y-8`).
-   **Desktop**: Tata letak Grid dua kolom (`md:grid-cols-2`). Kolom kiri fokus pada Rutinitas & Kebiasaan, kolom kanan fokus pada Prioritas & Check-In.

## Komponen Utama

### 1. Header (`HomeHeader`)
Menampilkan informasi waktu kontekstual:
-   **Sapaan**: Berubah sesuai waktu (Pagi/Siang/Sore/Malam).
-   **Tanggal**: Format lengkap lokal (Indonesia).
-   **Motivasi**: Menampilkan kutipan atau status singkat.

### 2. Seksi Kebiasaan (Habits Section)
Menampilkan kebiasaan yang dijadwalkan untuk *hari ini* saja.
-   **Tampilan Mobile**: *Horizontal Scroll* (`overflow-x-auto`) untuk menghemat ruang vertikal.
-   **Tampilan Desktop**: Grid responsif.
-   **Interaksi**: Kartu `HabitCard` memungkinkan check-in cepat. Jika belum selesai, modal `HabitCompletionModal` akan muncul untuk mencatat detail penyelesaian.

### 3. Timeline Rutinitas (`HomeRoutineSection`)
Menvisualisasikan jadwal harian pengguna.
-   **Logika**: Memfilter rutinitas berdasarkan jadwal waktu.
-   **Indikator Aktif**: Menyoroti rutinitas yang sedang berlangsung berdasarkan jam sistem saat ini.
-   **Aksi**: Tombol _Check-In_ langsung pada item rutinitas.

### 4. Manajemen Prioritas (`HomePrioritySection`)
Daftar tugas "Top 3" atau prioritas utama hari ini.
-   **CRUD**: Pengguna bisa menambah, mengedit teks/jadwal, menghapus, dan menandai selesai langsung dari widget ini.
-   **Pemisahan View**: Pada desktop, komponen ini dipindah ke kolom kanan untuk keseimbangan visual.

### 5. Widget Tambahan
-   **CheckInButton**: Tombol akses cepat ke halaman Check-In (Maghrib/Refleksi).
-   **GoogleSearchWidget**: (Desktop Only) Widget pencarian cepat untuk produktivitas.

## Manajemen Data
Menggunakan custom hooks terpusat untuk memisahkan logika dari tampilan:
-   `useRoutines()`: Menyediakan data rutinitas, prioritas, dan logika waktu.
-   `useHabits()`: Menyediakan data kebiasaan yang difilter khusus untuk hari ini.
