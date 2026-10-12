import { getPurchaseReport } from "./reports.service.js";
import { findPurchaseService } from "../../productPurchases/services/purchase.crud.js";
import { findTransactionService } from "../../transactions/services/transaction.service.js";
import { findPurchaseReturnService } from "../../purchaseReturn/services/purchaseReturn.crud.js";

jest.mock("../../productPurchases/services/purchase.crud.js", () => ({
    findPurchaseService: jest.fn(),
    countPurchaseService: jest.fn(),
}));

jest.mock("../../transactions/services/transaction.service.js", () => ({
    findTransactionService: jest.fn(),
    countTransactionService: jest.fn(),
}));

jest.mock("../../purchaseReturn/services/purchaseReturn.crud.js", () => ({
    findPurchaseReturnService: jest.fn(),
}));

const purchases = Array.from({ length: 25 }, (_, index) => ({
    _id: `purchase-${index + 1}`,
    supplier: { _id: "supplier-1", name: "Supplier One", toString: () => "supplier-1" },
    totalAmount: 100,
    paidAmount: 0,
    status: "delivered",
    purchaseReturns: [],
}));

describe("getPurchaseReport", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        findPurchaseService.mockResolvedValue(purchases);
        findTransactionService.mockResolvedValue([]);
        findPurchaseReturnService.mockResolvedValue([]);
    });

    it("loads every matching purchase and calculates totals from all rows", async () => {
        findTransactionService.mockResolvedValue(
            purchases.map(purchase => ({ sourceId: purchase._id, amount: 10 })),
        );

        const report = await getPurchaseReport({ period: "month" });

        expect(report.data).toHaveLength(25);
        expect(report.total).toBe(25);
        expect(report.page).toBe(1);
        expect(report.limit).toBe(25);
        expect(report.totalPages).toBe(1);
        expect(report.summary.totalBills).toBe(25);
        expect(report.summary.totalPurchases).toBe(2500);
        expect(report.summary.totalPaid).toBe(250);
        expect(report.summary.totalDeliveredCount).toBe(25);
        expect(findTransactionService).toHaveBeenCalledWith({
            sourceType: "purchase",
            sourceId: { $in: purchases.map(purchase => purchase._id) },
        });

        const [, options] = findPurchaseService.mock.calls[0];
        expect(options).not.toHaveProperty("skip");
        expect(options).not.toHaveProperty("limit");
    });

    it("applies a custom date range to the purchase query", async () => {
        await getPurchaseReport({
            period: "custom",
            fromDate: "2025-03-04",
            toDate: "2025-03-08",
        });

        const [filter] = findPurchaseService.mock.calls[0];
        expect(filter.createdAt.$gte).toEqual(new Date(2025, 2, 4, 0, 0, 0, 0));
        expect(filter.createdAt.$lte).toEqual(new Date(2025, 2, 8, 23, 59, 59, 999));
    });

    it("applies the last-three-months date range", async () => {
        const now = new Date();
        const expectedStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        const expectedEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        await getPurchaseReport({ period: "3month" });

        const [filter] = findPurchaseService.mock.calls[0];
        expect(filter.createdAt.$gte).toEqual(expectedStart);
        expect(filter.createdAt.$lte).toEqual(expectedEnd);
    });
});
