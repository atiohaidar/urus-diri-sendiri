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
import { useEffect, Suspense, lazy, useState } from "react";
import { App as CapacitorApp } from '@capacitor/app';
import { supabase } from '@/lib/supabase';
import { Loader2 } from "lucide-react";

// Layouts - Keep eager if small, or lazy if large. Layout usually needed immediately.
import AppLayout from "./components/layout/AppLayout";

// Lazy Load Pages
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
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // 1. Initialize Storage & Capacitor
    const initApp = async () => {
      try {
        await initializeStorage();
        setIsReady(true);

        // Hide Splash Screen manually ONLY after React state is ready
        try {
          const { SplashScreen } = await import('@capacitor/splash-screen');
          await SplashScreen.hide();
        } catch (e) {
          // Ignore on web
        }
      } catch (error) {
        console.error("Failed to initialize app:", error);
        setIsReady(true); // Proceed anyway to show ErrorBoundary if needed
      }
    };

    initApp();

    // 2. Setup Deep Link Listener for Supabase Auth
    const handleDeepLink = async (url: string) => {
      try {
        console.log('Deep link received:', url);

        const urlObj = new URL(url);
        // Validasi sederhana
        const allowedSchemes = ['urusdiri', 'http', 'https'];
        if (!allowedSchemes.includes(urlObj.protocol.replace(':', ''))) {
          return;
        }

        // Handle PKCE Flow (code in query params)
        const code = urlObj.searchParams.get('code');
        if (code) {
          console.log('Detected PKCE code, exchanging for session...');
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          toast.success("Login berhasil! (PKCE)");
          return;
        }

        // Handle Implicit Flow (tokens in hash)
        if (urlObj.hash) {
          const hashParams = new URLSearchParams(urlObj.hash.substring(1));
          const access_token = hashParams.get('access_token');
          const refresh_token = hashParams.get('refresh_token');

          if (access_token && refresh_token) {
            console.log('Detected Implicit tokens, setting session...');
            await supabase.auth.setSession({ access_token, refresh_token });
            toast.success("Login berhasil!");
            return;
          }
        }

        // Fallback: Parse query params for implicit tokens
        const access_token_query = urlObj.searchParams.get('access_token');
        const refresh_token_query = urlObj.searchParams.get('refresh_token');
        if (access_token_query && refresh_token_query) {
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

    const deepLinkListener = CapacitorApp.addListener('appUrlOpen', (data) => {
      handleDeepLink(data.url);
    });

    // 3. Initialize Standard Capacitor Plugins
    const initCapacitorPlugins = async () => {
      try {
        const { StatusBar, Style } = await import('@capacitor/status-bar');
        await StatusBar.setStyle({ style: Style.Light });
        await StatusBar.setBackgroundColor({ color: '#F4F1EA' });
        await StatusBar.setOverlaysWebView({ overlay: false });

        const { Keyboard, KeyboardResize } = await import('@capacitor/keyboard');
        await Keyboard.setResizeMode({ mode: KeyboardResize.Body });
      } catch (e) {
        console.debug('Capacitor plugins not available or browser environment');
      }
    };
    initCapacitorPlugins();

    // 4. Smart Resume: Refresh data
    const resumeListener = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        console.log('📱 App resumed - refreshing data...');
        queryClient.invalidateQueries();
      }
    });

    return () => {
      deepLinkListener.then(handle => handle.remove());
      resumeListener.then(handle => handle.remove());
    };
  }, []);

  // Show white screen / loader until storage is ready
  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F4F1EA]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

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
                      <Route path="/habits" element={<HabitsScreen />} />
                      <Route path="/ideas" element={<ParkingLotScreen />} />
                      <Route path="/history" element={<HistoryScreen />} />
                    </Route>

                    <Route path="/settings" element={<SettingsScreen />} />
                    <Route path="/schedule-editor" element={<EditSchedule />} />
                    <Route path="/note-editor/:id" element={<NoteEditorPage />} />
                    <Route path="/maghrib-checkin" element={<MaghribCheckinPage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/log-creator" element={<LogCreatorPage />} />
                    <Route path="/reflection/:id" element={<ReflectionDetailPage />} />
                    <Route path="/personal-notes" element={<PersonalNotesPage />} />
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
