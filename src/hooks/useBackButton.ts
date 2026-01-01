import { useEffect } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { useNavigate, useLocation } from "react-router-dom";

export const useBackButton = () => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        let backButtonListener: any;

        const setupListener = async () => {
            backButtonListener = await CapacitorApp.addListener("backButton", ({ canGoBack }) => {
                // Main routes that should act as "top level"
                const mainRoutes = ['/ideas', '/history', '/settings', '/about'];

                if (location.pathname === '/' || location.pathname === '') {
                    // Only exit if on the actual Home screen
                    CapacitorApp.exitApp();
                } else if (mainRoutes.includes(location.pathname)) {
                    // If on another main tab, go back to Home first
                    navigate('/');
                } else {
                    // Otherwise, go back in history (e.g. from editor to list)
                    navigate(-1);
                }
            });
        };

        setupListener();

        return () => {
            if (backButtonListener) {
                backButtonListener.remove();
            }
        };
    }, [navigate, location]);
};
