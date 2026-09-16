import {
    buildDateFilter,
    getTodayRange,
    enrichMainBusinessSummaryWithInventory,
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

    describe('enrichMainBusinessSummaryWithInventory', () => {
        it('should keep current stock and stock value from inventory summary', () => {
            const merged = enrichMainBusinessSummaryWithInventory(
                { totalSales: 5000 },
                { currentStock: 42, stockValue: 1234.5 }
            );

            expect(merged.totalSales).toBe(5000);
            expect(merged.currentStock).toBe(42);
            expect(merged.stockValue).toBe(1234.5);
            expect(merged.inventory).toEqual({ currentStock: 42, stockValue: 1234.5 });
        });
    });
});
