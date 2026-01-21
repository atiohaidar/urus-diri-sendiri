# Arsitektur Aplikasi

Dokumen ini menjelaskan struktur tingkat tinggi dari aplikasi Urus Diri Sendiri, sebagaimana diimplementasikan dalam `App.tsx` dan konfigurasi pendukungnya.

## Ringkasan

Aplikasi ini dirancang sebagai Single Page Application (SPA) berbasis React yang dibungkus dengan Capacitor untuk penggunaan mobile. Aplikasi menggunakan pendekatan berlapis (layered approach) untuk manajemen state dan penyedia layanan global (providers).

## Lapisan Provider (Context Providers)

Aplikasi dibungkus oleh beberapa provider yang menangani aspek spesifik dari aplikasi. Urutan pembungkusan dari terluar ke terdalam adalah:

1.  **QueryClientProvider**
    -   **Fungsi**: Mengelola data server-state dan caching menggunakan React Query.
    -   **Tujuan**: Memastikan data selalu sinkron, mengurangi permintaan jaringan yang berlebihan, dan menyediakan status loading/error yang konsisten.

2.  **ThemeProvider**
    -   **Fungsi**: Mengelola tema tampilan (terang/gelap).
    -   **Penyimpanan**: Preferensi tema disimpan di local storage dengan kunci `urus-diri-theme`.

3.  **AppInit (Custom Hook)**
    -   **Fungsi**: Menangani inisialisasi awal aplikasi sebelum merender antarmuka utama.
    -   **Tugas**: Mempersiapkan Capacitor, memastikan database lokal siap, dan memeriksa status autentikasi. Tampilan loading ditampilkan selama proses ini.

4.  **LanguageProvider**
    -   **Fungsi**: Menyediakan konteks internasionalisasi (i18n).
    -   **Tujuan**: Memungkinkan aplikasi mendukung berbagai bahasa (Indonesia/Inggris) secara dinamis.

5.  **ErrorBoundary**
    -   **Fungsi**: Menangkap kesalahan runtime pada komponen React di bawahnya.
    -   **Tujuan**: Mencegah aplikasi menjadi layar putih kosong (crash) saat terjadi error, dan menampilkan antarmuka fallback yang ramah pengguna.

6.  **TooltipProvider**
    -   **Fungsi**: Menyediakan konteks untuk komponen tooltip dari pustaka UI.

7.  **BrowserRouter**
    -   **Fungsi**: Mengelola routing dan navigasi halaman.

## Manajemen Navigasi dan Routing

Aplikasi menggunakan `react-router-dom` untuk navigasi. Rute dikelompokkan menjadi dua kategori utama:

### 1. Rute dengan Layout Utama (`AppLayout`)
Halaman-halaman ini menampilkan bilah navigasi bawah (bottom navigation bar) untuk akses cepat ke fitur utama:
-   `/`: Halaman Beranda (`HomeScreen`)
-   `/habits`: Daftar Kebiasaan (`HabitsScreen`)
-   `/ideas`: Halaman Ide/Parking Lot (`ParkingLotScreen`)
-   `/history`: Riwayat Aktivitas (`HistoryScreen`)

### 2. Rute Mandiri
Halaman ini tidak menampilkan navigasi bawah dan biasanya digunakan untuk fitur spesifik yang membutuhkan ruang layar penuh atau fokus pengguna:
-   `/settings`: Pengaturan Aplikasi
-   `/log-creator`: Pembuatan Log Baru (dengan Kamera/Timer)
-   `/note-editor/:id`: Editor Catatan
-   `/maghrib-checkin`: Halaman Refleksi Harian
-   `/habit/:habitId`: Detail Kebiasaan
-   `/personal-notes`: Catatan Pribadi

## Optimasi Performa

### Lazy Loading
Halaman-halaman dimuat secara *lazy* (tertunda) menggunakan `React.lazy` dan `Suspense`. Ini berarti kode JavaScript untuk halaman tertentu hanya akan diunduh ketika pengguna mengakses halaman tersebut untuk pertama kalinya, mengurangi ukuran bundle awal dan mempercepat waktu muat aplikasi.

### Back Button Handler
Aplikasi mengimplementasikan penanganan tombol "Kembali" perangkat keras (hard back button) khusus untuk perangkat Android melalui hook `useBackButton`. Ini memastikan navigasi terasa natural seperti aplikasi native.

## Komponen Global Lainnya

-   **Toaster & Sonner**: Komponen untuk menampilkan notifikasi sementara (toast) kepada pengguna.
-   **AppNotificationListener**: Komponen tanpa antarmuka yang mendengarkan event notifikasi global, digunakan untuk menangani interaksi notifikasi seperti balasan cepat.
