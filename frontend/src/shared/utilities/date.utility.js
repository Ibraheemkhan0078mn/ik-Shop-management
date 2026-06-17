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
        startOfMonth,
        endOfMonth
    };
};

export const toInputDateFormat = (date) => {
    const d = new Date(date);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

























export function getDateRange(period = 'day', currentDate = new Date()) {
    const date = new Date(currentDate);
    let start, end;

    switch (period.toLowerCase()) {
        case 'day':
        case 'current-day':
            // Start of day: 00:00:00.000
            start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
            // End of day: 23:59:59.999
            end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
            break;

        // make here the case of yesterday as well
        case 'yesterday':
            // Start of yesterday: 00:00:00.000
            start = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1, 0, 0, 0, 0);
            // End of yesterday: 23:59:59.999
            end = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1, 23, 59, 59, 999);
            break;

        case 'week':
        case 'current-week':
            // Start of week (Monday)
            const dayOfWeek = date.getDay();
            const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Sunday is 0, Monday is 1
            start = new Date(date.getFullYear(), date.getMonth(), date.getDate() + diffToMonday, 0, 0, 0, 0);
            // End of week (Sunday)
            end = new Date(start);
            end.setDate(start.getDate() + 6);
            end.setHours(23, 59, 59, 999);
            break;

        case 'month':
        case 'current-month':
            // Start of month: 1st day at 00:00:00.000
            start = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
            // End of month: last day at 23:59:59.999
            end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
            break;

        case '3months':
        case '3-months':
            // Last 3 months from today
            start = new Date(date.getFullYear(), date.getMonth() - 3, date.getDate(), 0, 0, 0, 0);
            end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
            break;

        case '6months':
        case '6-months':
            // Last 6 months from today
            start = new Date(date.getFullYear(), date.getMonth() - 6, date.getDate(), 0, 0, 0, 0);
            end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
            break;

        case '1year':
        case '1-year':
        case 'year':
            // Last 1 year from today
            start = new Date(date.getFullYear() - 1, date.getMonth(), date.getDate(), 0, 0, 0, 0);
            end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
            break;

        default:
            throw new Error(`Invalid period: ${period}. Valid options: day, week, month, 3months, 6months, 1year`);
    }

    return {
        start,
        end,
        period,
        startISO: start.toISOString(),
        endISO: end.toISOString(),
    };
}
