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
 * Formats HTML by adding newlines after block tags to make diffing more readable
 */
const formatHtmlForDiff = (html: string): string => {
    if (!html) return '';
    return html
        .replace(/&nbsp;/g, ' ') // Ganti &nbsp; dengan spasi biasa
        .replace(/\u00a0/g, ' ') // Ganti non-breaking space unicode dengan spasi biasa
        .replace(/><(?!\/)/g, '>\n<') // Tambah newline di antara tag yang berdekatan
        .replace(/<\/(p|div|h[1-6]|li|tr|ul|ol)>/gi, '$&\n') // Tambah newline setelah closing block tags
        .replace(/<br\s*\/?>/gi, '$&\n') // Tambah newline setelah <br>
        .split('\n')
        .map(line => line.trim()) // Bersihkan spasi di awal/akhir tiap baris
        .filter(line => line.length > 0) // Buang baris yang benar-benar kosong
        .join('\n');
};

/**
 * Generate line-by-line diff
 */
export const generateLineDiff = (oldText: string, newText: string): DiffResult[] => {
    // Normalisasi HTML agar diff per baris bekerja dengan benar
    const formattedOld = formatHtmlForDiff(oldText);
    const formattedNew = formatHtmlForDiff(newText);
    return Diff.diffLines(formattedOld, formattedNew) as DiffResult[];
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
