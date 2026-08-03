import { getLocalActivityLogModel, getLocalExpenseCategoryModel, getLocalExpensesModel, getLocalQarzaAccountModel, getLocalQarzaPaymentModel, getLocalUserModel, getLocalProductModel, getLocalCategoryModel, getLocalSubCategoryModel, getLocalBatchModel, getLocalSupplierModel, getLocalPurchaseModel, getLocalPurchasePaymentModel, getLocalOrderModel, getLocalHoldOrderModel, getLocalWastageModel, getLocalPurchaseReturnModel, getLocalProductReturnModel, getLocalCustomerModel, getLocalStaffModel, getLocalStaffSalaryPaymentModel, getLocalStaffSaleBillModel, getLocalStaffAttendanceModel, getLocalSettingsModel, getLocalPaymentMethodModel, getLocalAppThemeModel } from "../../../configs/connect.db.js"
import { getOnlineActivityLogModel, getOnlineExpenseCategoryModel, getOnlineExpensesModel, getOnlineQarzaAccountModel, getOnlineQarzaPaymentModel, getOnlineUserModel, getOnlineProductModel, getOnlineCategoryModel, getOnlineSubCategoryModel, getOnlineBatchModel, getOnlineSupplierModel, getOnlinePurchaseModel, getOnlinePurchasePaymentModel, getOnlineOrderModel, getOnlineHoldOrderModel, getOnlineWastageModel, getOnlinePurchaseReturnModel, getOnlineProductReturnModel, getOnlineCustomerModel, getOnlineStaffModel, getOnlineStaffSalaryPaymentModel, getOnlineStaffSaleBillModel, getOnlineStaffAttendanceModel, getOnlineSettingsModel, getOnlinePaymentMethodModel } from '../../../configs/onlineConnect.db.js'
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
            { local: getLocalProductModel(), online: getOnlineProductModel(), permissionString: ["products-view"] },
            { local: getLocalCategoryModel(), online: getOnlineCategoryModel(), permissionString: ["categories-view"] },
            { local: getLocalSubCategoryModel(), online: getOnlineSubCategoryModel(), permissionString: ["subcategories-view"] },
            { local: getLocalBatchModel(), online: getOnlineBatchModel(), permissionString: ["batches-view"] },
            { local: getLocalSupplierModel(), online: getOnlineSupplierModel(), permissionString: ["suppliers-view"] },
            { local: getLocalPurchaseModel(), online: getOnlinePurchaseModel(), permissionString: ["purchases-view"] },
            { local: getLocalPurchasePaymentModel(), online: getOnlinePurchasePaymentModel(), permissionString: ["purchase-payments-view"] },
            { local: getLocalOrderModel(), online: getOnlineOrderModel(), permissionString: ["orders-view"] },
            { local: getLocalHoldOrderModel(), online: getOnlineHoldOrderModel(), permissionString: ["hold-orders-view"] },
            { local: getLocalExpensesModel(), online: getOnlineExpensesModel(), permissionString: ["expenses-view"] },
            { local: getLocalExpenseCategoryModel(), online: getOnlineExpenseCategoryModel(), permissionString: ["expense-category-view"] },
            { local: getLocalQarzaAccountModel(), online: getOnlineQarzaAccountModel(), permissionString: ["qarzas-with-account-view"] },
            { local: getLocalQarzaPaymentModel(), online: getOnlineQarzaPaymentModel(), permissionString: ["qarza-with-account-payment-view"] },
            { local: getLocalWastageModel(), online: getOnlineWastageModel(), permissionString: ["wastage-view"] },
            { local: getLocalPurchaseReturnModel(), online: getOnlinePurchaseReturnModel(), permissionString: ["purchase-returns-view"] },
            { local: getLocalProductReturnModel(), online: getOnlineProductReturnModel(), permissionString: ["product-returns-view"] },
            { local: getLocalCustomerModel(), online: getOnlineCustomerModel(), permissionString: ["customers-view"] },
            { local: getLocalStaffModel(), online: getOnlineStaffModel(), permissionString: ["staff-view"] },
            { local: getLocalStaffSalaryPaymentModel(), online: getOnlineStaffSalaryPaymentModel(), permissionString: ["staff-salary-payments-view"] },
            { local: getLocalStaffSaleBillModel(), online: getOnlineStaffSaleBillModel(), permissionString: ["staff-sale-bills-view"] },
            { local: getLocalStaffAttendanceModel(), online: getOnlineStaffAttendanceModel(), permissionString: ["staff-attendance-view"] },
            { local: getLocalUserModel(), online: getOnlineUserModel(), permissionString: ["users-view"] },
            { local: getLocalActivityLogModel(), online: getOnlineActivityLogModel(), permissionString: ["activityLogs-view"] },
            { local: getLocalSettingsModel(), online: getOnlineSettingsModel(), permissionString: ["settings-view"] },
            { local: getLocalPaymentMethodModel(), online: getOnlinePaymentMethodModel(), permissionString: ["payment-methods-view"] }
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


        await imgDelete(modelArray, loggedInUserData)
        await ImageUpload(modelArray, loggedInUserData)
        await imageDownloadSync(modelArray, loggedInUserData)




        return { success: true, msg: "The data is synced" }

    } catch (error) {
        console.log(error)
        return { success: false, msg: error?.message, stack: error?.stack }
    }
}