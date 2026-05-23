import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';
import { Toaster } from '@/components/ui/toaster';
import { GuestMigrationDialog } from '@/components/GuestMigrationDialog';

const AppLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Determine active tab based on path
    // New order: Home → Habits → Parking (Notes) → History
    const getActiveTab = (): 'home' | 'habits' | 'parking' | 'history' => {
        const path = location.pathname;
        if (path === '/') return 'home';
        if (path.startsWith('/habits')) return 'habits';
        if (path.startsWith('/ideas')) return 'parking';
        if (path.startsWith('/history')) return 'history';
        return 'home';
    };

    const activeTab = getActiveTab();

    return (
        /**
         * PENGATURAN LAYOUT RESPONSIF (HP vs LAPTOP):
         * - 'min-h-screen': Tinggi minimal layar penuh.
         * - 'md:pl-64': DI LAPTOP (layar medium), kasih jarak kiri 64 unit buat Sidebar.
         * - 'transition-all': Biar pas layar berubah ukuran, gerakannya mulus.
         */
        <div className="min-h-screen bg-background md:pl-64 transition-all duration-300">
            {/* Area Konten Utama: Tempat halaman (HomeScreen, dll) muncul */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Outlet />
            </div>

            {/* Navigasi: Bisa jadi Bottom Bar (HP) atau Sidebar (Laptop) */}
            <BottomNav activeTab={activeTab} />

            {/* Kotak Notifikasi */}
            <GuestMigrationDialog />
            <Toaster />
        </div>
    );
};

export default AppLayout;

