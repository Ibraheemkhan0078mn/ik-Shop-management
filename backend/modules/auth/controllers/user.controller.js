import asyncHandler from "express-async-handler";
import ErrorResponse from "../../../common/utils/ErrorResponse.js";
import {
    getAllUsers,
    getUserById,
    findUserById,
    userUpdate,
    userDelete,
} from "../services/user.service.js";
import { findOneUserService, createUserService } from "../services/user.crud.js";

export const getAllUsersController = asyncHandler(async (req, res, next) => {
    const users = await getAllUsers();
    res.status(200).json({
        success: true,
        message: "Users fetched successfully",
        data: users,
    });
});

export const getUserByIdController = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const user = await getUserById(id);

    if (!user) {
        return next(new ErrorResponse("User not found", 404));
    }

    res.status(200).json({
        success: true,
        message: "User fetched successfully",
        data: user,
    });
});

export const createUserByAdminController = asyncHandler(async (req, res, next) => {
    const { email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        return next(new ErrorResponse("Passwords do not match", 400));
    }

    const userExists = await findOneUserService({ email });
    if (userExists) {
        return next(new ErrorResponse("User already exists with this email", 400));
    }

    const { confirmPassword: _, ...userData } = req.body;
    const user = await createUserService({ ...userData, permissions: userData.permissions });

    res.status(201).json({
        success: true,
        message: "User created successfully",
        data: {
            id: user._id,
            name: user.name,
            email: user.email,
            phoneNo: user.phoneNo,
            role: user.role,
            permissions: user.permissions,
        },
    });
});

export const updateUserByAdminController = asyncHandler(async (req, res, next) => {
    const { _id } = req.body;

    if (!_id) {
        return next(new ErrorResponse("User ID is required", 400));
    }

    const existingUser = await findUserById(_id);
    if (!existingUser) {
        return next(new ErrorResponse("User not found", 404));
    }

    const updated = await userUpdate(_id, req.body);

    if (!updated) {
        return next(new ErrorResponse("User not found", 404));
    }

    const users = await getAllUsers();

    res.status(200).json({
        success: true,
        message: "User updated successfully",
        data: users,
    });
});

export const deleteUserByAdminController = asyncHandler(async (req, res, next) => {
    const { _id } = req.body;

    if (!_id) {
        return next(new ErrorResponse("User ID is required", 400));
    }

    const deleted = await userDelete(_id);

    if (!deleted) {
        return next(new ErrorResponse("User not found", 404));
    }

    const users = await getAllUsers();

    res.status(200).json({
        success: true,
        message: "User deleted successfully",
        data: users,
    });
});
