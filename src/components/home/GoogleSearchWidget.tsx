
import { Search } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

export const GoogleSearchWidget = () => {
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Auto-focus on mount
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        window.location.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    };

    return (
        <form onSubmit={handleSearch} className="w-full relative group">
            <div className="relative flex items-center">
                <Search className="absolute left-4 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search Google..."
                    className="w-full h-12 pl-12 pr-4 rounded-full bg-secondary/50 border border-border/50 hover:border-primary/30 focus:border-primary focus:bg-background/80 focus:ring-4 focus:ring-primary/10 transition-all outline-none text-foreground placeholder:text-muted-foreground/70 shadow-sm"
                />
            </div>
        </form>
    );
};
