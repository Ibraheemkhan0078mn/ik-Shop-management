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
import { MONGODB_URI } from "../common/constants/constants.js";

let UserModel = null;
let ProductModel = null;
let CategoryModel = null;
let SubCategoryModel = null;
let BatchModel = null;
let SupplierModel = null;
let PurchaseModel = null;
let PurchasePaymentModel = null;
let OrderModel = null;
let HoldOrderModel = null;
let ActivityLogModel = null;
let ChangeTrackModel = null;
let ExpensesModel = null;
let ExpenseCategoryModel = null;
let ImageChangeTrackModel = null;
let QarzaAccountModel = null;
let QarzaPaymentModel = null;
let WastageModel = null;
let PurchaseReturnModel = null;
let ProductReturnModel = null;
let CustomerModel = null;
let StaffModel = null;
let StaffSalaryPaymentModel = null;
let StaffSaleBillModel = null;
let StaffAttendanceModel = null;

export const connectDb = async () => {
    console.log("the connection is running")
    dns.setServers(['8.8.8.8', '8.8.4.4']);

    const LocalConnection = await mongoose
        .createConnection("mongodb+srv://user2:lalakhanyar007m@cluster0.aipfjlf.mongodb.net/?appName=Cluster0", { dbName: "IMS-NEW" })
        .asPromise();

    if (LocalConnection.host) {
        console.log(`Server is connected to db host: ${LocalConnection.host}`);
    }

    UserModel = LocalConnection.model("Users", userSchema);
    ProductModel = LocalConnection.model("Products", productSchema);
    CategoryModel = LocalConnection.model("Categories", categorySchema);
    SubCategoryModel = LocalConnection.model(
        "SubCategories",
        subCategorySchema,
    );
    BatchModel = LocalConnection.model("Batches", batchSchema);
    SupplierModel = LocalConnection.model("Suppliers", supplierSchema);
    PurchaseModel = LocalConnection.model("Purchases", purchaseSchema);
    PurchasePaymentModel = LocalConnection.model("PurchasePayments", purchasePaymentSchema);
    OrderModel = LocalConnection.model("Orders", orderSchema);
    HoldOrderModel = LocalConnection.model("HoldOrders", holdOrderSchema);
    ExpensesModel = LocalConnection.model("Expenses", expenseSchema);
    ExpenseCategoryModel = LocalConnection.model("ExpensesCategory", expenseCatagSchema)
    ActivityLogModel = LocalConnection.model("ActivityLogs", activityLogSchema);
    ChangeTrackModel = LocalConnection.model("ChangeTracks", changeTrackSchema);
    ImageChangeTrackModel = LocalConnection.model("ImageChangeTracks", imageChangeTrackSchema)
    QarzaAccountModel = LocalConnection.model("QarzaAccount", QarzaAccountSchema)
    QarzaPaymentModel = LocalConnection.model("QarzaPayment", QarzaPaymentSchema)
    WastageModel = LocalConnection.model("Wastages", wastageSchema)
    PurchaseReturnModel = LocalConnection.model("PurchaseReturn", purchaseReturnSchema)
    ProductReturnModel = LocalConnection.model("ProductReturn", productReturnSchema)
    CustomerModel = LocalConnection.model("Customers", customerSchema)
    StaffModel = LocalConnection.model("Staff", staffSchema)
    StaffSalaryPaymentModel = LocalConnection.model("StaffSalaryPayment", staffSalaryPaymentSchema)
    StaffSaleBillModel = LocalConnection.model("StaffSaleBill", staffSaleBillSchema)
    StaffAttendanceModel = LocalConnection.model("StaffAttendance", staffAttendanceSchema)

};



export const getLocalPurchaseReturnModel = () => PurchaseReturnModel || null;
export const getLocalProductReturnModel = () => ProductReturnModel || null;
export const getLocalWastageModel = () => WastageModel || null;
export const getLocalCustomerModel = () => CustomerModel || null;
export const getLocalQarzaAccountModel = () => QarzaAccountModel || null;
export const getLocalQarzaPaymentModel = () => QarzaPaymentModel || null;
export const getLocalImageChangeTrackModel = () => ImageChangeTrackModel || null;
export const getLocalExpensesModel = () => ExpensesModel || null;
export const getLocalExpenseCategoryModel = () => ExpenseCategoryModel || null;
export const getLocalActivityLogModel = () => ActivityLogModel || null;
export const getLocalChangeTrackModel = () => ChangeTrackModel || null;
export const getLocalUserModel = () => UserModel || null;
export const getLocalProductModel = () => ProductModel || null;
export const getLocalCategoryModel = () => CategoryModel || null;
export const getLocalSubCategoryModel = () => SubCategoryModel || null;
export const getLocalBatchModel = () => BatchModel || null;
export const getLocalSupplierModel = () => SupplierModel || null;
export const getLocalPurchaseModel = () => PurchaseModel || null;
export const getLocalPurchasePaymentModel = () => PurchasePaymentModel || null;
export const getLocalOrderModel = () => OrderModel || null;
export const getLocalHoldOrderModel = () => HoldOrderModel || null;
export const getLocalStaffModel = () => StaffModel || null;
export const getLocalStaffSalaryPaymentModel = () => StaffSalaryPaymentModel || null;
export const getLocalStaffSaleBillModel = () => StaffSaleBillModel || null;
export const getLocalStaffAttendanceModel = () => StaffAttendanceModel || null;
