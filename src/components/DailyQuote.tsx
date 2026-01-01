import { useState, useEffect } from 'react';
import { Quote } from 'lucide-react';

const quotes = [
    { text: "Kata-kata hari ini: Semangat", author: "Aku" },

];

const DailyQuote = () => {
    const [quote, setQuote] = useState(quotes[0]);

    useEffect(() => {
        // Deterministic random based on date
        const today = new Date();
        const start = new Date(today.getFullYear(), 0, 0);
        const diff = (today.getTime() - start.getTime()) + ((start.getTimezoneOffset() - today.getTimezoneOffset()) * 60 * 1000);
        const oneDay = 1000 * 60 * 60 * 24;
        const dayOfYear = Math.floor(diff / oneDay);

        const quoteIndex = dayOfYear % quotes.length;
        setQuote(quotes[quoteIndex]);
    }, []);

    return (
        <div className="bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10 border border-indigo-500/10 rounded-3xl p-6 mb-8 relative overflow-hidden backdrop-blur-sm group hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-500">
            {/* Decorator */}
            <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity duration-300">
                <Quote className="w-16 h-16 text-indigo-500 rotate-12" />
            </div>

            <div className="relative z-10 flex flex-col items-center text-center space-y-3">
                <Quote className="w-6 h-6 text-indigo-500/50 mb-1" />
                <p className="text-lg md:text-xl font-medium text-foreground leading-relaxed italic max-w-2xl">
                    "{quote.text}"
                </p>
                <div className="h-1 w-12 bg-indigo-500/20 rounded-full my-2"></div>
                <p className="text-xs md:text-sm text-muted-foreground font-semibold tracking-wider uppercase">
                    {quote.author}
                </p>
            </div>
        </div>
    );
};

export default DailyQuote;
