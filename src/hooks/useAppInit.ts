import { useState, useEffect } from "react";
import { App as CapacitorApp } from '@capacitor/app'; // Plugin untuk akses fitur asli HP
import { supabase } from '@/lib/supabase'; // Koneksi ke database Supabase
import { toast } from "sonner"; // Library buat munculin notifikasi kecil
import { initializeStorage } from "@/lib/storage"; // Fungsi buat siapin database lokal
import { QueryClient } from "@tanstack/react-query";
import { waitForAuthSync, getAuthSyncStatus } from "@/lib/auth-sync-manager";

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

        // --- 2. HANDLE LOGIN LEWAT LINK (DEEP LINK) ---
        const handleDeepLink = async (url: string) => {
            console.log("AppInit: Memproses URL:", url);
            try {
                if (!url) return;

                // Pastikan URL valid sebelum diproses
                let urlObj;
                try {
                    urlObj = new URL(url);
                } catch (e) {
                    console.warn("AppInit: URL tidak valid untuk deep link:", url);
                    return;
                }

                if (!url.includes('code=') && !url.includes('#access_token=')) {
                    return;
                }

                // Ambil kode login dari URL (PKCE Flow)
                const code = urlObj.searchParams.get('code');
                if (code) {
                    console.log('DeepLink: Menukar kode untuk session...');
                    const { error } = await supabase.auth.exchangeCodeForSession(code);
                    if (error) throw error;

                    // Bersihkan URL dari parameter code
                    window.history.replaceState(null, '', window.location.pathname);

                    // Tunggu auth sync selesai
                    console.log('DeepLink: Menunggu auth sync selesai...');
                    const status = await waitForAuthSync();

                    if (status.state === 'ready') {
                        toast.success("Login berhasil! Data tersinkronisasi.");
                    }
                    queryClient.invalidateQueries();
                    return;
                }

                // Kalau pakai token langsung di URL (Implicit Flow / Hash)
                if (urlObj.hash) {
                    const hashParams = new URLSearchParams(urlObj.hash.substring(1));
                    const access_token = hashParams.get('access_token');
                    const refresh_token = hashParams.get('refresh_token');

                    if (access_token && refresh_token) {
                        console.log('DeepLink: Setting session dari token...');
                        const { error } = await supabase.auth.setSession({ access_token, refresh_token });
                        if (error) throw error;

                        window.history.replaceState(null, '', window.location.pathname);

                        console.log('DeepLink: Menunggu auth sync selesai...');
                        const status = await waitForAuthSync();

                        if (status.state === 'ready') {
                            toast.success("Login berhasil! Data tersinkronisasi.");
                        }
                        queryClient.invalidateQueries();
                        return;
                    }
                }
            } catch (e: any) {
                console.error('Error saat handle link login:', e);
                toast.error(`Login gagal: ${e.message || e}`);
            }
        };

        // --- 1. INISIALISASI STORAGE & SPLASH SCREEN ---
        const initApp = async () => {
            // Kita kasih batas waktu maksimal (timeout) biar aplikasi nggak macet di loading screen puluhan detik
            const timeoutId = setTimeout(() => {
                console.warn("AppInit: Initialization timed out! Proceeding with local data.");
                setIsReady(true);
                hideSplashScreen();
            }, 6000);

            try {
                // Sekarang handleDeepLink sudah didefinisikan di atas
                await handleDeepLink(window.location.href);

                // Tunggu database lokal siap
                await initializeStorage();

                // Tunggu auth sync selesai (jika ada)
                const authStatus = getAuthSyncStatus();
                if (authStatus.state === 'syncing') {
                    console.log('AppInit: Menunggu auth sync selesai...');
                    await Promise.race([
                        waitForAuthSync(),
                        new Promise(resolve => setTimeout(resolve, 4000))
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

        const deepLinkListener = CapacitorApp.addListener('appUrlOpen', (data) => {
            handleDeepLink(data.url);
        });

        // --- 3. PENGATURAN TAMPILAN KHUSUS HP (ANDROID/IOS) ---
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
            deepLinkListener.then(handle => handle.remove());
            resumeListener.then(handle => handle.remove());
        };
    }, [queryClient]);

    return { isReady, forceEntry };
};
