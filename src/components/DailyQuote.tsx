import { useState, useEffect } from 'react';
import { Quote } from 'lucide-react';

const quotes = [
    { text: "Small daily improvements are the key to staggering long-term results.", author: "Unknown" },
    { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
    { text: "The secret of your future is hidden in your daily routine.", author: "Mike Murdock" },
    { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
    { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
    { text: "Your life changes the moment you make a new, congruent, and committed decision.", author: "Tony Robbins" },
    { text: "Discipline is doing what needs to be done, even if you don't want to do it.", author: "Unknown" },
    { text: "The only bad workout is the one that didn't happen.", author: "Unknown" },
    { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
    { text: "Act as if what you do makes a difference. It does.", author: "William James" },
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
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/10 rounded-2xl p-4 md:p-6 mb-6 relative overflow-hidden">
            <Quote className="absolute top-2 right-2 w-12 h-12 text-primary/5 rotate-12" />
            <div className="relative z-10">
                <p className="text-sm md:text-base font-medium text-foreground italic leading-relaxed">
                    "{quote.text}"
                </p>
                <p className="text-xs text-muted-foreground mt-2 font-semibold">
                    — {quote.author}
                </p>
            </div>
        </div>
    );
};

export default DailyQuote;
