import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, PenLine, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getReflectionsAsync, saveReflection, getRoutines, getVisiblePriorities, initializeStorage } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/i18n/LanguageContext';
import { cn } from '@/lib/utils';
import { saveImage, getImage, deleteImage } from '@/lib/idb';

// Checkin Components
import { WinHurdleSection } from '@/components/checkin/WinHurdleSection';
import { PrioritiesSection } from '@/components/checkin/PrioritiesSection';
import { ReviewSection } from '@/components/checkin/ReviewSection';
import { SmallChangeSection } from '@/components/checkin/SmallChangeSection';
import { ImageUploadSection } from '@/components/checkin/ImageUploadSection';

const MaghribCheckinPage = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { t, language } = useLanguage();

    // Form States
    const [winOfDay, setWinOfDay] = useState('');
    const [hurdle, setHurdle] = useState('');
    const [priorities, setPriorities] = useState(['', '', '']);
    const [smallChange, setSmallChange] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadTodayData = async () => {
            setLoading(true);
            await initializeStorage(); // Ensure DB is ready
            const reflections = await getReflectionsAsync();
            const today = new Date().toDateString();
            const todayReflection = reflections.find(r => new Date(r.date).toDateString() === today);

            if (todayReflection) {
                setWinOfDay(todayReflection.winOfDay || '');
                setHurdle(todayReflection.hurdle || '');
                setPriorities(todayReflection.priorities.length > 0 ? [...todayReflection.priorities] : ['', '', '']);
                setSmallChange(todayReflection.smallChange || '');

                const loadedImages: string[] = [];
                // Load cached IDB images
                if (todayReflection.imageIds) {
                    for (const id of todayReflection.imageIds) {
                        const img = await getImage(id);
                        if (img) loadedImages.push(img);
                    }
                }
                // Load cloud URLs
                if (todayReflection.images) {
                    todayReflection.images.forEach(url => {
                        if (url && url.startsWith('http')) {
                            loadedImages.push(url);
                        }
                    });
                }
                setImages(loadedImages);
            }
            setLoading(false);
        };

        loadTodayData();
    }, []);

    const handleSave = async () => {
        const todayRoutines = getRoutines();
        const todayPriorities = getVisiblePriorities();

        const reflections = await getReflectionsAsync();
        const todayStr = new Date().toDateString();
        const existingToday = reflections.find(r => new Date(r.date).toDateString() === todayStr);

        // Clean up old images if updating
        if (existingToday?.imageIds) {
            for (const id of existingToday.imageIds) {
                await deleteImage(id);
            }
        }

        const imageIds: string[] = [];
        const cloudUrls: string[] = [];

        for (let i = 0; i < images.length; i++) {
            if (images[i].startsWith('http')) {
                cloudUrls.push(images[i]);
            } else {
                const id = await saveImage(images[i]);
                imageIds.push(id);
            }
        }

        await saveReflection({
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

    const todayDisplay = new Date().toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'short'
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-notebook flex items-center justify-center">
                <div className="w-12 h-12 bg-sticky-yellow shadow-sticky rounded-sm flex items-center justify-center animate-pulse">
                    <PenLine className="w-6 h-6 text-ink" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-notebook pb-24 md:pb-8 md:pl-64 pt-safe">
            <div className="container max-w-4xl mx-auto px-4 py-6">
                {/* Header - Notebook style */}
                <div className="flex items-center justify-between mb-6">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="-ml-2 rounded-sm text-pencil hover:text-ink"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <span className="font-handwriting text-lg text-ink">{t.checkin.title}</span>
                    <span className="px-3 py-1 bg-sticky-yellow text-ink text-sm font-handwriting rounded-sm shadow-tape -rotate-2">
                        {todayDisplay}
                    </span>
                </div>

                {/* Title */}
                <div className="mb-8 text-center md:text-left">
                    <h1 className="text-2xl md:text-3xl font-handwriting text-ink mb-2">
                        <span className="highlight">{t.checkin.title}</span> 🌙
                    </h1>
                    <p className="font-handwriting text-pencil">{t.checkin.subtitle}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                    {/* Left Column */}
                    <WinHurdleSection
                        winOfDay={winOfDay}
                        setWinOfDay={setWinOfDay}
                        hurdle={hurdle}
                        setHurdle={setHurdle}
                    />

                    {/* Right Column */}
                    <div className="space-y-6">
                        <PrioritiesSection
                            priorities={priorities}
                            setPriorities={setPriorities}
                        />

                        <ReviewSection />

                        <SmallChangeSection
                            smallChange={smallChange}
                            setSmallChange={setSmallChange}
                        />

                        <ImageUploadSection
                            images={images}
                            setImages={setImages}
                        />
                    </div>
                </div>

                {/* Decorative divider */}
                <div className="flex justify-center my-8">
                    <Leaf className="w-6 h-6 text-doodle-green/40" />
                </div>
            </div>

            {/* Save Button - Sticky note style */}
            <div className="fixed bottom-0 left-0 right-0 md:left-64 p-4 bg-paper border-t-2 border-dashed border-paper-lines pb-safe md:static md:bg-transparent md:border-0 md:p-0 md:mt-4">
                <div className="container max-w-4xl mx-auto md:px-4">
                    <Button
                        onClick={handleSave}
                        className={cn(
                            "w-full h-14 rounded-sm font-handwriting text-lg gap-2",
                            "bg-doodle-primary hover:bg-doodle-primary/90 text-white",
                            "shadow-[3px_3px_0_0_rgba(0,0,0,0.15)]",
                            "md:w-auto md:px-8 md:float-right"
                        )}
                    >
                        {t.checkin.save} ✓
                        <ArrowRight className="w-5 h-5" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default MaghribCheckinPage;
