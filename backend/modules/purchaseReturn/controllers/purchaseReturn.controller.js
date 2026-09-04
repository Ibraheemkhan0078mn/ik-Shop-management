import asyncHandler from "express-async-handler";
import { getPurchaseById as getPurchaseDetails } from "../../productPurchases/services/purchase.service.js";
import { ApiResponse, ApiError } from "../../../common/services/apiResponses.js";
import { adjustStock, calculateStockDiff } from "../../../common/services/stockManager.js";
import {
    createPurchaseReturnService,
    findPurchaseReturnService,
    findByIdPurchaseReturnService,
    updatePurchaseReturnService,
    deleteOnePurchaseReturnService,
    countPurchaseReturnService,
} from "../services/purchaseReturn.crud.js";
import {
    getPurchaseReturnSummary,
    calculateReturnedQuantitiesByBatch
} from "../services/purchaseReturn.service.js";
import { findByIdBatchService } from "../../productPurchases/services/batch.crud.js";
import { findByIdPurchaseService, findOnePurchaseService } from "../../productPurchases/services/purchase.crud.js";
import { findOneSupplierService } from "../../suppliers/services/supplier.crud.js";
import { findOneProductService } from "../../product/services/product.crud.js";
import {
    createPurchaseReturnPayment,
    getPurchaseReturnPayments,
    deletePurchaseReturnPayment
} from "../services/purchaseReturnPayment.service.js";
import {
    recalculatePurchaseReturnRefundAmount
} from "../services/purchaseReturn.service.js";

const normalizePurchaseReturnItems = async (items = []) => {
    if (!Array.isArray(items)) return [];

    const normalizedItems = [];

    for (const item of items) {
        const batch = item.batch ? await findByIdBatchService(item.batch) : null;
        normalizedItems.push({
            ...item,
            batchNumber: item.batchNumber?.trim() || batch?.batchNumber || "",
        });
    }

    return normalizedItems;
};

export const getPurchaseReturnsData = asyncHandler(async (req, res) => {
    const { status, supplier, startDate, endDate } = req.query;
    let query = {};
    if (status) query.status = status;
    if (supplier) query.supplier = supplier;
    if (startDate || endDate) {
        query.returnDate = {};
        if (startDate) query.returnDate.$gte = new Date(startDate);
        if (endDate) query.returnDate.$lte = new Date(endDate);
    }

    const purchaseReturns = await findPurchaseReturnService(query, {
        sort: { createdAt: -1 }
    });

    // Manually fetch supplier, purchase, and product data using findOne
    for (const purchaseReturn of purchaseReturns) {
        if (purchaseReturn.purchase) {
            const purchase = await findByIdPurchaseService(purchaseReturn.purchase);
            if (purchase) {
                purchaseReturn.purchase = {
                    _id: purchase._id,
                    invoiceNumber: purchase.invoiceNumber
                };
            }
        }

        if (purchaseReturn.supplier) {
            const supplier = await findOneSupplierService({ _id: purchaseReturn.supplier });
            if (supplier) {
                purchaseReturn.supplier = {
                    _id: supplier._id,
                    name: supplier.name
                };
            }
        }

        if (purchaseReturn.items && Array.isArray(purchaseReturn.items)) {
            for (const item of purchaseReturn.items) {
                if (item.product) {
                    const product = await findOneProductService({ _id: item.product });
                    if (product) {
                        item.product = {
                            _id: product._id,
                            name: product.name,
                            productCode: product.productCode
                        };
                    }
                }
            }
        }
    }

    return ApiResponse(res, 200, "Purchase returns retrieved successfully", purchaseReturns);
});

