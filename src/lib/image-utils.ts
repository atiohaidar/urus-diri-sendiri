/**
 * Utilities for image compression and resizing
 */

export const compressImage = (base64Str: string, maxWidth = 800, quality = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // Calculate new dimensions
            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Could not get canvas context'));
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);

            // Convert to compressed base64
            const compressed = canvas.toDataURL('image/jpeg', quality);
            resolve(compressed);
        };
        img.onerror = (err) => reject(err);
    });
};

/**
 * Convert Google Drive sharing link to direct view link
 */
export const getGoogleDriveDirectLink = (url: string): string => {
    if (!url) return url;

    // Jika sudah format direct/viewer, biarkan saja
    if (url.includes('drive-viewer') ||
        url.includes('uc?export=view') ||
        url.includes('drive.usercontent.google.com')) {
        return url;
    }

    // Ekstrak ID dari berbagai format link Google Drive
    const match = url.match(/[-\w]{25,}/);
    if (match) {
        // Format ini adalah 'cara memanggil' yang Anda inginkan agar gambar langsung tampil
        return `https://drive.usercontent.google.com/download?id=${match[0]}&export=download`;
    }

    return url;
};
