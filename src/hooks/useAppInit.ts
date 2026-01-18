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

    useEffect(() => {
        // --- 1. INISIALISASI STORAGE & SPLASH SCREEN ---
        const initApp = async () => {
            try {
                // Tunggu database lokal siap
                await initializeStorage();

                // Tunggu auth sync selesai (jika ada)
                // Ini memastikan data sudah ter-hydrate dengan benar
                const authStatus = getAuthSyncStatus();
                if (authStatus.state === 'syncing') {
                    console.log('AppInit: Menunggu auth sync selesai...');
                    await waitForAuthSync();
                    console.log('AppInit: Auth sync selesai!');
                }

                // Tandai aplikasi sudah siap
                setIsReady(true);

                // Di HP: Matikan gambar loading (Splash Screen) kalau React-nya sudah siap
                try {
                    const { SplashScreen } = await import('@capacitor/splash-screen');
                    await SplashScreen.hide();
                } catch (e) {
                    // Abaikan kalau dibuka di browser biasa
                }
            } catch (error) {
                console.error("Gagal memulai aplikasi:", error);
                setIsReady(true); // Tetap lanjut biar aplikasi nggak macet di loading terus
            }
        };

        initApp();

        // --- 2. HANDLE LOGIN LEWAT LINK (DEEP LINK) ---
        // Dipakai kalau kita klik link 'Login' dari Email pas di HP
        const handleDeepLink = async (url: string) => {
            try {
                console.log('Deep link diterima:', url);
                const urlObj = new URL(url);

                // Ambil kode login dari URL
                const code = urlObj.searchParams.get('code');
                if (code) {
                    console.log('DeepLink: Menukar kode untuk session...');
                    const { error } = await supabase.auth.exchangeCodeForSession(code);
                    if (error) throw error;

                    // Tunggu auth sync selesai sebelum menampilkan toast sukses
                    // Ini memastikan data sudah ter-hydrate dari cloud
                    console.log('DeepLink: Menunggu auth sync selesai...');
                    const status = await waitForAuthSync();

                    if (status.state === 'ready') {
                        toast.success("Login berhasil! Data tersinkronisasi.");
                    } else if (status.state === 'error') {
                        toast.warning("Login berhasil, tapi sync data gagal. Coba refresh.");
                    }

                    // Invalidate queries untuk memastikan UI menggunakan data terbaru
                    queryClient.invalidateQueries();
                    return;
                }

                // Kalau pakai token langsung di URL
                if (urlObj.hash) {
                    const hashParams = new URLSearchParams(urlObj.hash.substring(1));
                    const access_token = hashParams.get('access_token');
                    const refresh_token = hashParams.get('refresh_token');

                    if (access_token && refresh_token) {
                        console.log('DeepLink: Setting session dari token...');
                        await supabase.auth.setSession({ access_token, refresh_token });

                        // Tunggu auth sync selesai
                        console.log('DeepLink: Menunggu auth sync selesai...');
                        const status = await waitForAuthSync();

                        if (status.state === 'ready') {
                            toast.success("Login berhasil! Data tersinkronisasi.");
                        } else if (status.state === 'error') {
                            toast.warning("Login berhasil, tapi sync data gagal. Coba refresh.");
                        }

                        // Invalidate queries untuk memastikan UI menggunakan data terbaru
                        queryClient.invalidateQueries();
                        return;
                    }
                }
            } catch (e: any) {
                console.error('Error saat handle link login:', e);
                toast.error(`Login gagal: ${e.message || e}`);
            }
        };

        // Pasang pendengar: Kalau aplikasi dibuka lewat link, jalankan handleDeepLink
        const deepLinkListener = CapacitorApp.addListener('appUrlOpen', (data) => {
            handleDeepLink(data.url);
        });

        // --- 3. PENGATURAN TAMPILAN KHUSUS HP (ANDROID/IOS) ---
        const initCapacitorPlugins = async () => {
            try {
                // Atur warna bar baterai/jam di atas
                const { StatusBar, Style } = await import('@capacitor/status-bar');
                await StatusBar.setStyle({ style: Style.Light });
                await StatusBar.setBackgroundColor({ color: '#F4F1EA' }); // Warna krem sesuai desain

                // Atur agar aplikasi nggak ketutup keyboard pas ngetik
                const { Keyboard, KeyboardResize } = await import('@capacitor/keyboard');
                await Keyboard.setResizeMode({ mode: KeyboardResize.Body });
            } catch (e) {
                // Abaikan kalau bukan di HP
            }
        };
        initCapacitorPlugins();

        // --- 4. REFRESH OTOMATIS (SMART RESUME) ---
        // Kalau kita pindah aplikasi terus balik lagi, otomatis ambil data terbaru
        const resumeListener = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
            if (isActive) {
                console.log('📱 Balik ke aplikasi - menyegarkan data...');
                queryClient.invalidateQueries(); // Tukang suruh refresh data
            }
        });

        // Bersihkan semua listener kalau komponen ini nggak dipakai lagi
        return () => {
            deepLinkListener.then(handle => handle.remove());
            resumeListener.then(handle => handle.remove());
        };
    }, [queryClient]);

    return { isReady };
};
