import { useEffect } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { useNavigate, useLocation } from "react-router-dom";

export const useBackButton = () => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        CapacitorApp.addListener("backButton", ({ canGoBack }) => {
            // Updated to support all main tab routes
            const mainRoutes = ['/', '/ideas', '/history', '/settings'];
            if (mainRoutes.includes(location.pathname)) {
                CapacitorApp.exitApp();
            } else {
                navigate(-1);
            }
        });

        return () => {
            CapacitorApp.removeAllListeners();
        };
    }, [navigate, location]);
};
