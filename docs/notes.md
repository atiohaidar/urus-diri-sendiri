# Sistem Catatan (Notes System)

Dokumen ini menjelaskan implementasi teknis dari fitur **Catatan** (Notes), yang mencakup editor, manajemen draf, enkripsi, dan riwayat versi.

## Arsitektur Fitur

Sistem catatan terdiri dari tiga komponen utama:
1.  **Daftar Ide** (`ParkingLotScreen.tsx`): Antarmuka manajemen daftar catatan.
2.  **Editor Catatan** (`NoteEditorPage.tsx`): Inti dari pembuatan dan pengeditan konten.
3.  **Riwayat Catatan** (`NoteHistoryPage.tsx`): Sistem kontrol versi untuk setiap catatan.

---

## 1. Daftar Ide (ParkingLotScreen)

Halaman ini berfungsi sebagai "Inbox" atau tempat parkir ide.

### Fitur & Implementasi
-   **Virtual Scrolling**: Menggunakan library `react-virtuoso` untuk merender daftar catatan dalam jumlah besar tanpa mengorbankan performa UI.
-   **Filter & Pencarian**:
    -   **Kategori**: Filter berdasarkan kategori unik (`getUniqueCategories`) atau item tanpa kategori.
    -   **Pencarian Teks**: Pencarian case-insensitive pada judul dan konten secara *real-time*.
    -   **Keamanan**: Toggle khusus untuk menyembunyikan/menampilkan catatan terenkripsi.
-   **Pengelompokan Waktu**: Catatan dikelompokkan secara visual berdasarkan tanggal pembaruan (misal: "Senin, 20 Januari 2025") untuk memudahkan navigasi kronologis.

---

## 2. Editor Catatan (NoteEditorPage)

Ini adalah komponen paling kompleks dalam modul catatan, menangani input teks, keamanan, dan persistensi data.

### Manajemen State & Draf
-   **Auto-Save Draf**: Menggunakan hook `useDebounce` (delay 1 detik) untuk menyimpan konten sementara ke `localStorage`. Ini mencegah kehilangan data jika browser tertutup tidak sengaja.
-   **Pemulihan Draf**: Saat membuka catatan, sistem membandingkan timestamp versi tersimpan dengan draf lokal. Jika draf lebih baru, dialog pemulihan (`AlertDialog`) muncul, menawarkan opsi untuk memulihkan atau membuang draf, serta melihat perbedaan (Diff).

### Sistem Keamanan (Enkripsi)
Catatan dapat dikunci menggunakan kata sandi.
-   **Algoritma**: Menggunakan enkripsi standar industri (kemungkinan AES-GCM via Web Crypto API, diimplementasikan di `@/lib/encryption`).
-   **Metadata**: Menyimpan `encryptionSalt`, `encryptionIv`, dan `passwordHash` bersama catatan.
-   **Alur Kerja**:
    -   Konten *dekripsi* hanya ada di memori (state React) saat dibuka.
    -   Saat disimpan, konten dienkripsi ulang.
    -   Jika terkunci, konten di database adalah *ciphertext*.

### Deteksi Konflik
Mencegah penimpaan data (race condition) saat sinkronisasi atau edit multi-perangkat (jika ada backend).
-   **Mekanisme**: Membandingkan `updatedAt` dari versi server dengan waktu awal edit di klien.
-   **Resolusi**: Jika konflik terdeteksi, dialog muncul dengan opsi untuk menimpa (_Overwrite_) atau membatalkan.

### Fitur Editor
-   **Rich Text**: Menggunakan editor berbasis Quill (via `LazyEditor` untuk performa muat awal).
-   **Mode Layar Terpisah (Split View)**: Memungkinkan pengguna melihat referensi catatan lain di panel samping.
-   **Auto-Scroll**: Kursor dijaga agar selalu terlihat di viewport saat mengetik panjang.

---

## 3. Riwayat Versi (NoteHistoryPage)

Setiap kali catatan disimpan, versi sebelumnya diarsipkan.

### Implementasi
-   **Penyimpanan**: Menggunakan hook `useNoteHistories` untuk mengambil data dari tabel/store riwayat terpisah.
-   **Visualisasi**:
    -   Menampilkan daftar kronologis perubahan.
    -   **Mode Baca**: Menampilkan konten HTML dari versi lama dalam mode *read-only*.
    -   **Indikator Waktu**: Menggunakan `date-fns` (`formatDistanceToNow`) untuk label waktu relatif (misal: "2 jam yang lalu").
-   **Manajemen Data**: Opsi untuk menghapus seluruh riwayat untuk menghemat ruang penyimpanan.

## Dependensi Utama
-   `react-router-dom`: Navigasi & Parameter URL.
-   `lucide-react`: Ikon antarmuka.
-   `sonner` / `use-toast`: Notifikasi feedback (Toast).
-   `date-fns`: Format tanggal dan waktu lokal (ID).
