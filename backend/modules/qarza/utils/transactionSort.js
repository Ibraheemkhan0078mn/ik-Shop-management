const toTimestamp = (value) => {
    if (!value && value !== 0) return 0;

    const timestamp = new Date(value).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
};

const getDayKey = (value) => {
    const timestamp = toTimestamp(value);
    if (!timestamp) return 0;

    const date = new Date(timestamp);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
};

const compareObjectId = (left, right) => {
    const a = String(left ?? '');
    const b = String(right ?? '');

    if (a === b) return 0;
    return a.localeCompare(b);
};

export const sortTransactionsForDisplay = (transactions = [], sortOrder = 'asc') => {
    const direction = sortOrder === 'desc' ? -1 : 1;

    return [...transactions].sort((a, b) => {
        const dateA = getDayKey(a?.transactionDate ?? a?.date);
        const dateB = getDayKey(b?.transactionDate ?? b?.date);

        if (dateA !== dateB) {
            return (dateA - dateB) * direction;
        }

        const syncA = toTimestamp(a?.createdTimeForSync ?? a?.createdAt ?? a?.updateTimeForSync ?? a?.updatedAt);
        const syncB = toTimestamp(b?.createdTimeForSync ?? b?.createdAt ?? b?.updateTimeForSync ?? b?.updatedAt);

        if (syncA !== syncB) {
            return (syncA - syncB) * direction;
        }

        return compareObjectId(a?._id, b?._id) * direction;
    });
};
