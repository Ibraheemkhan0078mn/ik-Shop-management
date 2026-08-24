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
import staffSalaryChangeSchema from "../modules/staff/models/staffSalaryChange.model.js";
import staffPercentageChangeSchema from "../modules/staff/models/staffPercentageChange.model.js";
import settingsSchema from "../modules/settings/models/settings.model.js";
import paymentMethodSchema from "../modules/settings/models/paymentMethod.model.js";
import { MONGODB_URI } from "../common/constants/constants.js";
import { changeTrackDocsCreationFunc } from "../common/services/onlineSync/changeTrackModelCreation.js";
import appThemeSchema from "../modules/settings/models/appTheme.model.js";
import transactionSchema from "../modules/transactions/models/transaction.model.js";






let LocalConnectionInstance = null;

export const getLocalDbInstance = () => LocalConnectionInstance;

const internallyManagedModels = new Set([
    "ChangeTracks",
    "ActivityLogs",
    "ImageChangeTracks",
]);

const queryTrackingOperations = [
    "updateOne",
    "updateMany",
    "findOneAndUpdate",
    "replaceOne",
    "findOneAndReplace",
    "deleteOne",
    "deleteMany",
    "findOneAndDelete",
    "findOneAndRemove",
];

const isLocalModel = (model) => model?.db === LocalConnectionInstance;

const normalizeDocumentId = (documentId) => {
    if (!documentId) return null;
    return documentId.toString();
};

const trackDocument = (operation, modelName, documentId) => {
    const normalizedId = normalizeDocumentId(documentId);
    if (!normalizedId) return;

    changeTrackDocsCreationFunc(operation, modelName, normalizedId, null)
        .then(() => console.log(`[changeTrack] Successfully tracked ${operation} for ${modelName} (${normalizedId})`))
        .catch(error => {
            console.error(`[changeTrack] Error tracking ${operation} for ${modelName}:`, error);
        });
};

const findMatchingDocumentIds = async (model, filter, many = false) => {
    if (!model || !filter) return [];

    const query = model.find(filter).select({ _id: 1 });
    if (!many) query.limit(1);

    const documents = await query.lean();
    return documents.map(doc => doc._id.toString());
};

// Mongoose middleware only sees writes made through this connection's models.
const addChangeTrackingMiddleware = (schema, modelName) => {
    if (internallyManagedModels.has(modelName)) return;

    schema.pre('save', async function () {
        if (!isLocalModel(this.constructor)) return;
        this.$locals = this.$locals || {};
        this.$locals.changeTrackOperation = this.isNew ? 'create' : 'update';
        if (!this.isNew) this.updateTimeForSync = new Date();
    });

    schema.post('save', function (doc) {
        if (!isLocalModel(this.constructor)) return;
        trackDocument(this.$locals?.changeTrackOperation || 'update', modelName, doc?._id);
    });

    schema.post('insertMany', function (documents) {
        if (!isLocalModel(this)) return;
        for (const document of documents || []) {
            trackDocument('create', modelName, document?._id);
        }
    });

    schema.pre(queryTrackingOperations, async function () {
        if (!isLocalModel(this.model)) return;

        const operation = this.op;
        const isMany = operation === 'updateMany' || operation === 'deleteMany';
        this.$locals = this.$locals || {};
        this.$locals.changeTrackDocumentIds = await findMatchingDocumentIds(
            this.model,
            this.getFilter(),
            isMany,
        );

        if (operation === 'updateOne' || operation === 'updateMany' ||
            operation === 'findOneAndUpdate' || operation === 'replaceOne' ||
            operation === 'findOneAndReplace') {
            this.set({ updateTimeForSync: new Date() });
        }
    });

    schema.post(queryTrackingOperations, function (result) {
        if (!isLocalModel(this.model)) return;

        const operation = this.op === 'deleteOne' || this.op === 'deleteMany' ||
            this.op === 'findOneAndDelete' || this.op === 'findOneAndRemove'
            ? 'delete'
            : 'update';
        const documentIds = new Set(this.$locals?.changeTrackDocumentIds || []);
        const resultId = normalizeDocumentId(result?._id);
        if (resultId) documentIds.add(resultId);

        for (const documentId of documentIds) {
            trackDocument(operation, modelName, documentId);
        }
    });

    schema.pre('bulkWrite', async function (operations) {
        if (!isLocalModel(this)) return;

        const trackedOperations = [];
        for (const operation of operations || []) {
            const [operationName, operationData] = Object.entries(operation)[0] || [];
            if (!operationName || !operationData) continue;

            if (operationName === 'insertOne') {
                trackedOperations.push({ operation: 'create', documentIds: [operationData.document?._id] });
                continue;
            }

            const isDelete = operationName === 'deleteOne' || operationName === 'deleteMany';
            const isMany = operationName === 'updateMany' || operationName === 'deleteMany';
            const filter = operationData.filter;
            const documentIds = await findMatchingDocumentIds(this, filter, isMany);

            trackedOperations.push({
                operation: isDelete ? 'delete' : 'update',
                documentIds,
            });
        }

        this.$locals = this.$locals || {};
        this.$locals.changeTrackBulkOperations = trackedOperations;
    });

    schema.post('bulkWrite', function (result) {
        if (!isLocalModel(this)) return;

        for (const trackedOperation of this.$locals?.changeTrackBulkOperations || []) {
            for (const documentId of trackedOperation.documentIds) {
                trackDocument(trackedOperation.operation, modelName, documentId);
            }
        }

        for (const documentId of Object.values(result?.upsertedIds || {})) {
            trackDocument('create', modelName, documentId);
        }
    });
};

