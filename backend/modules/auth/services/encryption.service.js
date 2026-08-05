import crypto from 'crypto';

// Use a fixed encryption key - in production, this should be in environment variables
const ENCRYPTION_KEY = crypto.scryptSync('your-secret-key', 'salt', 32); // 32 bytes for AES-256
const IV_LENGTH = 16; // For AES, this is always 16
const ALGORITHM = 'aes-256-cbc';

/**
 * Encrypt plain text password using AES-256-CBC
 * @param {string} plainText - The plain text password to encrypt
 * @returns {string} - Encrypted password in format: iv:encrypted_data
 */
export const encryptPassword = (plainText) => {
    if (!plainText) {
        throw new Error('Password is required for encryption');
    }
    
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
};

/**
 * Decrypt encrypted password using AES-256-CBC
 * @param {string} encryptedText - The encrypted password in format: iv:encrypted_data
 * @returns {string} - Decrypted plain text password
 */
export const decryptPassword = (encryptedText) => {
    if (!encryptedText) {
        throw new Error('Encrypted password is required for decryption');
    }
    
    if (!encryptedText.includes(':')) {
        throw new Error('Invalid encrypted password format');
    }
    
    const textParts = encryptedText.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encrypted = textParts.join(':');
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};

/**
 * Compare plain text password with encrypted password
 * @param {string} plainPassword - The plain text password to verify
 * @param {string} encryptedPassword - The encrypted password stored in database
 * @returns {boolean} - True if passwords match, false otherwise
 */
export const comparePassword = (plainPassword, encryptedPassword) => {
    try {
        if (!plainPassword || !encryptedPassword) {
            return false;
        }
        
        const decryptedPassword = decryptPassword(encryptedPassword);
        return plainPassword === decryptedPassword;
    } catch (error) {
        return false;
    }
};

/**
 * Check if password is already encrypted (contains ':' separator)
 * @param {string} password - The password to check
 * @returns {boolean} - True if password is encrypted, false otherwise
 */
export const isPasswordEncrypted = (password) => {
    return password && password.includes(':');
};
