# Sistem Pencatatan Log (Logs)

Dokumen ini menjelaskan implementasi teknis dari fitur pembuatan log aktivitas, sebagaimana diimplementasikan dalam `LogCreatorPage.tsx`.

## Ringkasan Fitur

Sistem ini adalah antarmuka pembuatan konten utama aplikasi, memungkinkan pengguna untuk mencatat aktivitas melalui teks, foto, atau pengatur waktu (timer) fokus. Fitur ini mengintegrasikan fungsi perangkat keras (kamera) dengan logika aplikasi yang kompleks.

## Mode Operasi

Halaman ini mendukung dua mode operasi utama:

1.  **Mode Standar (Log Cepat)**
    -   Pengguna mengambil foto atau memilih dari galeri.
    -   Menambahkan keterangan (caption).
    -   Memilih warna latar belakang ("kertas") untuk estetika.

2.  **Mode Timer (Fokus)**
    -   Pengguna menetapkan durasi waktu fokus.
    -   Sistem menjalankan penghitungan mundur.
    -   Setelah selesai, pengguna mencatat "Realita" (apa yang sebenarnya terjadi) dibandingkan rencana awal.

## Implementasi Teknis

### Integrasi Kamera
Menggunakan `@capacitor/camera` untuk akses perangkat keras native.
-   `useCamera`: Custom hook yang mengelola inisialisasi dan stream kamera.
-   **Kompresi Gambar**: Gambar yang diambil dikompresi menggunakan utilitas `compressImage` (target lebar 1080px, kualitas 0.7) sebelum disimpan untuk menghemat ruang penyimpanan.

### Logika Timer & Notifikasi
Sistem timer dirancang agar tetap akurat meskipun aplikasi berjalan di latar belakang (background).

1.  **Target Waktu Absolut**:
    -   Timer tidak hanya mengandalkan `setInterval`, tetapi menghitung selisih waktu saat ini dengan `timerTargetTime` (waktu selesai yang diharapkan). Ini mencegah *drift* waktu jika thread JavaScript terhenti.

2.  **Notifikasi Latar Belakang**:
    -   Saat timer dimulai, notifikasi terjadwal (`scheduleTimerNotification`) langsung didaftarkan ke sistem operasi. Ini menjamin notifikasi akan muncul tepat waktu meskipun aplikasi ditutup.
    -   **Ongoing Notification**: Jika pengguna meminimalkan aplikasi saat timer berjalan, notifikasi persisten ("Sedang Fokus...") ditampilkan untuk memberikan status terkini.

3.  **Zen Mode**:
    -   Antarmuka kontrol otomatis disembunyikan setelah 3 detik ketidakaktifan mouse/sentuhan saat timer berjalan, memberikan pengalaman bebas gangguan.

### Mekanisme Penyimpanan

Proses penyimpanan (`handleSubmit`) menangani berbagai skenario:
1.  **Penyimpanan Media**: Gambar disimpan ke IndexedDB melalui fungsi `saveImage`, mengembalikan ID unik.
2.  **Format Konten Log**:
    -   Untuk log timer, konten diformat secara otomatis dengan template:
        `⏱️ Fokus [Durasi] ... ✍️: [Realita]`
    -   Sistem mendeteksi jika timer dihentikan lebih awal dan memberi tanda peringatan (⚠️) pada log.
3.  **Persistensi**: Data log akhir disimpan ke penyimpanan lokal/database melalui `saveLog`.

### Penanganan UX & Haptics
-   **Haptic Feedback**: Getaran diberikan pada setiap interaksi penting (tombol ditekan, timer mulai, ambil foto) menggunakan `@capacitor/haptics`.
-   **Pencegahan Data Hilang**:
    -   Menggunakan event `beforeunload` dan mencegat navigasi React Router (`handleBack`) untuk menampilkan dialog konfirmasi jika pengguna mencoba keluar saat ada data yang belum disimpan atau timer sedang berjalan.
    -   Menangani tombol "Kembali" fisik pada perangkat Android.

## Komponen Modular
Halaman ini dipecah menjadi beberapa sub-komponen untuk pemeliharaan kode:
-   `LogCameraView`: Menangani pratinjau kamera.
-   `LogHeader`: Kontrol atas (tombol kembali, pemilihan warna).
-   `StandardLogInput`: Input teks untuk mode standar.
-   `TimerInput` / `TimerRunning` / `TimerFinished`: Tampilan berbagai status timer.
-   `LogActionControls`: Tombol aksi utama di bagian bawah.