let UserModel = null;
let UserRoleModel = null;
let ProductModel = null;
let CategoryModel = null;
let SubCategoryModel = null;
let BrandModel = null;
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
let StaffRoleModel = null;
let StaffSalaryPaymentModel = null;
let StaffSaleBillModel = null;
let StaffAttendanceModel = null;
let StaffSalaryChangeModel = null;
let StaffPercentageChangeModel = null;
let SettingsModel = null;
let PaymentMethodModel = null;
let AppThemeModel = null;
let TransactionModel = null;

export const connectDb = async () => {
    try {
        console.log("The local db is running")
        // dns.setServers(['8.8.8.8', '8.8.4.4']);
        // mongodb+srv://user2:lalakhanyar007m@cluster0.aipfjlf.mongodb.net/?appName=Cluster0
        const LocalConnection = await mongoose
            .createConnection("mongodb://127.0.0.1:27017", { dbName: "IMS-NEW" })
            .asPromise();
        LocalConnectionInstance = LocalConnection;

        console.log("The db is connected.")
        if (LocalConnection.host) {
            console.log(`Server is connected to db host: ${LocalConnection.host}`);
        }

        // Add change tracking middleware to schemas before creating models
        addChangeTrackingMiddleware(userSchema, "Users");
        addChangeTrackingMiddleware(userRoleSchema, "UserRoles");
        addChangeTrackingMiddleware(productSchema, "Products");
        addChangeTrackingMiddleware(categorySchema, "Categories");
        addChangeTrackingMiddleware(subCategorySchema, "SubCategories");
        addChangeTrackingMiddleware(brandSchema, "Brands");
        addChangeTrackingMiddleware(batchSchema, "Batches");
        addChangeTrackingMiddleware(supplierSchema, "Suppliers");
        addChangeTrackingMiddleware(purchaseSchema, "Purchases");
        addChangeTrackingMiddleware(purchasePaymentSchema, "PurchasePayments");
        addChangeTrackingMiddleware(orderSchema, "Orders");
        addChangeTrackingMiddleware(holdOrderSchema, "HoldOrders");
        addChangeTrackingMiddleware(expenseSchema, "Expenses");
        addChangeTrackingMiddleware(expenseCatagSchema, "ExpensesCategory");
        addChangeTrackingMiddleware(activityLogSchema, "ActivityLogs");
        addChangeTrackingMiddleware(changeTrackSchema, "ChangeTracks");
        addChangeTrackingMiddleware(imageChangeTrackSchema, "ImageChangeTracks");
        addChangeTrackingMiddleware(QarzaAccountSchema, "QarzaAccount");
        addChangeTrackingMiddleware(QarzaPaymentSchema, "QarzaPayment");
        addChangeTrackingMiddleware(wastageSchema, "Wastages");
        addChangeTrackingMiddleware(purchaseReturnSchema, "PurchaseReturn");
        addChangeTrackingMiddleware(productReturnSchema, "ProductReturn");
        addChangeTrackingMiddleware(customerSchema, "Customers");
        addChangeTrackingMiddleware(staffSchema, "Staff");
        addChangeTrackingMiddleware(staffRoleSchema, "StaffRole");
        addChangeTrackingMiddleware(staffSalaryPaymentSchema, "StaffSalaryPayment");
        addChangeTrackingMiddleware(staffSaleBillSchema, "StaffSaleBill");
        addChangeTrackingMiddleware(staffAttendanceSchema, "StaffAttendance");
        addChangeTrackingMiddleware(staffSalaryChangeSchema, "StaffSalaryChange");
        addChangeTrackingMiddleware(staffPercentageChangeSchema, "StaffPercentageChange");
        addChangeTrackingMiddleware(settingsSchema, "Settings");
        addChangeTrackingMiddleware(paymentMethodSchema, "PaymentMethods");
        addChangeTrackingMiddleware(appThemeSchema, "AppThemes");
        addChangeTrackingMiddleware(transactionSchema, "Transactions");

        UserModel = LocalConnection.model("Users", userSchema);
        UserRoleModel = LocalConnection.model("UserRoles", userRoleSchema);
        ProductModel = LocalConnection.model("Products", productSchema);
        CategoryModel = LocalConnection.model("Categories", categorySchema);
        SubCategoryModel = LocalConnection.model(
            "SubCategories",
            subCategorySchema,
        );
        BrandModel = LocalConnection.model("Brands", brandSchema);
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
        StaffRoleModel = LocalConnection.model("StaffRole", staffRoleSchema)
        StaffSalaryPaymentModel = LocalConnection.model("StaffSalaryPayment", staffSalaryPaymentSchema)
        StaffSaleBillModel = LocalConnection.model("StaffSaleBill", staffSaleBillSchema)
        StaffAttendanceModel = LocalConnection.model("StaffAttendance", staffAttendanceSchema)
        StaffSalaryChangeModel = LocalConnection.model("StaffSalaryChange", staffSalaryChangeSchema)
        StaffPercentageChangeModel = LocalConnection.model("StaffPercentageChange", staffPercentageChangeSchema)
        SettingsModel = LocalConnection.model("Settings", settingsSchema)
        PaymentMethodModel = LocalConnection.model("PaymentMethods", paymentMethodSchema)
        AppThemeModel = LocalConnection.model("AppThemes", appThemeSchema)
        TransactionModel = LocalConnection.model("Transactions", transactionSchema)

        console.log("📝 Automatic change tracking enabled for local database models");
    } catch (error) {
        console.error("❌ Local database connection failed:", error);
    }
};


