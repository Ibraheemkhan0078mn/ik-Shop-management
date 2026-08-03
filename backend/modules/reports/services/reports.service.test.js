import {
    buildDateFilter,
    getTodayRange,
} from './reports.service.js';

describe('Reports Service Helper Functions', () => {
    describe('buildDateFilter', () => {
        it('should return empty filter when no dates provided', () => {
            const filter = buildDateFilter(null, null);
            expect(filter).toEqual({});
        });

        it('should build filter with fromDate only', () => {
            const fromDate = '2024-01-01';
            const filter = buildDateFilter(fromDate, null);
            expect(filter.createdAt).toHaveProperty('$gte');
            expect(filter.createdAt.$gte).toBeInstanceOf(Date);
        });

        it('should build filter with toDate only', () => {
            const toDate = '2024-01-31';
            const filter = buildDateFilter(null, toDate);
            expect(filter.createdAt).toHaveProperty('$lte');
            expect(filter.createdAt.$lte).toBeInstanceOf(Date);
        });

        it('should build filter with both fromDate and toDate', () => {
            const fromDate = '2024-01-01';
            const toDate = '2024-01-31';
            const filter = buildDateFilter(fromDate, toDate);
            expect(filter.createdAt).toHaveProperty('$gte');
            expect(filter.createdAt).toHaveProperty('$lte');
        });
    });

    describe('getTodayRange', () => {
        it('should return start and end of day', () => {
            const { startOfDay, endOfDay } = getTodayRange();
            expect(startOfDay).toBeInstanceOf(Date);
            expect(endOfDay).toBeInstanceOf(Date);
            expect(startOfDay < endOfDay).toBe(true);
        });
    });
});
