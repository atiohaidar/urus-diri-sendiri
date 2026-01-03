import { useState, useEffect } from 'react';
import { X, Quote, Sun, PenLine, Sparkles } from 'lucide-react';

const quotes = [
    { text: "Kata-kata hari ini: Semangat XD", author: "Aku" },

];

const GreetingOverlay = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [quote, setQuote] = useState(quotes[0]);

    useEffect(() => {
        const hasSeenGreeting = sessionStorage.getItem('has_seen_greeting');
        if (!hasSeenGreeting) {
            setIsVisible(true);

            const today = new Date();
            const start = new Date(today.getFullYear(), 0, 0);
            const diff = (today.getTime() - start.getTime()) + ((start.getTimezoneOffset() - today.getTimezoneOffset()) * 60 * 1000);
            const oneDay = 1000 * 60 * 60 * 24;
            const dayOfYear = Math.floor(diff / oneDay);
            const quoteIndex = dayOfYear % quotes.length;
            setQuote(quotes[quoteIndex]);
        }
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        sessionStorage.setItem('has_seen_greeting', 'true');
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Selamat Pagi';
        if (hour < 17) return 'Selamat Siang';
        return 'Selamat Sore';
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-paper animate-in fade-in duration-500">
            <div className="container max-w-md px-6 text-center space-y-8 animate-in slide-in-from-bottom-8 duration-700 delay-100">

                {/* Icon - Sticky note style */}
                <div className="w-20 h-20 bg-sticky-yellow rounded-sm flex items-center justify-center mx-auto mb-6 shadow-sticky rotate-6">
                    <Sun className="w-10 h-10 text-ink" />
                </div>

                <div className="space-y-2">
                    <h2 className="font-handwriting text-4xl text-ink">
                        {getGreeting()}! 👋
                    </h2>
                    <p className="font-handwriting text-lg text-pencil">Siap untuk hari ini?</p>
                </div>

                {/* Quote Card - Notebook style */}
                <div className="bg-card p-6 rounded-sm shadow-notebook border-2 border-paper-lines/50 relative overflow-hidden -rotate-1">
                    {/* Tape decoration */}
                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-16 h-4 bg-sticky-blue/60 shadow-tape rounded-sm" />

                    <Quote className="absolute top-4 left-4 w-8 h-8 text-ink/10" />
                    <p className="font-handwriting text-lg text-ink italic leading-relaxed relative z-10 px-2 min-h-[80px] flex items-center justify-center">
                        "{quote.text}"
                    </p>
                    <p className="font-handwriting text-sm text-doodle-primary mt-4">— {quote.author}</p>
                </div>

                <div className="pt-4">
                    <button
                        onClick={handleDismiss}
                        className="w-full py-4 bg-doodle-primary text-white font-handwriting text-xl rounded-sm shadow-notebook hover:shadow-notebook-hover hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2"
                    >
                        Ayo Mulai! <Sparkles className="w-5 h-5" />
                    </button>
                </div>

            </div>
        </div>
    );
};

export default GreetingOverlay;
