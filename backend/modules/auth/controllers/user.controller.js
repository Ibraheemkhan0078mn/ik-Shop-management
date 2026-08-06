import asyncHandler from "express-async-handler";
import ErrorResponse from "../../../common/utils/ErrorResponse.js";
import { encryptPassword, decryptPassword, isPasswordEncrypted } from "../services/encryption.service.js";
import {
    getAllUsers,
    getUserById,
    getUserByIdWithPassword,
    findUserById,
    userUpdate,
    userDelete,
} from "../services/user.service.js";
import { findOneUserService, createUserService } from "../services/user.crud.js";
import { getLocalUserModel } from "../../../configs/connect.db.js";
import { imageChangeTrackDocsCreation } from "../../../common/ikSync/imageChangeTrackModelCreation.js";

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

export const getUserByIdWithPasswordController = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { requesterRole } = req.query;

    // Only allow admins to fetch user with password
    if (!requesterRole || requesterRole !== 'admin') {
        return next(new ErrorResponse("Unauthorized - Admin access required", 403));
    }

    const user = await getUserByIdWithPassword(id);

    if (!user) {
        return next(new ErrorResponse("User not found", 404));
    }

    // Decrypt password for admin view
    const userWithDecryptedPassword = {
        ...(user.toObject ? user.toObject() : user),
        password: decryptPassword(user.password)
    };

    res.status(200).json({
        success: true,
        message: "User fetched successfully",
        data: userWithDecryptedPassword,
    });
});

export const createUserByAdminController = asyncHandler(async (req, res, next) => {
    const UserModel = getLocalUserModel();
    const { email, password, confirmPassword, name } = req.body;

    if (!name || !email || !password) {
        return next(new ErrorResponse("Name, email, and password are required", 400));
    }

    // Only check password match if confirmPassword is provided
    if (confirmPassword && password !== confirmPassword) {
        return next(new ErrorResponse("Passwords do not match", 400));
    }

    if (password.length < 6) {
        return next(new ErrorResponse("Password must be at least 6 characters long", 400));
    }

    const userExists = await findOneUserService({ email });
    if (userExists) {
        return next(new ErrorResponse("A user with this email already exists", 400));
    }

    const { confirmPassword: _, ...userData } = req.body;
    
    // Encrypt password before storing
    if (userData.password && !isPasswordEncrypted(userData.password)) {
        userData.password = encryptPassword(userData.password);
    }
    
    // Add photo filename if file was uploaded
    if (req.file) {
        userData.photo = req.file.filename;
    }

    const user = await createUserService({ ...userData, permissions: userData.permissions });
    
    // Track image creation if photo was uploaded
    if (req.file?.filename) {
        await imageChangeTrackDocsCreation("create", UserModel.modelName, user._id);
    }

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
            photo: user.photo,
        },
    });
});

export const updateUserByAdminController = asyncHandler(async (req, res, next) => {
    const UserModel = getLocalUserModel();
    const { _id, email } = req.body;

    if (!_id) {
        return next(new ErrorResponse("User ID is required", 400));
    }

    const existingUser = await findUserById(_id);
    if (!existingUser) {
        return next(new ErrorResponse("User not found", 404));
    }

    // Check if email is being changed and if it already exists
    if (email && email !== existingUser.email) {
        const emailExists = await findOneUserService({ email });
        if (emailExists) {
            return next(new ErrorResponse("A user with this email already exists", 400));
        }
    }

    const updateData = { ...req.body };
    
    // Encrypt password if provided and not already encrypted
    if (updateData.password && !isPasswordEncrypted(updateData.password)) {
        updateData.password = encryptPassword(updateData.password);
    }
    
    // Add photo filename if file was uploaded
    if (req.file) {
        updateData.photo = req.file.filename;
    }

    const updated = await userUpdate(_id, updateData);
    
    // Track image changes
    if (req.file?.filename) {
        // New photo uploaded - delete old photo from Cloudinary and track new one
        if (existingUser?.cloudinaryPublicId) {
            await imageChangeTrackDocsCreation("delete", UserModel.modelName, updated._id, existingUser.cloudinaryPublicId);
        }
        await imageChangeTrackDocsCreation("create", UserModel.modelName, updated._id);
    }

    if (!updated) {
        return next(new ErrorResponse("Failed to update user", 500));
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

    const existingUser = await findUserById(_id);
    if (!existingUser) {
        return next(new ErrorResponse("User not found", 404));
    }

    const deleted = await userDelete(_id);

    if (!deleted) {
        return next(new ErrorResponse("Failed to delete user", 500));
    }

    const users = await getAllUsers();

    res.status(200).json({
        success: true,
        message: "User deleted successfully",
        data: users,
    });
});
