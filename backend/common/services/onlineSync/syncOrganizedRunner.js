import { getActivityLogModel, getLocalAttendenceModel, getLocalChangeMemberModel, getLocalClassModel, getLocalClassPartnershipModel, getLocalCourseModel, getLocalDeviceIdentityModel, getLocalExamModel, getLocalExpenseCatagModel, getLocalExpenseModel, getLocalInventoryCategoryModel, getLocalInventoryModel, getLocalMemberSalaryChangeModel, getLocalOpeningBalanceModel, getLocalPartnerInvestmentModel, getLocalPaymentTrackingRecordModel, getLocalPaymentWithoutAccountModel, getLocalQarzaAccountModel, getLocalQarzaPaymentModel, getLocalReminderModel, getLocalStudentCounterModel, getLocalStudentFeeTrasactionModel, getLocalStudentMarksModel, getLocalstudentModel, getLocalSubjectModel, getLocalMemberAttendenceModel, getLocalMemberSalaryPaymentModel, getLocalUserModel, getLocalVacationLeaveModel } from "../../db/localDbConnection.js"
import { getOnlineActivityLogModel, getOnlineAttendenceModel, getOnlineClassModel, getOnlineClassPartnershipModel, getOnlineCourseModel, getOnlineDeviceIdentityModel, getOnlineExamModel, getOnlineExpenseCatagModel, getOnlineExpenseModel, getOnlineInventoryCategoryModel, getOnlineInventoryModel, getOnlineMemberSalaryChangeModel, getOnlineOpeningBalanceModel, getOnlinePartnerInvestmentModel, getOnlinePaymentTrackingRecordModel, getOnlinePaymentWithoutAccountModel, getOnlineQarzaAccountModel, getOnlineQarzaPaymentModel, getOnlineReminderModel, getOnlineStudentCounterModel, getOnlineStudentFeeTrasactionModel, getOnlineStudentMarksModel, getOnlineStudentModel, getOnlineSubjectModel, getOnlineMemberAttendenceModel, getOnlineMemberModel, getOnlineMemberSalaryPaymentModel, getOnlineUserModel, getOnlineVacationLeaveModel } from '../../db/onlineDbConnection.js'
import { deleteOnlineSync } from "./deleteOnlineSync.js";
import { downloadOnlineSync } from "./downloadOnlineSync.js";
import { permissionChangedDeletionFromLocal } from "./permissionChangeDeletion.js";
import { imageDownloadSync } from "./imageDownloadSync.js";
import { imgDelete } from "./imgDelete.js";
import { ImageUpload } from "./imgUpload.js";
import { onlineDocsUploadSyncInsert, onlineDocsUploadSyncUpdate } from "./uploadSync.js";
import { duplicateChangeTracksServiceCleaning } from "./cleaningSync.js";
import { syncOnlineDeveloperOptionsToLocalService } from "../../services/OrganizedServices/developerOption/developerOption.general.service.js";




export async function docsSyncOrganizer(syncType = "required", loggedInUserData) {
    try {

        let modelArray = [
            { local: getLocalPartnerInvestmentModel(), online: getOnlinePartnerInvestmentModel(), permissionString: ["member-investment-view"] },
            { local: getLocalClassPartnershipModel(), online: getOnlineClassPartnershipModel(), permissionString: ["member-class-partnership-view"] },
            { local: getLocalReminderModel(), online: getOnlineReminderModel(), permissionString: ["student-reminder"] },
            { local: getLocalPaymentWithoutAccountModel(), online: getOnlinePaymentWithoutAccountModel(), permissionString: ["qarzas-without-account-view"] },
            { local: getLocalQarzaAccountModel(), online: getOnlineQarzaAccountModel(), permissionString: ["qarzas-with-account-view"] },
            { local: getLocalQarzaPaymentModel(), online: getOnlineQarzaPaymentModel(), permissionString: ["qarza-with-account-payment-view"] },
            { local: getLocalExpenseModel(), online: getOnlineExpenseModel(), permissionString: ["expenses-view"] },
            { local: getLocalAttendenceModel(), online: getOnlineAttendenceModel(), permissionString: ["student-attendance-view"] },
            { local: getLocalClassModel(), online: getOnlineClassModel(), permissionString: ["classes-view"] },
            { local: getLocalstudentModel(), online: getOnlineStudentModel(), permissionString: ["students-view"] },
            { local: getLocalCourseModel(), online: getOnlineCourseModel(), permissionString: ["class-course-view"] },
            { local: getLocalStudentMarksModel(), online: getOnlineStudentMarksModel(), permissionString: ["student-marks-view"] },
            // { local: getLocalUserModel(), online: getOnlineUserModel(), permissionString: ["users-view"] },
            { local: getLocalChangeMemberModel(), online: getOnlineMemberModel(), permissionString: ["members-view"] },
            { local: getLocalMemberAttendenceModel(), online: getOnlineMemberAttendenceModel(), permissionString: ["members-attendance-view"] },
            { local: getLocalStudentFeeTrasactionModel(), online: getOnlineStudentFeeTrasactionModel(), permissionString: ["student-deposits-view"] },
            { local: getLocalSubjectModel(), online: getOnlineSubjectModel(), permissionString: ["class-subject-view"] },
            { local: getLocalExamModel(), online: getOnlineExamModel(), permissionString: ["class-exam-view"] },
            { local: getLocalExpenseCatagModel(), online: getOnlineExpenseCatagModel(), permissionString: ["expense-category-view"] },
            { local: getLocalMemberSalaryPaymentModel(), online: getOnlineMemberSalaryPaymentModel(), permissionString: ["member-payment-view"] },
            { local: getLocalInventoryCategoryModel(), online: getOnlineInventoryCategoryModel(), permissionString: ["inventory-view"] },
            { local: getLocalInventoryModel(), online: getOnlineInventoryModel(), permissionString: ["inventory-view"] },
            { local: getActivityLogModel(), online: getOnlineActivityLogModel(), permissionString: ["activityLogs-view"] },
            { local: getLocalOpeningBalanceModel(), online: getOnlineOpeningBalanceModel(), permissionString: ["opening-balance-view", 'opening-balance-update'] },
            { local: getLocalMemberSalaryChangeModel(), online: getOnlineMemberSalaryChangeModel(), permissionString: ["member-salary-change-view", 'member-salary-change-update'] },
            { local: getLocalVacationLeaveModel(), online: getOnlineVacationLeaveModel(), permissionString: ["vacation-leave-view", "vacation-leave-update"] },
            { local: getLocalPaymentTrackingRecordModel(), online: getOnlinePaymentTrackingRecordModel(), permissionString: ["payment-tracking-view"] }

        ];




        await syncOnlineDeveloperOptionsToLocalService() 

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