export const getCurrentMonthRange = () => {
    const now = new Date();

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return {
        startOfMonth,
        endOfMonth
    };
};

  
export const getCustomStartEndMonthRanges = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Start date ko first date of month + first time (00:00:00)
    const startOfMonth = new Date(start.getFullYear(), start.getMonth(), 1, 0, 0, 0, 0);
    
    // End date ko last date of month + last time (23:59:59)
    const endOfMonth = new Date(end.getFullYear(), end.getMonth() + 1, 0, 23, 59, 59, 999);

    return {
        startDateFormat:startOfMonth,
        endDateFormat:endOfMonth
    };
};

/**
 * Get current local time WITHOUT UTC conversion
 * This stores the local time as-is in MongoDB (e.g., if it's 9 AM locally, it stores 9 AM, not 4 AM UTC)
 * Used specifically for createdTimeForSync field to maintain local time consistency
 */
export const getLocalTimeWithoutUTC = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const date = now.getDate();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const milliseconds = now.getMilliseconds();
    
    // Create a new Date using UTC methods but with local time values
    // This ensures the stored time matches the local time display
    return new Date(Date.UTC(year, month, date, hours, minutes, seconds, milliseconds));
};

