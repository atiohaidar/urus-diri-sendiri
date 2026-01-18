import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Emergency Error Logger for Native Mobile
if (typeof window !== 'undefined') {
    window.onerror = function (msg, url, line, col, error) {
        const errorMsg = `Fatal Error: ${msg}\nLine: ${line}\nSource: ${url}`;
        console.error(errorMsg);
        // Kita pakai console.error saja agar tidak mengganggu user jika error tidak fatal,
        // tapi kalau anda mau melihatnya di HP, kita bisa aktifkan alert() di sini nanti.
        return false;
    };
}

createRoot(document.getElementById("root")!).render(<App />);