export const getPaginatedPurchaseReturnsData = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status, supplier, returnHash, invoiceNumber } = req.query;
    let query = {};
    if (status) query.status = status;
    if (supplier) query.supplier = supplier;
    if (returnHash) query.purchaseReturnNumber = returnHash;
    
    if (invoiceNumber) {
        // Filter by purchase invoice number
        const purchases = await findByIdPurchaseService({ invoiceNumber });
        if (purchases) {
            query.purchase = purchases._id;
        } else {
            // If no purchase found with this invoice number, return empty results
            return ApiResponse(res, 200, "Purchase returns retrieved successfully", [], {
                pagination: {
                    total: 0,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: 0,
                },
            });
        }
    }

    const purchaseReturns = await findPurchaseReturnService(query, {
        sort: { createdAt: -1 },
        skip: (page - 1) * limit,
        limit: parseInt(limit)
    });

    // Manually fetch supplier, purchase, and product data using findOne
    for (const purchaseReturn of purchaseReturns) {
        if (purchaseReturn.purchase) {
            const purchase = await findByIdPurchaseService(purchaseReturn.purchase);
            if (purchase) {
                purchaseReturn.purchase = {
                    _id: purchase._id,
                    invoiceNumber: purchase.invoiceNumber
                };
            }
        }

        if (purchaseReturn.supplier) {
            const supplier = await findOneSupplierService({ _id: purchaseReturn.supplier });
            if (supplier) {
                purchaseReturn.supplier = {
                    _id: supplier._id,
                    name: supplier.name
                };
            }
        }

        if (purchaseReturn.items && Array.isArray(purchaseReturn.items)) {
            for (const item of purchaseReturn.items) {
                if (item.product) {
                    const product = await findOneProductService({ _id: item.product });
                    if (product) {
                        item.product = {
                            _id: product._id,
                            name: product.name,
                            productCode: product.productCode
                        };
                    }
                }
            }
        }
    }

    const total = await countPurchaseReturnService(query);

    return ApiResponse(res, 200, "Purchase returns retrieved successfully", purchaseReturns, {
        pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / limit),
        },
    });
});

export const getPurchaseReturnDataById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const purchaseReturn = await findByIdPurchaseReturnService(id);
    if (!purchaseReturn) {
        throw new Error("Purchase return not found");
    }

    // Manually fetch purchase data using findOne
    if (purchaseReturn.purchase) {
        const purchase = await findByIdPurchaseService(purchaseReturn.purchase);
        if (purchase) {
            purchaseReturn.purchase = {
                _id: purchase._id,
                purchaseNumber: purchase.purchaseNumber
            };
        }
    }

    // Manually fetch supplier data using findOne
    if (purchaseReturn.supplier) {
        const supplier = await findOneSupplierService({ _id: purchaseReturn.supplier });
        if (supplier) {
            purchaseReturn.supplier = {
                _id: supplier._id,
                name: supplier.name
            };
        }
    }

    // Manually fetch product data for items using findOne
    if (purchaseReturn.items && Array.isArray(purchaseReturn.items)) {
        for (const item of purchaseReturn.items) {
            if (item.product) {
                const product = await findOneProductService({ _id: item.product });
                if (product) {
                    item.product = {
                        _id: product._id,
                        name: product.name,
                        productCode: product.productCode
                    };
                }
            }
        }
    }

    return ApiResponse(res, 200, "Purchase return retrieved successfully", purchaseReturn);
});

