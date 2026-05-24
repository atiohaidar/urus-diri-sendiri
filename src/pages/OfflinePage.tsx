import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const OfflinePage = () => {
    const handleRetry = () => {
        if (navigator.onLine) {
            toast.success("Koneksi internet terhubung kembali!");
            window.location.reload();
        } else {
            toast.error("Masih offline. Periksa kembali koneksi Wi-Fi atau data seluler Anda.");
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 animate-in fade-in duration-300">
            {/* Notebook style card */}
            <div className="w-full max-w-md bg-paper border-2 border-paper-lines rounded-sm p-8 shadow-notebook text-center relative overflow-hidden">
                {/* Red tape to indicate error/warning status */}
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-32 h-8 bg-doodle-red/20 shadow-tape rotate-2 z-10" />

                <div className="flex flex-col items-center mt-6 mb-6">
                    <div className="p-4 bg-doodle-red/10 border-2 border-dashed border-doodle-red/30 rounded-sm rotate-3 mb-6">
                        <WifiOff className="w-12 h-12 text-doodle-red animate-pulse" />
                    </div>
                    
                    <h1 className="font-handwriting text-2xl text-ink font-bold flex items-center justify-center gap-2">
                        Koneksi Terputus <WifiOff className="w-6 h-6 text-doodle-red shrink-0" />
                    </h1>
                    
                    <p className="text-sm font-handwriting text-pencil mt-4 max-w-xs leading-relaxed">
                        Aplikasi ini beroperasi dalam mode **Full Online** agar data Anda selalu sinkron di seluruh perangkat tanpa bentrok.
                    </p>
                    
                    <p className="text-sm font-handwriting text-pencil mt-3 max-w-xs leading-relaxed bg-paper-lines/10 p-3 rounded-sm border border-paper-lines/20">
                        Pastikan Wi-Fi atau koneksi seluler perangkat Anda aktif untuk melanjutkan aktivitas jurnal Anda.
                    </p>
                </div>

                <div className="pt-2">
                    <Button
                        onClick={handleRetry}
                        className="w-full h-11 rounded-sm font-handwriting bg-ink text-white hover:bg-ink/90 shadow-notebook gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Coba Hubungkan Kembali
                    </Button>
                </div>

                <div className="mt-8 text-xs font-handwriting text-pencil border-t border-dashed border-paper-lines/30 pt-4">
                    Pena Anda kering tanpa aliran data • Hubungkan ke internet
                </div>
            </div>
        </div>
    );
};
