import asyncHandler from "express-async-handler";
import ErrorResponse from "../../../common/utils/ErrorResponse.js";
import { getLocalUserModel } from "../../../configs/connect.db.js";
import {
    userCreate as userCreateService,
    findUserByEmail as findUserByEmailService,
    findUserById as findUserByIdService,
} from "../services/auth.service.js";

export const loginUser = asyncHandler(async (req, res, next) => {
    const UserModel = getLocalUserModel();
    const { email, password } = req.body || {};

    const user = await findUserByEmailService(email);
    if (!user) {
        return next(new ErrorResponse("Invalid credentials", 401));
    }

    const userWithPassword = await UserModel.findOne({ email }).select("+password");
    const isMatch = await userWithPassword.comparePassword(password);

    if (!isMatch) {
        return next(new ErrorResponse("Invalid credentials", 401));
    }

    res.status(200).json({
        success: true,
        message: "User logged in successfully",
        data: {
            id: user._id,
            name: user.name,
            email: user.email,
            phoneNo: user.phoneNo,
            role: user.role,
            permissions: user.permissions || [],
        },
    });
});

export const registerUser = asyncHandler(async (req, res, next) => {
    const validatedData = req.body || {};
    const { email, password, confirmPassword } = validatedData;

    if (password !== confirmPassword) {
        return next(new ErrorResponse("Passwords do not match", 400));
    }

    const userExists = await findUserByEmailService(email);
    if (userExists) {
        return next(
            new ErrorResponse("User already exists with this email", 400),
        );
    }

    const { confirmPassword: _, ...userData } = validatedData;
    const user = await userCreateService(userData);

    res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
            id: user._id,
            name: user.name,
            email: user.email,
            phoneNo: user.phoneNo,
            role: user.role,
            permissions: user.permissions || [],
        },
    });
});

export const getMe = asyncHandler(async (req, res, next) => {
    const UserModel = getLocalUserModel();
    const { userId } = req.query;

    if (!userId) {
        return res.status(200).json({
            success: false,
            message: "User ID is required",
            data: null,
        });
    }

    const user = await UserModel.findById(userId).select("-password");

    if (!user) {
        return res.status(200).json({
            success: false,
            message: "User not found",
            data: null,
        });
    }

    res.status(200).json({
        success: true,
        message: "User fetched successfully",
        data: user,
    });
});

export const logoutUser = asyncHandler(async (req, res, next) => {
    req.session.destroy((err) => {
        if (err) {
            return next(new ErrorResponse("Failed to logout", 500));
        }

        res.clearCookie("connect.sid");

        res.status(200).json({
            success: true,
            message: "User logged out successfully",
            data: {},
        });
    });
});
