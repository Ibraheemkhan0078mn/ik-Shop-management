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

