import { getOnlineDbInstance } from "../../configs/onlineConnect.db.js";
import {
    getOnlineUserModel,
    getOnlineProductModel,
    getOnlineCategoryModel,
    getOnlineSubCategoryModel,
    getOnlineBatchModel,
    getOnlineSupplierModel,
    getOnlinePurchaseModel,
    getOnlinePurchasePaymentModel,
    getOnlineOrderModel,
    getOnlineHoldOrderModel,
    getOnlineExpensesModel,
    getOnlineExpenseCategoryModel,
    getOnlineActivityLogModel,
    getOnlineChangeTrackModel,
    getOnlineImageChangeTrackModel,
    getOnlineQarzaAccountModel,
    getOnlineQarzaPaymentModel,
    getOnlineWastageModel,
    getOnlinePurchaseReturnModel,
    getOnlineProductReturnModel,
    getOnlineCustomerModel,
    getOnlineStaffModel,
    getOnlineStaffSalaryPaymentModel,
    getOnlineStaffSaleBillModel,
    getOnlineStaffAttendanceModel,
    getOnlineSettingsModel,
    getOnlinePaymentMethodModel,
    getOnlineAppThemeModel,
} from "../../configs/onlineConnect.db.js";
import {
    getLocalUserModel,
    getLocalProductModel,
    getLocalCategoryModel,
    getLocalSubCategoryModel,
    getLocalBatchModel,
    getLocalSupplierModel,
    getLocalPurchaseModel,
    getLocalPurchasePaymentModel,
    getLocalOrderModel,
    getLocalHoldOrderModel,
    getLocalExpensesModel,
    getLocalExpenseCategoryModel,
    getLocalActivityLogModel,
    getLocalChangeTrackModel,
    getLocalImageChangeTrackModel,
    getLocalQarzaAccountModel,
    getLocalQarzaPaymentModel,
    getLocalWastageModel,
    getLocalPurchaseReturnModel,
    getLocalProductReturnModel,
    getLocalCustomerModel,
    getLocalStaffModel,
    getLocalStaffSalaryPaymentModel,
    getLocalStaffSaleBillModel,
    getLocalStaffAttendanceModel,
    getLocalSettingsModel,
    getLocalPaymentMethodModel,
    getLocalAppThemeModel,
} from "../../configs/connect.db.js";

// Map model names to their getter functions for both local and online DB
const modelGetterMap = {
    "Users": { local: getLocalUserModel, online: getOnlineUserModel },
    "Products": { local: getLocalProductModel, online: getOnlineProductModel },
    "Categories": { local: getLocalCategoryModel, online: getOnlineCategoryModel },
    "SubCategories": { local: getLocalSubCategoryModel, online: getOnlineSubCategoryModel },
    "Batches": { local: getLocalBatchModel, online: getOnlineBatchModel },
    "Suppliers": { local: getLocalSupplierModel, online: getOnlineSupplierModel },
    "Purchases": { local: getLocalPurchaseModel, online: getOnlinePurchaseModel },
    "PurchasePayments": { local: getLocalPurchasePaymentModel, online: getOnlinePurchasePaymentModel },
    "Orders": { local: getLocalOrderModel, online: getOnlineOrderModel },
    "HoldOrders": { local: getLocalHoldOrderModel, online: getOnlineHoldOrderModel },
    "Expenses": { local: getLocalExpensesModel, online: getOnlineExpensesModel },
    "ExpensesCategory": { local: getLocalExpenseCategoryModel, online: getOnlineExpenseCategoryModel },
    "ActivityLogs": { local: getLocalActivityLogModel, online: getOnlineActivityLogModel },
    "ChangeTracks": { local: getLocalChangeTrackModel, online: getOnlineChangeTrackModel },
    "ImageChangeTracks": { local: getLocalImageChangeTrackModel, online: getOnlineImageChangeTrackModel },
    "QarzaAccount": { local: getLocalQarzaAccountModel, online: getOnlineQarzaAccountModel },
    "QarzaPayment": { local: getLocalQarzaPaymentModel, online: getOnlineQarzaPaymentModel },
    "Wastages": { local: getLocalWastageModel, online: getOnlineWastageModel },
    "PurchaseReturn": { local: getLocalPurchaseReturnModel, online: getOnlinePurchaseReturnModel },
    "ProductReturn": { local: getLocalProductReturnModel, online: getOnlineProductReturnModel },
    "Customers": { local: getLocalCustomerModel, online: getOnlineCustomerModel },
    "Staff": { local: getLocalStaffModel, online: getOnlineStaffModel },
    "StaffSalaryPayment": { local: getLocalStaffSalaryPaymentModel, online: getOnlineStaffSalaryPaymentModel },
    "StaffSaleBill": { local: getLocalStaffSaleBillModel, online: getOnlineStaffSaleBillModel },
    "StaffAttendance": { local: getLocalStaffAttendanceModel, online: getOnlineStaffAttendanceModel },
    "Settings": { local: getLocalSettingsModel, online: getOnlineSettingsModel },
    "PaymentMethods": { local: getLocalPaymentMethodModel, online: getOnlinePaymentMethodModel },
    "AppThemes": { local: getLocalAppThemeModel, online: getOnlineAppThemeModel },
};

