import { qarzaAccountUpdate } from "../../qarza/services/qarza.service.js";

/**
 * Sync customer data to associated qarza account
 * Updates qarza account when customer fields are changed
 */
const syncCustomerToQarzaAccount = async (customer) => {
    if (!customer || !customer.qarzaAccountId) {
        return; // No qarza account to sync
    }

    try {
        const qarzaUpdateData = {
            name: customer.name,
            phoneNo: customer.phoneNo || '',
            address: customer.address || '',
            notes: `Auto-created for customer: ${customer.name}`,
            isActive: customer.isActive
        };

        await qarzaAccountUpdate(customer.qarzaAccountId, qarzaUpdateData);
    } catch (error) {
        console.error("Failed to sync customer data to qarza account:", error);
        // Don't throw error - customer update should succeed even if qarza sync fails
    }
};

export { syncCustomerToQarzaAccount };
