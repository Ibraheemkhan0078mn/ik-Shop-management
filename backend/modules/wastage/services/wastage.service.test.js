import { resolveBatchWastageCosting } from './wastage.service.js';

describe('resolveBatchWastageCosting', () => {
  it('uses the batch cost and stored per-unit costing when available', () => {
    const costing = resolveBatchWastageCosting({
      costPrice: 100,
      perUnitCosting: 97.2,
      discountEntryValue: 10,
      discountEntryType: 'percentage',
      taxEntryValue: 8,
      taxEntryType: 'percentage',
    }, { quantity: 3 });

    expect(costing.baseCostPrice).toBe(100);
    expect(costing.discountAmount).toBe(10);
    expect(costing.taxAmount).toBe(7.2);
    expect(costing.effectiveCostPrice).toBe(97.2);
    expect(costing.totalLoss).toBe(291.6);
  });

  it('falls back to direct cost-price formula when no per-unit costing exists', () => {
    const costing = resolveBatchWastageCosting({
      costPrice: 100,
      discountEntryValue: 10,
      discountEntryType: 'percentage',
      taxEntryValue: 8,
      taxEntryType: 'percentage',
    }, { quantity: 2 });

    expect(costing.baseCostPrice).toBe(100);
    expect(costing.discountAmount).toBe(10);
    expect(costing.taxAmount).toBe(7.2);
    expect(costing.effectiveCostPrice).toBe(97.2);
    expect(costing.totalLoss).toBe(194.4);
  });
});
