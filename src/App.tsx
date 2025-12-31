import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import EditSchedule from "./pages/EditSchedule";
import MaghribCheckinPage from "./pages/MaghribCheckinPage";
import { App as CapacitorApp } from "@capacitor/app";
import { useEffect } from "react";

const queryClient = new QueryClient();

const BackButtonHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    CapacitorApp.addListener("backButton", ({ canGoBack }) => {
      if (location.pathname === "/") {
        CapacitorApp.exitApp();
      } else {
        navigate(-1);
      }
    });

    return () => {
      CapacitorApp.removeAllListeners();
    };
  }, [navigate, location]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <BackButtonHandler />
        <Routes>
          <Route path="/" element={<Index />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="/schedule-editor" element={<EditSchedule />} />
          <Route path="/maghrib-checkin" element={<MaghribCheckinPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
