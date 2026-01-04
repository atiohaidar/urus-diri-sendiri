import { useState } from 'react';
import { generateLineDiff, stripHtml, getDiffStats, type DiffResult } from '@/lib/diff-utils';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

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
            const cDiff = generateLineDiff(stripHtml(oldContent), stripHtml(newContent));
            const allDiffs = [...tDiff, ...cDiff];

            setTitleDiff(tDiff);
            setContentDiff(cDiff);
            setStats(getDiffStats(allDiffs));
            setIsLoading(false);
        }, 100);
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-doodle-primary" />
                <span className="ml-2 font-handwriting text-pencil">Generating diff...</span>
            </div>
        );
    }

    return (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Stats */}
            <div className="flex gap-4 text-sm font-handwriting pb-2 border-b-2 border-dashed border-paper-lines">
                <span className="text-doodle-green">+{stats.additions} additions</span>
                <span className="text-doodle-red">-{stats.deletions} deletions</span>
            </div>

            {/* Title Diff */}
            {titleDiff.some(d => d.added || d.removed) && (
                <div>
                    <h4 className="font-handwriting text-sm text-pencil mb-2">📝 Title Changes:</h4>
                    <div className="bg-card rounded-sm border-2 border-paper-lines p-3 font-mono text-sm">
                        {titleDiff.map((part, index) => (
                            <span
                                key={index}
                                className={cn(
                                    part.added && 'bg-doodle-green/20 text-doodle-green',
                                    part.removed && 'bg-doodle-red/20 text-doodle-red line-through'
                                )}
                            >
                                {part.value}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Content Diff */}
            <div>
                <h4 className="font-handwriting text-sm text-pencil mb-2">📄 Content Changes:</h4>
                <div className="bg-card rounded-sm border-2 border-paper-lines p-3 font-mono text-xs space-y-0.5 max-h-96 overflow-y-auto">
                    {contentDiff.map((part, index) => {
                        const lines = part.value.split('\n');
                        return lines.map((line, lineIndex) => {
                            // Skip only the very last empty line of each part
                            if (lineIndex === lines.length - 1 && !line.trim()) return null;

                            return (
                                <div
                                    key={`${index}-${lineIndex}`}
                                    className={cn(
                                        'px-2 py-1 rounded-sm whitespace-pre-wrap break-words',
                                        part.added && 'bg-doodle-green/10 text-doodle-green border-l-2 border-doodle-green',
                                        part.removed && 'bg-doodle-red/10 text-doodle-red border-l-2 border-doodle-red line-through',
                                        !part.added && !part.removed && 'text-ink/70'
                                    )}
                                >
                                    <span className="select-none mr-2 text-pencil/50 font-bold">
                                        {part.added ? '+' : part.removed ? '-' : ' '}
                                    </span>
                                    <span>{line || ' '}</span>
                                </div>
                            );
                        });
                    })}
                </div>
            </div>
        </div>
    );
};
