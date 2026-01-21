# Catatan Pribadi (Personal Notes)

Dokumen ini menjelaskan implementasi teknis dari fitur Catatan Pribadi (`PersonalNotesPage.tsx`), yang menyediakan ruang penyimpanan aman untuk informasi sensitif pengguna.

## Ringkasan Fitur

Fitur ini berfungsi sebagai brankas digital sederhana. Pengguna harus mengatur kata sandi sebelum dapat menggunakan fitur ini. Setelah terbuka, pengguna dapat menyimpan pasangan data Label-Nilai (Key-Value), menyalinnya ke clipboard, atau mengelolanya. Jika aplikasi ditutup atau dikunci manual, data kembali terlindungi.

## Implementasi Teknis

### Manajemen Keamanan & State

Logika inti dikelola oleh custom hook `usePersonalNotes`.
-   **Enkripsi**: Data sensitif tidak disimpan dalam teks biasa (plain text). Implementasi keamanan bergantung pada mekanisme penyimpanan yang digunakan provider `usePersonalNotes` (misal: hashing password sederhana atau enkripsi lokal).
-   **Sesi**: Status "Terbuka" (`isUnlocked`) hanya bertahan di memori (session state). Jika halaman di-refresh atau aplikasi dimatikan, status kembali ke "Terkunci".

### Alur Pengguna (User Flow)

1.  **Pengaturan Awal (Setup)**
    -   Jika belum ada password (`!isSetup`), pengguna diminta membuat password baru.
    -   Peringatan ditampilkan bahwa tidak ada mekanisme "Lupa Password" (karena data bersifat lokal/pribadi).

2.  **Autentikasi (Unlock)**
    -   Pengguna memasukkan password untuk membuka akses.
    -   Validasi dilakukan terhadap password yang tersimpan.

3.  **Manajemen Entri**
    -   **CRUD**: Pengguna dapat Membuat (Add), Membaca (List), Memperbarui (Update), dan Menghapus (Delete) entri catatan.
    -   **Copy-to-Clipboard**: Fitur praktis untuk menyalin nilai catatan (misal: nomor rekening, PIN) langsung ke clipboard perangkat.

4.  **Zona Bahaya (Danger Zone)**
    -   Fitur "Hapus Semua" (`resetAll`) disediakan untuk menghapus seluruh data dan password jika pengguna ingin mereset fitur ini sepenuhnya.

## Komponen UI

-   **Dialog Modal**: Sebagian besar interaksi (Setup, Entri Baru, Konfirmasi Hapus) dilakukan melalui komponen `AlertDialog` atau Dialog kustom (`PersonalNoteEntryDialog`) untuk menjaga fokus pengguna.
-   **Tabel Responsif**: Daftar catatan ditampilkan dalam tabel yang dapat digulir secara horizontal (`overflow-x-auto`) untuk mengakomodasi layar ponsel yang sempit tanpa merusak tata letak.
-   **Indikator Visual**: Ikon Gembok (Lock/LockOpen) memberikan status visual instan mengenai keamanan data saat ini.

## Dependensi
-   `sonner`: Untuk notifikasi hasil operasi (sukses/gagal).
-   `lucide-react`: Ikonografi (Gembok, Kunci, Edit, Hapus).
