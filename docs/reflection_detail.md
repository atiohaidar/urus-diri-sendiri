# Detail Refleksi (Reflection Detail)

Dokumen ini menjelaskan implementasi halaman Detail Refleksi (`ReflectionDetailPage.tsx`), yang berfungsi sebagai arsip untuk melihat kembali evaluasi harian masa lalu.

## Ringkasan Fitur

Halaman ini menampilkan data historis dari sesi Check-in Maghrib (Maghrib Check-in) tertentu. Selain menampilkan jawaban reflektif pengguna (kemenangan, hambatan), halaman ini juga merekonstruksi konteks dari hari tersebut dengan menampilkan snapshot rutinitas dan prioritas yang disimpan saat itu.

## Pengambilan Data

Halaman menggunakan parameter URL `id` untuk mengidentifikasi entri refleksi yang akan ditampilkan.
-   **Fetching**: Fungsi asinkron `getReflectionsAsync` digunakan untuk mengambil seluruh daftar refleksi, kemudian difilter berdasarkan ID.
-   **Fallback**: Jika refleksi tidak ditemukan (misal ID salah), tampilan "Tidak Ditemukan" ditampilkan dengan tombol kembali.

## Visualisasi Data

### 1. Data Refleksi Inti
Menampilkan jawaban teks pengguna dalam kartu bergaya catatan:
-   Win of the Day (Kemenangan Hari Ini)
-   Hurdle (Hambatan)
-   Small Change (Perubahan Kecil)

### 2. Galeri Foto Hibrida
Menangani dua sumber gambar:
-   **IndexedDB**: Menggunakan komponen `LazyImage` untuk memuat gambar lokal secara efisien berdasarkan ID.
-   **Cloud/Eksternal**: Menampilkan tautan eksternal jika gambar disimpan di cloud (Google Drive, dll).

### 3. Snapshot Teknis (Historical Context)
Fitur unik dari halaman ini adalah kemampuannya menampilkan "potret waktu" (time capsule) dari hari tersebut.
-   **Log Rutinitas**: Menampilkan daftar rutinitas seperti yang tercatat pada hari itu, lengkap dengan waktu penyelesaian dan catatan penyelesaiannya.
-   **Status Prioritas**: Menampilkan apakah prioritas hari itu tercapai atau tidak.

Data ini diambil dari properti `todayRoutines` dan `todayPriorities` yang tertanam dalam objek refleksi, bukan dari data master saat ini. Ini memastikan integritas sejarah data (data hari lalu tidak berubah meskipun pengguna mengubah jadwal rutin hari ini).

## Komponen UI
-   Menggunakan ikonografi yang konsisten dengan halaman Check-in Maghrib (`Trophy`, `Construction`, `Rocket`) untuk memudahkan pengenalan visual.
-   Gaya visual konsisten dengan tema "Jurnal Kertas" (border putus-putus, font tulisan tangan).
