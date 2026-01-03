import { useState, useRef, useEffect } from 'react';
import { Loader2, ArrowDown } from 'lucide-react';

interface PullToRefreshProps {
    onRefresh: () => Promise<void>;
    children: React.ReactNode;
    className?: string;
}

export const PullToRefresh = ({ onRefresh, children, className }: PullToRefreshProps) => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDraggingRef = useRef(false);
    const startYRef = useRef(0);

    // Threshold to trigger refresh
    const PULL_THRESHOLD = 80;

    // Calculate opacity based on pull distance
    const opacity = Math.min(pullDistance / 40, 1);
    const rotation = Math.min(pullDistance / 80 * 360, 360);

    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;

        const handleTouchStart = (e: TouchEvent) => {
            if (window.scrollY > 0) return;
            startYRef.current = e.touches[0].clientY;
            isDraggingRef.current = true;
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!isDraggingRef.current) return;
            if (window.scrollY > 0) {
                isDraggingRef.current = false;
                setPullDistance(0);
                return;
            }
            if (isRefreshing) return;

            const currentY = e.touches[0].clientY;
            const diff = currentY - startYRef.current;

            if (diff > 0) {
                const damped = Math.min(diff * 0.5, 150);
                setPullDistance(damped);

                if (e.cancelable && diff < PULL_THRESHOLD * 1.5) {
                    // Prevent native scroll/refresh behavior
                    // e.preventDefault(); 
                }
            } else {
                setPullDistance(0);
            }
        };

        const handleTouchEnd = async () => {
            if (!isDraggingRef.current) return;
            isDraggingRef.current = false;

            if (pullDistance > PULL_THRESHOLD) {
                setIsRefreshing(true);
                setPullDistance(PULL_THRESHOLD); // Snap to loading position

                try {
                    await onRefresh();
                } finally {
                    setIsRefreshing(false);
                    setPullDistance(0);
                }
            } else {
                setPullDistance(0); // Snap back to 0
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
    }, [isRefreshing, onRefresh, pullDistance]);

    return (
        <div ref={containerRef} className={`relative touch-pan-y ${className}`}>
            {/* Loading Indicator Overlay */}
            <div
                style={{
                    transform: `translateY(${pullDistance}px)`,
                    opacity: opacity,
                    transition: isDraggingRef.current ? 'none' : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}
                className="absolute top-0 left-0 right-0 flex justify-center z-50 pointer-events-none"
            >
                <div className="mt-[-40px] h-10 flex items-center justify-center p-2 rounded-full bg-paper shadow-notebook border-2 border-dashed border-paper-lines">
                    {isRefreshing ? (
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    ) : (
                        <div style={{ transform: `rotate(${rotation}deg)` }}>
                            <ArrowDown className="w-5 h-5 text-primary" />
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div
                style={{
                    transform: `translateY(${pullDistance}px)`,
                    transition: isDraggingRef.current ? 'none' : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}
            >
                {children}
            </div>
        </div>
    );
};
