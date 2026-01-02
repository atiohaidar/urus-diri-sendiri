import { Home, Lightbulb, Clock, Settings, Sparkles, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';

interface BottomNavProps {
  activeTab: 'home' | 'parking' | 'history' | 'settings';
}

const BottomNav = ({ activeTab }: BottomNavProps) => {
  const navigate = useNavigate();
  const { pathname } = useLocation(); // Add useLocation
  const { t } = useLanguage();

  const handleNavigate = (path: string) => {
    if (pathname === path) return;
    navigate(path);
  };

  const tabs = [
    { id: 'home' as const, icon: Home, label: t.navigation.home, path: '/' },
    { id: 'parking' as const, icon: Lightbulb, label: t.navigation.ideas, path: '/ideas' },
    { id: 'history' as const, icon: Clock, label: t.navigation.history, path: '/history' },
    { id: 'settings' as const, icon: Settings, label: t.navigation.settings, path: '/settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-t border-border safe-bottom md:top-0 md:w-64 md:border-t-0 md:border-r md:h-screen md:flex md:flex-col">
      <div className="w-full md:px-4 md:py-6">
        {/* Desktop Header Title */}
        <div className="hidden md:flex flex-col items-start gap-1 mb-8 px-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium border border-primary/20">
            <Sparkles className="w-3 h-3" />
            <span>v1.0.0</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight flex items-center">
            <span className="text-foreground">UrusDiri</span>
            <span className="text-primary">Sendiri</span>
          </h1>
        </div>

        <div className="flex items-center justify-around py-2 md:flex-col md:space-y-2 md:justify-start">
          {tabs.slice(0, 2).map(({ id, icon: Icon, label, path }) => (
            <button
              key={id}
              onClick={() => handleNavigate(path)}
              className={cn(
                "flex flex-col items-center gap-1 px-2 py-2 rounded-2xl transition-all duration-200 md:flex-row md:w-full md:px-4 md:py-3.5 md:gap-3",
                activeTab === id
                  ? "text-primary bg-secondary/50"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon
                className={cn(
                  "w-6 h-6 transition-transform duration-200",
                  activeTab === id && "scale-110 md:scale-100"
                )}
                strokeWidth={activeTab === id ? 2.5 : 2}
              />
              <span className={cn(
                "text-[10px] font-medium md:text-sm",
                activeTab === id ? "font-semibold" : "font-medium"
              )}>{label}</span>
            </button>
          ))}

          {/* Central Log Button (Mobile) */}
          <div className="md:hidden -mt-8">
            <button
              onClick={() => handleNavigate('/log-creator')}
              className="h-14 w-14 rounded-full bg-gradient-to-tr from-primary to-lime-400 shadow-lg shadow-primary/40 flex items-center justify-center text-primary-foreground transform active:scale-95 transition-transform"
            >
              <Plus className="w-7 h-7" strokeWidth={3} />
            </button>
          </div>

          {/* Desktop Log Button (Hidden in flex map above, added here specific for Desktop sidebar layout if needed, 
              but since we slice 0,2 and then need rest, let's just do standard mapping for desktop and special layout for mobile)
           */}

          {/* Right Tabs */}
          {tabs.slice(2).map(({ id, icon: Icon, label, path }) => (
            <button
              key={id}
              onClick={() => handleNavigate(path)}
              className={cn(
                "flex flex-col items-center gap-1 px-2 py-2 rounded-2xl transition-all duration-200 md:flex-row md:w-full md:px-4 md:py-3.5 md:gap-3",
                activeTab === id
                  ? "text-primary bg-secondary/50"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon
                className={cn(
                  "w-6 h-6 transition-transform duration-200",
                  activeTab === id && "scale-110 md:scale-100"
                )}
                strokeWidth={activeTab === id ? 2.5 : 2}
              />
              <span className={cn(
                "text-[10px] font-medium md:text-sm",
                activeTab === id ? "font-semibold" : "font-medium"
              )}>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
