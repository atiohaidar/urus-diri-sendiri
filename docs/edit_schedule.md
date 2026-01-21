# Editor Jadwal (Edit Schedule)

Dokumen ini menjelaskan implementasi teknis dari halaman Editor Jadwal (`EditSchedule.tsx`), yang digunakan untuk mengelola rutinitas harian pengguna.

## Ringkasan Fitur

Fitur ini memungkinkan pengguna untuk membuat, membaca, memperbarui, dan menghapus (CRUD) item rutinitas harian. Halaman ini juga dilengkapi dengan validasi logika waktu (misal: tumpang tindih jadwal) dan fitur penambahan massal (bulk add).

## Logika & Validasi

### Manajemen State
State utama dikelola oleh komponen:
-   `items`: Array dari `RoutineItem` yang berisi daftar jadwal saat ini.
-   `editForm`: State sementara untuk form pengeditan (waktu mulai/selesai, aktivitas, kategori).

### Validasi Waktu
Sistem mencegah entri jadwal yang tidak logis:
1.  **Validasi Urutan Waktu**:
    -   Memastikan Waktu Selesai > Waktu Mulai.
2.  **Deteksi Tumpang Tindih (Overlap)**:
    -   Menggunakan fungsi `checkOverlap` dari modul penyimpanan `@/lib/storage`.
    -   Mendeteksi jika rentang waktu jadwal baru bertabrakan dengan jadwal yang sudah ada.
    -   **Visualisasi**: Jika terdeteksi tumpang tindih, kartu jadwal ditandai dengan warna peringatan (kuning/merah) di UI.

### Pengurutan Otomatis
Setiap kali jadwal disimpan atau ada perubahan, daftar secara otomatis diurutkan berdasarkan waktu mulai (`startTime`) agar kronologis.
-   Fungsi `parseTimeToMinutes` digunakan untuk mengubah format string jam ("09:30") menjadi integer menit agar mudah dibandingkan.

## Fitur Impor Massal (Bulk Add)
Fitur lanjutan untuk pengguna yang ingin menyalin template jadwal.
-   Menggunakan komponen `BulkAddDialog`.
-   Menerima input teks multi-baris yang diparsing menjadi objek jadwal.
-   Menggabungkan item baru dengan item lama, melakukan validasi, lalu menyimpan dan mengurutkan ulang.

## Komponen Pendukung
Untuk menjaga kode tetap bersih, beberapa bagian UI dipisahkan:
-   `ScheduleCard`: Menampilkan item jadwal dalam mode baca (read-only) dengan tombol aksi.
-   `ScheduleForm`: Formulir inline untuk mengedit item.
-   `TimePicker`: Input khusus untuk memilih jam dan menit dengan mudah.

## Interaksi Data
Seluruh data dipersistenkan ke LocalStorage melalui wrapper `saveRoutines` dan `deleteRoutine`. Saat halaman dimuat, data diambil sekali menggunakan `getRoutines`.
