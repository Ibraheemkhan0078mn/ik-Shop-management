import { getLocalActivityLogModel, getLocalExpenseCategoryModel, getLocalExpensesModel, getLocalQarzaAccountModel, getLocalQarzaPaymentModel, getLocalUserModel, getLocalProductModel, getLocalCategoryModel, getLocalSubCategoryModel, getLocalBatchModel, getLocalSupplierModel, getLocalPurchaseModel, getLocalPurchasePaymentModel, getLocalOrderModel, getLocalHoldOrderModel, getLocalWastageModel, getLocalPurchaseReturnModel, getLocalProductReturnModel, getLocalCustomerModel, getLocalStaffModel, getLocalStaffSalaryPaymentModel, getLocalStaffSaleBillModel, getLocalStaffAttendanceModel, getLocalSettingsModel, getLocalPaymentMethodModel, getLocalAppThemeModel, getLocalBrandModel, getLocalUserRoleModel, getLocalStaffRoleModel, getLocalTransactionModel } from "../../../configs/connect.db.js"
import { getOnlineActivityLogModel, getOnlineExpenseCategoryModel, getOnlineExpensesModel, getOnlineQarzaAccountModel, getOnlineQarzaPaymentModel, getOnlineUserModel, getOnlineProductModel, getOnlineCategoryModel, getOnlineSubCategoryModel, getOnlineBatchModel, getOnlineSupplierModel, getOnlinePurchaseModel, getOnlinePurchasePaymentModel, getOnlineOrderModel, getOnlineHoldOrderModel, getOnlineWastageModel, getOnlinePurchaseReturnModel, getOnlineProductReturnModel, getOnlineCustomerModel, getOnlineStaffModel, getOnlineStaffSalaryPaymentModel, getOnlineStaffSaleBillModel, getOnlineStaffAttendanceModel, getOnlineSettingsModel, getOnlinePaymentMethodModel, getOnlineAppThemeModel, getOnlineBrandModel, getOnlineUserRoleModel, getOnlineStaffRoleModel, getOnlineTransactionModel } from '../../../configs/onlineConnect.db.js'
import { downloadOnlineSync } from "./downloadOnlineSync.js";
import { permissionChangedDeletionFromLocal } from "./permissionChangeDeletion.js";
import { imageDownloadSync } from "./imageDownloadSync.js";
import { imgDelete } from "./imgDelete.js";
import { ImageUpload } from "./imgUpload.js";
import { onlineDocsUploadSyncInsert } from "./insertSync.js";
import { onlineDocsUploadSyncUpdate } from "./updateSync.js";




