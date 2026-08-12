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
    getLocalTransactionModel,
    getLocalOrderModel,
    getLocalHoldOrderModel,
    getLocalStaffModel,
    getLocalStaffSalaryPaymentModel,
    getLocalStaffSaleBillModel,
    getLocalStaffAttendanceModel,
    getLocalSettingsModel,
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
    getOnlineTransactionModel,
    getOnlineOrderModel,
    getOnlineHoldOrderModel,
    getOnlineStaffModel,
    getOnlineStaffSalaryPaymentModel,
    getOnlineStaffSaleBillModel,
    getOnlineStaffAttendanceModel,
    getOnlineSettingsModel,
} from "../../../configs/onlineConnect.db.js";

// Model name to local model mapping
const localModelMap = {
    purchaseReturn: getLocalPurchaseReturnModel,
    productReturn: getLocalProductReturnModel,
    wastage: getLocalWastageModel,
    customer: getLocalCustomerModel,
    qarzaAccount: getLocalQarzaAccountModel,
    qarzaPayment: getLocalQarzaPaymentModel,
    QarzaPayment: getLocalQarzaPaymentModel,
    imageChangeTrack: getLocalImageChangeTrackModel,
    expense: getLocalExpensesModel,
    expenseCategory: getLocalExpenseCategoryModel,
    activityLog: getLocalActivityLogModel,
    changeTrack: getLocalChangeTrackModel,
    user: getLocalUserModel,
    product: getLocalProductModel,
    category: getLocalCategoryModel,
    subCategory: getLocalSubCategoryModel,
    batch: getLocalBatchModel,
    supplier: getLocalSupplierModel,
    purchase: getLocalPurchaseModel,
    purchasePayment: getLocalPurchasePaymentModel,
    transaction: getLocalTransactionModel,
    transactions: getLocalTransactionModel,
    order: getLocalOrderModel,
    holdOrder: getLocalHoldOrderModel,
    staff: getLocalStaffModel,
    staffSalaryPayment: getLocalStaffSalaryPaymentModel,
    staffSaleBill: getLocalStaffSaleBillModel,
    staffAttendance: getLocalStaffAttendanceModel,
    settings: getLocalSettingsModel,
};

// Model name to online model mapping
const onlineModelMap = {
    purchaseReturn: getOnlinePurchaseReturnModel,
    productReturn: getOnlineProductReturnModel,
    wastage: getOnlineWastageModel,
    customer: getOnlineCustomerModel,
    qarzaAccount: getOnlineQarzaAccountModel,
    qarzaPayment: getOnlineQarzaPaymentModel,
    QarzaPayment: getOnlineQarzaPaymentModel,
    imageChangeTrack: getOnlineImageChangeTrackModel,
    expense: getOnlineExpensesModel,
    expenseCategory: getOnlineExpenseCategoryModel,
    activityLog: getOnlineActivityLogModel,
    changeTrack: getOnlineChangeTrackModel,
    user: getOnlineUserModel,
    product: getOnlineProductModel,
    category: getOnlineCategoryModel,
    subCategory: getOnlineSubCategoryModel,
    batch: getOnlineBatchModel,
    supplier: getOnlineSupplierModel,
    purchase: getOnlinePurchaseModel,
    purchasePayment: getOnlinePurchasePaymentModel,
    transaction: getOnlineTransactionModel,
    transactions: getOnlineTransactionModel,
    order: getOnlineOrderModel,
    holdOrder: getOnlineHoldOrderModel,
    staff: getOnlineStaffModel,
    staffSalaryPayment: getOnlineStaffSalaryPaymentModel,
    staffSaleBill: getOnlineStaffSaleBillModel,
    staffAttendance: getOnlineStaffAttendanceModel,
    settings: getOnlineSettingsModel,
};

export function getLocalModelByName(modelName) {
    // Handle case-insensitive model name lookup
    const normalizedName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
    const modelGetter = localModelMap[normalizedName] || localModelMap[modelName];
    if (!modelGetter) {
        console.warn(`[modelHelper] Local model not found for: ${modelName}`);
        return null;
    }
    return modelGetter();
}

export function getOnlineModelByName(modelName) {
    // Handle case-insensitive model name lookup
    const normalizedName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
    const modelGetter = onlineModelMap[normalizedName] || onlineModelMap[modelName];
    if (!modelGetter) {
        console.warn(`[modelHelper] Online model not found for: ${modelName}`);
        return null;
    }
    return modelGetter();
}

// Permission string mapping for each model
const permissionStringMap = {
    purchaseReturn: ["purchase-return-view"],
    productReturn: ["product-return-view"],
    wastage: ["wastage-view"],
    customer: ["customer-view"],
    qarzaAccount: ["qarza-account-view"],
    qarzaPayment: ["qarza-payment-view"],
    imageChangeTrack: [],
    expense: ["expense-view"],
    expenseCategory: ["expense-category-view"],
    activityLog: ["activity-log-view"],
    changeTrack: [],
    user: ["user-view"],
    product: ["product-view"],
    category: ["category-view"],
    subCategory: ["subcategory-view"],
    batch: ["batch-view"],
    supplier: ["supplier-view"],
    purchase: ["purchase-view"],
    purchasePayment: ["purchase-payment-view"],
    transaction: ["transaction-view"],
    order: ["order-view"],
    holdOrder: ["hold-order-view"],
    staff: ["staff-view"],
    staffSalaryPayment: ["staff-salary-payment-view"],
    staffSaleBill: ["staff-sale-bill-view"],
    staffAttendance: ["staff-attendance-view"],
    settings: ["settings-view"],
};

export function getPermissionStringForModel(modelName) {
    return permissionStringMap[modelName] || null;
}
