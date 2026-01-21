import { useState } from 'react';
import { Image as ImageIcon, ExternalLink, X, Camera } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/i18n/LanguageContext';
import { compressImage } from '@/lib/image-utils';

interface ImageUploadSectionProps {
    images: string[];
    setImages: React.Dispatch<React.SetStateAction<string[]>>;
}

export const ImageUploadSection = ({ images, setImages }: ImageUploadSectionProps) => {
    const { t } = useLanguage();
    const { toast } = useToast();
    const [linkInput, setLinkInput] = useState('');
    const [showLinkInput, setShowLinkInput] = useState(false);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (images.length + files.length > 3) {
            toast({
                title: t.checkin.image_limit,
                variant: "destructive"
            });
            return;
        }

        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = reader.result as string;
                try {
                    const compressed = await compressImage(base64, 800, 0.7);
                    setImages(prev => [...prev, compressed]);
                } catch (err) {
                    console.error('Compression failed', err);
                    setImages(prev => [...prev, base64]);
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const addLinkImage = () => {
        if (!linkInput.trim()) return;
        if (images.length >= 3) {
            toast({ title: t.checkin.image_limit, variant: "destructive" });
            return;
        }
        setImages(prev => [...prev, linkInput.trim()]);
        setLinkInput('');
        setShowLinkInput(false);
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="bg-card rounded-sm p-4 border-2 border-paper-lines/50 shadow-notebook">
            <label className="flex items-center gap-2 font-handwriting text-base text-ink mb-3">
                <ImageIcon className="w-5 h-5 text-sticky-pink" />
                {t.checkin.add_images}
            </label>

            <div className="flex flex-wrap gap-3">
                {images.map((img, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded-sm overflow-hidden shadow-notebook border-2 border-paper-lines">
                        {img.startsWith('http') ? (
                            <a
                                href={img}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full h-full flex items-center justify-center bg-sticky-blue/30 hover:bg-sticky-blue/50 transition-colors"
                            >
                                <ExternalLink className="w-6 h-6 text-doodle-primary" />
                            </a>
                        ) : (
                            <img src={img} alt="Preview" className="w-full h-full object-cover" />
                        )}
                        <button
                            onClick={() => removeImage(idx)}
                            className="absolute top-1 right-1 bg-paper/90 p-1 rounded-sm text-ink hover:bg-doodle-red hover:text-white transition-colors"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                ))}

                {images.length < 3 && (
                    <div className="flex gap-3">
                        <label className="w-20 h-20 rounded-sm border-2 border-dashed border-sticky-pink/50 bg-sticky-pink/10 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-sticky-pink/20 transition-colors group">
                            <Camera className="w-5 h-5 text-ink/60 group-hover:text-ink" />
                            <span className="text-[10px] font-handwriting text-ink/60 group-hover:text-ink">{t.checkin.camera}</span>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                        </label>

                        <button
                            onClick={() => setShowLinkInput(!showLinkInput)}
                            className="w-20 h-20 rounded-sm border-2 border-dashed border-sticky-blue/50 bg-sticky-blue/10 flex flex-col items-center justify-center gap-1 hover:bg-sticky-blue/20 transition-colors group"
                        >
                            <ExternalLink className="w-5 h-5 text-ink/60 group-hover:text-ink" />
                            <span className="text-[10px] font-handwriting text-ink/60 group-hover:text-ink">{t.checkin.url}</span>
                        </button>
                    </div>
                )}
            </div>

            {showLinkInput && (
                <div className="mt-3 flex gap-2">
                    <Input
                        value={linkInput}
                        onChange={(e) => setLinkInput(e.target.value)}
                        placeholder={t.checkin.paste_link_placeholder}
                        variant="notebook"
                        className="font-handwriting"
                    />
                    <Button
                        onClick={addLinkImage}
                        className="rounded-sm font-handwriting"
                    >
                        {t.checkin.ok}
                    </Button>
                </div>
            )}

            <p className="text-xs font-handwriting text-pencil mt-2 italic">
                {t.checkin.image_limit}
            </p>
        </div>
    );
};
