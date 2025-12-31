import { useState, useRef } from 'react';
import { Camera, Send, X, Image as ImageIcon, Type, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { saveImage } from '@/lib/idb';
import { saveLog } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { triggerHaptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';

interface LogCreatorProps {
    children: React.ReactNode;
}

const LogCreator = ({ children }: LogCreatorProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState<'camera' | 'text'>('camera');
    const [caption, setCaption] = useState('');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    // Quick chips for context
    const tags = ['Working 💻', 'Learning 📚', 'Workout 🏃', 'Ibadah 🕌', 'Chill ☕', 'Ideas 💡'];
    const [selectedTag, setSelectedTag] = useState<string | null>(null);

    const handleTakePhoto = async () => {
        try {
            const image = await CapacitorCamera.getPhoto({
                quality: 80,
                allowEditing: false,
                resultType: CameraResultType.Base64,
                source: CameraSource.Camera, // Force Camera (Snap & Go feel)
            });

            if (image.base64String) {
                const base64Data = `data:image/${image.format};base64,${image.base64String}`;
                setImagePreview(base64Data);
                setMode('camera'); // Switch to camera/preview mode
            }
        } catch (error) {
            console.log('User cancelled or error', error);
            // Fallback for web dev mostly, or if user cancels
            if (mode === 'camera' && !imagePreview) {
                // Keep modal open but maybe switch to text or stay
            }
        }
    };

    const handleSubmit = async () => {
        if (!caption.trim() && !imagePreview) return;

        setIsSubmitting(true);
        triggerHaptic();

        try {
            let mediaId;
            if (imagePreview) {
                // Save image to IndexedDB
                mediaId = await saveImage(imagePreview);
            }

            // Save text only if present OR if we have an image
            saveLog({
                type: imagePreview ? 'photo' : 'text',
                content: caption,
                mediaId: mediaId,
                category: selectedTag || undefined
            });

            toast({ title: "Moment captured! 📸" });

            // Reset & Close
            setCaption('');
            setImagePreview(null);
            setSelectedTag(null);
            setIsOpen(false);
        } catch (e) {
            console.error(e);
            toast({ title: "Failed to save", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const onOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (open) {
            // Auto open camera if opening modal and no preview yet
            // Delay slightly for smoother transition
            if (!imagePreview) {
                // Option: Auto-trigger camera? Maybe too aggressive for web, but good for mobile app feel.
                // let's stick to user choice for now or default to Text input focus.
                setMode('text');
            }
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md p-0 gap-0 bg-background border-none shadow-none h-full md:h-auto max-h-[100dvh] flex flex-col">
                {/* Header */}
                <div className="p-4 flex items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-10">
                    <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="-ml-2">
                        <X className="w-6 h-6" />
                    </Button>
                    <span className="font-semibold">{imagePreview ? 'Add Caption' : 'New Log'}</span>
                    <Button
                        onClick={handleSubmit}
                        disabled={(!caption.trim() && !imagePreview) || isSubmitting}
                        className={cn("rounded-full font-bold transition-all",
                            imagePreview ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        )}
                        size="sm"
                    >
                        {isSubmitting ? <Sparkles className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        <span className="ml-2">Post</span>
                    </Button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto bg-muted/10 flex flex-col">

                    {/* Image Preview / Camera Trigger */}
                    <div className="p-4 pb-0">
                        {imagePreview ? (
                            <div className="relative rounded-2xl overflow-hidden shadow-lg border border-border/50 group">
                                <img src={imagePreview} alt="Preview" className="w-full h-auto max-h-[60vh] object-cover" />
                                <Button
                                    size="icon"
                                    className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => setImagePreview(null)}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <button
                                    onClick={handleTakePhoto}
                                    className="h-32 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 flex flex-col items-center justify-center gap-2 text-primary transition-colors active:scale-95 duration-200"
                                >
                                    <div className="p-3 bg-background rounded-full shadow-sm">
                                        <Camera className="w-6 h-6" />
                                    </div>
                                    <span className="font-medium text-sm">Snap Photo</span>
                                </button>
                                <button
                                    onClick={() => setMode('text')}
                                    className="h-32 rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-muted/30 hover:bg-muted/50 flex flex-col items-center justify-center gap-2 text-muted-foreground transition-colors active:scale-95 duration-200"
                                >
                                    <div className="p-3 bg-background rounded-full shadow-sm">
                                        <Type className="w-6 h-6" />
                                    </div>
                                    <span className="font-medium text-sm">Text Only</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Text Input */}
                    <div className="p-4 pt-4">
                        <Textarea
                            autoFocus={!imagePreview}
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            placeholder={imagePreview ? "Add a caption..." : "What are you doing right now?"}
                            className="min-h-[120px] text-lg bg-transparent border-none resize-none px-0 focus-visible:ring-0 placeholder:text-muted-foreground/50"
                        />
                    </div>

                    {/* Chips / Categories */}
                    <div className="p-4 mt-auto sticky bottom-0 bg-gradient-to-t from-background via-background to-transparent pb-6">
                        <p className="text-xs font-medium text-muted-foreground mb-3 px-1">Quick Tags</p>
                        <div className="flex flex-wrap gap-2">
                            {tags.map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => {
                                        setSelectedTag(tag === selectedTag ? null : tag);
                                        triggerHaptic();
                                    }}
                                    className={cn(
                                        "px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95",
                                        selectedTag === tag
                                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                            : "bg-secondary/50 text-secondary-foreground hover:bg-secondary"
                                    )}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default LogCreator;
