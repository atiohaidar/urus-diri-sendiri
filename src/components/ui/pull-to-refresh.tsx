import { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Loader2, ArrowDown } from 'lucide-react';

interface PullToRefreshProps {
    onRefresh: () => Promise<void>;
    children: React.ReactNode;
    className?: string;
}

export const PullToRefresh = ({ onRefresh, children, className }: PullToRefreshProps) => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const y = useMotionValue(0);
    const rotate = useTransform(y, [0, 80], [0, 360]);
    const opacity = useTransform(y, [0, 40], [0, 1]);

    // Threshold to trigger refresh
    const PULL_THRESHOLD = 80;

    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        let startY = 0;
        let isDragging = false;

        const handleTouchStart = (e: TouchEvent) => {
            // Only enable if we are at the top of the scroll
            if (window.scrollY > 0) return;

            // Also check if any parent scrollable container is not at top? 
            // For simplicity, we just check window for now, but strictly speaking 
            // we might need to check the target's scroll parent. 
            // Given the specific layout of HomeScreen, the main scroll is the one that matters.

            startY = e.touches[0].clientY;
            isDragging = true;
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!isDragging) return;
            if (window.scrollY > 0) return;
            if (isRefreshing) return;

            const currentY = e.touches[0].clientY;
            const diff = currentY - startY;

            // Only handle pull down
            if (diff > 0) {
                // Add resistance/damping
                const damped = Math.min(diff * 0.5, 150);
                y.set(damped);

                // Prevent default scrolling if we are pulling down at the top
                // This is important to prevent native browser refresh or scroll bouncing
                if (e.cancelable && diff < PULL_THRESHOLD * 1.5) {
                    // e.preventDefault(); // Sometimes this blocks normal scroll, be careful
                }
            } else {
                // pushing up, ignore
                y.set(0);
            }
        };

        const handleTouchEnd = async () => {
            if (!isDragging) return;
            isDragging = false;

            const currentY = y.get();

            if (currentY > PULL_THRESHOLD) {
                setIsRefreshing(true);
                // Snap to loading position
                animate(y, PULL_THRESHOLD, { type: 'spring', stiffness: 300, damping: 30 });

                try {
                    await onRefresh();
                } finally {
                    setIsRefreshing(false);
                    animate(y, 0, { type: 'spring', stiffness: 300, damping: 30 });
                }
            } else {
                // Snap back to 0
                animate(y, 0, { type: 'spring', stiffness: 300, damping: 30 });
            }
        };

        container.addEventListener('touchstart', handleTouchStart);
        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        container.addEventListener('touchend', handleTouchEnd);

        return () => {
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isRefreshing, onRefresh, y]);

    return (
        <div ref={containerRef} className={`relative touch-pan-y ${className}`}>
            {/* Loading Indicator Overlay */}
            <motion.div
                style={{ y, opacity }}
                className="absolute top-0 left-0 right-0 flex justify-center z-50 pointer-events-none"
            >
                <div className="mt-[-40px] h-10 flex items-center justify-center p-2 rounded-full bg-background/80 backdrop-blur shadow-md border border-border">
                    {isRefreshing ? (
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    ) : (
                        <motion.div style={{ rotate }}>
                            <ArrowDown className="w-5 h-5 text-primary" />
                        </motion.div>
                    )}
                </div>
            </motion.div>

            {/* Content */}
            <motion.div style={{ y }}>
                {children}
            </motion.div>
        </div>
    );
};
