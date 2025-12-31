import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Construction, Rocket, Sprout, ArrowRight, Leaf, Plus, Trash2, CheckCircle2, Circle, Image as ImageIcon, X, Camera, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { saveReflection, getRoutines, getPriorities, getReflections } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/i18n/LanguageContext';
import { cn } from '@/lib/utils';
import { compressImage } from '@/lib/image-utils';
import { saveImage, getImage, deleteImage } from '@/lib/idb';
import { useEffect } from 'react';

const MaghribCheckinPage = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { t, language } = useLanguage();
    const [winOfDay, setWinOfDay] = useState('');
    const [hurdle, setHurdle] = useState('');
    const [priorities, setPriorities] = useState(['', '', '']);
    const [smallChange, setSmallChange] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [linkInput, setLinkInput] = useState('');
    const [showLinkInput, setShowLinkInput] = useState(false);

    useEffect(() => {
        const loadTodayData = async () => {
            const reflections = getReflections();
            const today = new Date().toDateString();
            const todayReflection = reflections.find(r => new Date(r.date).toDateString() === today);

            if (todayReflection) {
                setWinOfDay(todayReflection.winOfDay || '');
                setHurdle(todayReflection.hurdle || '');
                setPriorities(todayReflection.priorities.length > 0 ? [...todayReflection.priorities] : ['', '', '']);
                setSmallChange(todayReflection.smallChange || '');

                // Load images from IDB (local) and cloud URLs (Google Drive)
                const loadedImages: string[] = [];

                // 1. Get local images
                if (todayReflection.imageIds) {
                    for (const id of todayReflection.imageIds) {
                        const img = await getImage(id);
                        if (img) loadedImages.push(img);
                    }
                }

                // 2. Get cloud images (Google Drive links)
                if (todayReflection.images) {
                    todayReflection.images.forEach(url => {
                        if (url && url.startsWith('http')) {
                            loadedImages.push(url);
                        }
                    });
                }

                setImages(loadedImages);
            }
        };

        loadTodayData();
    }, []);

    const updatePriority = (index: number, value: string) => {
        const updated = [...priorities];
        updated[index] = value;
        setPriorities(updated);
    };

    const addPriorityRow = () => {
        setPriorities([...priorities, '']);
    };

    const removePriorityRow = (index: number) => {
        const updated = [...priorities];
        updated.splice(index, 1);
        setPriorities(updated);
    };

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
                    setImages(prev => [...prev, base64]); // Fallback
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

    const handleSave = async () => {
        // Capture snapshots of today
        const todayRoutines = getRoutines();
        const todayPriorities = getPriorities();

        // Clean up old images for TODAY if editing
        const reflections = getReflections();
        const todayStr = new Date().toDateString();
        const existingToday = reflections.find(r => new Date(r.date).toDateString() === todayStr);
        if (existingToday?.imageIds) {
            for (const id of existingToday.imageIds) {
                await deleteImage(id);
            }
        }

        // Differentiate between local (base64) and cloud (URL) images
        const imageIds: string[] = [];
        const cloudUrls: string[] = [];

        for (let i = 0; i < images.length; i++) {
            if (images[i].startsWith('http')) {
                cloudUrls.push(images[i]);
            } else {
                const id = `img-${Date.now()}-${i}`;
                await saveImage(id, images[i]);
                imageIds.push(id);
            }
        }

        saveReflection({
            date: new Date().toISOString(),
            winOfDay,
            hurdle,
            priorities: priorities.filter(p => p.trim()),
            smallChange,
            todayRoutines,
            todayPriorities,
            images: cloudUrls,
            imageIds
        });

        toast({
            title: t.checkin.save_toast_title,
            description: t.checkin.save_toast_desc,
        });

        navigate('/');
    };

    const today = new Date().toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'short'
    });

    return (
        <div className="min-h-screen bg-background pb-24 md:pb-8 animate-in fade-in slide-in-from-bottom-4 duration-300 md:pl-64">
            <div className="container max-w-4xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="-ml-2 rounded-full"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <span className="font-medium">{t.checkin.title}</span>
                    <span className="text-sm text-primary font-medium">{today}</span>
                </div>

                {/* Title */}
                <div className="mb-8 text-center md:text-left">
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{t.checkin.title}</h1>
                    <p className="text-muted-foreground">{t.checkin.subtitle}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                    {/* Left Column */}
                    <div className="space-y-6">
                        {/* Win of the Day */}
                        <div className="animate-fade-in" style={{ animationDelay: '50ms' }}>
                            <label className="flex items-center gap-2 text-sm font-semibold mb-3">
                                <Trophy className="w-4 h-4 text-amber-500" />
                                {t.checkin.win_of_day}
                            </label>
                            <Textarea
                                value={winOfDay}
                                onChange={(e) => setWinOfDay(e.target.value)}
                                placeholder={t.checkin.win_placeholder}
                                className="min-h-[120px] bg-card rounded-2xl border-0 resize-none card-elevated focus-visible:ring-primary"
                            />
                        </div>

                        {/* The Hurdle */}
                        <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
                            <label className="flex items-center gap-2 text-sm font-semibold mb-3">
                                <Construction className="w-4 h-4 text-orange-500" />
                                {t.checkin.hurdle}
                            </label>
                            <Textarea
                                value={hurdle}
                                onChange={(e) => setHurdle(e.target.value)}
                                placeholder={t.checkin.hurdle_placeholder}
                                className="min-h-[120px] bg-card rounded-2xl border-0 resize-none card-elevated focus-visible:ring-primary"
                            />
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        {/* Top 3 Priorities */}
                        <div className="animate-fade-in" style={{ animationDelay: '150ms' }}>
                            <label className="flex items-center gap-2 text-sm font-semibold mb-3">
                                <Rocket className="w-4 h-4 text-primary" />
                                {t.checkin.priorities}
                            </label>
                            <div className="space-y-3">
                                {priorities.map((priority, index) => (
                                    <div key={index} className="flex items-center gap-3 group">
                                        <span className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                                            {index + 1}
                                        </span>
                                        <Input
                                            value={priority}
                                            onChange={(e) => updatePriority(index, e.target.value)}
                                            placeholder={index === 0 ? t.checkin.priority_1_placeholder : index === 1 ? t.checkin.priority_2_placeholder : t.checkin.priority_3_placeholder}
                                            className="bg-card rounded-xl border-0 h-11 card-elevated focus-visible:ring-primary"
                                        />
                                        {priorities.length > 1 && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full hover:bg-destructive/10 hover:text-destructive"
                                                onClick={() => removePriorityRow(index)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                                <Button
                                    variant="outline"
                                    onClick={addPriorityRow}
                                    className="w-full h-11 rounded-xl border-dashed border-2 bg-transparent hover:bg-secondary/50 gap-2 border-primary/30 text-primary"
                                >
                                    <Plus className="w-4 h-4" />
                                    Tambah Prioritas
                                </Button>
                            </div>
                        </div>

                        {/* Today's Review Snapshot */}
                        <div className="animate-fade-in" style={{ animationDelay: '250ms' }}>
                            <label className="flex items-center gap-2 text-sm font-semibold mb-3">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                Review Capaian Hari Ini
                            </label>
                            <div className="bg-card rounded-2xl p-4 card-elevated space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground font-medium">Rutinitas Selesai</span>
                                    <span className="text-primary font-bold">
                                        {getRoutines().filter(r => r.completedAt).length}/{getRoutines().length}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground font-medium">Prioritas Tercapai</span>
                                    <span className="text-primary font-bold">
                                        {getPriorities().filter(p => p.completed).length}/{getPriorities().length}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* One Small Change */}
                        <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
                            <label className="flex items-center gap-2 text-sm font-semibold mb-3">
                                <Sprout className="w-4 h-4 text-emerald-500" />
                                {t.checkin.small_change}
                            </label>
                            <Textarea
                                value={smallChange}
                                onChange={(e) => setSmallChange(e.target.value)}
                                placeholder={t.checkin.small_change_placeholder}
                                className="min-h-[80px] bg-card rounded-2xl border-0 resize-none card-elevated focus-visible:ring-primary"
                            />
                        </div>

                        {/* Image Upload */}
                        <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
                            <label className="flex items-center gap-2 text-sm font-semibold mb-3">
                                <ImageIcon className="w-4 h-4 text-pink-500" />
                                {t.checkin.add_images}
                            </label>

                            <div className="flex flex-wrap gap-3">
                                {images.map((img, idx) => (
                                    <div key={idx} className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-sm animate-in zoom-in-50 duration-200 bg-secondary/30 border border-border/50">
                                        {img.startsWith('http') ? (
                                            <a
                                                href={img}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full h-full flex items-center justify-center bg-primary/10 hover:bg-primary/20 transition-colors"
                                                title="View in Google Drive"
                                            >
                                                <ExternalLink className="w-6 h-6 text-primary" />
                                            </a>
                                        ) : (
                                            <img src={img} alt="Preview" className="w-full h-full object-cover" />
                                        )}
                                        <button
                                            onClick={() => removeImage(idx)}
                                            className="absolute top-1 right-1 bg-background/80 backdrop-blur-sm p-1 rounded-full text-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}

                                {images.length < 3 && (
                                    <div className="flex gap-3">
                                        <label className="w-20 h-20 rounded-2xl border-2 border-dashed border-primary/20 bg-primary/5 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-primary/10 transition-colors group">
                                            <Camera className="w-5 h-5 text-primary/60 group-hover:text-primary" />
                                            <span className="text-[10px] font-medium text-primary/60 group-hover:text-primary">Camera</span>
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
                                            className="w-20 h-20 rounded-2xl border-2 border-dashed border-primary/20 bg-primary/5 flex flex-col items-center justify-center gap-1 hover:bg-primary/10 transition-colors group"
                                        >
                                            <ExternalLink className="w-5 h-5 text-primary/60 group-hover:text-primary" />
                                            <span className="text-[10px] font-medium text-primary/60 group-hover:text-primary">URL</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {showLinkInput && (
                                <div className="mt-3 flex gap-2 animate-in slide-in-from-top-2 duration-200">
                                    <Input
                                        value={linkInput}
                                        onChange={(e) => setLinkInput(e.target.value)}
                                        placeholder="Paste Google Drive link here..."
                                        className="h-10 rounded-xl bg-card border-0 card-elevated"
                                    />
                                    <Button
                                        onClick={addLinkImage}
                                        className="h-10 rounded-xl px-4"
                                    >
                                        OK
                                    </Button>
                                </div>
                            )}

                            <p className="text-[10px] text-muted-foreground mt-2 px-1 italic">
                                {t.checkin.image_limit}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Decorative leaf */}
                <div className="flex justify-center my-8">
                    <Leaf className="w-6 h-6 text-primary/40" />
                </div>
            </div>

            {/* Save Button */}
            <div className="fixed bottom-0 left-0 right-0 md:left-64 p-4 bg-background/80 backdrop-blur-lg border-t border-border safe-bottom md:static md:bg-transparent md:border-0 md:p-0 md:mt-4">
                <div className="container max-w-4xl mx-auto md:px-4">
                    <Button
                        onClick={handleSave}
                        className="w-full h-14 rounded-2xl text-base font-semibold gap-2 shadow-lg shadow-primary/20 md:w-auto md:px-8 md:float-right"
                    >
                        {t.checkin.save}
                        <ArrowRight className="w-5 h-5" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default MaghribCheckinPage;
