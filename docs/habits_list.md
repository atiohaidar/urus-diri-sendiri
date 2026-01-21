# Daftar Kebiasaan (Habits List)

Dokumen ini menjelaskan implementasi halaman Daftar Kebiasaan (`HabitsScreen.tsx`), yang digunakan untuk manajemen dan pelacakan seluruh kebiasaan pengguna secara detail.

## Struktur & Filter Data

Berbeda dengan Dashboard yang hanya menampilkan kebiasaan hari ini, halaman ini menampilkan **seluruh** kebiasaan yang terdaftar, namun dikelompokkan:

### 1. Kebiasaan Hari Ini (`todayHabits`)
Kebiasaan yang jadwalnya cocok dengan hari ini. Ditampilkan paling atas dengan prioritas visual lebih tinggi.

### 2. Kebiasaan Lainnya (`otherHabits`)
Kebiasaan yang tidak dijadwalkan untuk hari ini (misal: kebiasaan mingguan yang jatuh di hari lain).

## Sistem Penilaian (Grading System)

Halaman ini memiliki fitur unik **Gamifikasi Sederhana** berupa nilai huruf (Grade) untuk performa hari ini:
-   **Logika**: `(Jumlah Selesai Hari Ini / Total Target Hari Ini) * 100`
-   **Peringkat**:
    -   **A+**: 100% (Sempurna)
    -   **A**: ≥ 80%
    -   **B**: ≥ 60%
    -   **C**: ≥ 40%
    -   **📝**: < 40% (Belum cukup data/awal hari)
-   **Visualisasi**: Ditampilkan dalam "lingkaran nilai" di header.

## Interaksi & CRUD
Halaman ini adalah pusat manajemen (sumber kebenaran) untuk entitas Habit.
-   **Tambah/Edit**: Menggunakan modal formulir `HabitFormModal` yang di-reusability untuk kedua aksi.
-   **Hapus**: Fungsi `deleteHabit` dipanggil langsung dari kartu kebiasaan.
-   **Pencatatan**: Klik pada kartu memicu `toggleCompletion`. Jika status berubah menjadi "Selesai", modal `HabitCompletionModal` muncul untuk opsional menambah catatan jurnal kecil.

## Komponen UI
-   **Grid Layout**: Responsif 1 kolom (Mobile) hingga 3 kolom (Desktop).
-   **ProgressBar**: (Khusus Mobile) Bar linear sederhana untuk menunjukkan progres harian di bagian atas, menggantikan Grade Circle desktop.
-   **FAB**: Tombol tambah cepat yang melayang di sudut kanan bawah (Mobile only).
