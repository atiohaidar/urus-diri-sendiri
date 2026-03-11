import { useState, useEffect } from "react";
import { App as CapacitorApp } from '@capacitor/app'; // Plugin untuk akses fitur asli HP
import { initializeStorage } from "@/lib/storage"; // Fungsi buat siapin database lokal
import { QueryClient } from "@tanstack/react-query";

/**
 * Hook khusus untuk menangani persiapan aplikasi saat pertama kali dibuka.
 * @param queryClient Manajer data React Query
 */
export const useAppInit = (queryClient: QueryClient) => {
    // Status apakah aplikasi sudah siap digunakan
    const [isReady, setIsReady] = useState(false);

    // Fungsi untuk memaksa masuk jika macet
    const forceEntry = () => {
        console.warn("AppInit: Force entry triggered by user.");
        setIsReady(true);
        hideSplashScreen();
    };

    const hideSplashScreen = async () => {
        try {
            const { SplashScreen } = await import('@capacitor/splash-screen');
            await SplashScreen.hide();
        } catch (e) {
            // Abaikan kalau dibuka di browser biasa
        }
    };

    useEffect(() => {
        // Hapus logo native secepat mungkin agar webview terlihat
        hideSplashScreen();

        // --- INISIALISASI STORAGE & SPLASH SCREEN ---
        const initApp = async () => {
            // Kita kasih batas waktu maksimal (timeout) biar aplikasi nggak macet di loading screen puluhan detik
            const timeoutId = setTimeout(() => {
                console.warn("AppInit: Initialization timed out! Proceeding with local data.");
                setIsReady(true);
                hideSplashScreen();
            }, 6000);

            try {
                // Tunggu database lokal siap
                await initializeStorage();

                // Tandai aplikasi sudah siap
                clearTimeout(timeoutId);
                setIsReady(true);
                hideSplashScreen();
            } catch (error) {
                console.error("Gagal memulai aplikasi:", error);
                clearTimeout(timeoutId);
                setIsReady(true);
                hideSplashScreen();
            }
        };

        initApp();

        // --- PENGATURAN TAMPILAN KHUSUS HP (ANDROID/IOS) ---
        const initCapacitorPlugins = async () => {
            try {
                // Atur warna bar baterai/jam di atas
                const { StatusBar, Style } = await import('@capacitor/status-bar');
                await StatusBar.setStyle({ style: Style.Light });
                await StatusBar.setBackgroundColor({ color: '#F4F1EA' });

                const { Keyboard, KeyboardResize } = await import('@capacitor/keyboard');
                await Keyboard.setResizeMode({ mode: KeyboardResize.Body });
            } catch (_e) { /* Not available in browser */ }
        };
        initCapacitorPlugins();

        const resumeListener = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
            if (isActive) {
                console.log('📱 Balik ke aplikasi - menyegarkan data...');
                queryClient.invalidateQueries();
            }
        });

        return () => {
            resumeListener.then(handle => handle.remove());
        };
    }, [queryClient]);

    return { isReady, forceEntry };
};
