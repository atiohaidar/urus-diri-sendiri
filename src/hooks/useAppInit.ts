import { useState, useEffect } from "react";
import { App as CapacitorApp } from '@capacitor/app';
import { toast } from "sonner";
import { initializeStorage } from "@/lib/storage";
import { QueryClient } from "@tanstack/react-query";
import { waitForAuthSync, getAuthSyncStatus } from "@/lib/auth-sync-manager";
import { verifySession } from "@/lib/cloudflare-auth";

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

        // --- 1. INISIALISASI STORAGE & AUTH ---
        const initApp = async () => {
            // Batas waktu maksimal biar aplikasi nggak macet di loading
            const timeoutId = setTimeout(() => {
                console.warn("AppInit: Initialization timed out! Proceeding with local data.");
                setIsReady(true);
                hideSplashScreen();
            }, 8000);

            try {
                // Verifikasi token yang tersimpan (jika ada) sebelum init storage
                // Ini memastikan token expired di-clear sebelum auth listener jalan
                await verifySession();

                // Tunggu database lokal siap
                await initializeStorage();

                // Tunggu auth sync selesai (jika ada)
                const authStatus = getAuthSyncStatus();
                if (authStatus.state === 'syncing') {
                    console.log('AppInit: Menunggu auth sync selesai...');
                    await Promise.race([
                        waitForAuthSync(),
                        new Promise(resolve => setTimeout(resolve, 5000))
                    ]);
                    console.log('AppInit: Auth sync selesai atau dilewati.');
                }

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

        // --- 2. PENGATURAN TAMPILAN KHUSUS HP (ANDROID/IOS) ---
        const initCapacitorPlugins = async () => {
            try {
                // Atur warna bar baterai/jam di atas
                const { StatusBar, Style } = await import('@capacitor/status-bar');
                await StatusBar.setStyle({ style: Style.Light });
                await StatusBar.setBackgroundColor({ color: '#F4F1EA' });

                const { Keyboard, KeyboardResize } = await import('@capacitor/keyboard');
                await Keyboard.setResizeMode({ mode: KeyboardResize.Body });
            } catch (e) { }
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
