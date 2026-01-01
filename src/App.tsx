import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
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
    const handleDeepLink = async (url: string) => {
      try {
        if (url.includes('login-callback')) {
          // Parse tokens from hash (Implicit Flow)
          const hashIndex = url.indexOf('#');
          if (hashIndex !== -1) {
            const hash = url.substring(hashIndex + 1);
            const params = new URLSearchParams(hash);
            const access_token = params.get('access_token');
            const refresh_token = params.get('refresh_token');

            if (access_token && refresh_token) {
              await supabase.auth.setSession({
                access_token,
                refresh_token,
              });
              // Force reload/navigation might be good, but state change should trigger UI update
            }
          }
        }
      } catch (e) {
        console.error('Deep link handling error:', e);
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