export const createPurchaseReturnData = asyncHandler(async (req, res) => {
    const userId = req.user?._id || req.user?.id || null;

    const data = req.body;

    // Generate sequential purchase return number
    let purchaseReturnNumber = data.purchaseReturnNumber;
    if (!purchaseReturnNumber) {
        // Generate sequential number: PR-XXXXX
        let isUnique = false;
        let attempts = 0;
        let newNumber;
        while (!isUnique && attempts < 100) {
            const randomNum = Math.floor(10000 + Math.random() * 90000);
            newNumber = `PR-${randomNum}`;
            try {
                const existing = await findPurchaseReturnService({ purchaseReturnNumber: newNumber });
                if (!existing || existing.length === 0) {
                    isUnique = true;
                }
            } catch (e) {
                // If error, assume it doesn't exist
                isUnique = true;
            }
            attempts++;
        }
        purchaseReturnNumber = newNumber;
    } else {
        // Check if the provided number already exists
        const existing = await findPurchaseReturnService({ purchaseReturnNumber });
        if (existing && existing.length > 0) {
            throw new Error("Purchase return number already exists");
        }
    }

    const purchase = await findByIdPurchaseService(data.purchase);
    if (!purchase) {
        throw new Error("Purchase not found");
    }

    const normalizedItems = await normalizePurchaseReturnItems(data.items);

    for (const item of normalizedItems) {
        const batch = await findByIdBatchService(item.batch);
        if (!batch) {
            throw new Error(`Batch not found: ${item.batchNumber}`);
        }
        // Allow return even if batch quantity is 0 (e.g., for damaged goods or corrections)
        // Only warn if quantity is negative
        if (batch.quantity < 0) {
            throw new Error(`Invalid batch quantity in ${item.batchNumber}. Quantity cannot be negative: ${batch.quantity}`);
        }
        // Log warning if batch is empty but allow the return to proceed
        if (batch.quantity === 0) {
            console.warn(`Batch ${item.batchNumber} has 0 quantity available. Proceeding with return of ${item.quantity} items. This may indicate the batch was already used or returned.`);
        }
    }

    // Calculate total refund amount with discount consideration
    let totalRefundAmount = 0;
    let totalQuantity = 0;
    
    for (const item of normalizedItems) {
        let discountedPrice = item.purchasePrice;
        
        // Apply purchase discount if available
        if (purchase.discountType && purchase.discount) {
            const discount = Number(purchase.discount) || 0;
            if (purchase.discountType === 'percentage') {
                // Apply percentage discount
                discountedPrice = item.purchasePrice - (item.purchasePrice * (discount / 100));
            } else if (purchase.discountType === 'fixed') {
                // Apply fixed discount (distributed across total quantity)
                const totalPurchaseQuantity = purchase.items?.reduce((sum, i) => sum + (i.quantity || 0), 0) || 1;
                const discountPerItem = discount / totalPurchaseQuantity;
                discountedPrice = item.purchasePrice - discountPerItem;
            }
        }
        
        const refund = (item.quantity * discountedPrice) - (item.cut || 0);
        totalRefundAmount += refund;
        totalQuantity += item.quantity;
    }

    const purchaseReturn = await createPurchaseReturnService({
        ...data,
        items: normalizedItems,
        purchaseReturnNumber,
        totalRefundAmount,
        totalQuantity,
        createdBy: userId,
    });

    // If status is approved, deduct stock immediately
    if (data.status === 'approved') {
        for (const item of normalizedItems) {
            await adjustStock(item.product, item.batch, 'decr', item.quantity);
        }
    }

    return ApiResponse(res, 201, "Purchase return created successfully", purchaseReturn);
});

