/**
 * Migration script to update batch purchasePrice from purchase costPrice
 * Run this script to update existing batches to use cost prices instead of selling prices
 * Usage: node backend/modules/productPurchases/scripts/migrate-cost-price-to-batches.js
 */

import { getLocalBatchModel, getLocalProductModel } from '../../../configs/connect.db.js';
import { getPurchases } from '../services/purchase.service.js';

async function migrateCostPriceToBatches() {
    try {
        console.log('Starting migration of cost prices to batches...');
        
        const BatchModel = getLocalBatchModel();
        const ProductModel = getLocalProductModel();
        
        // Get all purchases
        const purchases = await getPurchases();
        console.log(`Found ${purchases.length} purchases`);
        
        let updatedBatches = 0;
        let skippedBatches = 0;
        
        for (const purchase of purchases) {
            if (!purchase.items || !Array.isArray(purchase.items)) continue;
            
            for (const item of purchase.items) {
                // Only process items that have costPrice
                if (item.costPrice === undefined || item.costPrice === null) {
                    skippedBatches++;
                    continue;
                }
                
                // Find the batch by batchNumber and product
                const batch = await BatchModel.findOne({
                    batchNumber: item.batchNumber,
                    product: item.product
                });
                
                if (!batch) {
                    console.log(`Batch not found for product ${item.product}, batch ${item.batchNumber}`);
                    continue;
                }
                
                // Update batch purchasePrice if it's different from costPrice
                if (batch.purchasePrice !== item.costPrice) {
                    const oldPrice = batch.purchasePrice;
                    batch.purchasePrice = item.costPrice;
                    await batch.save();
                    
                    console.log(`Updated batch ${batch.batchNumber}: purchasePrice ${oldPrice} -> ${item.costPrice}`);
                    updatedBatches++;
                } else {
                    skippedBatches++;
                }
            }
        }
        
        console.log('\n=== Migration Summary ===');
        console.log(`Updated batches: ${updatedBatches}`);
        console.log(`Skipped batches: ${skippedBatches}`);
        console.log('Migration completed successfully!');
        
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

// Run migration
migrateCostPriceToBatches();
