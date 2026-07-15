import { getLocalSettingsModel } from "../../../configs/connect.db.js";

// Get settings by user ID
export const getSettingsByUserId = async (userId) => {
    const SettingsModel = getLocalSettingsModel();
    let settings = await SettingsModel.findOne({ userId });
    
    // If no settings exist, create default settings for this user
    if (!settings) {
        settings = await SettingsModel.create({ userId });
    }
    
    return settings;
};

// Update settings
export const updateSettings = async (userId, updateData) => {
    const SettingsModel = getLocalSettingsModel();
    const settings = await SettingsModel.findOneAndUpdate(
        { userId },
        { $set: updateData },
        { new: true, upsert: true }
    );
    
    return settings;
};

// Update shop settings
export const updateShopSettings = async (userId, shopData) => {
    const SettingsModel = getLocalSettingsModel();
    const settings = await SettingsModel.findOneAndUpdate(
        { userId },
        { $set: { shop: shopData } },
        { new: true, upsert: true }
    );
    
    return settings;
};

// Update printer settings
export const updatePrinterSettings = async (userId, printerData) => {
    const SettingsModel = getLocalSettingsModel();
    const settings = await SettingsModel.findOneAndUpdate(
        { userId },
        { $set: { printer: printerData } },
        { new: true, upsert: true }
    );
    
    return settings;
};

// Update camera settings
export const updateCameraSettings = async (userId, cameraData) => {
    const SettingsModel = getLocalSettingsModel();
    const settings = await SettingsModel.findOneAndUpdate(
        { userId },
        { $set: { camera: cameraData } },
        { new: true, upsert: true }
    );
    
    return settings;
};

// Update language settings
export const updateLanguageSettings = async (userId, language) => {
    const SettingsModel = getLocalSettingsModel();
    const settings = await SettingsModel.findOneAndUpdate(
        { userId },
        { $set: { language } },
        { new: true, upsert: true }
    );
    
    return settings;
};

// Update module visibility settings
export const updateModuleSettings = async (userId, modules) => {
    const SettingsModel = getLocalSettingsModel();
    const settings = await SettingsModel.findOneAndUpdate(
        { userId },
        { $set: { modules } },
        { new: true, upsert: true }
    );
    
    return settings;
};

// Update permission password settings
export const updatePermissionPasswordSettings = async (userId, permissionPassword) => {
    const SettingsModel = getLocalSettingsModel();
    const settings = await SettingsModel.findOneAndUpdate(
        { userId },
        { $set: { permissionPassword } },
        { new: true, upsert: true }
    );
    
    return settings;
};