export const updatePurchaseReturnData = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existing = await findByIdPurchaseReturnService(id);
    if (!existing) throw new Error("Purchase return not found");

    let incomingItems = req.body.items;

    if (incomingItems) {
        // Step 1: Normalize items (resolves batchNumber, batch ref, etc.)
        incomingItems = await normalizePurchaseReturnItems(incomingItems);

        // Step 2: Make sure every batch exists and has enough stock
        for (const item of incomingItems) {
            const batch = await findByIdBatchService(item.batch);
            if (!batch) throw new Error(`Batch "${item.batchNumber}" not found`);
            if (batch.quantity < item.quantity)
                throw new Error(`Not enough stock in batch "${item.batchNumber}". Available: ${batch.quantity}, Requested: ${item.quantity}`);
        }

        // Step 3: Compare old vs new quantities and adjust stock for each item if currently approved
        if (existing.status === 'approved') {
            const adjustments = calculateStockDiff(existing.items, incomingItems);
            for (const adj of adjustments) {
                // In purchase return, increasing returned qty ('inc') reduces store stock ('decr')
                // and decreasing returned qty ('decr') restores store stock ('inc')
                const op = adj.operation === 'inc' ? 'decr' : 'inc';
                await adjustStock(adj.productId, adj.batchId, op, adj.quantity);
            }
        }
    }

    // Calculate total refund amount and total quantity with discount consideration
    let totalRefundAmount = 0;
    let totalQuantity = 0;
    
    // Fetch the original purchase to get discount info
    const originalPurchase = await findByIdPurchaseService(existing.purchase);
    
    if (incomingItems) {
        for (const item of incomingItems) {
            let discountedPrice = item.purchasePrice;
            
            // Apply purchase discount if available
            if (originalPurchase?.discountType && originalPurchase?.discount) {
                const discount = Number(originalPurchase.discount) || 0;
                if (originalPurchase.discountType === 'percentage') {
                    // Apply percentage discount
                    discountedPrice = item.purchasePrice - (item.purchasePrice * (discount / 100));
                } else if (originalPurchase.discountType === 'fixed') {
                    // Apply fixed discount (distributed across total quantity)
                    const totalPurchaseQuantity = originalPurchase.items?.reduce((sum, i) => sum + (i.quantity || 0), 0) || 1;
                    const discountPerItem = discount / totalPurchaseQuantity;
                    discountedPrice = item.purchasePrice - discountPerItem;
                }
            }
            
            const refund = (item.quantity * discountedPrice) - (item.cut || 0);
            totalRefundAmount += refund;
            totalQuantity += item.quantity;
        }
    } else if (existing.items) {
        for (const item of existing.items) {
            let discountedPrice = item.purchasePrice;
            
            // Apply purchase discount if available
            if (originalPurchase?.discountType && originalPurchase?.discount) {
                const discount = Number(originalPurchase.discount) || 0;
                if (originalPurchase.discountType === 'percentage') {
                    // Apply percentage discount
                    discountedPrice = item.purchasePrice - (item.purchasePrice * (discount / 100));
                } else if (originalPurchase.discountType === 'fixed') {
                    // Apply fixed discount (distributed across total quantity)
                    const totalPurchaseQuantity = originalPurchase.items?.reduce((sum, i) => sum + (i.quantity || 0), 0) || 1;
                    const discountPerItem = discount / totalPurchaseQuantity;
                    discountedPrice = item.purchasePrice - discountPerItem;
                }
            }
            
            const refund = (item.quantity * discountedPrice) - (item.cut || 0);
            totalRefundAmount += refund;
            totalQuantity += item.quantity;
        }
    }

    const updated = await updatePurchaseReturnService(id, {
        ...req.body,
        items: incomingItems,
        totalRefundAmount,
        totalQuantity,
        updatedAt: new Date(),
    });

    return ApiResponse(res, 200, "Purchase return updated successfully", updated);
});

export const deletePurchaseReturnData = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existing = await findByIdPurchaseReturnService(id);
    if (!existing) {
        throw new Error("Purchase return not found");
    }

    // if (existing.status !== "pending") {
    //     throw new Error("Only pending purchase returns can be deleted");
    // }

    // If approved, restore stock before deletion
    if (existing.status === "approved") {
        for (const item of existing.items) {
            await adjustStock(item.product, item.batch, 'inc', item.quantity);
        }
    }

    await deleteOnePurchaseReturnService(id);
    return ApiResponse(res, 200, "Purchase return deleted successfully", {});
});

export const submitPurchaseReturnData = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existing = await findByIdPurchaseReturnService(id);
    if (!existing) {
        throw new Error("Purchase return not found");
    }

    if (existing.status !== "draft") {
        throw new Error("Only draft purchase returns can be submitted for approval");
    }

    const submitted = await updatePurchaseReturnService(id, { status: "pending" });
    return ApiResponse(res, 200, "Purchase return submitted for approval", submitted);
});