/**
 * Sync live changes to online database
 * NOTE: This function is currently NOT being used. It's kept for future implementation.
 * When enabled, it will sync document changes (create, update, delete) to the online database in real-time.
 * 
 * @param {string} operation - The operation type: 'create', 'update', or 'delete'
 * @param {string} modelName - The name of the model (must match keys in modelGetterMap)
 * @param {string} documentId - The ID of the document to sync
 */
export async function liveChangeSyncFunc(operation, modelName, documentId) {
    console.log(`[liveChangeSync] Function called but currently DISABLED. Operation: ${operation}, Model: ${modelName}, ID: ${documentId}`);
    
    // Function is currently disabled - return early
    return;
    
    try {
        // Check if online DB is connected
        const onlineDbInstance = getOnlineDbInstance();
        if (!onlineDbInstance || onlineDbInstance.readyState !== 1) {
            console.log(`[liveChangeSync] Online DB not connected, skipping sync for ${modelName}`);
            return;
        }

        // Get the model getters for the given modelName
        const modelGetters = modelGetterMap[modelName];
        if (!modelGetters) {
            console.log(`[liveChangeSync] No model mapping found for ${modelName}`);
            return;
        }

        // Get model instances using the imported getter functions
        const localModel = modelGetters.local();
        const onlineModel = modelGetters.online();

        if (!localModel || !onlineModel) {
            console.log(`[liveChangeSync] Model not available for ${modelName}`);
            return;
        }

        // Fetch the document from local DB
        const localDoc = await localModel.findById(documentId);
        if (!localDoc && operation !== 'delete') {
            console.log(`[liveChangeSync] Document not found in local DB for ${modelName}`);
            return;
        }

        // Perform the operation on online DB
        if (operation === 'create' || operation === 'update') {
            // Use findOneAndUpdate with upsert for create/update
            const docData = localDoc.toObject();
            delete docData._id; // Remove _id to let MongoDB handle it

            await onlineModel.findOneAndUpdate(
                { _id: documentId },
                docData,
                { upsert: true, returnDocument: 'after' }
            );
            console.log(`[liveChangeSync] ${operation} synced to online DB for ${modelName} (${documentId})`);
        } else if (operation === 'delete') {
            // Delete the document from online DB
            await onlineModel.deleteOne({ _id: documentId });
            console.log(`[liveChangeSync] delete synced to online DB for ${modelName} (${documentId})`);
        }

    } catch (error) {
        console.error(`[liveChangeSync] Error syncing ${modelName} to online DB:`, error);
    }
}
