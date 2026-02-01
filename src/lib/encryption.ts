import CryptoJS from 'crypto-js';

/**
 * Encryption utilities for secure notes using CryptoJS
 * 
 * This implementation is used as a fallback for environments where Web Crypto API (crypto.subtle)
 * is not available (e.g., non-HTTPS contexts or local IP development).
 */

const PBKDF2_ITERATIONS = 10000; // Adjusted for performance across devices
const SALT_SIZE = 128 / 8; // 16 bytes
const IV_SIZE = 128 / 8; // 16 bytes for AES

/**
 * Creates SHA-256 hash of password for validation
 */
export async function hashPassword(password: string): Promise<string> {
    return CryptoJS.SHA256(password).toString(CryptoJS.enc.Base64);
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
    // Generate random salt and IV
    const salt = CryptoJS.lib.WordArray.random(SALT_SIZE);
    const iv = CryptoJS.lib.WordArray.random(IV_SIZE);

    // Derive key using PBKDF2
    const key = CryptoJS.PBKDF2(password, salt, {
        keySize: 256 / 32,
        iterations: PBKDF2_ITERATIONS,
        hasher: CryptoJS.algo.SHA256
    });

    // Encrypt content using AES (defaults to CBC with PKCS7 padding)
    const encrypted = CryptoJS.AES.encrypt(content, key, {
        iv: iv,
        padding: CryptoJS.pad.Pkcs7,
        mode: CryptoJS.mode.CBC
    });

    // Create password hash for validation
    const passwordHash = await hashPassword(password);

    return {
        encryptedContent: encrypted.toString(), // Base64 by default for CipherParams
        salt: CryptoJS.enc.Base64.stringify(salt),
        iv: CryptoJS.enc.Base64.stringify(iv),
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
        const saltWA = CryptoJS.enc.Base64.parse(salt);
        const ivWA = CryptoJS.enc.Base64.parse(iv);

        // Derive the same key from password and salt
        const key = CryptoJS.PBKDF2(password, saltWA, {
            keySize: 256 / 32,
            iterations: PBKDF2_ITERATIONS,
            hasher: CryptoJS.algo.SHA256
        });

        // Decrypt content
        const decrypted = CryptoJS.AES.decrypt(encryptedContent, key, {
            iv: ivWA,
            padding: CryptoJS.pad.Pkcs7,
            mode: CryptoJS.mode.CBC
        });

        const result = decrypted.toString(CryptoJS.enc.Utf8);
        if (!result) throw new Error('Decryption failed');

        return result;
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
