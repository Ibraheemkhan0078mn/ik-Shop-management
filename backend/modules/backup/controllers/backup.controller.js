import { connectOnlineDb } from "../../../configs/onlineConnect.db.js";
import { onlineDocsUploadSyncInsert, onlineDocsUploadSyncUpdate } from "../services/uploadSync.js";
import { docsSyncOrganizer } from "../services/syncOrganizedRunner.js";
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

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

        // Import all models and fetch their data
        const models = [
            { name: 'Users', path: '../../auth/models/auth.model.js' },
            { name: 'Customers', path: '../../customer/models/customer.model.js' },
            { name: 'Expenses', path: '../../expenses/models/expense.model.js' },
            { name: 'ExpenseCategories', path: '../../expenses/models/expenseCatag.model.js' },
            { name: 'HoldOrders', path: '../../pos/models/holdOrder.model.js' },
            { name: 'Orders', path: '../../pos/models/order.model.js' },
            { name: 'Categories', path: '../../product/models/category.model.js' },
            { name: 'Products', path: '../../product/models/product.model.js' },
            { name: 'SubCategories', path: '../../product/models/subCategory.model.js' },
            { name: 'Batches', path: '../../productPurchases/models/batch.model.js' },
            { name: 'Purchases', path: '../../productPurchases/models/purchase.model.js' },
            { name: 'PurchasePayments', path: '../../productPurchases/models/purchasePayment.model.js' },
            { name: 'PurchaseReturns', path: '../../productPurchases/models/purchaseReturn.model.js' },
            { name: 'ProductReturns', path: '../../productReturn/models/productReturn.model.js' },
            { name: 'PurchaseReturns2', path: '../../purchaseReturn/models/purchaseReturn.model.js' },
            { name: 'QarzaAccounts', path: '../../qarza/models/qarzaAccount.model.js' },
            { name: 'AppThemes', path: '../../settings/models/appTheme.model.js' },
            { name: 'PaymentMethods', path: '../../settings/models/paymentMethod.model.js' },
            { name: 'Staff', path: '../../staff/models/staff.model.js' },
            { name: 'StaffAttendance', path: '../../staff/models/staffAttendance.model.js' },
            { name: 'StaffSalaryPayments', path: '../../staff/models/staffSalaryPayment.model.js' },
            { name: 'StaffSaleBills', path: '../../staff/models/staffSaleBill.model.js' },
            { name: 'Suppliers', path: '../../suppliers/models/supplier.model.js' },
            { name: 'Wastage', path: '../../wastage/models/wastage.model.js' },
        ];

        // Fetch data from each model and create sheets
        for (const model of models) {
            try {
                const Model = (await import(model.path)).default;
                const data = await Model.find({}).lean();
                
                if (data.length > 0) {
                    // Convert Mongoose documents to plain objects and remove _id, __v
                    const cleanData = data.map(doc => {
                        const { _id, __v, ...rest } = doc;
                        return rest;
                    });
                    
                    // Create worksheet
                    const worksheet = XLSX.utils.json_to_sheet(cleanData);
                    XLSX.utils.book_append_sheet(workbook, worksheet, model.name);
                }
            } catch (error) {
                console.error(`Error fetching data for ${model.name}:`, error);
                // Continue with other models even if one fails
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
