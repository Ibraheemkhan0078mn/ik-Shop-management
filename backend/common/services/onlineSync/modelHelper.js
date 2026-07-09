import {
    getLocalPartnerInvestmentModel,
    getLocalClassPartnershipModel,
    getLocalReminderModel,
    getLocalPaymentWithoutAccountModel,
    getLocalQarzaAccountModel,
    getLocalQarzaPaymentModel,
    getLocalExpenseModel,
    getLocalAttendenceModel,
    getLocalClassModel,
    getLocalstudentModel,
    getLocalCourseModel,
    getLocalStudentMarksModel,
    getLocalChangeMemberModel,
    getLocalMemberAttendenceModel,
    getLocalStudentFeeTrasactionModel,
    getLocalSubjectModel,
    getLocalExamModel,
    getLocalExpenseCatagModel,
    getLocalMemberSalaryPaymentModel,
    getLocalInventoryCategoryModel,
    getLocalInventoryModel,
    getActivityLogModel,
    getLocalOpeningBalanceModel,
    getLocalMemberSalaryChangeModel,
    getLocalVacationLeaveModel,
    getLocalPaymentTrackingRecordModel,
    getLocalUserModel,
    getLocalLiveClassesModel,
    getLocalStudentCounterModel,
    getLocalDeveloperOptionModel,
    getLocalStudentAccountSummaryModel,
} from "../../db/localDbConnection.js";

import {
    getOnlinePartnerInvestmentModel,
    getOnlineClassPartnershipModel,
    getOnlineReminderModel,
    getOnlinePaymentWithoutAccountModel,
    getOnlineQarzaAccountModel,
    getOnlineQarzaPaymentModel,
    getOnlineExpenseModel,
    getOnlineAttendenceModel,
    getOnlineClassModel,
    getOnlineStudentModel,
    getOnlineCourseModel,
    getOnlineStudentMarksModel,
    getOnlineMemberModel,
    getOnlineMemberAttendenceModel,
    getOnlineStudentFeeTrasactionModel,
    getOnlineSubjectModel,
    getOnlineExamModel,
    getOnlineExpenseCatagModel,
    getOnlineMemberSalaryPaymentModel,
    getOnlineInventoryCategoryModel,
    getOnlineInventoryModel,
    getOnlineActivityLogModel,
    getOnlineOpeningBalanceModel,
    getOnlineMemberSalaryChangeModel,
    getOnlineVacationLeaveModel,
    getOnlinePaymentTrackingRecordModel,
    getOnlineUserModel,
    getOnlineLiveClassesModel,
    getOnlineStudentCounterModel,
    getOnlineDeveloperOptionModel,
    getOnlineStudentAccountSummaryModel,
} from "../../db/onlineDbConnection.js";

// Model name to local model mapping
const localModelMap = {
    partnerInvestment: getLocalPartnerInvestmentModel,
    classPartnership: getLocalClassPartnershipModel,
    reminder: getLocalReminderModel,
    paymentWithoutAccount: getLocalPaymentWithoutAccountModel,
    qarzaAccount: getLocalQarzaAccountModel,
    qarzaPayment: getLocalQarzaPaymentModel,
    expense: getLocalExpenseModel,
    attendence: getLocalAttendenceModel,
    class: getLocalClassModel,
    student: getLocalstudentModel,
    course: getLocalCourseModel,
    studentMark: getLocalStudentMarksModel,
    teacher: getLocalChangeMemberModel,
    teacherAttendence: getLocalMemberAttendenceModel,
    studentFeeTransaction: getLocalStudentFeeTrasactionModel,
    subject: getLocalSubjectModel,
    exam: getLocalExamModel,
    expenseCatag: getLocalExpenseCatagModel,
    teacherSalaryPayment: getLocalMemberSalaryPaymentModel,
    inventoryCategory: getLocalInventoryCategoryModel,
    inventory: getLocalInventoryModel,
    activityLog: getActivityLogModel,
    openingBalance: getLocalOpeningBalanceModel,
    memberSalaryChange: getLocalMemberSalaryChangeModel,
    vacationLeave: getLocalVacationLeaveModel,
    paymentTrackingRecord: getLocalPaymentTrackingRecordModel,
    user: getLocalUserModel,
    liveClass: getLocalLiveClassesModel,
    studentCounter: getLocalStudentCounterModel,
    developerOption: getLocalDeveloperOptionModel,
    studentAccountSummary: getLocalStudentAccountSummaryModel,
};

