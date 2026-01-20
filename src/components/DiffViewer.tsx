import { useState } from 'react';
import { generateLineDiff, getDiffStats, type DiffResult } from '@/lib/diff-utils';
import { cn } from '@/lib/utils';
import { Loader2, Plus, Minus } from 'lucide-react';

interface DiffViewerProps {
    oldTitle: string;
    oldContent: string;
    newTitle: string;
    newContent: string;
}

export const DiffViewer = ({ oldTitle, oldContent, newTitle, newContent }: DiffViewerProps) => {
    const [isLoading, setIsLoading] = useState(true);
    const [titleDiff, setTitleDiff] = useState<DiffResult[]>([]);
    const [contentDiff, setContentDiff] = useState<DiffResult[]>([]);
    const [stats, setStats] = useState({ additions: 0, deletions: 0 });

    // Generate diff on mount
    useState(() => {
        setTimeout(() => {
            const tDiff = generateLineDiff(oldTitle, newTitle);
            const cDiff = generateLineDiff(oldContent, newContent);
            const allDiffs = [...tDiff, ...cDiff];

            setTitleDiff(tDiff);
            setContentDiff(cDiff);
            setStats(getDiffStats(allDiffs));
            setIsLoading(false);
        }, 100);
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-doodle-primary" />
                <span className="ml-3 font-handwriting text-pencil text-lg">Menganalisis perbedaan...</span>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex gap-4 text-[11px] font-handwriting tracking-wide uppercase opacity-70">
                <div className="flex items-center gap-1.5 text-doodle-green bg-doodle-green/10 dark:bg-doodle-green/20 px-2.5 py-1 rounded-full border border-doodle-green/20">
                    <Plus className="w-3 h-3" /> {stats.additions} ditambahkan
                </div>
                <div className="flex items-center gap-1.5 text-doodle-red bg-doodle-red/10 dark:bg-doodle-red/20 px-2.5 py-1 rounded-full border border-doodle-red/20">
                    <Minus className="w-3 h-3" /> {stats.deletions} dihapus
                </div>
            </div>

            {titleDiff.some(d => d.added || d.removed) && (
                <div className="space-y-3">
                    <h4 className="font-handwriting text-base text-pencil flex items-center gap-2 px-1">
                        <span className="w-2 h-2 rounded-full bg-doodle-primary" />
                        Judul Catatan
                    </h4>
                    <div className="bg-paper dark:bg-card border-2 border-paper-lines p-5 font-handwriting text-xl shadow-inner rounded-xl leading-relaxed">
                        {titleDiff.map((part, index) => (
                            <span
                                key={index}
                                className={cn(
                                    part.added && 'bg-doodle-green/20 dark:bg-doodle-green/30 text-doodle-green px-1 rounded mx-0.5',
                                    part.removed && 'bg-doodle-red/20 dark:bg-doodle-red/30 text-doodle-red line-through px-1 rounded mx-0.5 opacity-70'
                                )}
                            >
                                {part.value}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <div className="space-y-3">
                <h4 className="font-handwriting text-base text-pencil flex items-center gap-2 px-1">
                    <span className="w-2 h-2 rounded-full bg-doodle-primary" />
                    Isi Catatan
                </h4>
                <div className="bg-paper dark:bg-black/20 border-2 border-paper-lines p-2 space-y-px max-h-[600px] overflow-y-auto rounded-xl shadow-inner backdrop-blur-sm">
                    {contentDiff.map((part, index) => {
                        const lines = part.value.split('\n');
                        return lines.map((line, lineIndex) => {
                            if (lineIndex === lines.length - 1 && !line.trim()) return null;

                            return (
                                <div
                                    key={`${index}-${lineIndex}`}
                                    className={cn(
                                        'px-4 py-1.5 rounded-md border-l-[3px] transition-all relative overflow-hidden group',
                                        part.added && 'bg-doodle-green/5 dark:bg-doodle-green/10 border-doodle-green/60 text-ink',
                                        part.removed && 'bg-doodle-red/5 dark:bg-doodle-red/10 border-doodle-red/60 text-ink/60 line-through decoration-doodle-red/30',
                                        !part.added && !part.removed && 'border-transparent text-ink/60 opacity-60'
                                    )}
                                >
                                    <div className="flex items-start gap-5">
                                        <span className={cn(
                                            "select-none min-w-[0.75rem] font-bold shrink-0 text-xs mt-1.5 font-mono opacity-50",
                                            part.added ? "text-doodle-green" : part.removed ? "text-doodle-red" : "text-pencil"
                                        )}>
                                            {part.added ? '+' : part.removed ? '-' : ' '}
                                        </span>

                                        {/* AGGRESSIVE RESET: !min-h-0 and all text element margins */}
                                        <div
                                            className="ql-editor !p-0 !min-h-0 font-sans text-[15px] leading-relaxed w-full overflow-x-auto [&_p]:my-0 [&_div]:my-0 [&_h1]:my-0 [&_h2]:my-0 [&_h3]:my-0 [&_ul]:my-0 [&_ol]:my-0"
                                            dangerouslySetInnerHTML={{ __html: line || '&nbsp;' }}
                                        />
                                    </div>

                                    {part.removed && (
                                        <div className="absolute inset-0 pointer-events-none opacity-[0.02] dark:opacity-[0.04] bg-[repeating-linear-gradient(45deg,transparent,transparent_8px,currentColor_8px,currentColor_16px)]" />
                                    )}
                                </div>
                            );
                        });
                    })}
                </div>
            </div>

            <p className="text-[10px] text-pencil font-handwriting italic text-center opacity-60">
                Baris berwarna hijau telah ditambahkan, warna merah telah dihapus.
            </p>
        </div>
    );
};
