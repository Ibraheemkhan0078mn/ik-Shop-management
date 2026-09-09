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

// Update backup settings
export const updateBackupSettings = async (userId, backupData) => {
    const settings = await findOneAndUpdateSettingsService(
        { userId },
        { $set: { backup: backupData } }
    );
    console.log(backupData, "The backup data being saved");
    
    return settings;
};

// Update zoom settings
export const updateZoomSettings = async (userId, zoomLevel) => {
    const settings = await findOneAndUpdateSettingsService(
        { userId },
        { $set: { zoom: zoomLevel } }
    );
    
    return settings;
};

// Recalculate all data
export const recalculateAllData = async () => {
    const { recalculateAllStock } = await import("../../product/services/stockRecalculation.service.js");
    const { recalculateCustomerBalance } = await import("../../qarza/services/recalculateCustomerBalance.service.js");
    const { recalculateSupplierBalance } = await import("../../qarza/services/recalculateSupplierBalance.service.js");
    const { recalculateGeneralAccountBalance } = await import("../../qarza/services/recalculateGeneralAccountBalance.service.js");
    const { findQarzaAccountService } = await import("../../qarza/services/qarzaAccount.crud.js");

    const results = {
        stock: null,
        customers: null,
        suppliers: null,
        generalAccounts: null
    };

    try {
        // 1. Recalculate all product stock
        results.stock = await recalculateAllStock();

        // 2. Get all qarza accounts
        const allAccounts = await findQarzaAccountService({ isDeleted: false });

        // 3. Recalculate customer balances
        const customerAccounts = allAccounts.filter(acc => acc.type === 'customer');
        const customerResults = await Promise.all(
            customerAccounts.map(acc => recalculateCustomerBalance(acc._id))
        );
        results.customers = {
            total: customerResults.length,
            results: customerResults
        };

        // 4. Recalculate supplier balances
        const supplierAccounts = allAccounts.filter(acc => acc.type === 'supplier');
        const supplierResults = await Promise.all(
            supplierAccounts.map(acc => recalculateSupplierBalance(acc._id))
        );
        results.suppliers = {
            total: supplierResults.length,
            results: supplierResults
        };

        // 5. Recalculate general account balances
        const generalAccounts = allAccounts.filter(acc => acc.type === 'general');
        const generalResults = await Promise.all(
            generalAccounts.map(acc => recalculateGeneralAccountBalance(acc._id))
        );
        results.generalAccounts = {
            total: generalResults.length,
            results: generalResults
        };

        return results;
    } catch (error) {
        console.error("Error in recalculateAllData:", error);
        throw error;
    }
};
