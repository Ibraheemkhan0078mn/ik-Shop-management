import {
    getLocalUserModel,
    getLocalUserRoleModel,
    getLocalProductModel,
    getLocalCategoryModel,
    getLocalSubCategoryModel,
    getLocalBrandModel,
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
    getLocalStaffRoleModel,
    getLocalStaffSalaryPaymentModel,
    getLocalStaffSaleBillModel,
    getLocalStaffAttendanceModel,
    getLocalSettingsModel,
    getLocalPaymentMethodModel,
    getLocalAppThemeModel,
} from "../../configs/connect.db.js";
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
} from '../../configs/onlineConnect.db.js';
import { deleteOnlineSync } from "./deleteOnlineSync.js";
import { downloadOnlineSync } from "./downloadOnlineSync.js";
import { permissionChangedDeletionFromLocal } from "./permissionChangeDeletion.js";
import { imageDownloadSync } from "./imageDownloadSync.js";
import { imgDelete } from "./imgDelete.js";
import { ImageUpload } from "./imgUpload.js";
import { onlineDocsUploadSyncInsert, onlineDocsUploadSyncUpdate } from "./uploadSync.js";




export async function docsSyncOrganizer(syncType = "required", loggedInUserData) {
    try {




        console.log("The sync organizer is starts")


        let modelArray = [
            // Auth & User Management
            { local: getLocalUserModel(), online: getOnlineUserModel(), permissionString: ["users-view"] },
            { local: getLocalUserRoleModel(), online: null, permissionString: ["users-view"] },
            
            // Product Management
            { local: getLocalProductModel(), online: getOnlineProductModel(), permissionString: ["products-view"] },
            { local: getLocalCategoryModel(), online: getOnlineCategoryModel(), permissionString: ["categories-view"] },
            { local: getLocalSubCategoryModel(), online: getOnlineSubCategoryModel(), permissionString: ["subcategories-view"] },
            { local: getLocalBrandModel(), online: null, permissionString: ["brands-view"] },
            { local: getLocalBatchModel(), online: getOnlineBatchModel(), permissionString: ["batches-view"] },
            
            // Supplier & Purchase Management
            { local: getLocalSupplierModel(), online: getOnlineSupplierModel(), permissionString: ["suppliers-view"] },
            { local: getLocalPurchaseModel(), online: getOnlinePurchaseModel(), permissionString: ["purchases-view"] },
            { local: getLocalPurchasePaymentModel(), online: getOnlinePurchasePaymentModel(), permissionString: ["purchase-payments-view"] },
            { local: getLocalPurchaseReturnModel(), online: getOnlinePurchaseReturnModel(), permissionString: ["purchase-returns-view"] },
            
            // Sales & Orders
            { local: getLocalOrderModel(), online: getOnlineOrderModel(), permissionString: ["sales-view"] },
            { local: getLocalHoldOrderModel(), online: getOnlineHoldOrderModel(), permissionString: ["hold-orders-view"] },
            
            // Customer Management
            { local: getLocalCustomerModel(), online: getOnlineCustomerModel(), permissionString: ["customers-view"] },
            { local: getLocalProductReturnModel(), online: getOnlineProductReturnModel(), permissionString: ["product-returns-view"] },
            
            // Expense Management
            { local: getLocalExpensesModel(), online: getOnlineExpensesModel(), permissionString: ["expenses-view"] },
            { local: getLocalExpenseCategoryModel(), online: getOnlineExpenseCategoryModel(), permissionString: ["expense-category-view"] },
            
            // Qarza Management
            { local: getLocalQarzaAccountModel(), online: getOnlineQarzaAccountModel(), permissionString: ["qarzas-with-account-view"] },
            { local: getLocalQarzaPaymentModel(), online: getOnlineQarzaPaymentModel(), permissionString: ["qarza-with-account-payment-view"] },
            
            // Staff Management
            { local: getLocalStaffModel(), online: getOnlineStaffModel(), permissionString: ["staff-view"] },
            { local: getLocalStaffRoleModel(), online: null, permissionString: ["staff-view"] },
            { local: getLocalStaffSalaryPaymentModel(), online: getOnlineStaffSalaryPaymentModel(), permissionString: ["staff-salary-view"] },
            { local: getLocalStaffSaleBillModel(), online: getOnlineStaffSaleBillModel(), permissionString: ["staff-sales-view"] },
            { local: getLocalStaffAttendanceModel(), online: getOnlineStaffAttendanceModel(), permissionString: ["staff-attendance-view"] },
            
            // Wastage Management
            { local: getLocalWastageModel(), online: getOnlineWastageModel(), permissionString: ["wastage-view"] },
            
            // Settings & Configuration
            { local: getLocalSettingsModel(), online: getOnlineSettingsModel(), permissionString: ["settings-view"] },
            { local: getLocalPaymentMethodModel(), online: getOnlinePaymentMethodModel(), permissionString: ["payment-methods-view"] },
            { local: getLocalAppThemeModel(), online: getOnlineAppThemeModel(), permissionString: ["app-theme-view"] },
            
            // Activity & Change Tracking
            { local: getLocalActivityLogModel(), online: getOnlineActivityLogModel(), permissionString: ["activityLogs-view"] },
            { local: getLocalChangeTrackModel(), online: getOnlineChangeTrackModel(), permissionString: ["change-tracks-view"] },
            { local: getLocalImageChangeTrackModel(), online: getOnlineImageChangeTrackModel(), permissionString: ["image-change-tracks-view"] },
        ];


        // first delete when have not permission 
        await permissionChangedDeletionFromLocal(modelArray, loggedInUserData)





        // then check if someone have not user permission then filter it reduce load on others
        // IDEA: what if i filter the all the modesl here so the load is reduce on other utilities of it.
        if (loggedInUserData.role != "admin" && (!loggedInUserData.permissions?.includes("users-view"))) {
            modelArray.filter(m => m.local.modelName != "user")
        }

        // console.log(loggedInUserData.role, loggedInUserData.permissions)
        if (loggedInUserData.role != "admin") {
            modelArray = modelArray.filter(mObject => {
                // console.log(loggedInUserData.permissions?.includes(mObject.permissionString), mObject.permissionString, 'filter')
                if (loggedInUserData.permissions?.includes(mObject.permissionString)) {
                    return true;
                }
            })
            // modelArray.forEach(m => console.log(m.permissionString))
        }



        await deleteOnlineSync(modelArray, loggedInUserData)
        await onlineDocsUploadSyncInsert(modelArray, syncType, loggedInUserData)
        await onlineDocsUploadSyncUpdate(modelArray, syncType, loggedInUserData)
        await downloadOnlineSync(modelArray, syncType, loggedInUserData)

        // Auto-fetch missing images from Cloudinary BEFORE deleting from Cloudinary
        await imgDelete(modelArray, loggedInUserData)
        await ImageUpload(modelArray, loggedInUserData)
        await imageDownloadSync(modelArray, loggedInUserData)




        return { success: true, msg: "The data is synced" }

    } catch (error) {
        console.log(error)
        return { success: false, msg: error?.message, stack: error?.stack }
    }
}