export const approvePurchaseReturnData = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?._id || req.user?.id || null;

    const existing = await findByIdPurchaseReturnService(id);
    if (!existing) {
        throw new Error("Purchase return not found");
    }

    if (existing.status !== "pending") {
        throw new Error(`Only pending purchase returns can be approved. Current status: ${existing.status}`);
    }

    for (const item of existing.items) {
        await adjustStock(item.product, item.batch, 'decr', item.quantity);
    }

    // Auto-create credit transaction for purchase return linked to supplier's qarza account
    const { getPurchaseReturnById } = await import("../services/purchaseReturn.service.js");
    const purchaseReturnWithSupplier = await getPurchaseReturnById(id);
    if (purchaseReturnWithSupplier?.supplier?.qarzaAccountId) {
        const { createPurchaseReturnTransaction } = await import("../../transactions/services/transaction.service.js");
        const { recalculateSupplierBalance } = await import("../../qarza/services/recalculateSupplierBalance.service.js");
        await createPurchaseReturnTransaction({
            purchaseReturn: id,
            paymentMethod: 'credit',
            amount: existing.totalRefundAmount,
            cashAmount: 0,
            creditAmount: existing.totalRefundAmount,
            creditAccount: purchaseReturnWithSupplier.supplier.qarzaAccountId,
            paymentDate: new Date(),
            notes: `Auto-created credit transaction on approval for purchase return ${existing.purchaseReturnNumber}`,
            createdBy: userId,
        });
        await recalculateSupplierBalance(purchaseReturnWithSupplier.supplier.qarzaAccountId);
    }

    // Recalculate purchase return refund amount after auto transaction creation
    await recalculatePurchaseReturnRefundAmount(id);

    const approved = await updatePurchaseReturnService(id, {
        status: "approved",
        approvedBy: userId,
        approvedAt: new Date(),
    });

    return ApiResponse(res, 200, "Purchase return approved and stock deducted successfully", approved);
});

export const rejectPurchaseReturnData = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    if (!rejectionReason) {
        throw new Error("Rejection reason is required");
    }

    const existing = await findByIdPurchaseReturnService(id);
    if (!existing) {
        throw new Error("Purchase return not found");
    }

    if (existing.status !== "pending") {
        throw new Error(`Only pending purchase returns can be rejected. Current status: ${existing.status}`);
    }

    const rejected = await updatePurchaseReturnService(id, { status: "rejected", rejectionReason });
    return ApiResponse(res, 200, "Purchase return rejected successfully", rejected);
});

export const getPurchaseDetailsForReturn = asyncHandler(async (req, res) => {
    const { purchaseId } = req.params;
    const purchase = await getPurchaseDetails(purchaseId);
    return ApiResponse(res, 200, "Purchase details retrieved successfully", purchase);
});

export const generatePurchaseReturnNumberData = asyncHandler(async (req, res) => {
    // Find all purchase returns with PR-\d+ format (including soft-deleted)
    const allReturns = await findPurchaseReturnService({ purchaseReturnNumber: /^PR-\d+$/ }, {
        sort: { purchaseReturnNumber: -1 },
        limit: 1
    });

    let nextNumber = 1;

    if (allReturns && allReturns.length > 0) {
        const latestReturn = allReturns[0];
        const latestNumber = latestReturn.purchaseReturnNumber;
        
        // Extract the numeric part from PR-\d+ format
        const match = latestNumber.match(/^PR-(\d+)$/);
        if (match) {
            const currentNum = parseInt(match[1], 10);
            nextNumber = currentNum + 1;
        }
    }

    // Format with leading zeros (e.g., PR-01, PR-02, etc.)
    const purchaseReturnNumber = `PR-${String(nextNumber).padStart(2, '0')}`;

    return ApiResponse(res, 200, "Purchase return number generated successfully", {
        purchaseReturnNumber
    });
});

export const validatePurchaseReturnNumberData = asyncHandler(async (req, res) => {
    const { purchaseReturnNumber } = req.body;
    
    if (!purchaseReturnNumber) {
        throw new Error("Purchase return number is required");
    }

    // Check if the provided number already exists
    const existing = await findPurchaseReturnService({ purchaseReturnNumber });
    if (existing && existing.length > 0) {
        // Duplicate found - generate a new date-based number
        const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));
        const endOfDay = new Date(new Date().setHours(23, 59, 59, 999));
        const dateRange = { createdAt: { $gte: startOfDay, $lt: endOfDay } };

        const countValue = await countPurchaseReturnService(dateRange);
        const dateStr = startOfDay.toISOString().slice(0, 10).replace(/-/g, "");
        const newNumber = `PR-${dateStr}-${String(countValue + 1).padStart(4, "0")}`;

        return ApiResponse(res, 200, "Duplicate found, new number generated", {
            isDuplicate: true,
            suggestedNumber: newNumber
        });
    }

    return ApiResponse(res, 200, "Purchase return number is available", {
        isDuplicate: false,
        suggestedNumber: purchaseReturnNumber
    });
});

