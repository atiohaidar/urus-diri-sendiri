import { useState, useEffect, useRef } from 'react';
import { getImage } from '@/lib/idb';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyImageProps {
    imageId: string;
    className?: string;
}

export const LazyImage = ({ imageId, className }: LazyImageProps) => {
    const [src, setSrc] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isVisible, setIsVisible] = useState(false);
    const imgRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            {
                rootMargin: '200px', // Load images slightly before they appear
                threshold: 0.1
            }
        );

        if (imgRef.current) {
            observer.observe(imgRef.current);
        }

        return () => {
            if (observer) observer.disconnect();
        };
    }, []);

    useEffect(() => {
        if (!isVisible) return;

        let isMounted = true;

        const load = async () => {
            try {
                const data = await getImage(imageId);
                if (isMounted) {
                    setSrc(data);
                    setLoading(false);
                }
            } catch (err) {
                console.error('Failed to load image from IDB', err);
                if (isMounted) setLoading(false);
            }
        };

        load();
        return () => { isMounted = false; };
    }, [imageId, isVisible]);

    // Container for observation
    if (!isVisible || loading) {
        return <div ref={imgRef} className={className}><Skeleton className="w-full h-full" /></div>;
    }

    if (!src) return <div className={className} />; // Placeholder if no src found

    return (
        <img
            src={src}
            alt="Reflection"
            className={className}
            loading="lazy"
        />
    );
};
