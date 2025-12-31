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
import MaghribCheckinPage from "./pages/MaghribCheckinPage";
import AboutPage from "./pages/AboutPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const BackButtonHandler = () => {
  useBackButton();
  return null;
};

const App = () => (
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

export default App;