export const getSupplierPurchaseReturnsData = asyncHandler(async (req, res) => {
    const { supplierId } = req.params;
    const { page = 1, limit = 20, startDate, endDate } = req.query;
    
    console.log('Supplier Purchase Returns Request:', { supplierId, page, limit, startDate, endDate });
    
    let query = { supplier: supplierId };
    
    if (startDate || endDate) {
        query.returnDate = {};
        if (startDate) query.returnDate.$gte = new Date(startDate);
        if (endDate) query.returnDate.$lte = new Date(endDate);
    }

    const purchaseReturns = await findPurchaseReturnService(query, {
        sort: { returnDate: -1 },
        skip: (page - 1) * limit,
        limit: parseInt(limit)
    });

    console.log('Found purchase returns:', purchaseReturns.length);

    // Manually fetch supplier, purchase, and product data using findOne
    for (const purchaseReturn of purchaseReturns) {
        if (purchaseReturn.purchase) {
            const purchase = await findByIdPurchaseService(purchaseReturn.purchase);
            if (purchase) {
                purchaseReturn.purchase = {
                    _id: purchase._id,
                    invoiceNumber: purchase.invoiceNumber
                };
            }
        }

        if (purchaseReturn.supplier) {
            const supplier = await findOneSupplierService({ _id: purchaseReturn.supplier });
            if (supplier) {
                purchaseReturn.supplier = {
                    _id: supplier._id,
                    name: supplier.name
                };
            }
        }

        if (purchaseReturn.items && Array.isArray(purchaseReturn.items)) {
            for (const item of purchaseReturn.items) {
                if (item.product) {
                    const product = await findOneProductService({ _id: item.product });
                    if (product) {
                        item.product = {
                            _id: product._id,
                            name: product.name,
                            productCode: product.productCode
                        };
                    }
                }
            }
        }
    }

    const total = await countPurchaseReturnService(query);

    // Calculate KPIs
    const allReturns = await findPurchaseReturnService({ supplier: supplierId });
    const kpis = {
        totalReturns: allReturns.length,
        totalRefundAmount: allReturns.reduce((sum, r) => sum + (r.totalRefundAmount || 0), 0),
        pendingReturns: allReturns.filter(r => r.status === 'pending').length,
        approvedReturns: allReturns.filter(r => r.status === 'approved').length,
        rejectedReturns: allReturns.filter(r => r.status === 'rejected').length,
        draftReturns: allReturns.filter(r => r.status === 'draft').length,
    };

    console.log('KPIs:', kpis);

    return ApiResponse(res, 200, "Supplier purchase returns retrieved successfully", purchaseReturns, {
        pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / limit),
        },
        kpis
    });
});

// Payment/Refund endpoints for purchase returns
export const addPurchaseReturnPaymentData = asyncHandler(async (req, res) => {
    const userId = req.user?._id || req.user?.id || null;
    const { id } = req.params;

    const paymentData = {
        ...req.body,
        purchaseReturn: id,
        createdBy: userId,
    };

    const transactions = await createPurchaseReturnPayment(paymentData);
    return ApiResponse(res, 201, "Purchase return refund added successfully", transactions);
});

export const getPurchaseReturnPaymentsData = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const payments = await getPurchaseReturnPayments(id);
    return ApiResponse(res, 200, "Purchase return refunds retrieved successfully", payments);
});

export const deletePurchaseReturnPaymentData = asyncHandler(async (req, res) => {
    const { id, paymentId } = req.params;
    const result = await deletePurchaseReturnPayment(paymentId);
    return ApiResponse(res, 200, "Purchase return refund deleted successfully", result);
});

export const recalculatePurchaseReturnData = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await recalculatePurchaseReturnRefundAmount(id);
    return ApiResponse(res, 200, "Purchase return recalculated successfully", result);
});

export const getPurchaseReturnSummaryData = asyncHandler(async (req, res) => {
    const { purchaseId } = req.params;
    const result = await getPurchaseReturnSummary(purchaseId);
    return ApiResponse(res, 200, "Purchase return summary retrieved successfully", result);
});
