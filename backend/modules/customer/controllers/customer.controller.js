import asyncHandler from "express-async-handler";
import ErrorResponse from "../../../common/utils/ErrorResponse.js";
import { deleteProductImage } from "../../product/services/productImage.service.js";
import {
    customerCreate as customerCreateService,
    getAllCustomers as getAllCustomersService,
    getCustomerById as getCustomerByIdService,
    findCustomerByPhoneOrCnic as findCustomerByPhoneOrCnicService,
    customerUpdate as customerUpdateService,
    customerDelete as customerDeleteService,
    getPaginatedCustomers as getPaginatedCustomersService,
} from "../services/customer.service.js";
import { getLocalCustomerModel } from "../../../configs/connect.db.js";
import { imageChangeTrackDocsCreation } from "../../../common/ikSync/imageChangeTrackModelCreation.js";
import { qarzaAccountCreate as qarzaAccountCreateService } from "../../qarza/services/qarza.service.js";

const coerceCustomerBody = (body = {}) => {
    const coerced = { ...body };
    for (const [key, value] of Object.entries(coerced)) {
        if (typeof value !== "string") continue;
        if (value === "true" || value === "false") {
            coerced[key] = value === "true";
            continue;
        }
        if (value.trim() === "") continue;
        const parsed = Number(value);
        if (!Number.isNaN(parsed)) {
            coerced[key] = parsed;
        }
    }
    return coerced;
};

const buildCustomerPayload = (body = {}, fileName) => {
    const payload = coerceCustomerBody(body);
    if (fileName) {
        payload.image = fileName;
    } else if (payload.image === undefined) {
        payload.image = "";
    }
    return payload;
};

export const getCustomers = asyncHandler(async (_req, res) => {
    const customers = await getAllCustomersService();
    res.status(200).json({ success: true, message: "Customers retrieved successfully", data: customers });
});

export const getPaginatedCustomers = asyncHandler(async (req, res) => {
    const result = await getPaginatedCustomersService({
        page: req.query.page || 1,
        limit: req.query.limit || 20,
    });

    return res.status(200).json({
        success: true,
        message: "Customers retrieved successfully",
        data: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
    });
});

export const getCustomerById = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const customer = await getCustomerByIdService(id);

    if (!customer) {
        return next(new ErrorResponse("Customer not found", 404));
    }

    return res.status(200).json({ success: true, message: "Customer retrieved successfully", data: customer });
});

export const createCustomer = asyncHandler(async (req, res, next) => {
    const CustomerModel = getLocalCustomerModel();
    const validatedData = buildCustomerPayload(req.body || {}, req.file?.filename);

    const { phoneNo, cnic, name, address } = validatedData;
    const duplicate = await findCustomerByPhoneOrCnicService({ $or: [{ phoneNo }, { cnic }] });

    if (duplicate) {
        return next(new ErrorResponse("Customer with this phone or CNIC already exists", 400));
    }

    const customer = await customerCreateService(validatedData);
    
    // Auto-create qarza account for customer
    try {
        const qarzaAccount = await qarzaAccountCreateService({
            name: name,
            type: 'customer',
            phoneNo: phoneNo || '',
            address: address || '',
            notes: `Auto-created for customer: ${name}`,
            isActive: true
        });
        
        // Update customer with qarza account ID
        await customerUpdateService(customer._id, { qarzaAccountId: qarzaAccount._id });
        customer.qarzaAccountId = qarzaAccount._id;
    } catch (qarzaError) {
        console.error("Failed to create qarza account for customer:", qarzaError);
        // Continue with customer creation even if qarza account creation fails
    }
    
    // Track image creation if image was uploaded
    if (req.file?.filename) {
        await imageChangeTrackDocsCreation("create", CustomerModel.modelName, customer._id);
    }
    
    res.status(201).json({ success: true, message: "Customer created successfully", data: customer });
});

export const updateCustomer = asyncHandler(async (req, res, next) => {
    const CustomerModel = getLocalCustomerModel();
    const { id } = req.params;
    let customer = await getCustomerByIdService(id);

    if (!customer) {
        return next(new ErrorResponse("Customer not found", 404));
    }

    const validatedData = buildCustomerPayload(req.body || {}, req.file?.filename);
    if (!req.file && req.body?.image === undefined) {
        delete validatedData.image;
    }

    if (validatedData.phoneNo || validatedData.cnic) {
        const duplicate = await findCustomerByPhoneOrCnicService({
            $and: [
                { _id: { $ne: id } },
                { $or: [{ phoneNo: validatedData.phoneNo }, { cnic: validatedData.cnic }] },
            ],
        });

        if (duplicate) {
            return next(new ErrorResponse("Customer with this phone or CNIC already exists", 400));
        }
    }

    if (req.file?.filename && customer.image) {
        deleteProductImage(customer.image);
    }

    customer = await customerUpdateService(id, validatedData);
    
    // Track image changes
    if (req.file?.filename) {
        // New image uploaded - delete old image from Cloudinary and track new one
        if (customer?.cloudinaryPublicId) {
            await imageChangeTrackDocsCreation("delete", CustomerModel.modelName, customer._id, customer.cloudinaryPublicId);
        }
        await imageChangeTrackDocsCreation("create", CustomerModel.modelName, customer._id);
    }
    
    res.status(200).json({ success: true, message: "Customer updated successfully", data: customer });
});

export const deleteCustomer = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const customer = await getCustomerByIdService(id);

    if (!customer) {
        return next(new ErrorResponse("Customer not found", 404));
    }

    await customerDeleteService(id);
    res.status(200).json({ success: true, message: "Customer deleted successfully", data: {} });
});
