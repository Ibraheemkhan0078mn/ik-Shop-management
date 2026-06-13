import mongoose from "mongoose";
import userSchema from "../modules/auth/models/auth.model.js";
import productSchema from "../modules/product/models/product.model.js";
import categorySchema from "../modules/product/models/category.model.js";
import subCategorySchema from "../modules/product/models/subCategory.model.js";
import batchSchema from "../modules/stock/models/batch.model.js";
import supplierSchema from "../modules/stock/models/supplier.model.js";
import purchaseSchema from "../modules/stock/models/purchase.model.js";
import orderSchema from "../modules/pos/models/order.model.js";
import holdOrderSchema from "../modules/pos/models/holdOrder.model.js";
import memberSchema from "../modules/member/models/member.model.js";
import expenseSchema from "../modules/expenses/models/expense.model.js";
import inventorySchema from "../modules/assets/models/inventory.model.js";
import inventoryCategorySchema from "../modules/assets/models/inventoryCategory.model.js";
import activityLogSchema from "../modules/others/models/logsTracking.model.js";
import changeTrackSchema from "../modules/others/models/changeTrack.model.js";
import expenseCatagSchema from "../modules/expenses/models/expenseCatag.model.js";
import memberAttendenceSchema from "../modules/member/models/memberAttendence.model.js";
import { memberInvoiceSchema } from "../modules/member/models/memberInvoice.js";
import memberPaymentSchema from "../modules/member/models/memberPayment.model.js";
import imageChangeTrackSchema from "../modules/others/models/imageChangeTrack.model.js";
import memberInvestmentSchema from "../modules/member/models/memberInvestment.model.js";
import QarzaAccountSchema from "../modules/qarza/models/qarzaAccount.model.js";
import QarzaPaymentSchema from "../modules/qarza/models/qarzaPayment.js";
import wastageSchema from "../modules/stock/models/wastage.model.js";
import returnSchema from "../modules/stock/models/return.model.js";
import { MONGODB_URI } from "../common/constants/constants.js";

let UserModel = null;
let ProductModel = null;
let CategoryModel = null;
let SubCategoryModel = null;
let BatchModel = null;
let SupplierModel = null;
let PurchaseModel = null;
let OrderModel = null;
let HoldOrderModel = null;
let ActivityLogModel = null;
let ChangeTrackModel = null;
let MemberModel = null;
let ExpensesModel = null;
let ExpenseCategoryModel = null;
let InventoryModel = null;
let InventoryCatagModel = null;
let MemberAttendanceModel = null;
let MemberInvoiceModel = null;
let MemberPaymentModel = null;
let ImageChangeTrackModel = null;
let MemberInvestmentModel = null;
let QarzaAccountModel = null;
let QarzaPaymentModel = null;
let WastageModel = null;
let ReturnModel = null;

export const connectDb = async () => {
    console.log("the connection is running")
    const LocalConnection = await mongoose 
        .createConnection( "mongodb://localhost:27017/shop-management", { dbName: "IMS-NEW" })
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
    OrderModel = LocalConnection.model("Orders", orderSchema);
    HoldOrderModel = LocalConnection.model("HoldOrders", holdOrderSchema);

    MemberModel = LocalConnection.model("Members", memberSchema);
    ExpensesModel = LocalConnection.model("Expenses", expenseSchema);
    ExpenseCategoryModel = LocalConnection.model("ExpensesCategory", expenseCatagSchema)
    InventoryModel = LocalConnection.model("Inventory", inventorySchema);
    InventoryCatagModel = LocalConnection.model("InventoryCategory", inventoryCategorySchema)
    ActivityLogModel = LocalConnection.model("ActivityLogs", activityLogSchema);
    ChangeTrackModel = LocalConnection.model("ChangeTracks", changeTrackSchema);
    MemberAttendanceModel = LocalConnection.model("MemberAttendance", memberAttendenceSchema);
    MemberInvoiceModel = LocalConnection.model("MemberInvoices", memberInvoiceSchema);
    MemberPaymentModel = LocalConnection.model("MemberPayment", memberPaymentSchema)
    ImageChangeTrackModel = LocalConnection.model("ImageChangeTracks", imageChangeTrackSchema)
    MemberInvestmentModel = LocalConnection.model("MemberInvestment", memberInvestmentSchema)
    QarzaAccountModel = LocalConnection.model("QarzaAccount", QarzaAccountSchema)
    QarzaPaymentModel = LocalConnection.model("QarzaPayment", QarzaPaymentSchema)
    WastageModel = LocalConnection.model("Wastages", wastageSchema)
    ReturnModel = LocalConnection.model("Return", returnSchema)

};



export const getLocalReturnModel =()=> ReturnModel || null ; 
export const getLocalWastageModel = () => WastageModel || null;
export const getLocalQarzaAccountModel = () => QarzaAccountModel || null;
export const getLocalQarzaPaymentModel = () => QarzaPaymentModel || null;
export const getLocalMemberInvestmentModel = () => MemberInvestmentModel || null;
export const getLocalImageChangeTrackModel = () => ImageChangeTrackModel || null;
export const getLocalMemberPaymentModel = () => MemberPaymentModel || null;
export const getLocalMemberInvoiceModel = () => MemberInvoiceModel || null;
export const getLocalMemberAttendanceModel = () => MemberAttendanceModel || null;
export const getLocalInventoryCategoryModel = () => InventoryCatagModel || null;
export const getLocalMemberModel = () => MemberModel || null;
export const getLocalExpensesModel = () => ExpensesModel || null;
export const getLocalExpenseCategoryModel = () => ExpenseCategoryModel || null;
export const getLocalInventoryModel = () => InventoryModel || null;
export const getLocalActivityLogModel = () => ActivityLogModel || null;
export const getLocalChangeTrackModel = () => ChangeTrackModel || null;
export const getLocalUserModel = () => UserModel || null;
export const getLocalProductModel = () => ProductModel || null;
export const getLocalCategoryModel = () => CategoryModel || null;
export const getLocalSubCategoryModel = () => SubCategoryModel || null;
export const getLocalBatchModel = () => BatchModel || null;
export const getLocalSupplierModel = () => SupplierModel || null;
export const getLocalPurchaseModel = () => PurchaseModel || null;
export const getLocalOrderModel = () => OrderModel || null;
export const getLocalHoldOrderModel = () => HoldOrderModel || null;
