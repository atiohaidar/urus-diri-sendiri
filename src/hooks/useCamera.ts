import { useState, useRef, useCallback, useEffect } from 'react';

interface UseCameraOptions {
    /** Initial facing mode */
    initialFacing?: 'user' | 'environment';
    /** Video constraints */
    videoConstraints?: MediaTrackConstraints;
}

interface UseCameraReturn {
    /** Ref to attach to video element */
    videoRef: React.RefObject<HTMLVideoElement>;
    /** Whether camera is currently active */
    isActive: boolean;
    /** Current facing mode */
    facing: 'user' | 'environment';
    /** Start the camera */
    start: (facing?: 'user' | 'environment') => Promise<void>;
    /** Stop the camera */
    stop: () => void;
    /** Switch between front and back camera */
    switchCamera: () => Promise<void>;
    /** Capture a photo from the video stream */
    capturePhoto: (quality?: number) => Promise<string | null>;
    /** Error if camera access failed */
    error: string | null;
}

/**
 * Custom hook for camera functionality
 * Handles camera stream lifecycle, capture, and cleanup
 */
export const useCamera = (options: UseCameraOptions = {}): UseCameraReturn => {
    const {
        initialFacing = 'environment',
        videoConstraints = { width: { ideal: 1920 }, height: { ideal: 1080 } }
    } = options;

    const [isActive, setIsActive] = useState(false);
    const [facing, setFacing] = useState<'user' | 'environment'>(initialFacing);
    const [error, setError] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Cleanup function
    const cleanup = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                track.stop();
                console.log('Camera track stopped:', track.label);
            });
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }, []);

    // Clean up on unmount
    useEffect(() => {
        return cleanup;
    }, [cleanup]);

    const start = useCallback(async (newFacing?: 'user' | 'environment') => {
        try {
            setError(null);

            // Stop any existing stream
            cleanup();

            const facingToUse = newFacing || facing;
            if (newFacing) setFacing(newFacing);

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: facingToUse,
                    ...videoConstraints
                },
                audio: false
            });

            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setIsActive(true);
        } catch (err: any) {
            console.error('Camera start error:', err);
            setError(err.message || 'Kamera tidak dapat diakses');
            setIsActive(false);
        }
    }, [facing, videoConstraints, cleanup]);

    const stop = useCallback(() => {
        cleanup();
        setIsActive(false);
    }, [cleanup]);

    const switchCamera = useCallback(async () => {
        const newFacing = facing === 'user' ? 'environment' : 'user';
        await start(newFacing);
    }, [facing, start]);

    const capturePhoto = useCallback(async (quality: number = 0.85): Promise<string | null> => {
        if (!videoRef.current || !isActive) return null;

        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        // Mirror if using front camera
        if (facing === 'user') {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
        }

        ctx.drawImage(video, 0, 0);
        return canvas.toDataURL('image/jpeg', quality);
    }, [isActive, facing]);

    return {
        videoRef,
        isActive,
        facing,
        start,
        stop,
        switchCamera,
        capturePhoto,
        error
    };
};
