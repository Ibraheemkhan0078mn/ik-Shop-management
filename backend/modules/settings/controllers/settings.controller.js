import asyncHandler from "express-async-handler";
import ErrorResponse from "../../../common/utils/ErrorResponse.js";
import {
    getSettingsByUserId,
    updateSettings,
    updateShopSettings,
    updatePrinterSettings,
    updateCameraSettings,
    updateLanguageSettings,
    updateModuleSettings,
} from "../services/settings.service.js";

// Get Settings
export const getSettingsData = asyncHandler(async (req, res, next) => {
    const { userId } = req.query;
    // For legacy endpoints, if no userId provided, use "global" as userId
    const effectiveUserId = userId || "global";
    const settings = await getSettingsByUserId(effectiveUserId);

    res.status(200).json({
        success: true,
        message: "Settings retrieved successfully",
        data: settings,
    });
});

// Update Settings
export const updateSettingsData = asyncHandler(async (req, res, next) => {
    const { userId } = req.body;
    // For legacy endpoints, if no userId provided, use "global" as userId
    const effectiveUserId = userId || "global";
    const updateData = req.body;
    const settings = await updateSettings(effectiveUserId, updateData);

    res.status(200).json({
        success: true,
        message: "Settings updated successfully",
        data: settings,
    });
});

// Update Shop Settings
export const updateShopSettingsData = asyncHandler(async (req, res, next) => {
    const { userId } = req.body;
    if (!userId) {
        return next(new ErrorResponse("User ID is required", 400));
    }
    const shopData = req.body;
    const settings = await updateShopSettings(userId, shopData);

    res.status(200).json({
        success: true,
        message: "Shop settings updated successfully",
        data: settings,
    });
});

// Update Printer Settings
export const updatePrinterSettingsData = asyncHandler(async (req, res, next) => {
    const { userId } = req.body;
    if (!userId) {
        return next(new ErrorResponse("User ID is required", 400));
    }
    const printerData = req.body;
    const settings = await updatePrinterSettings(userId, printerData);

    res.status(200).json({
        success: true,
        message: "Printer settings updated successfully",
        data: settings,
    });
});

// Update Camera Settings
export const updateCameraSettingsData = asyncHandler(async (req, res, next) => {
    const { userId } = req.body;
    if (!userId) {
        return next(new ErrorResponse("User ID is required", 400));
    }
    const cameraData = req.body;
    const settings = await updateCameraSettings(userId, cameraData);

    res.status(200).json({
        success: true,
        message: "Camera settings updated successfully",
        data: settings,
    });
});

// Update Language Settings
export const updateLanguageSettingsData = asyncHandler(async (req, res, next) => {
    const { userId, language } = req.body;

    // For legacy endpoints, if no userId provided, use "global" as userId
    const effectiveUserId = userId || "global";

    if (!language) {
        return next(new ErrorResponse("Language is required", 400));
    }

    const settings = await updateLanguageSettings(effectiveUserId, language);

    res.status(200).json({
        success: true,
        message: "Language settings updated successfully",
        data: settings,
    });
});

// Update Module Settings
export const updateModuleSettingsData = asyncHandler(async (req, res, next) => {
    const { userId, modules } = req.body;

    if (!userId) {
        return next(new ErrorResponse("User ID is required", 400));
    }
    if (!modules) {
        return next(new ErrorResponse("Modules data is required", 400));
    }

    const settings = await updateModuleSettings(userId, modules);

    res.status(200).json({
        success: true,
        message: "Module settings updated successfully",
        data: settings,
    });
});
