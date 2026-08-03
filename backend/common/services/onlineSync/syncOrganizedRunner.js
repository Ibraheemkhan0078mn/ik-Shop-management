import { 
    getLocalPurchaseReturnModel, 
    getLocalProductReturnModel, 
    getLocalWastageModel, 
    getLocalCustomerModel, 
    getLocalQarzaAccountModel, 
    getLocalQarzaPaymentModel, 
    getLocalImageChangeTrackModel, 
    getLocalExpensesModel, 
    getLocalExpenseCategoryModel, 
    getLocalActivityLogModel, 
    getLocalChangeTrackModel, 
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
    getLocalStaffModel, 
    getLocalStaffSalaryPaymentModel, 
    getLocalStaffSaleBillModel, 
    getLocalStaffAttendanceModel, 
    getLocalSettingsModel 
} from "../../../configs/connect.db.js";

import { 
    getOnlinePurchaseReturnModel, 
    getOnlineProductReturnModel, 
    getOnlineWastageModel, 
    getOnlineCustomerModel, 
    getOnlineQarzaAccountModel, 
    getOnlineQarzaPaymentModel, 
    getOnlineImageChangeTrackModel, 
    getOnlineExpensesModel, 
    getOnlineExpenseCategoryModel, 
    getOnlineActivityLogModel, 
    getOnlineChangeTrackModel, 
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
    getOnlineStaffModel, 
    getOnlineStaffSalaryPaymentModel, 
    getOnlineStaffSaleBillModel, 
    getOnlineStaffAttendanceModel, 
    getOnlineSettingsModel 
} from '../../../configs/onlineConnect.db.js';

import { deleteOnlineSync } from "./deleteOnlineSync.js";
import { downloadOnlineSync } from "./downloadOnlineSync.js";
import { permissionChangedDeletionFromLocal } from "./permissionChangeDeletion.js";
import { imageDownloadSync } from "./imageDownloadSync.js";
import { imgDelete } from "./imgDelete.js";
import { ImageUpload } from "./imgUpload.js";
import { onlineDocsUploadSyncInsert, onlineDocsUploadSyncUpdate } from "./uploadSync.js";
import { duplicateChangeTracksServiceCleaning } from "./cleaningSync.js";

