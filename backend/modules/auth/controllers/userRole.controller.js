import asyncHandler from "express-async-handler";
import ErrorResponse from "../../../common/utils/ErrorResponse.js";
import { changeTrackDocsCreationFunc } from "../../../common/ikSync/changeTrackModelCreation.js";
import {
    createUserRoleService,
    findUserRoleService,
    findByIdUserRoleService,
    updateUserRoleService,
    deleteOneUserRoleService,
    countUserRoleService
} from "../services/userRole.crud.js";

export const getAllUserRolesController = asyncHandler(async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const roles = await findUserRoleService({}, { skip, limit });
    const total = await countUserRoleService({});

    res.status(200).json({
        success: true,
        message: "User roles fetched successfully",
        data: roles,
        total,
        page,
        limit,
    });
});

export const getUserRoleByIdController = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const role = await findByIdUserRoleService(id);

    if (!role) {
        return next(new ErrorResponse("User role not found", 404));
    }

    res.status(200).json({
        success: true,
        message: "User role fetched successfully",
        data: role,
    });
});

export const createUserRoleController = asyncHandler(async (req, res, next) => {
    const { name, permissions } = req.body;

    if (!name) {
        return next(new ErrorResponse("Role name is required", 400));
    }

    const existingRole = await findUserRoleService({ name });
    if (existingRole.length > 0) {
        return next(new ErrorResponse("A role with this name already exists", 400));
    }

    const role = await createUserRoleService({ name, permissions: permissions || [] });

    await changeTrackDocsCreationFunc("create", "UserRoles", role._id);

    const roles = await findUserRoleService({});

    res.status(201).json({
        success: true,
        message: "User role created successfully",
        data: roles,
    });
});

export const updateUserRoleController = asyncHandler(async (req, res, next) => {
    const { _id, name, permissions } = req.body;

    if (!_id) {
        return next(new ErrorResponse("Role ID is required", 400));
    }

    const existingRole = await findByIdUserRoleService(_id);
    if (!existingRole) {
        return next(new ErrorResponse("User role not found", 404));
    }

    // Check if name is being changed and if it already exists
    if (name && name !== existingRole.name) {
        const nameExists = await findUserRoleService({ name });
        if (nameExists.length > 0) {
            return next(new ErrorResponse("A role with this name already exists", 400));
        }
    }

    const updated = await updateUserRoleService(_id, { name, permissions });

    if (!updated) {
        return next(new ErrorResponse("Failed to update user role", 500));
    }

    await changeTrackDocsCreationFunc("update", "UserRoles", _id);

    const roles = await findUserRoleService({});

    res.status(200).json({
        success: true,
        message: "User role updated successfully",
        data: roles,
    });
});

export const deleteUserRoleController = asyncHandler(async (req, res, next) => {
    const { _id } = req.body;

    if (!_id) {
        return next(new ErrorResponse("Role ID is required", 400));
    }

    const existingRole = await findByIdUserRoleService(_id);
    if (!existingRole) {
        return next(new ErrorResponse("User role not found", 404));
    }

    const deleted = await deleteOneUserRoleService(_id);

    if (!deleted) {
        return next(new ErrorResponse("Failed to delete user role", 500));
    }

    await changeTrackDocsCreationFunc("delete", "UserRoles", _id);

    const roles = await findUserRoleService({});

    res.status(200).json({
        success: true,
        message: "User role deleted successfully",
        data: roles,
    });
});
