/**
 * Encryption utilities for secure notes using Web Crypto API
 * 
 * Features:
 * - AES-256-GCM encryption/decryption
 * - PBKDF2 key derivation from password
 * - Password validation via SHA-256 hash
 * - Secure random salt and IV generation
 */

const PBKDF2_ITERATIONS = 100000;
const AES_KEY_LENGTH = 256;
const SALT_LENGTH = 16; // bytes
const IV_LENGTH = 12; // bytes for GCM

/**
 * Converts ArrayBuffer to Base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

/**
 * Converts Base64 string to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

/**
 * Generates a random salt for key derivation
 */
function generateSalt(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

/**
 * Generates a random IV for AES-GCM
 */
function generateIV(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(IV_LENGTH));
}

/**
 * Derives an encryption key from password using PBKDF2
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
    );

    // Derive AES key using PBKDF2
    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt as BufferSource,
            iterations: PBKDF2_ITERATIONS,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: AES_KEY_LENGTH },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Creates SHA-256 hash of password for validation
 */
export async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return arrayBufferToBase64(hashBuffer);
}

/**
 * Validates password against stored hash
 */
export async function validatePassword(password: string, hash: string): Promise<boolean> {
    const passwordHash = await hashPassword(password);
    return passwordHash === hash;
}

/**
 * Encrypts note content with password
 * 
 * @param content - Plain text content to encrypt
 * @param password - Password for encryption
 * @returns Object containing encrypted content and metadata
 */
export async function encryptNote(content: string, password: string): Promise<{
    encryptedContent: string;
    salt: string;
    iv: string;
    passwordHash: string;
}> {
    const encoder = new TextEncoder();
    const contentBuffer = encoder.encode(content);

    // Generate random salt and IV
    const salt = generateSalt();
    const iv = generateIV();

    // Derive encryption key from password
    const key = await deriveKey(password, salt);

    // Encrypt content using AES-GCM
    const encryptedBuffer = await crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv as BufferSource
        },
        key,
        contentBuffer
    );

    // Create password hash for validation
    const passwordHash = await hashPassword(password);

    return {
        encryptedContent: arrayBufferToBase64(encryptedBuffer),
        salt: arrayBufferToBase64(salt.buffer as ArrayBuffer),
        iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
        passwordHash
    };
}

/**
 * Decrypts note content with password
 * 
 * @param encryptedContent - Base64 encoded encrypted content
 * @param password - Password for decryption
 * @param salt - Base64 encoded salt used during encryption
 * @param iv - Base64 encoded IV used during encryption
 * @returns Decrypted plain text content
 * @throws Error if decryption fails (wrong password or corrupted data)
 */
export async function decryptNote(
    encryptedContent: string,
    password: string,
    salt: string,
    iv: string
): Promise<string> {
    try {
        // Convert Base64 strings back to ArrayBuffers
        const encryptedBuffer = base64ToArrayBuffer(encryptedContent);
        const saltBuffer = new Uint8Array(base64ToArrayBuffer(salt));
        const ivBuffer = new Uint8Array(base64ToArrayBuffer(iv));

        // Derive the same key from password and salt
        const key = await deriveKey(password, saltBuffer);

        // Decrypt content using AES-GCM
        const decryptedBuffer = await crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: ivBuffer as BufferSource
            },
            key,
            encryptedBuffer
        );

        // Convert decrypted buffer back to string
        const decoder = new TextDecoder();
        return decoder.decode(decryptedBuffer);
    } catch (error) {
        throw new Error('Decryption failed. Wrong password or corrupted data.');
    }
}

/**
 * Changes the password for an encrypted note
 * 
 * @param encryptedContent - Current encrypted content
 * @param oldPassword - Current password
 * @param newPassword - New password
 * @param salt - Current salt
 * @param iv - Current IV
 * @returns New encryption metadata
 */
export async function changeNotePassword(
    encryptedContent: string,
    oldPassword: string,
    newPassword: string,
    salt: string,
    iv: string
): Promise<{
    encryptedContent: string;
    salt: string;
    iv: string;
    passwordHash: string;
}> {
    // First decrypt with old password
    const plainContent = await decryptNote(encryptedContent, oldPassword, salt, iv);

    // Then re-encrypt with new password
    return encryptNote(plainContent, newPassword);
}
