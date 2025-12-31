import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

interface MainLayoutProps {
    children: ReactNode;
    className?: string;
    showMobileHeader?: boolean;
    headerContent?: ReactNode;
    greeting?: string;
}

const MainLayout = ({
    children,
    className,
    showMobileHeader = true,
    headerContent,
    greeting
}: MainLayoutProps) => {
    const currentDate = new Date();

    return (
        <div className="min-h-screen bg-background pb-24 md:pb-10">
            {/* Mobile Header - Optional */}
            {showMobileHeader && (
                <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 md:hidden">
                    <div className="container max-w-md mx-auto px-4 py-4">
                        {headerContent ? headerContent : (
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-xl font-bold text-foreground">{greeting || "Hello"} 👋</h1>
                                    <p className="text-sm font-medium text-muted-foreground/90 mt-1">
                                        {currentDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                    <Sparkles className="w-5 h-5 text-primary" />
                                </div>
                            </div>
                        )}
                    </div>
                </header>
            )}

            {/* Main Content Container */}
            <main className={cn(
                "container mx-auto px-4 py-6 md:py-12",
                "max-w-md md:max-w-5xl",
                className
            )}>
                {children}
            </main>
        </div>
    );
};

export default MainLayout;