export async function docsSyncOrganizer(syncType = "required", loggedInUserData) {
    try {




        console.log("The sync organizer is starts")

        let modelArray = [
            { local: getLocalProductModel(), online: getOnlineProductModel(), permissionString: ["products.view"] },
            { local: getLocalCategoryModel(), online: getOnlineCategoryModel(), permissionString: ["categories.view"] },
            { local: getLocalSubCategoryModel(), online: getOnlineSubCategoryModel(), permissionString: ["subcategories.view"] },
            { local: getLocalBrandModel(), online: getOnlineBrandModel(), permissionString: ["brands.view"] },
            { local: getLocalBatchModel(), online: getOnlineBatchModel(), permissionString: ["batches.view"] },
            { local: getLocalSupplierModel(), online: getOnlineSupplierModel(), permissionString: ["suppliers.view"] },
            { local: getLocalPurchaseModel(), online: getOnlinePurchaseModel(), permissionString: ["purchases.view"] },
            { local: getLocalPurchasePaymentModel(), online: getOnlinePurchasePaymentModel(), permissionString: ["purchases.view"] },
            { local: getLocalOrderModel(), online: getOnlineOrderModel(), permissionString: ["orders.view"] },
            { local: getLocalHoldOrderModel(), online: getOnlineHoldOrderModel(), permissionString: ["pos.orders.hold"] },
            { local: getLocalExpensesModel(), online: getOnlineExpensesModel(), permissionString: ["expenses.view"] },
            { local: getLocalExpenseCategoryModel(), online: getOnlineExpenseCategoryModel(), permissionString: ["expenses.view"] },
            { local: getLocalQarzaAccountModel(), online: getOnlineQarzaAccountModel(), permissionString: ["creditsAndDebitsAccounts.view"] },
            { local: getLocalQarzaPaymentModel(), online: getOnlineQarzaPaymentModel(), permissionString: ["creditsDebits.view"] },
            { local: getLocalWastageModel(), online: getOnlineWastageModel(), permissionString: ["wastage.view"] },
            { local: getLocalPurchaseReturnModel(), online: getOnlinePurchaseReturnModel(), permissionString: ["purchaseReturns.view"] },
            { local: getLocalProductReturnModel(), online: getOnlineProductReturnModel(), permissionString: ["productReturns.view"] },
            { local: getLocalCustomerModel(), online: getOnlineCustomerModel(), permissionString: ["customers.view"] },
            { local: getLocalStaffModel(), online: getOnlineStaffModel(), permissionString: ["staff.view"] },
            { local: getLocalStaffRoleModel(), online: getOnlineStaffRoleModel(), permissionString: ["staff.view"] },
            { local: getLocalStaffSalaryPaymentModel(), online: getOnlineStaffSalaryPaymentModel(), permissionString: ["staff.salaries.view"] },
            { local: getLocalStaffSaleBillModel(), online: getOnlineStaffSaleBillModel(), permissionString: ["staff.orders.view"] },
            { local: getLocalStaffAttendanceModel(), online: getOnlineStaffAttendanceModel(), permissionString: ["staff.view"] },
            { local: getLocalUserModel(), online: getOnlineUserModel(), permissionString: ["users.view"] },
            { local: getLocalUserRoleModel(), online: getOnlineUserRoleModel(), permissionString: ["userRoles.view"] },
            { local: getLocalActivityLogModel(), online: getOnlineActivityLogModel(), permissionString: ["dashboard.view"] },
            { local: getLocalSettingsModel(), online: getOnlineSettingsModel(), permissionString: ["settings.view"] },
            { local: getLocalPaymentMethodModel(), online: getOnlinePaymentMethodModel(), permissionString: ["settings.paymentMethods"] },
            { local: getLocalAppThemeModel(), online: getOnlineAppThemeModel(), permissionString: ["settings.theme"] },
            { local: getLocalTransactionModel(), online: getOnlineTransactionModel(), permissionString: [], syncAlways: true }
        ];





        // first delete when have not permission 
        await permissionChangedDeletionFromLocal(modelArray, loggedInUserData)





        // then check if someone have not user permission then filter it reduce load on others
        // IDEA: what if i filter the all the modesl here so the load is reduce on other utilities of it.
        if (loggedInUserData.role != "admin") {
            modelArray = modelArray.filter(mObject => {
                if (mObject.syncAlways) return true;
                // Check if user has any of the required permissions for this model
                const hasPermission = mObject.permissionString.some(permission => 
                    loggedInUserData.permissions?.includes(permission)
                );
                return hasPermission;
            })
        }



        await onlineDocsUploadSyncInsert(modelArray, syncType, loggedInUserData)
        await onlineDocsUploadSyncUpdate(modelArray, syncType, loggedInUserData)
        await downloadOnlineSync(modelArray, syncType, loggedInUserData)


        await imgDelete(modelArray, loggedInUserData)
        await ImageUpload(modelArray, loggedInUserData)
        await imageDownloadSync(modelArray, loggedInUserData)




        return { success: true, msg: "The data is synced" }

    } catch (error) {
        console.log(error)
        return { success: false, msg: error?.message, stack: error?.stack }
    }
}