import { getLocalActivityLogModel, getLocalExpenseCategoryModel, getLocalExpensesModel, getLocalQarzaAccountModel, getLocalQarzaPaymentModel, getLocalUserModel } from "../../db/localDbConnection.js"
import { getOnlineActivityLogModel, getOnlineExpenseCatagModel, getOnlineExpenseModel, getOnlineQarzaAccountModel, getOnlineQarzaPaymentModel, getOnlineReminderModel, getOnlineStudentCounterModel, getOnlineStudentFeeTrasactionModel, getOnlineStudentInvoiceModel, getOnlineStudentMarksModel, getOnlineStudentModel, getOnlineSubjectModel, getOnlineTeacherAttendenceModel, getOnlineTeacherInvoiceModel, getOnlineTeacherModel, getOnlineTeacherSalaryPaymentModel, getOnlineUserModel } from '../../db/onlineDbConnection.js'
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
            { local: getLocalQarzaAccountModel(), online: getOnlineQarzaAccountModel(), permissionString: ["qarzas-with-account-view"] },
            { local: getLocalQarzaPaymentModel(), online: getOnlineQarzaPaymentModel(), permissionString: ["qarza-with-account-payment-view"] },
            { local: getLocalExpensesModel(), online: getOnlineExpenseModel(), permissionString: ["expenses-view"] },
            { local: getLocalUserModel(), online: getOnlineUserModel(), permissionString: ["users-view"] },
            { local: getLocalExpenseCategoryModel(), online: getOnlineExpenseCatagModel(), permissionString: ["expense-category-view"] },
            { local: getLocalActivityLogModel(), online: getOnlineActivityLogModel(), permissionString: ["activityLogs-view"] }
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