// --- 1. IMPORT LIBRARY & KOMPONEN ---
// Library React & UI Utama
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"; // Untuk manage data/API
import { BrowserRouter, Routes, Route } from "react-router-dom"; // Untuk navigasi halaman
import { ThemeProvider } from "@/components/theme-provider"; // Untuk atur Dark/Light mode
import { LanguageProvider } from "@/i18n/LanguageContext"; // Untuk fitur multi-bahasa
import { useBackButton } from "@/hooks/useBackButton"; // Hook buat handle tombol back di HP
import { ErrorBoundary } from "@/components/ErrorBoundary"; // Penjaga kalau ada error biar nggak crash
import { Suspense, lazy } from "react"; // Buat fitur loading halaman (lazy load)
import { Loader2 } from "lucide-react"; // Icon loading putar
import { useAppInit } from "@/hooks/useAppInit"; // Hook buatan kita buat persiapan aplikasi

// Layout utama (misal Header/Footer yang selalu muncul)
import AppLayout from "./components/layout/AppLayout";

// --- 2. LAZY LOADING PAGES ---
// Cara ini bikin aplikasi ringan: Halaman cuma di-download pas dibuka aja
const HomeScreen = lazy(() => import("./components/screens/HomeScreen"));
const HabitsScreen = lazy(() => import("./components/screens/HabitsScreen"));
const ParkingLotScreen = lazy(() => import("./components/screens/ParkingLotScreen"));
const HistoryScreen = lazy(() => import("./components/screens/HistoryScreen"));
const SettingsScreen = lazy(() => import("./components/screens/SettingsScreen"));
const EditSchedule = lazy(() => import("./pages/EditSchedule"));
const NoteEditorPage = lazy(() => import("./pages/NoteEditorPage"));
const MaghribCheckinPage = lazy(() => import("./pages/MaghribCheckinPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const LogCreatorPage = lazy(() => import("./pages/LogCreatorPage"));
const ReflectionDetailPage = lazy(() => import("./pages/ReflectionDetailPage"));
const PersonalNotesPage = lazy(() => import("./pages/PersonalNotesPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

/**
 * Inisialisasi React Query (Si "Asisten Pribadi" pengelola data).
 * Tugasnya: 
 * 1. Menyimpan data yang sudah diambil (Caching) biar aplikasi tidak loading terus.
 * 2. Mengambil data baru secara otomatis di balik layar jika data lama dianggap "basi".
 * 3. Memberi tahu komponen apakah data masih loading, sukses, atau error.
 */
const queryClient = new QueryClient();

// Komponen kecil buat nangkep tombol Back di Android/HP
const BackButtonHandler = () => {
  useBackButton();
  return null;
};

// Tampilan Loading pas lagi pindah halaman
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

const App = () => {
  // Jalankan persiapan aplikasi (Capacitor, Storage, Auth)
  const { isReady } = useAppInit(queryClient);

  // --- 3. SUSUNAN PROVIDER & ROUTING (Lapis-lapis Pelindung Aplikasi) ---
  return (
    /* Lapis 1: Pengelola Data (React Query) - Mengatur cache & sinkronisasi data database */
    <QueryClientProvider client={queryClient}>

      {/* /* Lapis 2: Pengelola Tema - Mengatur mode Terang/Gelap (Light/Dark mode) */}
      <ThemeProvider defaultTheme="system" storageKey="urus-diri-theme">

        {/* Jika aplikasi belum siap (sedang inisialisasi), tampilkan layar loading yang sesuai tema */}
        {!isReady ? (
          <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="font-handwriting text-lg animate-pulse text-muted-foreground">Menyiapkan buku jurnal...</p>
            </div>
          </div>
        ) : (
          /* Lapis 3: Pengelola Bahasa - Menyediakan info bahasa (ID/EN) ke seluruh halaman */
          <LanguageProvider>

            {/* /* Lapis 4: Sabuk Pengaman - Menangkap error agar aplikasi tidak crash total/blank putih */}
            <ErrorBoundary>

              {/* /* Lapis 5: Fitur Tooltip - Mengaktifkan teks mungil yang muncul saat tombol ditahan */}
              <TooltipProvider>

                {/* Komponen Notifikasi - Disiagakan agar bisa muncul kapan saja (popup kecil) */}
                <Toaster />
                <Sonner />

                {/* Lapis 6: Sistem Navigasi - Mengatur perpindahan halaman tanpa refresh browser */}
                <BrowserRouter>
                  <BackButtonHandler />

                  {/* Lapis 7: Layar Tunggu - Menampilkan loading ikon saat halaman sedang di-download */}
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      {/* Grup Halaman yang pakai Menu Navigasi Bawah (AppLayout) */}
                      <Route element={<AppLayout />}>
                        <Route path="/" element={<HomeScreen />} />
                        <Route path="/habits" element={<HabitsScreen />} />
                        <Route path="/ideas" element={<ParkingLotScreen />} />
                        <Route path="/history" element={<HistoryScreen />} />
                      </Route>

                      {/* Halaman Mandiri (Halaman Full tanpa menu bawah) */}
                      <Route path="/settings" element={<SettingsScreen />} />
                      <Route path="/schedule-editor" element={<EditSchedule />} />
                      <Route path="/note-editor/:id" element={<NoteEditorPage />} />
                      <Route path="/maghrib-checkin" element={<MaghribCheckinPage />} />
                      <Route path="/about" element={<AboutPage />} />
                      <Route path="/log-creator" element={<LogCreatorPage />} />
                      <Route path="/reflection/:id" element={<ReflectionDetailPage />} />
                      <Route path="/personal-notes" element={<PersonalNotesPage />} />

                      {/* fallback: Kalau alamat URL tidak ditemukan */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </BrowserRouter>

              </TooltipProvider>
            </ErrorBoundary>
          </LanguageProvider>
        )}
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
