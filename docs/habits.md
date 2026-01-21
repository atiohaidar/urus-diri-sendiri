# Sistem Kebiasaan (Habits)

Dokumen ini menjelaskan implementasi teknis dari fitur pelacakan kebiasaan, khususnya yang terdapat pada halaman Detail Kebiasaan (`HabitDetailPage.tsx`).

## Ringkasan Fitur

Fitur ini memungkinkan pengguna untuk melihat statistik mendalam mengenai kebiasaan tertentu. Halaman ini dirancang dengan estetika "jurnal/buku catatan" dan menyajikan data visual berupa kalender heatmap dan kartu statistik.

## Komponen Utama

### `HabitDetailPage`
Komponen utama yang menangani pengambilan data, perhitungan statistik, dan rendering antarmuka pengguna.

#### Pengambilan Data
Data diambil secara asinkron menggunakan fungsi dari modul `storage`:
-   `getHabitById(habitId)`: Mengambil metadata kebiasaan (nama, ikon, target).
-   `getHabitLogsByHabitId(habitId)`: Mengambil seluruh riwayat log untuk kebiasaan tersebut.
-   **Listener**: Komponen mendaftarkan listener penyimpanan (`registerListener`) untuk memperbarui tampilan secara real-time jika ada perubahan data di latar belakang.

#### Perhitungan Statistik
Statistik dihitung menggunakan `useMemo` untuk efisiensi performa, hanya dihitung ulang jika data log atau ID kebiasaan berubah:

1.  **Streak Saat Ini (`currentStreak`)**
    -   Menghitung jumlah hari berturut-turut kebiasaan dilakukan hingga hari ini.
2.  **Streak Terpanjang (`longestStreak`)**
    -   Rekor jumlah hari berturut-turut terpanjang dalam sejarah log.
3.  **Statistik Mingguan & Bulanan**
    -   Menggunakan `calculateCompletionRate` untuk mendapatkan persentase penyelesaian dalam rentang waktu 7 hari dan 30 hari terakhir.
4.  **Progres Target**
    -   Jika kebiasaan memiliki target numerik (`habit.targetCount`), sistem menghitung total penyelesaian kumulatif dibandingkan dengan target tersebut.

## Visualisasi Data

### Kalender Heatmap
Kalender interaktif yang menampilkan status penyelesaian per hari dalam satu bulan.
-   **Navigasi**: Pengguna dapat berpindah antar bulan.
-   **Indikator Visual**:
    -   **Hijau**: Selesai (Completed).
    -   **Garis Putus-putus**: Tidak ada aktivitas (Missed).
    -   **Cincin Fokus**: Menandakan hari ini.
-   **Implementasi**: Menggunakan `date-fns` untuk menghasilkan array tanggal dalam bulan yang aktif (`eachDayOfInterval`), kemudian memetakan setiap tanggal ke status penyelesaiannya.

### Kartu Statistik (Sticky Notes)
Data statistik ditampilkan dalam elemen UI yang menyerupai kertas catatan tempel (sticky notes) dengan rotasi acak sedikit untuk kesan natural.
-   **Api (Flame)**: Merepresentasikan Streak Saat Ini.
-   **Grafik (TrendingUp)**: Merepresentasikan Streak Terpanjang.
-   **Target/Kalender**: Menampilkan persentase keberhasilan mingguan atau progres menuju target total.

## Struktur Log

Setiap log kebiasaan (`HabitLog`) yang ditampilkan di daftar Riwayat Aktivitas memiliki atribut:
-   `date`: Tanggal log.
-   `completedAt`: Timestamp spesifik waktu penyelesaian.
-   `note`: Catatan opsional yang ditambahkan pengguna.
-   **Badge Terbaru**: Log paling atas (terbaru) diberi penanda visual khusus.

## Dependensi Teknis
-   `date-fns`: Manipulasi dan format tanggal.
-   `recharts`: (Opsional/Dependensi tidak langsung) Digunakan untuk grafik visual jika ada.
-   `lucide-react`: Ikon antarmuka.
