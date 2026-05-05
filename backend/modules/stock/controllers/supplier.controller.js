import asyncHandler from "express-async-handler";
import ErrorResponse from "../../../common/utils/ErrorResponse.js";
import {
    createSupplierSchema,
    updateSupplierSchema,
} from "../schema/supplier.schema.js";
import { getLocalSupplierModel } from "../../../configs/connect.db.js";
import { paginateModel } from "../../../common/services/common.service.js";

export const getSuppliers = asyncHandler(async (req, res, next) => {
    const SupplierModel = getLocalSupplierModel();

    const suppliers = await SupplierModel.find().sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        message: "Suppliers retrieved successfully",
        data: suppliers,
    });
});


export const getPaginatedSuppliers=asyncHandler( async (req,res)=>{
    const SupplierModel = getLocalSupplierModel();
    const suppliers = await paginateModel({
        model:SupplierModel,
        page:req.query.page,
        limit:req.query.limit,
        populate:["supplier"],
        sort:{createdAt:-1},
     })


     return res.status(200).json({
        success: true,
        message: "Suppliers retrieved successfully",
        data: suppliers,
    });
})

export const createSupplier = asyncHandler(async (req, res, next) => {
    const SupplierModel = getLocalSupplierModel();

    const validatedData = await createSupplierSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
    });

    const { name } = validatedData;

    const supplierExists = await SupplierModel.findOne({ name });

    if (supplierExists) {
        return next(
            new ErrorResponse("Supplier with this name already exists", 400),
        );
    }

    const supplier = await SupplierModel.create(validatedData);

    res.status(201).json({
        success: true,
        message: "Supplier created successfully",
        data: supplier,
    });
});

export const updateSupplier = asyncHandler(async (req, res, next) => {
    const SupplierModel = getLocalSupplierModel();
    const { id } = req.params;

    let supplier = await SupplierModel.findById(id);

    if (!supplier) {
        return next(new ErrorResponse("Supplier not found", 404));
    }

    const validatedData = await updateSupplierSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
    });

    if (validatedData.name && validatedData.name !== supplier.name) {
        const nameExists = await SupplierModel.findOne({
            name: validatedData.name,
        });
        if (nameExists) {
            return next(new ErrorResponse("Supplier name already in use", 400));
        }
    }

    supplier = await SupplierModel.findByIdAndUpdate(id, validatedData, {
        new: true,
        runValidators: true,
    });

    res.status(200).json({
        success: true,
        message: "Supplier updated successfully",
        data: supplier,
    });
});

export const deleteSupplier = asyncHandler(async (req, res, next) => {
    const SupplierModel = getLocalSupplierModel();
    const { id } = req.params;

    const supplier = await SupplierModel.findById(id);

    if (!supplier) {
        return next(new ErrorResponse("Supplier not found", 404));
    }

    await supplier.deleteOne();

    res.status(200).json({
        success: true,
        message: "Supplier deleted successfully",
        data: {},
    });
});
