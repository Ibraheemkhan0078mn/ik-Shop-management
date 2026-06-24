import asyncHandler from "express-async-handler";
import ErrorResponse from "../../../common/utils/ErrorResponse.js";
import { getLocalCustomerModel } from "../../../configs/connect.db.js";
import { paginateModel } from "../../../common/services/common.service.js";
import {
    customerCreate as customerCreateService,
    getAllCustomers as getAllCustomersService,
    getCustomerById as getCustomerByIdService,
    findCustomerByPhoneOrCnic as findCustomerByPhoneOrCnicService,
    customerUpdate as customerUpdateService,
    customerDelete as customerDeleteService,
} from "../services/customer.service.js";

export const getCustomers = asyncHandler(async (_req, res) => {
    const customers = await getAllCustomersService();
    res.status(200).json({ success: true, message: "Customers retrieved successfully", data: customers });
});

export const getPaginatedCustomers = asyncHandler(async (req, res) => {
    const CustomerModel = getLocalCustomerModel();
    const result = await paginateModel({
        model: CustomerModel,
        page: req.query.page || 1,
        limit: req.query.limit || 20,
        sort: { createdAt: -1 },
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
    const validatedData = req.body || {};

    const { phoneNo, cnic } = validatedData;
    const duplicate = await findCustomerByPhoneOrCnicService({ $or: [{ phoneNo }, { cnic }] });

    if (duplicate) {
        return next(new ErrorResponse("Customer with this phone or CNIC already exists", 400));
    }

    const customer = await customerCreateService(validatedData);
    res.status(201).json({ success: true, message: "Customer created successfully", data: customer });
});

export const updateCustomer = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    let customer = await getCustomerByIdService(id);

    if (!customer) {
        return next(new ErrorResponse("Customer not found", 404));
    }

    const validatedData = req.body || {};

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

    customer = await customerUpdateService(id, validatedData);
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
