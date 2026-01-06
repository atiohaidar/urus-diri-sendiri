import { Home, Lightbulb, Clock, Flame, Sparkles, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';

interface BottomNavProps {
  activeTab: 'home' | 'habits' | 'parking' | 'history';
}

const BottomNav = ({ activeTab }: BottomNavProps) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t } = useLanguage();

  const handleNavigate = (path: string) => {
    if (pathname === path) return;
    navigate(path);
  };

  // Tab rotations for sticky note effect
  const tabRotations = ['-rotate-1', 'rotate-1', '-rotate-2', 'rotate-1'];

  // New order: Home → Habits → Parking (Notes) → History
  const tabs = [
    { id: 'home' as const, icon: Home, label: t.navigation.home, path: '/' },
    { id: 'habits' as const, icon: Flame, label: t.navigation.habits || 'Habits', path: '/habits' },
    { id: 'parking' as const, icon: Lightbulb, label: t.navigation.ideas, path: '/ideas' },
    { id: 'history' as const, icon: Clock, label: t.navigation.history, path: '/history' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-paper border-t-2 border-dashed border-paper-lines safe-bottom md:top-0 md:w-64 md:border-t-0 md:border-r-2 md:h-screen md:flex md:flex-col">
      <div className="w-full md:px-4 md:py-6">
        {/* Desktop Header Title */}
        <div className="hidden md:flex flex-col items-start gap-2 mb-8 px-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm bg-sticky-yellow text-ink text-[10px] font-handwriting shadow-tape -rotate-2">
            <Sparkles className="w-3 h-3" />
            <span>v1.0.0</span>
          </div>
          <h1 className="text-2xl font-handwriting tracking-normal flex items-center">
            <span className="text-ink">UrusDiri</span>
            <span className="text-doodle-primary highlight">Sendiri</span>
          </h1>
        </div>

        <div className="flex items-center justify-around py-2 md:flex-col md:space-y-2 md:justify-start">
          {/* First two tabs */}
          {tabs.slice(0, 2).map(({ id, icon: Icon, label, path }, index) => (
            <button
              key={id}
              onClick={() => handleNavigate(path)}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 transition-all duration-150",
                "md:flex-row md:w-full md:px-4 md:py-3 md:gap-3",
                // Active state - sticky note style
                activeTab === id
                  ? cn(
                    "bg-sticky-yellow text-ink shadow-sticky rounded-sm font-handwriting",
                    tabRotations[index]
                  )
                  : "text-pencil hover:text-ink hover:bg-paper-lines/20 rounded-sm"
              )}
            >
              <Icon
                className={cn(
                  "w-6 h-6 transition-transform duration-150",
                  activeTab === id && "scale-105 md:scale-100"
                )}
                strokeWidth={activeTab === id ? 2.5 : 2}
              />
              <span className={cn(
                "text-[10px] md:text-sm font-handwriting",
                activeTab === id ? "font-semibold" : "font-normal"
              )}>{label}</span>
            </button>
          ))}

          {/* Central Log Button (Mobile) - Pencil/Pen style */}
          <div className="md:hidden -mt-8">
            <button
              onClick={() => handleNavigate('/log-creator')}
              className={cn(
                "h-14 w-14 rounded-full flex items-center justify-center",
                "bg-doodle-primary text-white",
                "shadow-[2px_2px_0_0_rgba(0,0,0,0.2)]",
                "border-2 border-ink/20",
                "transform active:scale-95 transition-transform duration-150",
                "will-change-transform"
              )}
            >
              <Plus className="w-7 h-7" strokeWidth={3} />
            </button>
          </div>

          {/* Right Tabs */}
          {tabs.slice(2).map(({ id, icon: Icon, label, path }, index) => (
            <button
              key={id}
              onClick={() => handleNavigate(path)}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 transition-all duration-150",
                "md:flex-row md:w-full md:px-4 md:py-3 md:gap-3",
                // Active state - sticky note style
                activeTab === id
                  ? cn(
                    "bg-sticky-yellow text-ink shadow-sticky rounded-sm font-handwriting",
                    tabRotations[index + 2]
                  )
                  : "text-pencil hover:text-ink hover:bg-paper-lines/20 rounded-sm"
              )}
            >
              <Icon
                className={cn(
                  "w-6 h-6 transition-transform duration-150",
                  activeTab === id && "scale-105 md:scale-100"
                )}
                strokeWidth={activeTab === id ? 2.5 : 2}
              />
              <span className={cn(
                "text-[10px] md:text-sm font-handwriting",
                activeTab === id ? "font-semibold" : "font-normal"
              )}>{label}</span>
            </button>
          ))}
        </div>

        {/* Desktop: Quick Log Special Button */}
        <div className="hidden md:block px-4 mt-4">
          <div className="border-t-2 border-dashed border-paper-lines pt-4 mb-4">
            <button
              onClick={() => handleNavigate('/log-creator')}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 transition-all duration-150",
                "bg-sticky-blue text-ink shadow-sticky rounded-sm font-handwriting",
                "hover:shadow-sticky-hover hover:-rotate-1",
                "transform active:scale-95"
              )}
            >
              <Plus className="w-5 h-5" strokeWidth={2.5} />
              <div className="flex flex-col items-start flex-1">
                <span className="text-sm font-semibold">{t.navigation.quick_log}</span>
                <span className="text-[10px] opacity-70">{t.navigation.quick_log_shortcut}</span>
              </div>
            </button>
          </div>
        </div>

        {/* Desktop: Additional Doodle Decoration */}
        <div className="hidden md:block mt-auto px-4 pt-8">
          <div className="border-t-2 border-dashed border-paper-lines pt-4">
            <p className="font-handwriting text-sm text-pencil italic">
              "Belajar terus, yuk!" ✏️
            </p>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;

