import dns from "dns";
import mongoose from "mongoose";
import userSchema from "../modules/auth/models/auth.model.js";
import productSchema from "../modules/product/models/product.model.js";
import categorySchema from "../modules/product/models/category.model.js";
import subCategorySchema from "../modules/product/models/subCategory.model.js";
import batchSchema from "../modules/productPurchases/models/batch.model.js";
import supplierSchema from "../modules/suppliers/models/supplier.model.js";
import purchaseSchema from "../modules/productPurchases/models/purchase.model.js";
import purchasePaymentSchema from "../modules/productPurchases/models/purchasePayment.model.js";
import orderSchema from "../modules/pos/models/order.model.js";
import holdOrderSchema from "../modules/pos/models/holdOrder.model.js";
import expenseSchema from "../modules/expenses/models/expense.model.js";
import activityLogSchema from "../modules/others/models/logsTracking.model.js";
import changeTrackSchema from "../modules/others/models/changeTrack.model.js";
import expenseCatagSchema from "../modules/expenses/models/expenseCatag.model.js";
import imageChangeTrackSchema from "../modules/others/models/imageChangeTrack.model.js";
import QarzaAccountSchema from "../modules/qarza/models/qarzaAccount.model.js";
import QarzaPaymentSchema from "../modules/qarza/models/qarzaPayment.js";
import wastageSchema from "../modules/wastage/models/wastage.model.js";
import purchaseReturnSchema from "../modules/purchaseReturn/models/purchaseReturn.model.js";
import productReturnSchema from "../modules/productReturn/models/productReturn.model.js";
import customerSchema from "../modules/customer/models/customer.model.js";
import staffSchema from "../modules/staff/models/staff.model.js";
import staffSalaryPaymentSchema from "../modules/staff/models/staffSalaryPayment.model.js";
import staffSaleBillSchema from "../modules/staff/models/staffSaleBill.model.js";
import staffAttendanceSchema from "../modules/staff/models/staffAttendance.model.js";
import settingsSchema from "../modules/settings/models/settings.model.js";

let OnlineUserModel = null;
let OnlineProductModel = null;
let OnlineCategoryModel = null;
let OnlineSubCategoryModel = null;
let OnlineBatchModel = null;
let OnlineSupplierModel = null;
let OnlinePurchaseModel = null;
let OnlinePurchasePaymentModel = null;
let OnlineOrderModel = null;
let OnlineHoldOrderModel = null;
let OnlineActivityLogModel = null;
let OnlineChangeTrackModel = null;
let OnlineExpensesModel = null;
let OnlineExpenseCategoryModel = null;
let OnlineImageChangeTrackModel = null;
let OnlineQarzaAccountModel = null;
let OnlineQarzaPaymentModel = null;
let OnlineWastageModel = null;
let OnlinePurchaseReturnModel = null;
let OnlineProductReturnModel = null;
let OnlineCustomerModel = null;
let OnlineStaffModel = null;
let OnlineStaffSalaryPaymentModel = null;
let OnlineStaffSaleBillModel = null;
let OnlineStaffAttendanceModel = null;
let OnlineSettingsModel = null;

