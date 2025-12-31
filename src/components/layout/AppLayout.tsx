import { Outlet, useLocation } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';
import { Toaster } from '@/components/ui/toaster';

const AppLayout = () => {
    const location = useLocation();

    // Determine active tab based on path
    const getActiveTab = () => {
        const path = location.pathname;
        if (path === '/') return 'home';
        if (path.startsWith('/ideas')) return 'parking';
        if (path.startsWith('/history')) return 'history';
        if (path.startsWith('/settings')) return 'settings';
        return 'home';
    };

    const activeTab = getActiveTab();

    return (
        <div className="min-h-screen bg-background md:pl-64 transition-all duration-300">
            {/* Screen Content */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Outlet />
            </div>

            {/* Bottom Navigation */}
            <BottomNav activeTab={activeTab} />

            <Toaster />
        </div>
    );
};

export default AppLayout;
