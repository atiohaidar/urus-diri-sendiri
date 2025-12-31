import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import BottomNav from '@/components/BottomNav';
import { Toaster } from '@/components/ui/toaster';

const AppLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();

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

    // Swipe Logic
    const tabs = ['/', '/ideas', '/history', '/settings'];
    const currentTabIndex = tabs.indexOf(location.pathname);

    const handlers = useSwipeable({
        onSwipedLeft: () => {
            if (currentTabIndex < tabs.length - 1 && currentTabIndex !== -1) {
                navigate(tabs[currentTabIndex + 1]);
            }
        },
        onSwipedRight: () => {
            if (currentTabIndex > 0) {
                navigate(tabs[currentTabIndex - 1]);
            }
        },
        trackMouse: false, // Only touch gestures for mobile feel
        preventScrollOnSwipe: false, // Let user scroll naturally
        delta: 50, // Minimum swipe distance
    });

    return (
        <div className="min-h-screen bg-background md:pl-64 transition-all duration-300" {...handlers}>
            {/* Screen Content */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-screen">
                <Outlet />
            </div>

            {/* Bottom Navigation */}
            <BottomNav activeTab={activeTab} />

            <Toaster />
        </div>
    );
};

export default AppLayout;
