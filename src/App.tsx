import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { toast } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { useBackButton } from "@/hooks/useBackButton";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { initializeStorage } from "@/lib/storage";
import { useEffect, Suspense, lazy } from "react";
import { App as CapacitorApp } from '@capacitor/app';
import { supabase } from '@/lib/supabase';
import { Loader2 } from "lucide-react";

// Layouts - Keep eager if small, or lazy if large. Layout usually needed immediately.
import AppLayout from "./components/layout/AppLayout";

// Lazy Load Pages
const HomeScreen = lazy(() => import("./components/screens/HomeScreen"));
const ParkingLotScreen = lazy(() => import("./components/screens/ParkingLotScreen"));
const HistoryScreen = lazy(() => import("./components/screens/HistoryScreen"));
const SettingsScreen = lazy(() => import("./components/screens/SettingsScreen"));
const EditSchedule = lazy(() => import("./pages/EditSchedule"));
const NoteEditorPage = lazy(() => import("./pages/NoteEditorPage"));
const MaghribCheckinPage = lazy(() => import("./pages/MaghribCheckinPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const LogCreatorPage = lazy(() => import("./pages/LogCreatorPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const BackButtonHandler = () => {
  useBackButton();
  return null;
};

// Global Loading Fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

const App = () => {
  useEffect(() => {
    initializeStorage();

    // Listen for Deep Links (Supabase Auth)
    const handleDeepLink = async (url: string) => {
      try {
        console.log('Deep link received:', url);

        // Normalize URL to handle custom schemes correctly in URL constructor if needed
        // But Capacitor usually passes a full valid URL string.
        const urlObj = new URL(url);

        // 1. Handle PKCE Flow (code in query params)
        const code = urlObj.searchParams.get('code');
        if (code) {
          console.log('Detected PKCE code, exchanging for session...');
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;

          toast.success("Login berhasil! (PKCE)");
          return;
        }

        // 2. Handle Implicit Flow (tokens in hash)
        // new URL(url).hash returns string starting with #
        if (urlObj.hash) {
          const hashParams = new URLSearchParams(urlObj.hash.substring(1)); // remove #
          const access_token = hashParams.get('access_token');
          const refresh_token = hashParams.get('refresh_token');

          if (access_token && refresh_token) {
            console.log('Detected Implicit tokens, setting session...');
            await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            toast.success("Login berhasil!");
            return;
          }
        }

        // 3. Fallback: Parse query params for implicit tokens (sometimes happens)
        const access_token_query = urlObj.searchParams.get('access_token');
        const refresh_token_query = urlObj.searchParams.get('refresh_token');
        if (access_token_query && refresh_token_query) {
          console.log('Detected Implicit tokens in query, setting session...');
          await supabase.auth.setSession({
            access_token: access_token_query,
            refresh_token: refresh_token_query,
          });
          toast.success("Login berhasil!");
          return;
        }

      } catch (e: any) {
        console.error('Deep link handling error:', e);
        toast.error(`Login failed: ${e.message || e}`);
      }
    };

    const listener = CapacitorApp.addListener('appUrlOpen', (data) => {
      handleDeepLink(data.url);
    });

    return () => {
      listener.then(handle => handle.remove());
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="urus-diri-theme">
        <LanguageProvider>
          <ErrorBoundary>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <BackButtonHandler />
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route element={<AppLayout />}>
                      <Route path="/" element={<HomeScreen />} />
                      <Route path="/ideas" element={<ParkingLotScreen />} />
                      <Route path="/history" element={<HistoryScreen />} />
                      <Route path="/settings" element={<SettingsScreen />} />
                    </Route>

                    <Route path="/schedule-editor" element={<EditSchedule />} />
                    <Route path="/note-editor/:id" element={<NoteEditorPage />} />
                    <Route path="/maghrib-checkin" element={<MaghribCheckinPage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/log-creator" element={<LogCreatorPage />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </TooltipProvider>
          </ErrorBoundary>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
