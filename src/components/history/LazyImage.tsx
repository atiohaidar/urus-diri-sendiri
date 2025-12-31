import { useState, useEffect } from 'react';
import { getImage } from '@/lib/idb';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyImageProps {
    imageId: string;
    className?: string;
}

export const LazyImage = ({ imageId, className }: LazyImageProps) => {
    const [src, setSrc] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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
    }, [imageId]);

    if (loading) {
        return <Skeleton className={className} />;
    }

    if (!src) return null;

    return (
        <img
            src={src}
            alt="Reflection"
            className={className}
            loading="lazy"
        />
    );
};
