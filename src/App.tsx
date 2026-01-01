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

import AppLayout from "./components/layout/AppLayout";
import HomeScreen from "./components/screens/HomeScreen";
import ParkingLotScreen from "./components/screens/ParkingLotScreen";
import HistoryScreen from "./components/screens/HistoryScreen";
import SettingsScreen from "./components/screens/SettingsScreen";
import EditSchedule from "./pages/EditSchedule";
import NoteEditorPage from "./pages/NoteEditorPage";
import MaghribCheckinPage from "./pages/MaghribCheckinPage";
import AboutPage from "./pages/AboutPage";
import LogCreatorPage from "./pages/LogCreatorPage";
import NotFound from "./pages/NotFound";

import { initializeStorage } from "@/lib/storage";
import { useEffect } from "react";
import { App as CapacitorApp } from '@capacitor/app';
import { supabase } from '@/lib/supabase';

const queryClient = new QueryClient();

const BackButtonHandler = () => {
  useBackButton();
  return null;
};

const App = () => {
  useEffect(() => {
    initializeStorage();

    // Listen for Deep Links (Supabase Auth)
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
              </BrowserRouter>
            </TooltipProvider>
          </ErrorBoundary>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
