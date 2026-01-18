import { useEffect } from "react";
import { App as CapacitorApp } from "@capacitor/app"; // Library Capacitor buat akses fitur asli HP
import { useNavigate, useLocation } from "react-router-dom"; // Untuk urusan navigasi halaman

/**
 * APA GUNANYA HOOK INI?
 * Hook ini khusus buat HP (terutama Android) yang punya tombol "Back" fisik atau gesture navigasi.
 * Tanpa kode ini, kalau user tekan tombol Back, aplikasi bisa langsung tertutup atau navigasinya kacau.
 * 
 * KONSEP/STRATEGI:
 * 1. Kalau ada Modal (Pop-up) kebuka -> Tutup pop-up nya dulu, jangan pindah halaman.
 * 2. Kalau di Halaman Utama (Home) -> Keluar aplikasi.
 * 3. Kalau di Halaman Menu lain -> Balik ke Home.
 * 4. Kalau di Halaman Detail -> Balik ke halaman sebelumnya (History).
 */

export const useBackButton = () => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        let backButtonListener: any;

        const setupListener = async () => {
            // Pasang pendengar (listener) buat tombol Back di HP
            /**
             * TRIGGER NYA DI SINI:
             * 'CapacitorApp.addListener("backButton", ...)' adalah jembatan yang nungguin 
             * sinyal dari HP. Pas kamu pencet tombol back fisik, HP ngasih tau Capacitor, 
             * lalu Capacitor manggil fungsi ini.
             */
            backButtonListener = await CapacitorApp.addListener("backButton", ({ canGoBack }) => {

                // --- PRIORITAS 1: Tutup Modal/Pop-up ---
                // Cara kerjanya: Kode ini 'ngintip' ke layar, ada nggak kotak modal yang lagi 'open'
                const openModal = document.querySelector('[data-state="open"][role="dialog"], [data-state="open"][role="alertdialog"]');

                if (openModal) {
                    /**
                     * KALAU LAGI BUKA MODAL:
                     * Kita 'nipu' sistem dengan ngirim sinyal tombol 'Escape' (Esc).
                     * Karena library UI (Shadcn) sudah disetting otomatis nutup kalau Esc dipencet.
                     */
                    // Paksa tekan tombol 'Escape' secara virtual buat nutup modal
                    const escapeEvent = new KeyboardEvent('keydown', {
                        key: 'Escape',
                        code: 'Escape',
                        keyCode: 27,
                        bubbles: true,
                        cancelable: true
                    });
                    openModal.dispatchEvent(escapeEvent);
                    return; // Stop, jangan lanjut ke ganti halaman
                }

                // --- PRIORITAS 2: Logika Navigasi Halaman ---
                // Kita tentukan sendiri daftar halaman yang dianggap "Menu Utama"
                const mainRoutes = ['/ideas', '/history', '/settings', '/about', '/habits'];

                if (location.pathname === '/' || location.pathname === '') {
                    // KONDISI A: Kalau sudah di halaman Home (paling depan)
                    // Maka instruksinya adalah: KELUAR dari aplikasi.
                    CapacitorApp.exitApp();
                } else if (mainRoutes.includes(location.pathname)) {
                    // KONDISI B: Kalau lagi di menu utama (misal Settings atau Habits)
                    // Instruksinya: Paksa balik ke halaman HOME ('/').
                    navigate('/');
                } else {
                    // KONDISI C: Halaman lainnya (misal lagi edit catatan)
                    /**
                     * TAU DARI MANA -1 ITU?
                     * Browser (dan React Router) punya yang namanya "History Stack" (Tumpukan Sejarah).
                     * Bayangkan seperti tumpukan piring:
                     * [ Piring 3: Halaman Edit ] <-- Kamu di sini sekarang
                     * [ Piring 2: Halaman Daftar Catatan ]
                     * [ Piring 1: Halaman Home ]
                     * 
                     * 'navigate(-1)' artinya: "Buang piring paling atas, dan liat piring tepat di bawahnya".
                     * Angka -1 berarti mundur 1 tumpukan. 
                     * Kalau -2, berarti lompat mundur 2 tumpukan sekaligus.
                     */
                    navigate(-1);
                }
            });
        };

        setupListener();

        // Bersihkan listener pas aplikasi ditutup biar nggak membebani memori
        return () => {
            if (backButtonListener) {
                backButtonListener.remove();
            }
        };
    }, [navigate, location]);
};
