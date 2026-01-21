# Check-in Maghrib (Refleksi Harian)

Dokumen ini menjelaskan implementasi teknis dari fitur Check-in Maghrib (`MaghribCheckinPage.tsx`), sebuah alur kerja harian untuk evaluasi diri dan perencanaan.

## Ringkasan Fitur

Fitur ini dirancang untuk dijalankan sekali sehari (biasanya saat Maghrib). Halaman ini memandu pengguna melalui serangkaian pertanyaan reflektif:
1.  **Kemenangan Hari Ini (Win of Day)**: Apa yang berhasil dicapai?
2.  **Hambatan (Hurdle)**: Apa yang menghalangi produktivitas?
3.  **Evaluasi Prioritas**: Apakah prioritas hari ini tercapai?
4.  **Perubahan Kecil (Small Change)**: Apa satu hal kecil yang akan diperbaiki besok?
5.  **Dokumentasi Visual**: Unggah foto hari ini.

## Mekanisme Penyimpanan (`handleSave`)

Proses penyimpanan data cukup kompleks karena melibatkan snapshot data dari modul lain dan penanganan file media.

### Snapshot Data
Saat menyimpan refleksi, sistem juga mengambil "snapshot" (potret) kondisi data lain pada saat itu:
-   `getRoutines()`: Menyimpan status rutin hari ini.
-   `getPriorities()`: Menyimpan daftar prioritas hari ini.
Tujuannya adalah agar saat pengguna melihat kembali "Riwayat" di masa depan, mereka melihat konteks data seperti pada hari tersebut, bukan data yang telah berubah di kemudian hari.

### Penanganan Gambar (Hibrida)

Sistem mendukung dua jenis penyimpanan gambar:
1.  **Lokal (IndexedDB)**:
    -   Gambar yang baru diunggah dari perangkat disimpan ke IndexedDB menggunakan `saveImage` dan menghasilkan ID unik.
    -   ID ini disimpan di dalam array `imageIds` pada objek refleksi.
2.  **Cloud (URL)**:
    -   Jika gambar sudah berupa URL (misal: hasil sinkronisasi dari server atau gambar lama), URL tersebut disimpan langsung di array `images`.

### Pembersihan Data (Cleanup)
-   Sebelum menyimpan gambar baru untuk hari yang sama (update), sistem menghapus gambar lama yang terkait di IndexedDB (`deleteImage`) untuk mencegah penumpukan sampah file (storage leak).

### Struktur Data Refleksi
Objek refleksi disimpan dengan format:
```typescript
interface Reflection {
    date: string;          // ISO String
    winOfDay: string;
    hurdle: string;
    priorities: string[];  // Prioritas yang dievaluasi
    smallChange: string;
    todayRoutines: any;    // Snapshot rutinitas
    todayPriorities: any;  // Snapshot prioritas
    images: string[];      // URL gambar eksternal
    imageIds: string[];    // ID gambar lokal (IndexedDB)
}
```

## Pemuatan Data (`useEffect`)

Saat halaman dimuat, sistem memeriksa apakah sudah ada refleksi untuk hari ini (`new Date().toDateString()`).
-   Jika ada, formulir diisi otomatis (pre-fill) dengan data tersebut, memungkinkan pengguna untuk mengedit refleksi yang sudah dibuat sebelumnya.
-   Gambar dimuat secara hibrida: mengambil dari URL cloud dan meresolusi ID IndexedDB menjadi objek blob/base64 untuk ditampilkan.

## UI/UX
-   **Desain Jurnal**: Menggunakan tipografi tulisan tangan dan elemen visual seperti "solatip" (sticky tape) untuk memberikan nuansa personal.
-   **Modular**: Bagian-bagian formulir dipisahkan menjadi komponen kecil (`WinHurdleSection`, `PrioritiesSection`, dll) untuk keterbacaan kode.