export const connectOnlineDb = async () => {
    console.log("Online connection is running");
    dns.setServers(['8.8.8.8', '8.8.4.4']);
    
    // Dummy URL - replace with actual online MongoDB connection string
    const ONLINE_MONGODB_URI = "mongodb+srv://dummy:dummy@cluster0.dummy.mongodb.net/?appName=Cluster0";
    
    const OnlineConnection = await mongoose
        .createConnection(ONLINE_MONGODB_URI, { dbName: "IMS-ONLINE" })
        .asPromise();

    if (OnlineConnection.host) {
        console.log(`Server is connected to online db host: ${OnlineConnection.host}`);
    }

    OnlineUserModel = OnlineConnection.model("Users", userSchema);
    OnlineProductModel = OnlineConnection.model("Products", productSchema);
    OnlineCategoryModel = OnlineConnection.model("Categories", categorySchema);
    OnlineSubCategoryModel = OnlineConnection.model(
        "SubCategories",
        subCategorySchema,
    );
    OnlineBatchModel = OnlineConnection.model("Batches", batchSchema);
    OnlineSupplierModel = OnlineConnection.model("Suppliers", supplierSchema);
    OnlinePurchaseModel = OnlineConnection.model("Purchases", purchaseSchema);
    OnlinePurchasePaymentModel = OnlineConnection.model("PurchasePayments", purchasePaymentSchema);
    OnlineOrderModel = OnlineConnection.model("Orders", orderSchema);
    OnlineHoldOrderModel = OnlineConnection.model("HoldOrders", holdOrderSchema);
    OnlineExpensesModel = OnlineConnection.model("Expenses", expenseSchema);
    OnlineExpenseCategoryModel = OnlineConnection.model("ExpensesCategory", expenseCatagSchema)
    OnlineActivityLogModel = OnlineConnection.model("ActivityLogs", activityLogSchema);
    OnlineChangeTrackModel = OnlineConnection.model("ChangeTracks", changeTrackSchema);
    OnlineImageChangeTrackModel = OnlineConnection.model("ImageChangeTracks", imageChangeTrackSchema)
    OnlineQarzaAccountModel = OnlineConnection.model("QarzaAccount", QarzaAccountSchema)
    OnlineQarzaPaymentModel = OnlineConnection.model("QarzaPayment", QarzaPaymentSchema)
    OnlineWastageModel = OnlineConnection.model("Wastages", wastageSchema)
    OnlinePurchaseReturnModel = OnlineConnection.model("PurchaseReturn", purchaseReturnSchema)
    OnlineProductReturnModel = OnlineConnection.model("ProductReturn", productReturnSchema)
    OnlineCustomerModel = OnlineConnection.model("Customers", customerSchema)
    OnlineStaffModel = OnlineConnection.model("Staff", staffSchema)
    OnlineStaffSalaryPaymentModel = OnlineConnection.model("StaffSalaryPayment", staffSalaryPaymentSchema)
    OnlineStaffSaleBillModel = OnlineConnection.model("StaffSaleBill", staffSaleBillSchema)
    OnlineStaffAttendanceModel = OnlineConnection.model("StaffAttendance", staffAttendanceSchema)
    OnlineSettingsModel = OnlineConnection.model("Settings", settingsSchema)
};



export const getOnlinePurchaseReturnModel = () => OnlinePurchaseReturnModel || null;
export const getOnlineProductReturnModel = () => OnlineProductReturnModel || null;
export const getOnlineWastageModel = () => OnlineWastageModel || null;
export const getOnlineCustomerModel = () => OnlineCustomerModel || null;
export const getOnlineQarzaAccountModel = () => OnlineQarzaAccountModel || null;
export const getOnlineQarzaPaymentModel = () => OnlineQarzaPaymentModel || null;
export const getOnlineImageChangeTrackModel = () => OnlineImageChangeTrackModel || null;
export const getOnlineExpensesModel = () => OnlineExpensesModel || null;
export const getOnlineExpenseCategoryModel = () => OnlineExpenseCategoryModel || null;
export const getOnlineActivityLogModel = () => OnlineActivityLogModel || null;
export const getOnlineChangeTrackModel = () => OnlineChangeTrackModel || null;
export const getOnlineUserModel = () => OnlineUserModel || null;
export const getOnlineProductModel = () => OnlineProductModel || null;
export const getOnlineCategoryModel = () => OnlineCategoryModel || null;
export const getOnlineSubCategoryModel = () => OnlineSubCategoryModel || null;
export const getOnlineBatchModel = () => OnlineBatchModel || null;
export const getOnlineSupplierModel = () => OnlineSupplierModel || null;
export const getOnlinePurchaseModel = () => OnlinePurchaseModel || null;
export const getOnlinePurchasePaymentModel = () => OnlinePurchasePaymentModel || null;
export const getOnlineOrderModel = () => OnlineOrderModel || null;
export const getOnlineHoldOrderModel = () => OnlineHoldOrderModel || null;
export const getOnlineStaffModel = () => OnlineStaffModel || null;
export const getOnlineStaffSalaryPaymentModel = () => OnlineStaffSalaryPaymentModel || null;
export const getOnlineStaffSaleBillModel = () => OnlineStaffSaleBillModel || null;
export const getOnlineStaffAttendanceModel = () => OnlineStaffAttendanceModel || null;
export const getOnlineSettingsModel = () => OnlineSettingsModel || null;
