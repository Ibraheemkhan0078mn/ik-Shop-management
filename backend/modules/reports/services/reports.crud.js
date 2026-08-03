import {
    getLocalOrderModel,
    getLocalHoldOrderModel,
    getLocalProductModel,
    getLocalBatchModel,
    getLocalPurchaseModel,
    getLocalSupplierModel,
    getLocalExpensesModel,
    getLocalExpenseCategoryModel,
    getLocalWastageModel,
    getLocalPurchaseReturnModel,
    getLocalQarzaAccountModel,
    getLocalQarzaPaymentModel,
    getLocalActivityLogModel,
    getLocalCategoryModel,
    getLocalProductReturnModel,
    getLocalCustomerModel,
    getLocalStaffModel,
    getLocalStaffSalaryPaymentModel,
    getLocalStaffSaleBillModel,
    getLocalStaffAttendanceModel,
} from "../../../configs/connect.db.js";

// Get models for reports aggregations
export const getOrderModel = () => getLocalOrderModel();
export const getHoldOrderModel = () => getLocalHoldOrderModel();
export const getProductModel = () => getLocalProductModel();
export const getBatchModel = () => getLocalBatchModel();
export const getPurchaseModel = () => getLocalPurchaseModel();
export const getSupplierModel = () => getLocalSupplierModel();
export const getExpenseModel = () => getLocalExpensesModel();
export const getExpenseCategoryModel = () => getLocalExpenseCategoryModel();
export const getWastageModel = () => getLocalWastageModel();
export const getPurchaseReturnModel = () => getLocalPurchaseReturnModel();
export const getQarzaAccountModel = () => getLocalQarzaAccountModel();
export const getQarzaPaymentModel = () => getLocalQarzaPaymentModel();
export const getActivityLogModel = () => getLocalActivityLogModel();
export const getCategoryModel = () => getLocalCategoryModel();
export const getProductReturnModel = () => getLocalProductReturnModel();
export const getCustomerModel = () => getLocalCustomerModel();
export const getStaffModel = () => getLocalStaffModel();
export const getStaffSalaryPaymentModel = () => getLocalStaffSalaryPaymentModel();
export const getStaffSaleBillModel = () => getLocalStaffSaleBillModel();
export const getStaffAttendanceModel = () => getLocalStaffAttendanceModel();
