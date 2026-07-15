import asyncHandler from "express-async-handler";
import ErrorResponse from "../../../common/utils/ErrorResponse.js";
import { getLocalSupplierModel } from "../../../configs/connect.db.js";
import { paginateModel } from "../../../common/services/common.service.js";
import {
    supplierCreate as supplierCreateService,
    getAllSuppliers as getAllSuppliersService,
    getSupplierById as getSupplierByIdService,
    findSupplierByName as findSupplierByNameService,
    supplierUpdate as supplierUpdateService,
    supplierDelete as supplierDeleteService,
    countSuppliers as countSuppliersService,
} from "../services/supplier.service.js";
import { countPurchaseService } from "../../productPurchases/services/purchase.crud.js";
import { countBatchService } from "../../productPurchases/services/batch.crud.js";

export const getSuppliers = asyncHandler(async (req, res, next) => {
    const suppliers = await getAllSuppliersService();

    res.status(200).json({
        success: true,
        message: "Suppliers retrieved successfully",
        data: suppliers,
    });
});


export const getPaginatedSuppliers = asyncHandler(async (req, res) => {
    const SupplierModel = getLocalSupplierModel();
    const result = await paginateModel({
        model: SupplierModel,
        page:  req.query.page  || 1,
        limit: req.query.limit || 20,
        sort:  { createdAt: -1 },
    });

    return res.status(200).json({
        success:    true,
        message:    "Suppliers retrieved successfully",
        data:       result.data,
        total:      result.total,
        page:       result.page,
        limit:      result.limit,
        totalPages: result.totalPages,
    });
})






export const getSupplierById = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const supplier = await getSupplierByIdService(id);

    if (!supplier) {
        return next(new ErrorResponse("Supplier not found", 404));
    }

    return res.status(200).json({
        success: true,
        message: "Supplier retrieved successfully",
        data: supplier,
    });
})

export const createSupplier = asyncHandler(async (req, res, next) => {
    const validatedData = req.body || {};
    const { taxId: _taxId, ...supplierData } = validatedData;

    const { name } = supplierData;

    const supplierExists = await findSupplierByNameService(name);

    if (supplierExists) {
        return next(
            new ErrorResponse("Supplier with this name already exists", 400),
        );
    }

    const supplier = await supplierCreateService(supplierData);

    res.status(201).json({
        success: true,
        message: "Supplier created successfully",
        data: supplier,
    });
});

export const updateSupplier = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    let supplier = await getSupplierByIdService(id);

    if (!supplier) {
        return next(new ErrorResponse("Supplier not found", 404));
    }

    const validatedData = req.body || {};
    const { taxId: _taxId, ...supplierData } = validatedData;

    if (supplierData.name && supplierData.name !== supplier.name) {
        const nameExists = await findSupplierByNameService(supplierData.name);
        if (nameExists) {
            return next(new ErrorResponse("Supplier name already in use", 400));
        }
    }

    supplier = await supplierUpdateService(id, supplierData);

    res.status(200).json({
        success: true,
        message: "Supplier updated successfully",
        data: supplier,
    });
});

export const deleteSupplier = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const supplier = await getSupplierByIdService(id);

    if (!supplier) {
        return next(new ErrorResponse("Supplier not found", 404));
    }

    // Check if supplier has associated purchases
    const purchaseCount = await countPurchaseService({ supplier: id });
    if (purchaseCount > 0) {
        return next(new ErrorResponse(`Cannot delete supplier with ${purchaseCount} associated purchase(s). Please delete or transfer purchases first.`, 400));
    }

    // Check if supplier has associated batches
    const batchCount = await countBatchService({ supplier: id });
    if (batchCount > 0) {
        return next(new ErrorResponse(`Cannot delete supplier with ${batchCount} associated batch(es). Please delete or transfer batches first.`, 400));
    }

    await supplierDeleteService(id);

    res.status(200).json({
        success: true,
        message: "Supplier deleted successfully",
        data: {},
    });
});
