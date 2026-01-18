import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

/**
 * PERUMPAMAAN: ErrorBoundary adalah "Bantalan Udara" (Airbag) mobil.
 * Jika ada bagian aplikasi yang 'tabrakan' (crash/error), 
 * komponen ini akan mengembang agar seluruh aplikasi tidak hancur (blank putih).
 */

interface Props {
    children: ReactNode; // Halaman atau komponen yang "dibungkus" di dalamnya
}

interface State {
    hasError: boolean; // Status apakah sedang terjadi error
    error: Error | null; // Detail pesan errornya
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    // Fungsi ini otomatis jalan kalau ada error di komponen anaknya
    public static getDerivedStateFromError(error: Error): State {
        // Update status: "Ya, ada error!"
        return { hasError: true, error };
    }

    // Fungsi untuk mencatat log error (bisa dilihat di Inspect Element > Console)
    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Terjadi error yang tidak tertangkap:", error, errorInfo);
    }

    public render() {
        // JIKA TERJADI ERROR: Tampilkan layar peringatan ini
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-background">
                    <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                        <AlertTriangle className="w-8 h-8 text-destructive" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Waduh, ada masalah!</h1>
                    <p className="text-muted-foreground mb-6 max-w-md">
                        {this.state.error?.message || "Terjadi kesalahan yang tidak terduga."}
                    </p>
                    <div className="flex gap-2">
                        {/* Tombol buat coba muat ulang halaman */}
                        <Button onClick={() => window.location.reload()}>
                            Muat Ulang Halaman
                        </Button>
                        {/* Tombol buat balik ke halaman depan */}
                        <Button variant="outline" onClick={() => window.location.href = '/'}>
                            Kembali ke Home
                        </Button>
                    </div>
                </div>
            );
        }

        // JIKA TIDAK ADA ERROR: Tampilkan isi aplikasi seperti biasa
        return this.props.children;
    }
}
