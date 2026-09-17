import mongoose from 'mongoose';
import ProductReturnSchema from '../models/productReturn.model.js';

describe('ProductReturn schema', () => {
    test('stores aggregate refund totals and refund status on the document', () => {
        const ProductReturn = mongoose.models.ProductReturnTest || mongoose.model('ProductReturnTest', ProductReturnSchema);

        const doc = new ProductReturn({
            returnNumber: 'RET-000001',
            referenceOrderId: new mongoose.Types.ObjectId(),
            referenceOrderNumber: 'O-0001',
            customerName: 'Customer One',
            items: [{
                productId: new mongoose.Types.ObjectId(),
                productName: 'Product One',
                quantity: 1,
                returnReason: 'damaged',
                originalPrice: 300,
                refundAmount: 261,
            }],
            totalRefundAmount: 261,
            refundedAmount: 0,
            refundStatus: 'pending',
        });

        expect(doc.toObject()).toMatchObject({
            totalRefundAmount: 261,
            refundedAmount: 0,
            refundStatus: 'pending',
        });
    });
});
