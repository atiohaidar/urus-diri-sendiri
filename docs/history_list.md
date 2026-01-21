# Daftar Riwayat (History List)

Dokumen ini menjelaskan implementasi halaman Daftar Riwayat (`HistoryScreen.tsx`), yang berfungsi sebagai arsip sentral aktivitas pengguna.

## Struktur Halaman

Halaman ini menggunakan pola **Tab View** untuk memisahkan dua jenis data historis yang berbeda secara konseptual:
1.  **Refleksi (Reflections)**: Entri jurnal mendalam (evaluasi harian/Maghrib).
2.  **Log Aktivitas (Activity Logs)**: Catatan atomik kejadian (misal: "Minum air", "Fokus 20 menit").

## Manajemen State
-   **`activeTab`**: Menentukan tab yang aktif ('reflections' atau 'logs').
-   **Persistensi Tab**: Mengambil nilai awal dari `location.state`. Ini memungkinkan halaman lain (misal: setelah membuat Log baru) untuk me-redirect pengguna langsung ke tab 'logs' bukan default 'reflections'.

## 1. Tab Refleksi
Menggunakan komponen `ReflectionsList`.
-   **Fetching**: Data diambil via `getReflectionsAsync`.
-   **Paginasi**: Menggunakan strategi *Load More* manual. State `visibleCount` mengatur jumlah item yang di-render (default: 10).
-   **Tampilan Kosong**: Menampilkan ilustrasi khusus jika belum ada data.

## 2. Tab Log Aktivitas
Menggunakan komponen `LogsList`.
-   **Fetching**: Data diambil via `getLogsAsync`.
-   **Real-time Update**: Menggunakan `registerListener` dari modul storage untuk mendengarkan perubahan data (CRUD) dan memperbarui tampilan tanpa reload halaman secara manual.
-   **Penghapusan**: Mendukung fitur hapus log dengan dialog konfirmasi (`AlertDialog`) untuk mencegah ketidaksengajaan.

## Navigasi
-   **Floating Action Button (FAB)**:
    -   Di tab Refleksi: Tombol pintas menuju halaman `MaghribCheckinPage`.
    -   Di tab Log: (Disembunyikan atau berbeda, sesuai logika kondisional).

## Estetika
Halaman konsisten dengan tema "Buku Catatan":
-   Tab digayakan seperti pembatas buku/sticky notes.
-   Latar belakang dan border menggunakan gaya garis putus-putus (`dashed`).
