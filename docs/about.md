# Halaman Tentang (About)

Dokumen ini menjelaskan implementasi halaman Informasi Aplikasi (`AboutPage.tsx`).

## Ringkasan Fitur

Halaman ini memberikan informasi statis mengenai aplikasi, termasuk:
-   Versi aplikasi.
-   Tautan sosial dan kredit pengembang.
-   Informasi tumpukan teknologi (tech stack).
-   Penjelasan alur kerja pengembangan (workflow).

## Implementasi Visual

Halaman ini sangat berat pada penggunaan gaya visual khusus untuk mencerminkan identitas "jurnal/buku catatan" aplikasi.

### Elemen Desain Kustom
1.  **Header Kertas**:
    -   Menggunakan elemen `div` dengan batas putus-putus (`border-dashed`) dan tekstur latar belakang (`bg-paper`) untuk mensimulasikan kertas fisik.
    -   Garis margin vertikal ditambahkan menggunakan CSS absolut positioning.

2.  **Efek Sticky Note & Selotip**:
    -   Menggunakan rotasi CSS (`rotate-2`, `-rotate-3`) pada elemen kontainer untuk memberikan kesan organik seperti tempelan kertas.
    -   Bayangan kustom (`shadow-tape`, `shadow-notebook`) digunakan untuk memberikan kedalaman.

3.  **Tautan Eksternal**:
    -   Semua tautan keluar dikonfigurasi dengan `target="_blank" rel="noopener noreferrer"` untuk keamanan dan UX standar web.

## Data Statis
Informasi seperti daftar teknologi dan tautan sosial disimpan dalam array konstan (`techStack`, `socialLinks`) di dalam komponen untuk kemudahan pemeliharaan dan rendering iteratif menggunakan `map`.

## Integrasi i18n
Meskipun kontennya statis, seluruh teks tetap diambil melalui hook `useLanguage` (`t.about.*`) untuk mendukung fitur multi-bahasa sepenuhnya.
