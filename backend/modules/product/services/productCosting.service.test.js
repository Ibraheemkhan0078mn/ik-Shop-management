import { jest } from '@jest/globals';
import { findOneBatchService } from '../../productPurchases/services/batch.crud.js';
import { getProductCostingByBatch } from './productCosting.service.js';

jest.mock('../../productPurchases/services/batch.crud.js', () => ({
    findOneBatchService: jest.fn(),
}));

describe('getProductCostingByBatch', () => {
    it('uses the stored batch cost fields and not missing purchasePrice values', async () => {
        findOneBatchService.mockResolvedValue({
            _id: 'batch-1',
            product: 'prod-1',
            batchNumber: 'B-001',
            costPrice: 100,
            perUnitCosting: 92.5,
            defaultSellingPrice: 120,
            discountInPercentage: 5,
            taxInPercentage: 0,
        });

        const result = await getProductCostingByBatch('prod-1', 'batch-1');

        expect(result.found).toBe(true);
        expect(result.basePurchasePrice).toBe(92.5);
        expect(result.effectiveCostPrice).toBe(92.5);
    });
});
