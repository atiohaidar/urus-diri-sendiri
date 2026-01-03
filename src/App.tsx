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

        // Validate URL scheme for security
        const urlObj = new URL(url);
        const allowedSchemes = ['urusdiri', 'http', 'https'];
        const allowedHosts = ['localhost', '127.0.0.1', 'urusdiri.app'];

        // Check scheme
        if (!allowedSchemes.includes(urlObj.protocol.replace(':', ''))) {
          console.warn('Deep link rejected: Invalid scheme', urlObj.protocol);
          return;
        }

        // For http/https, also check host
        if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
          const host = urlObj.hostname.toLowerCase();
          if (!allowedHosts.some(allowed => host === allowed || host.endsWith('.' + allowed))) {
            console.warn('Deep link rejected: Invalid host', urlObj.hostname);
            toast.error('Login gagal: URL tidak valid');
            return;
          }
        }

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
        if (urlObj.hash) {
          const hashParams = new URLSearchParams(urlObj.hash.substring(1));
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

        // 3. Fallback: Parse query params for implicit tokens
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

    // Initialize Capacitor Plugins
    const initCapacitor = async () => {
      try {
        // Only run on native platforms
        if ((await CapacitorApp.getInfo()).name) { // Simple check, or better try/catch block 
          // Implemented inside try catch, so safe to call
        }

        // 1. Status Bar - Match Notebook Theme
        // Dynamic import to avoid SSR/Browser issues if package not present (though we installed it)
        const { StatusBar, Style } = await import('@capacitor/status-bar');
        await StatusBar.setStyle({ style: Style.Light }); // Dark text
        await StatusBar.setBackgroundColor({ color: '#F4F1EA' }); // Matches --paper color exactly
        await StatusBar.setOverlaysWebView({ overlay: false });

        // 2. Keyboard - Prevent UI breaking
        const { Keyboard, KeyboardResize } = await import('@capacitor/keyboard');
        await Keyboard.setResizeMode({ mode: KeyboardResize.Body });

        // 3. Splash Screen - Hide manually for seamless transition
        const { SplashScreen } = await import('@capacitor/splash-screen');
        await SplashScreen.hide();

      } catch (e) {
        // Silent fail in browser or if plugins missing
        console.debug('Capacitor plugins not available or browser environment');
      }
    };

    initCapacitor();

    // Smart Resume: Refresh data when app comes to foreground
    const resumeListener = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        console.log('📱 App resumed - refreshing data...');
        queryClient.invalidateQueries(); // Refresh server data if any
        // Force re-render of components sensitive to date/time could be done here if needed
      }
    });

    return () => {
      listener.then(handle => handle.remove());
      resumeListener.then(handle => handle.remove());
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
                      <Route path="/habits" element={<HabitsScreen />} />
                      <Route path="/ideas" element={<ParkingLotScreen />} />
                      <Route path="/history" element={<HistoryScreen />} />
                    </Route>

                    {/* Settings is now a standalone page */}
                    <Route path="/settings" element={<SettingsScreen />} />

                    <Route path="/schedule-editor" element={<EditSchedule />} />
                    <Route path="/note-editor/:id" element={<NoteEditorPage />} />
                    <Route path="/maghrib-checkin" element={<MaghribCheckinPage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/log-creator" element={<LogCreatorPage />} />
                    <Route path="/reflection/:id" element={<ReflectionDetailPage />} />
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
