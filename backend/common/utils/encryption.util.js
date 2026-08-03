import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// Use a fixed encryption key - in production, this should be in environment variables
const ENCRYPTION_KEY = crypto.scryptSync('your-secret-key', 'salt', 32); // 32 bytes for AES-256
const IV_LENGTH = 16; // For AES, this is always 16
const ALGORITHM = 'aes-256-cbc';

export const encrypt = (text) => {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
};

export const decrypt = (encryptedText) => {
    const textParts = encryptedText.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encrypted = textParts.join(':');
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};

export const comparePassword = (candidatePassword, encryptedPassword) => {
    try {
        // Check if it's AES encrypted (contains ':' separator)
        if (encryptedPassword.includes(':')) {
            const decrypted = decrypt(encryptedPassword);
            return candidatePassword === decrypted;
        }
        // Fallback to bcrypt for existing users
        return bcrypt.compare(candidatePassword, encryptedPassword);
    } catch (error) {
        // If AES decryption fails, try bcrypt as fallback
        try {
            return bcrypt.compare(candidatePassword, encryptedPassword);
        } catch (bcryptError) {
            return false;
        }
    }
};
