
import { Search } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

export const GoogleSearchWidget = () => {
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
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
                <Search className="absolute left-4 w-5 h-5 text-pencil group-focus-within:text-doodle-primary transition-colors" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Cari di Google..."
                    className="w-full h-12 pl-12 pr-4 rounded-sm bg-paper border-2 border-dashed border-paper-lines hover:border-doodle-primary/30 focus:border-doodle-primary focus:bg-card focus:ring-2 focus:ring-doodle-primary/20 transition-all outline-none font-handwriting text-ink placeholder:text-pencil/50 shadow-notebook"
                />
            </div>
        </form>
    );
};