export const getLocalAppThemeModel = () => AppThemeModel || null;
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
export const getLocalUserRoleModel = () => UserRoleModel || null;
export const getLocalProductModel = () => ProductModel || null;
export const getLocalCategoryModel = () => CategoryModel || null;
export const getLocalSubCategoryModel = () => SubCategoryModel || null;
export const getLocalBrandModel = () => BrandModel || null;
export const getLocalBatchModel = () => BatchModel || null;
export const getLocalSupplierModel = () => SupplierModel || null;
export const getLocalPurchaseModel = () => PurchaseModel || null;
export const getLocalPurchasePaymentModel = () => PurchasePaymentModel || null;
export const getLocalOrderModel = () => OrderModel || null;
export const getLocalHoldOrderModel = () => HoldOrderModel || null;
export const getLocalStaffModel = () => StaffModel || null;
export const getLocalStaffRoleModel = () => StaffRoleModel || null;
export const getLocalStaffSalaryPaymentModel = () => StaffSalaryPaymentModel || null;
export const getLocalStaffSaleBillModel = () => StaffSaleBillModel || null;
export const getLocalStaffAttendanceModel = () => StaffAttendanceModel || null;
export const getLocalStaffSalaryChangeModel = () => StaffSalaryChangeModel || null;
export const getLocalStaffPercentageChangeModel = () => StaffPercentageChangeModel || null;
export const getLocalSettingsModel = () => SettingsModel || null;
export const getLocalPaymentMethodModel = () => PaymentMethodModel || null;
export const getLocalTransactionModel = () => TransactionModel || null;
export const getLocalDeviceIdentityModel = () => null;
