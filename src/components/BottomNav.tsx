import { Home, Lightbulb, Clock, Settings, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';

interface BottomNavProps {
  activeTab: 'home' | 'parking' | 'history' | 'settings';
}

const BottomNav = ({ activeTab }: BottomNavProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

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
            <span>v1.1.0</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight flex items-center">
            <span className="text-foreground">UrusDiri</span>
            <span className="text-primary">Sendiri</span>
          </h1>
        </div>

        <div className="flex items-center justify-around py-2 md:flex-col md:space-y-2 md:justify-start">
          {tabs.map(({ id, icon: Icon, label, path }) => (
            <button
              key={id}
              onClick={() => navigate(path)}
              className={cn(
                "flex flex-col items-center gap-1 px-6 py-2 rounded-2xl transition-all duration-200 md:flex-row md:w-full md:px-4 md:py-3.5 md:gap-3",
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
                "text-xs font-medium md:text-sm",
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
