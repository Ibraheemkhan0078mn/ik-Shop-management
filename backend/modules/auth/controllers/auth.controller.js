import asyncHandler from "express-async-handler";
import ErrorResponse from "../../../common/utils/ErrorResponse.js";
import { loginSchema, registerSchema } from "../schemas/auth.schema.js";
import { getLocalUserModel } from "../../../configs/connect.db.js";

export const loginUser = asyncHandler(async (req, res, next) => {
    const UserModel = getLocalUserModel();
    const { email, password } = await loginSchema.validate(req.body, {
        abortEarly: true,
        stripUnknown: true,
    });

    const user = await UserModel.findOne({ email }).select("+password");

    if (!user) {
        return next(new ErrorResponse("Invalid credentials", 401));
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
        return next(new ErrorResponse("Invalid credentials", 401));
    }

    req.session.userId = user._id;

    res.status(200).json({
        success: true,
        message: "User logged in successfully",
        data: {
            id: user._id,
            name: user.name,
            role: user.role,
        },
    });
});

export const registerUser = asyncHandler(async (req, res, next) => {
    const UserModel = getLocalUserModel();
    const validatedData = await registerSchema.validate(req.body, {
        abortEarly: true,
        stripUnknown: true,
    });
    const { email } = validatedData;
    const userExists = await UserModel.findOne({ email });
    if (userExists) {
        return next(
            new ErrorResponse("User already exists with this email", 400),
        );
    }
    const user = await UserModel.create(validatedData);
    req.session.userId = user._id;
    res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
            id: user._id,
            name: user.name,
            role: user.role,
        },
    });
});

export const getMe = asyncHandler(async (req, res, next) => {
    const UserModel = getLocalUserModel();

    // if (!req.session.userId) {
    //     return next(
    //         new ErrorResponse("Not authorized to access this route", 401),
    //     );
    // }

    // const user = await UserModel.findById(req.session.userId).select(
    //     "-password",
    // );

    // if (!user) {
    //     return next(new ErrorResponse("User not found", 404));
    // }

    res.status(200).json({
        success: true,
        message: "User fetched successfully",
        // user,
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
