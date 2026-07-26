/**
 * Convert time value and unit to milliseconds
 * @param {number} value - The time value
 * @param {string} unit - The time unit ('seconds', 'minutes', 'hours', 'days')
 * @returns {number} - Time in milliseconds
 */
export const convertToMilliseconds = (value, unit) => {
    if (!value || value === 0) return 0;
    
    switch (unit) {
        case 'seconds':
            return value * 1000;
        case 'minutes':
            return value * 60 * 1000;
        case 'hours':
            return value * 60 * 60 * 1000;
        case 'days':
            return value * 24 * 60 * 60 * 1000;
        default:
            // Default to hours if unit is not recognized
            return value * 60 * 60 * 1000;
    }
};

/**
 * Format milliseconds to human-readable time string
 * @param {number} milliseconds - Time in milliseconds
 * @returns {string} - Formatted time string
 */
export const formatMilliseconds = (milliseconds) => {
    if (!milliseconds) return '0 seconds';
    
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
        return `${days} day${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
        return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else if (minutes > 0) {
        return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else {
        return `${seconds} second${seconds > 1 ? 's' : ''}`;
    }
};
