import * as Diff from 'diff';

export interface DiffResult {
    added: boolean;
    removed: boolean;
    value: string;
}

/**
 * Generate diff between two text strings
 */
export const generateTextDiff = (oldText: string, newText: string): DiffResult[] => {
    return Diff.diffWords(oldText, newText) as DiffResult[];
};

/**
 * Generate line-by-line diff
 */
export const generateLineDiff = (oldText: string, newText: string): DiffResult[] => {
    return Diff.diffLines(oldText, newText) as DiffResult[];
};

/**
 * Strip HTML tags for plain text comparison
 */
export const stripHtml = (html: string): string => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
};

/**
 * Calculate diff statistics
 */
export const getDiffStats = (diffs: DiffResult[]) => {
    let additions = 0;
    let deletions = 0;

    diffs.forEach(part => {
        const lines = part.value.split('\n').filter(l => l.trim());
        if (part.added) additions += lines.length;
        if (part.removed) deletions += lines.length;
    });

    return { additions, deletions };
};
