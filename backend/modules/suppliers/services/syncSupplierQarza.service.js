import { qarzaAccountUpdate } from "../../qarza/services/qarza.service.js";

/**
 * Sync supplier data to associated qarza account
 * Updates qarza account when supplier fields are changed
 */
const syncSupplierToQarzaAccount = async (supplier) => {
    if (!supplier || !supplier.qarzaAccountId) {
        return; // No qarza account to sync
    }

    try {
        const qarzaUpdateData = {
            name: supplier.name,
            phoneNo: supplier.phone || '',
            address: supplier.address || '',
            notes: supplier.notes || `Auto-created for supplier: ${supplier.name}`,
            isActive: supplier.isActive
        };

        await qarzaAccountUpdate(supplier.qarzaAccountId, qarzaUpdateData);
    } catch (error) {
        console.error("Failed to sync supplier data to qarza account:", error);
        // Don't throw error - supplier update should succeed even if qarza sync fails
    }
};

export { syncSupplierToQarzaAccount };
