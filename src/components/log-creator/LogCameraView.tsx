import { X, Image as ImageIcon, FlipHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UseCameraReturn } from '@/hooks/useCamera';

interface LogCameraViewProps {
    camera: UseCameraReturn;
    flashEffect: boolean;
    onPickGallery: () => void;
    onCapture: () => void;
}

export const LogCameraView = ({ camera, flashEffect, onPickGallery, onCapture }: LogCameraViewProps) => {
    if (!camera.isActive) return null;

    return (
        <div className="absolute inset-0 z-10 bg-black">
            <video
                ref={camera.videoRef}
                autoPlay
                playsInline
                className={cn("w-full h-full object-cover", camera.facing === 'user' && "scale-x-[-1]")}
            />
            {flashEffect && <div className="absolute inset-0 bg-white z-20" />}

            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-30 safe-top">
                <button onClick={camera.stop} className="p-3 bg-black/30 backdrop-blur-md rounded-full text-white">
                    <X className="w-6 h-6" />
                </button>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-12 flex justify-around items-center z-30 safe-bottom">
                <button onClick={onPickGallery} className="p-4 bg-white/10 backdrop-blur-md rounded-full text-white active:scale-90 transition-transform">
                    <ImageIcon className="w-7 h-7" />
                </button>

                <button
                    onClick={onCapture}
                    className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1 active:scale-95 transition-all shadow-xl"
                >
                    <div className="w-full h-full bg-white rounded-full" />
                </button>

                <button
                    onClick={camera.switchCamera}
                    className="p-4 bg-white/10 backdrop-blur-md rounded-full text-white active:scale-90 transition-transform"
                >
                    <FlipHorizontal className="w-7 h-7" />
                </button>
            </div>
        </div>
    );
};