// Model name to online model mapping
const onlineModelMap = {
    partnerInvestment: getOnlinePartnerInvestmentModel,
    classPartnership: getOnlineClassPartnershipModel,
    reminder: getOnlineReminderModel,
    paymentWithoutAccount: getOnlinePaymentWithoutAccountModel,
    qarzaAccount: getOnlineQarzaAccountModel,
    qarzaPayment: getOnlineQarzaPaymentModel,
    expense: getOnlineExpenseModel,
    attendence: getOnlineAttendenceModel,
    class: getOnlineClassModel,
    student: getOnlineStudentModel,
    course: getOnlineCourseModel,
    studentMark: getOnlineStudentMarksModel,
    teacher: getOnlineMemberModel,
    teacherAttendence: getOnlineMemberAttendenceModel,
    studentFeeTransaction: getOnlineStudentFeeTrasactionModel,
    subject: getOnlineSubjectModel,
    exam: getOnlineExamModel,
    expenseCatag: getOnlineExpenseCatagModel,
    teacherSalaryPayment: getOnlineMemberSalaryPaymentModel,
    inventoryCategory: getOnlineInventoryCategoryModel,
    inventory: getOnlineInventoryModel,
    activityLog: getOnlineActivityLogModel,
    openingBalance: getOnlineOpeningBalanceModel,
    memberSalaryChange: getOnlineMemberSalaryChangeModel,
    vacationLeave: getOnlineVacationLeaveModel,
    paymentTrackingRecord: getOnlinePaymentTrackingRecordModel,
    user: getOnlineUserModel,
    liveClass: getOnlineLiveClassesModel,
    studentCounter: getOnlineStudentCounterModel,
    developerOption: getOnlineDeveloperOptionModel,
    studentAccountSummary: getOnlineStudentAccountSummaryModel,
};

export function getLocalModelByName(modelName) {
    const modelGetter = localModelMap[modelName];
    if (!modelGetter) {
        console.warn(`[modelHelper] Local model not found for: ${modelName}`);
        return null;
    }
    return modelGetter();
}

export function getOnlineModelByName(modelName) {
    const modelGetter = onlineModelMap[modelName];
    if (!modelGetter) {
        console.warn(`[modelHelper] Online model not found for: ${modelName}`);
        return null;
    }
    return modelGetter();
}

// Permission string mapping for each model
const permissionStringMap = {
    partnerInvestment: ["member-investment-view"],
    classPartnership: ["member-class-partnership-view"],
    reminder: ["student-reminder"],
    paymentWithoutAccount: ["qarzas-without-account-view"],
    qarzaAccount: ["qarzas-with-account-view"],
    qarzaPayment: ["qarza-with-account-payment-view"],
    expense: ["expenses-view"],
    attendence: ["student-attendance-view"],
    class: ["classes-view"],
    student: ["students-view"],
    course: ["class-course-view"],
    studentMark: ["student-marks-view"],
    teacher: ["members-view"],
    teacherAttendence: ["members-attendance-view"],
    studentFeeTransaction: ["student-deposits-view"],
    subject: ["class-subject-view"],
    exam: ["class-exam-view"],
    expenseCatag: ["expense-category-view"],
    teacherSalaryPayment: ["member-payment-view"],
    inventoryCategory: ["inventory-view"],
    inventory: ["inventory-view"],
    activityLog: ["activityLogs-view"],
    openingBalance: ["opening-balance-view", "opening-balance-update"],
    memberSalaryChange: ["member-salary-change-view", "member-salary-change-update"],
    vacationLeave: ["vacation-leave-view", "vacation-leave-update"],
    paymentTrackingRecord: ["payment-tracking-view"],
    user: ["users-view"],
    liveClass: ["live-class-view"],
    studentCounter: ["student-counter-view"],
    developerOption: [],
    studentAccountSummary: [],
};

export function getPermissionStringForModel(modelName) {
    return permissionStringMap[modelName] || null;
}
