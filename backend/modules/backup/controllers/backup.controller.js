import { connectOnlineDb } from "../../../configs/onlineConnect.db.js";
import { connectDb } from "../../../configs/connect.db.js";
import { onlineDocsUploadSyncInsert, onlineDocsUploadSyncUpdate } from "../services/uploadSync.js";
import { docsSyncOrganizer } from "../services/syncOrganizedRunner.js";
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { 
    getLocalProductModel, 
    getLocalCategoryModel 
} from "../../../configs/connect.db.js";

// Global sync cancellation flag
let syncInProgress = false;
let syncAbortController = null;

export const getStorageInfo = async (req, res) => {
    try {
        await connectOnlineDb();
        const mongoose = await import('mongoose');
        const ONLINE_MONGODB_URI = "mongodb+srv://user2:lalakhanyar007m@cluster0.aipfjlf.mongodb.net/?appName=Cluster0";
        const onlineDb = await mongoose.createConnection(ONLINE_MONGODB_URI, { dbName: "IMS-ONLINE" }).asPromise();
        
        // Get database stats from MongoDB Atlas
        const stats = await onlineDb.db.stats();
        
        // MongoDB Atlas storage metrics
        // storageSize: actual disk space used (compressed) - this is what matters for billing
        // dataSize: uncompressed data size
        // indexSize: uncompressed index size
        const storageSize = stats.storageSize || 0;
        const dataSize = stats.dataSize || 0;
        const indexSize = stats.indexSize || 0;
        
        // MongoDB Atlas free tier has 512MB quota
        const atlasQuota = 512 * 1024 * 1024; // 512MB in bytes
        const usedStorage = storageSize; // Actual compressed storage used
        const totalStorage = atlasQuota; // Atlas free tier quota
        const remainingStorage = Math.max(0, totalStorage - usedStorage);
        const percentageUsed = totalStorage > 0 ? ((usedStorage / totalStorage) * 100).toFixed(2) : 0;

        res.json({
            success: true,
            data: {
                total: totalStorage,
                used: usedStorage,
                remaining: remainingStorage,
                percentage: parseFloat(percentageUsed),
                dataSize: stats.dataSize,
                indexSize: stats.indexSize,
                storageSize: stats.storageSize,
            },
        });
    } catch (error) {
        console.error("Error fetching storage info:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch storage information",
        });
    }
};

export const syncAll = async (req, res) => {
    try {
        if (syncInProgress) {
            return res.status(400).json({
                success: false,
                message: "Sync is already in progress",
            });
        }

        // Check database connections before starting sync
        const localProductModel = getLocalProductModel();
        const localCategoryModel = getLocalCategoryModel();
        
        if (!localProductModel || !localCategoryModel) {
            return res.status(400).json({
                success: false,
                message: "Local database not connected. Please ensure database connection is established.",
            });
        }

        try {
            await connectOnlineDb();
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: "Online database not connected. Please check your internet connection and try again.",
            });
        }

        syncInProgress = true;
        syncAbortController = new AbortController();

        // Run sync with type "all" - provide default user if req.user is undefined
        const userData = req.user || { role: "admin", permissions: [] };
        await docsSyncOrganizer("all", userData);

        syncInProgress = false;
        syncAbortController = null;

        res.json({
            success: true,
            message: "Full sync completed successfully",
        });
    } catch (error) {
        syncInProgress = false;
        syncAbortController = null;
        console.error("Error during sync all:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Sync failed",
        });
    }
};

export const syncRequired = async (req, res) => {
    try {
        if (syncInProgress) {
            return res.status(400).json({
                success: false,
                message: "Sync is already in progress",
            });
        }

        // Check database connections before starting sync
        const localProductModel = getLocalProductModel();
        const localCategoryModel = getLocalCategoryModel();
        
        if (!localProductModel || !localCategoryModel) {
            return res.status(400).json({
                success: false,
                message: "Local database not connected. Please ensure database connection is established.",
            });
        }

        try {
            await connectOnlineDb();
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: "Online database not connected. Please check your internet connection and try again.",
            });
        }

        syncInProgress = true;
        syncAbortController = new AbortController();

        // Run sync with type "required" - provide default user if req.user is undefined
        const userData = req.user || { role: "admin", permissions: [] };
        await docsSyncOrganizer("required", userData);

        syncInProgress = false;
        syncAbortController = null;

        res.json({
            success: true,
            message: "Required sync completed successfully",
        });
    } catch (error) {
        syncInProgress = false;
        syncAbortController = null;
        console.error("Error during sync required:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Sync failed",
        });
    }
};

export const stopSync = async (req, res) => {
    try {
        if (!syncInProgress || !syncAbortController) {
            return res.status(400).json({
                success: false,
                message: "No sync in progress",
            });
        }

        syncAbortController.abort();
        syncInProgress = false;
        syncAbortController = null;

        res.json({
            success: true,
            message: "Sync stopped successfully",
        });
    } catch (error) {
        console.error("Error stopping sync:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to stop sync",
        });
    }
};

