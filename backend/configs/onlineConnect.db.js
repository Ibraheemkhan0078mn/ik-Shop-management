import dns from "dns";
import mongoose from "mongoose";
import userSchema from "../modules/auth/models/auth.model.js";
import userRoleSchema from "../modules/auth/models/userRole.model.js";
import productSchema from "../modules/product/models/product.model.js";
import categorySchema from "../modules/product/models/category.model.js";
import subCategorySchema from "../modules/product/models/subCategory.model.js";
import brandSchema from "../modules/product/models/brand.model.js";
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
import staffRoleSchema from "../modules/staff/models/staffRole.model.js";
import staffSalaryPaymentSchema from "../modules/staff/models/staffSalaryPayment.model.js";
import staffSaleBillSchema from "../modules/staff/models/staffSaleBill.model.js";
import staffAttendanceSchema from "../modules/staff/models/staffAttendance.model.js";
import settingsSchema from "../modules/settings/models/settings.model.js";
import paymentMethodSchema from "../modules/settings/models/paymentMethod.model.js";
import appThemeSchema from "../modules/settings/models/appTheme.model.js";
import { startChangeStreamTracking } from "../common/services/onlineSync/changeStreamTracker.js";

let OnlineUserModel = null;
let OnlineUserRoleModel = null;
let OnlineProductModel = null;
let OnlineCategoryModel = null;
let OnlineSubCategoryModel = null;
let OnlineBrandModel = null;
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
let OnlinePaymentMethodModel = null;
let OnlineAppThemeModel = null;
let OnlineStaffRoleModel=null

// Store the connection instance for export
let OnlineConnectionInstance = null;

export const getOnlineDbInstance = () => OnlineConnectionInstance;

export const connectOnlineDb = async () => {
   try {
     console.log("Online connection is running");
    dns.setServers(['8.8.8.8', '8.8.4.4']);
    
    // Dummy URL - replace with actual online MongoDB connection string
    const ONLINE_MONGODB_URI = "mongodb+srv://user2:lalakhanyar007m@cluster0.aipfjlf.mongodb.net/?appName=Cluster0";
    
    OnlineConnectionInstance = await mongoose
        .createConnection(ONLINE_MONGODB_URI, { dbName: "IMS-ONLINE-Test" })
        .asPromise();

    if (OnlineConnectionInstance.host) {
        console.log(`Server is connected to online db host: ${OnlineConnectionInstance.host}`);
    }

    OnlineUserModel = OnlineConnectionInstance.model("Users", userSchema);
    OnlineUserRoleModel = OnlineConnectionInstance.model("UserRoles", userRoleSchema);
    OnlineProductModel = OnlineConnectionInstance.model("Products", productSchema);
    OnlineCategoryModel = OnlineConnectionInstance.model("Categories", categorySchema);
    OnlineSubCategoryModel = OnlineConnectionInstance.model(
        "SubCategories",
        subCategorySchema,
    );
    OnlineBrandModel = OnlineConnectionInstance.model("Brands", brandSchema);
    OnlineBatchModel = OnlineConnectionInstance.model("Batches", batchSchema);
    OnlineSupplierModel = OnlineConnectionInstance.model("Suppliers", supplierSchema);
    OnlinePurchaseModel = OnlineConnectionInstance.model("Purchases", purchaseSchema);
    OnlinePurchasePaymentModel = OnlineConnectionInstance.model("PurchasePayments", purchasePaymentSchema);
    OnlineOrderModel = OnlineConnectionInstance.model("Orders", orderSchema);
    OnlineHoldOrderModel = OnlineConnectionInstance.model("HoldOrders", holdOrderSchema);
    OnlineExpensesModel = OnlineConnectionInstance.model("Expenses", expenseSchema);
    OnlineExpenseCategoryModel = OnlineConnectionInstance.model("ExpensesCategory", expenseCatagSchema)
    OnlineActivityLogModel = OnlineConnectionInstance.model("ActivityLogs", activityLogSchema);
    OnlineChangeTrackModel = OnlineConnectionInstance.model("ChangeTracks", changeTrackSchema);
    OnlineImageChangeTrackModel = OnlineConnectionInstance.model("ImageChangeTracks", imageChangeTrackSchema)
    OnlineQarzaAccountModel = OnlineConnectionInstance.model("QarzaAccount", QarzaAccountSchema)
    OnlineQarzaPaymentModel = OnlineConnectionInstance.model("QarzaPayment", QarzaPaymentSchema)
    OnlineWastageModel = OnlineConnectionInstance.model("Wastages", wastageSchema)
    OnlinePurchaseReturnModel = OnlineConnectionInstance.model("PurchaseReturn", purchaseReturnSchema)
    OnlineProductReturnModel = OnlineConnectionInstance.model("ProductReturn", productReturnSchema)
    OnlineCustomerModel = OnlineConnectionInstance.model("Customers", customerSchema)
    OnlineStaffModel = OnlineConnectionInstance.model("Staff", staffSchema)
    OnlineStaffRoleModel = OnlineConnectionInstance.model("StaffRoles", staffRoleSchema)
    OnlineStaffSalaryPaymentModel = OnlineConnectionInstance.model("StaffSalaryPayment", staffSalaryPaymentSchema)
    OnlineStaffSaleBillModel = OnlineConnectionInstance.model("StaffSaleBill", staffSaleBillSchema)
    OnlineStaffAttendanceModel = OnlineConnectionInstance.model("StaffAttendance", staffAttendanceSchema)
    OnlineSettingsModel = OnlineConnectionInstance.model("Settings", settingsSchema)
    OnlinePaymentMethodModel = OnlineConnectionInstance.model("PaymentMethods", paymentMethodSchema)
    OnlineAppThemeModel = OnlineConnectionInstance.model("AppThemes", appThemeSchema)

    // Change stream tracking disabled - using local database tracking instead
    // startChangeStreamTracking(OnlineConnection)
   } catch (error) {
      console.error("Online connection failed:", error.message);
   }
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
export const getOnlineUserRoleModel = () => OnlineUserRoleModel || null;
export const getOnlineProductModel = () => OnlineProductModel || null;
export const getOnlineCategoryModel = () => OnlineCategoryModel || null;
export const getOnlineSubCategoryModel = () => OnlineSubCategoryModel || null;
export const getOnlineBrandModel = () => OnlineBrandModel || null;
export const getOnlineBatchModel = () => OnlineBatchModel || null;
export const getOnlineSupplierModel = () => OnlineSupplierModel || null;
export const getOnlinePurchaseModel = () => OnlinePurchaseModel || null;
export const getOnlinePurchasePaymentModel = () => OnlinePurchasePaymentModel || null;
export const getOnlineOrderModel = () => OnlineOrderModel || null;
export const getOnlineHoldOrderModel = () => OnlineHoldOrderModel || null;
export const getOnlineStaffModel = () => OnlineStaffModel || null;
export const getOnlineStaffRoleModel = () => OnlineStaffRoleModel || null;
export const getOnlineStaffSalaryPaymentModel = () => OnlineStaffSalaryPaymentModel || null;
export const getOnlineStaffSaleBillModel = () => OnlineStaffSaleBillModel || null;
export const getOnlineStaffAttendanceModel = () => OnlineStaffAttendanceModel || null;
export const getOnlineSettingsModel = () => OnlineSettingsModel || null;
export const getOnlinePaymentMethodModel = () => OnlinePaymentMethodModel || null;
export const getOnlineAppThemeModel = () => OnlineAppThemeModel || null;