export async function docsSyncOrganizer(syncType = "required", loggedInUserData) {
    try {

        let modelArray = [
            { local: getLocalPurchaseReturnModel(), online: getOnlinePurchaseReturnModel(), permissionString: ["purchase-return-view"] },
            { local: getLocalProductReturnModel(), online: getOnlineProductReturnModel(), permissionString: ["product-return-view"] },
            { local: getLocalWastageModel(), online: getOnlineWastageModel(), permissionString: ["wastage-view"] },
            { local: getLocalCustomerModel(), online: getOnlineCustomerModel(), permissionString: ["customer-view"] },
            { local: getLocalQarzaAccountModel(), online: getOnlineQarzaAccountModel(), permissionString: ["qarza-account-view"] },
            { local: getLocalQarzaPaymentModel(), online: getOnlineQarzaPaymentModel(), permissionString: ["qarza-payment-view"] },
            { local: getLocalExpensesModel(), online: getOnlineExpensesModel(), permissionString: ["expense-view"] },
            { local: getLocalExpenseCategoryModel(), online: getOnlineExpenseCategoryModel(), permissionString: ["expense-category-view"] },
            { local: getLocalActivityLogModel(), online: getOnlineActivityLogModel(), permissionString: ["activity-log-view"] },
            { local: getLocalChangeTrackModel(), online: getOnlineChangeTrackModel(), permissionString: [] },
            { local: getLocalImageChangeTrackModel(), online: getOnlineImageChangeTrackModel(), permissionString: [] },
            { local: getLocalUserModel(), online: getOnlineUserModel(), permissionString: ["user-view"] },
            { local: getLocalProductModel(), online: getOnlineProductModel(), permissionString: ["product-view"] },
            { local: getLocalCategoryModel(), online: getOnlineCategoryModel(), permissionString: ["category-view"] },
            { local: getLocalSubCategoryModel(), online: getOnlineSubCategoryModel(), permissionString: ["subcategory-view"] },
            { local: getLocalBatchModel(), online: getOnlineBatchModel(), permissionString: ["batch-view"] },
            { local: getLocalSupplierModel(), online: getOnlineSupplierModel(), permissionString: ["supplier-view"] },
            { local: getLocalPurchaseModel(), online: getOnlinePurchaseModel(), permissionString: ["purchase-view"] },
            { local: getLocalPurchasePaymentModel(), online: getOnlinePurchasePaymentModel(), permissionString: ["purchase-payment-view"] },
            { local: getLocalOrderModel(), online: getOnlineOrderModel(), permissionString: ["order-view"] },
            { local: getLocalHoldOrderModel(), online: getOnlineHoldOrderModel(), permissionString: ["hold-order-view"] },
            { local: getLocalStaffModel(), online: getOnlineStaffModel(), permissionString: ["staff-view"] },
            { local: getLocalStaffSalaryPaymentModel(), online: getOnlineStaffSalaryPaymentModel(), permissionString: ["staff-salary-payment-view"] },
            { local: getLocalStaffSaleBillModel(), online: getOnlineStaffSaleBillModel(), permissionString: ["staff-sale-bill-view"] },
            { local: getLocalStaffAttendanceModel(), online: getOnlineStaffAttendanceModel(), permissionString: ["staff-attendance-view"] },
            { local: getLocalSettingsModel(), online: getOnlineSettingsModel(), permissionString: ["settings-view"] },
        ];

        console.time("dublicateCleaning")
        await duplicateChangeTracksServiceCleaning()
        console.timeEnd("dublicateCleaning")

        // Step 1: Remove documents that user has but no longer has permission for
        console.time("permissionChangedDeletionFromLocal")
        await permissionChangedDeletionFromLocal(modelArray, loggedInUserData)
        console.timeEnd("permissionChangedDeletionFromLocal")

        // Step 2: Filter models array to remove non-permitted models from sync operations
        // This prevents download, upload, delete, create, update for non-permitted models
        if (loggedInUserData.role != "admin" && (!loggedInUserData.permissions?.includes("users-view"))) {
            modelArray = modelArray.filter(m => m.local.modelName != "user")
        }

        if (loggedInUserData.role != "admin") {
            modelArray = modelArray.filter(mObject => {
                return mObject.permissionString.some(permission =>
                    loggedInUserData.permissions?.includes(permission)
                )
            })
        }

        console.time("deleteOnlineSync")
        await deleteOnlineSync(modelArray, loggedInUserData)
        console.timeEnd("deleteOnlineSync")

        console.time("onlineDocsUploadSyncInsert")
        await onlineDocsUploadSyncInsert(modelArray, syncType, loggedInUserData)
        console.timeEnd("onlineDocsUploadSyncInsert")

        console.time("onlineDocsUploadSyncUpdate")
        await onlineDocsUploadSyncUpdate(modelArray, syncType, loggedInUserData)
        console.timeEnd("onlineDocsUploadSyncUpdate")

        console.time("downloadOnlineSync")
        await downloadOnlineSync(modelArray, syncType, loggedInUserData)
        console.timeEnd("downloadOnlineSync")


        console.time("imgDelete")
        await imgDelete(modelArray, loggedInUserData)
        console.timeEnd("imgDelete")

        console.time("ImageUpload")
        await ImageUpload(modelArray, loggedInUserData)
        console.timeEnd("ImageUpload")

        console.time("imageDownloadSync")
        await imageDownloadSync(modelArray, loggedInUserData)
        console.timeEnd("imageDownloadSync")


        return { success: true, msg: "The data is synced" }

    } catch (error) {
        console.error(error)
        return { success: false, msg: error?.message, stack: error?.stack }
    }
}