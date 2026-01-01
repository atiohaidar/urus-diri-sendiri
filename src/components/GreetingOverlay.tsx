import { useState, useEffect } from 'react';
import { X, Quote, Sun } from 'lucide-react';

const quotes = [
    { text: "Kata-kata hari ini: Semangat XD", author: "Aku" },

];

const GreetingOverlay = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [quote, setQuote] = useState(quotes[0]);

    useEffect(() => {
        // Check session storage to show only once per session
        const hasSeenGreeting = sessionStorage.getItem('has_seen_greeting');
        if (!hasSeenGreeting) {
            setIsVisible(true);

            // Set daily quote
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

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm animate-in fade-in duration-500">
            <div className="container max-w-md px-6 text-center space-y-8 animate-in slide-in-from-bottom-8 duration-700 delay-100">

                <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-primary/10">
                    <Sun className="w-10 h-10 text-primary animate-pulse-slow" />
                </div>

                <div className="space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">
                        Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}!
                    </h2>
                    <p className="text-muted-foreground">Ready to win the day?</p>
                </div>

                <div className="bg-card p-6 rounded-3xl shadow-lg border border-border/50 relative overflow-hidden">
                    <Quote className="absolute top-4 left-4 w-8 h-8 text-primary/10" />
                    <p className="text-lg font-medium text-foreground italic leading-relaxed relative z-10 px-2 min-h-[80px] flex items-center justify-center">
                        "{quote.text}"
                    </p>
                    <p className="text-sm text-primary font-semibold mt-4">— {quote.author}</p>
                </div>

                <div className="pt-4">
                    <button
                        onClick={handleDismiss}
                        className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-2xl shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                    >
                        Let's Go 🚀
                    </button>
                </div>

            </div>
        </div>
    );
};

export default GreetingOverlay;
