import { useState, useEffect } from 'react';
import { Quote, PenLine } from 'lucide-react';

const quotes = [
    { text: "Kata-kata hari ini: Semangat", author: "Aku" },

];

const DailyQuote = () => {
    const [quote, setQuote] = useState(quotes[0]);

    useEffect(() => {
        const today = new Date();
        const start = new Date(today.getFullYear(), 0, 0);
        const diff = (today.getTime() - start.getTime()) + ((start.getTimezoneOffset() - today.getTimezoneOffset()) * 60 * 1000);
        const oneDay = 1000 * 60 * 60 * 24;
        const dayOfYear = Math.floor(diff / oneDay);

        const quoteIndex = dayOfYear % quotes.length;
        setQuote(quotes[quoteIndex]);
    }, []);

    return (
        <div className="bg-sticky-yellow/20 border-2 border-dashed border-sticky-yellow/50 rounded-sm p-6 mb-8 relative overflow-hidden shadow-notebook group hover:shadow-notebook-hover transition-all duration-300 rotate-1">
            {/* Tape decoration */}
            <div className="absolute -top-2 left-8 w-12 h-4 bg-sticky-pink/60 shadow-tape rounded-sm -rotate-6" />

            {/* Decorator */}
            <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-40 transition-opacity duration-300">
                <PenLine className="w-12 h-12 text-ink rotate-12" />
            </div>

            <div className="relative z-10 flex flex-col items-center text-center space-y-3">
                <Quote className="w-6 h-6 text-ink/30 mb-1" />
                <p className="font-handwriting text-lg md:text-xl text-ink leading-relaxed italic max-w-2xl">
                    "{quote.text}"
                </p>
                <div className="flex items-center gap-2">
                    <div className="h-0.5 w-8 bg-ink/20 rounded-full" />
                    <PenLine className="w-3 h-3 text-ink/30" />
                    <div className="h-0.5 w-8 bg-ink/20 rounded-full" />
                </div>
                <p className="font-handwriting text-sm text-pencil">
                    — {quote.author}
                </p>
            </div>
        </div>
    );
};

export default DailyQuote;
