import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';

// GitHub API configuration
const GITHUB_OWNER = 'atiohaidar';
const GITHUB_REPO = 'urus-diri-sendiri';
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;

// Current app version (from package.json)
const CURRENT_VERSION = '1.0.0';

export interface GitHubRelease {
    tag_name: string;
    name: string;
    body: string | null;
    published_at: string;
    assets: GitHubAsset[];
}

export interface GitHubAsset {
    name: string;
    size: number;
    browser_download_url: string;
    content_type: string;
}

export interface UpdateInfo {
    available: boolean;
    currentVersion: string;
    latestVersion: string;
    buildNumber?: number;
    releaseNotes?: string;
    downloadUrl?: string;
    fileSize?: number;
}

/**
 * Get current app version
 */
export const getCurrentVersion = (): string => {
    return CURRENT_VERSION;
};

/**
 * Parse version string from GitHub tag
 * Format: "v1.0.0+35" -> { version: "1.0.0", build: 35 }
 */
const parseVersion = (tagName: string): { version: string; build: number } => {
    // Remove 'v' prefix if exists
    const cleaned = tagName.startsWith('v') ? tagName.slice(1) : tagName;

    // Split by '+' to get version and build number
    const [version, buildStr] = cleaned.split('+');
    const build = buildStr ? parseInt(buildStr, 10) : 0;

    return { version, build };
};

/**
 * Compare two version strings
 * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
const compareVersions = (v1: string, v2: string): number => {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const num1 = parts1[i] || 0;
        const num2 = parts2[i] || 0;

        if (num1 > num2) return 1;
        if (num1 < num2) return -1;
    }

    return 0;
};

/**
 * Check for app updates from GitHub Releases
 */
export const checkForUpdates = async (): Promise<UpdateInfo> => {
    try {
        const response = await fetch(GITHUB_API_URL, {
            headers: {
                'Accept': 'application/vnd.github.v3+json',
            },
        });

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }

        const release: GitHubRelease = await response.json();

        // Parse version info from latest release
        const { version: latestVersion, build: latestBuild } = parseVersion(release.tag_name);
        const currentVersion = getCurrentVersion();

        // For now, we don't track current build number in the app
        // So we assume current build is 0 if not specified
        // In production, you might want to get this from app metadata
        const currentBuild = 0;

        // Find APK asset
        const apkAsset = release.assets.find(
            asset => asset.name === 'app-release.apk' &&
                asset.content_type === 'application/vnd.android.package-archive'
        );

        // Compare versions first
        const versionComparison = compareVersions(latestVersion, currentVersion);

        // Update is available if:
        // 1. Latest version is higher than current version, OR
        // 2. Versions are equal BUT latest build is higher than current build
        const isUpdateAvailable = versionComparison > 0 ||
            (versionComparison === 0 && latestBuild > currentBuild);

        return {
            available: isUpdateAvailable,
            currentVersion,
            latestVersion,
            buildNumber: latestBuild,
            releaseNotes: release.body || undefined,
            downloadUrl: apkAsset?.browser_download_url,
            fileSize: apkAsset?.size,
        };
    } catch (error) {
        console.error('Error checking for updates:', error);
        throw error;
    }
};

/**
 * Download update APK
 * Returns the file path of the downloaded APK
 */
export const downloadUpdate = async (
    downloadUrl: string,
    onProgress?: (progress: number) => void
): Promise<string> => {
    try {
        // Only works on native platforms
        if (!Capacitor.isNativePlatform()) {
            throw new Error('Download is only available on native platforms');
        }

        // Download the file
        const response = await fetch(downloadUrl);

        if (!response.ok) {
            throw new Error(`Download failed: ${response.status}`);
        }

        const blob = await response.blob();
        const reader = new FileReader();

        return new Promise((resolve, reject) => {
            reader.onload = async () => {
                try {
                    const base64Data = (reader.result as string).split(',')[1];

                    // Save to cache directory
                    const fileName = 'app-update.apk';
                    const result = await Filesystem.writeFile({
                        path: fileName,
                        data: base64Data,
                        directory: Directory.Cache,
                    });

                    if (onProgress) {
                        onProgress(100);
                    }

                    resolve(result.uri);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => {
                reject(new Error('Failed to read downloaded file'));
            };

            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error('Error downloading update:', error);
        throw error;
    }
};

/**
 * Format file size to human readable string
 */
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};