export const getSyncStatus = async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                inProgress: syncInProgress,
            },
        });
    } catch (error) {
        console.error("Error fetching sync status:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch sync status",
        });
    }
};

export const exportExcel = async (req, res) => {
    try {
        const { userId } = req.body;
        
        // Get settings to find Excel backup path using the centralized service
        const { findOneSettingsService } = (await import('../../settings/services/settings.crud.js'));
        const settings = await findOneSettingsService({ userId: userId || "global" });
        
        if (!settings) {
            return res.status(404).json({
                success: false,
                message: "Settings not found",
            });
        }

        const excelBackupPath = settings.backup?.excelBackupPath || "./backups/excel";
        
        // Ensure directory exists
        if (!fs.existsSync(excelBackupPath)) {
            fs.mkdirSync(excelBackupPath, { recursive: true });
        }

        // Create new workbook
        const workbook = XLSX.utils.book_new();

        // Service-based data fetching configuration
        const dataSources = [
            { name: 'Users', service: '../../auth/services/user.service.js', method: 'getAllUsers' },
            { name: 'Customers', service: '../../customer/services/customer.service.js', method: 'getAllCustomers' },
            { name: 'Expenses', service: '../../expenses/services/expense.service.js', method: 'getAllExpenses' },
            { name: 'ExpenseCategories', service: '../../expenses/services/expenseCategory.service.js', method: 'expenseCatagGetAll' },
            { name: 'HoldOrders', service: '../../pos/services/holdOrder.service.js', method: 'getAllHoldOrders' },
            { name: 'Orders', service: '../../pos/services/order.service.js', method: 'getAllOrders' },
            { name: 'Categories', service: '../../product/services/category.service.js', method: 'getCategories' },
            { name: 'Products', service: '../../product/services/product.service.js', method: 'getProducts' },
            { name: 'SubCategories', service: '../../product/services/subCategory.service.js', method: 'getSubCategories' },
            { name: 'Batches', service: '../../productPurchases/services/batch.service.js', method: 'getBatches' },
            { name: 'Purchases', service: '../../productPurchases/services/purchase.service.js', method: 'getPurchases' },
            { name: 'PurchaseReturns', service: '../../productPurchases/services/purchaseReturn.service.js', method: 'getAllPurchaseReturns' },
            { name: 'ProductReturns', service: '../../productReturn/services/productReturn.service.js', method: 'getAllProductReturns' },
            { name: 'PurchaseReturns2', service: '../../purchaseReturn/services/purchaseReturn.service.js', method: 'getAllPurchaseReturns' },
            { name: 'QarzaAccounts', service: '../../qarza/services/qarza.service.js', method: 'getAllQarzaAccounts' },
            { name: 'AppThemes', service: '../../settings/services/appTheme.service.js', method: 'getAllThemes' },
            { name: 'PaymentMethods', service: '../../settings/services/paymentMethod.service.js', method: 'getAllPaymentMethods' },
            { name: 'Staff', service: '../../staff/services/staff.service.js', method: 'getAllStaff' },
            { name: 'Suppliers', service: '../../suppliers/services/supplier.service.js', method: 'getAllSuppliers' },
            { name: 'Wastage', service: '../../wastage/services/wastage.service.js', method: 'getAllWastages' },
        ];

        // Fetch data from each service and create sheets
        for (const source of dataSources) {
            try {
                const serviceModule = await import(source.service);
                const fetchMethod = serviceModule[source.method];
                
                if (typeof fetchMethod === 'function') {
                    let data;
                    // Handle methods that need parameters
                    if (source.name === 'Batches') {
                        data = await fetchMethod(null); // getBatches accepts productId
                    } else if (source.name === 'Staff') {
                        data = await fetchMethod({}); // getAllStaff needs filters object
                    } else {
                        data = await fetchMethod();
                    }
                    
                    // Handle paginated responses
                    if (data && data.data && Array.isArray(data.data)) {
                        data = data.data;
                    }
                    
                    if (data && data.length > 0) {
                        // Convert Mongoose documents to plain objects and remove _id, __v
                        const cleanData = data.map(doc => {
                            const plainDoc = doc.toObject ? doc.toObject() : doc;
                            const { _id, __v, ...rest } = plainDoc;
                            return rest;
                        });
                        
                        // Create worksheet
                        const worksheet = XLSX.utils.json_to_sheet(cleanData);
                        XLSX.utils.book_append_sheet(workbook, worksheet, source.name);
                    }
                } else {
                    console.error(`Method ${source.method} not found in ${source.service}`);
                }
            } catch (error) {
                console.error(`Error fetching data for ${source.name}:`, error.message);
                // Continue with other services even if one fails
            }
        }

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `backup_${timestamp}.xlsx`;
        const filepath = path.join(excelBackupPath, filename);

        // Write workbook to file
        XLSX.writeFile(workbook, filepath);

        res.json({
            success: true,
            message: "Excel export completed successfully",
            data: {
                filepath,
                filename,
            },
        });
    } catch (error) {
        console.error("Error during Excel export:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Excel export failed",
        });
    }
};
