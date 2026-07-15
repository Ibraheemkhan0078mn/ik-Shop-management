import {
    findOneSettingsService,
    createSettingsService,
    findOneAndUpdateSettingsService,
} from "./settings.crud.js";

// Get settings by user ID
export const getSettingsByUserId = async (userId) => {
    let settings = await findOneSettingsService({ userId });
    
    // If no settings exist, create default settings for this user
    if (!settings) {
        settings = await createSettingsService({ userId });
    }
    
    return settings;
};

// Update settings
export const updateSettings = async (userId, updateData) => {
    const settings = await findOneAndUpdateSettingsService(
        { userId },
        { $set: updateData }
    );
    
    return settings;
};

// Update shop settings
export const updateShopSettings = async (userId, shopData) => {
    const settings = await findOneAndUpdateSettingsService(
        { userId },
        { $set: { shop: shopData } }
    );
    
    return settings;
};

// Update printer settings
export const updatePrinterSettings = async (userId, printerData) => {
    const settings = await findOneAndUpdateSettingsService(
        { userId },
        { $set: { printer: printerData } }
    );
    
    return settings;
};

// Update camera settings
export const updateCameraSettings = async (userId, cameraData) => {
    const settings = await findOneAndUpdateSettingsService(
        { userId },
        { $set: { camera: cameraData } }
    );
    
    return settings;
};

// Update language settings
export const updateLanguageSettings = async (userId, language) => {
    const settings = await findOneAndUpdateSettingsService(
        { userId },
        { $set: { language } }
    );
    
    return settings;
};

// Update module visibility settings
export const updateModuleSettings = async (userId, modules) => {
    const settings = await findOneAndUpdateSettingsService(
        { userId },
        { $set: { modules } }
    );
    
    return settings;
};

// Update permission password settings
export const updatePermissionPasswordSettings = async (userId, permissionPassword) => {
    const settings = await findOneAndUpdateSettingsService(
        { userId },
        { $set: { permissionPassword } }
    );
    
    return settings;
};
