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
                // 1. Priority: Close any open Modals/Dialogs first
                // Shadcn/Radix UI uses role="dialog" or "alertdialog"
                const openModal = document.querySelector('[data-state="open"][role="dialog"], [data-state="open"][role="alertdialog"]');

                if (openModal) {
                    // Simulate Escape key to close the modal naturally
                    // This triggers the onOpenChange(false) handler of the component
                    const escapeEvent = new KeyboardEvent('keydown', {
                        key: 'Escape',
                        code: 'Escape',
                        keyCode: 27,
                        bubbles: true,
                        cancelable: true
                    });
                    openModal.dispatchEvent(escapeEvent);

                    // Fallback: If simulation fails or specialized modal, try finding a close button
                    // But usually dispatching to the dialog content works for Radix
                    return;
                }

                // 2. Navigation Logic
                // Main routes that should act as "top level"
                const mainRoutes = ['/ideas', '/history', '/settings', '/about', '/habits'];

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
