export const STORAGE_KEYS = {
    PRIORITIES: 'urus-diri-priorities',
    REFLECTIONS: 'urus-diri-reflections',
    NOTES: 'urus-diri-notes',
    ROUTINES: 'urus-diri-routines',
    LAST_OPEN_DATE: 'last_open_date',
    LANGUAGE: 'urus-diri-language',
    GOOGLE_SHEET_URL: 'urus-diri-sheet-url',
    CLOUD_SYNC_TOKEN: 'urus-diri-cloud-token',
    LOGS: 'urus-diri-logs',
    OFFLINE_QUEUE: 'urus-diri-offline-queue', // Added for sync
} as const;

export const CATEGORY_LIST = [
    'Mindfulness',
    'Fitness',
    'Nutrition',
    'Productivity',
    'Spiritual',
    'Learning',
    'Other',
    'Reading',    // Added common category
    'Work',       // Added common category
] as const;
