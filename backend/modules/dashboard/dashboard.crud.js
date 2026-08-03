import { getLocalOrderModel, getLocalPurchaseModel, getLocalExpensesModel, getLocalProductModel, getLocalCustomerModel, getLocalSupplierModel, getLocalBatchModel, getLocalWastageModel, getLocalPurchaseReturnModel, getLocalProductReturnModel, getLocalCategoryModel, getLocalQarzaAccountModel } from "../../configs/connect.db.js";

// Get models for dashboard aggregations
export const getOrderModel = () => getLocalOrderModel();
export const getPurchaseModel = () => getLocalPurchaseModel();
export const getExpenseModel = () => getLocalExpensesModel();
export const getProductModel = () => getLocalProductModel();
export const getCustomerModel = () => getLocalCustomerModel();
export const getSupplierModel = () => getLocalSupplierModel();
export const getBatchModel = () => getLocalBatchModel();
export const getWastageModel = () => getLocalWastageModel();
export const getPurchaseReturnModel = () => getLocalPurchaseReturnModel();
export const getProductReturnModel = () => getLocalProductReturnModel();
export const getCategoryModel = () => getLocalCategoryModel();
export const getQarzaAccountModel = () => getLocalQarzaAccountModel();
