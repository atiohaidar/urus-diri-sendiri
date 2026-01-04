import { useEffect, useRef } from 'react';

/**
 * Custom hook for debounced callbacks
 * @param callback - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export const useDebounce = <T extends (...args: any[]) => void>(
    callback: T,
    delay: number
): ((...args: Parameters<T>) => void) => {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const callbackRef = useRef(callback);

    // Update callback ref when it changes
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return (...args: Parameters<T>) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            callbackRef.current(...args);
        }, delay);
    };
};
