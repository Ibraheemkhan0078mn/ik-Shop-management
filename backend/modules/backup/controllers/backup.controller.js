import { connectOnlineDb } from "../../../configs/onlineConnect.db.js";
import { connectDb } from "../../../configs/connect.db.js";
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

export const exportFilteredData = async (req, res) => {
    try {
        const { models, filters, exportType, userId } = req.body;
        
        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = exportType === 'excel' ? `filtered_backup_${timestamp}.xlsx` : `filtered_backup_${timestamp}.pdf`;

        // Model to service mapping
        const modelServiceMap = {
            orders: { service: '../../pos/services/order.service.js', method: 'getAllOrders' },
            holdOrders: { service: '../../pos/services/holdOrder.service.js', method: 'getAllHoldOrders' },
            products: { service: '../../product/services/product.service.js', method: 'getProducts' },
            categories: { service: '../../product/services/category.service.js', method: 'getCategories' },
            brands: { service: '../../product/services/brand.service.js', method: 'getBrands' },
            wastage: { service: '../../wastage/services/wastage.service.js', method: 'getAllWastages' },
            purchases: { service: '../../productPurchases/services/purchase.service.js', method: 'getPurchases' },
            purchaseReturns: { service: '../../productPurchases/services/purchaseReturn.service.js', method: 'getAllPurchaseReturns' },
            customers: { service: '../../customer/services/customer.service.js', method: 'getAllCustomers' },
            suppliers: { service: '../../suppliers/services/supplier.service.js', method: 'getAllSuppliers' },
            qarzaAccounts: { service: '../../qarza/services/qarza.service.js', method: 'getAllQarzaAccounts' },
            expenses: { service: '../../expenses/services/expense.service.js', method: 'getAllExpenses' },
            staff: { service: '../../staff/services/staff.service.js', method: 'getAllStaff' },
            users: { service: '../../auth/services/user.service.js', method: 'getAllUsers' },
        };

        const exportData = {};

        // Fetch data for selected models
        for (const modelId of models) {
            try {
                const serviceConfig = modelServiceMap[modelId];
                if (!serviceConfig) {
                    console.error(`No service configuration found for model: ${modelId}`);
                    continue;
                }

                console.log(`Fetching data for model: ${modelId}`);
                const serviceModule = await import(serviceConfig.service);
                const fetchMethod = serviceModule[serviceConfig.method];
                
                if (typeof fetchMethod === 'function') {
                    let data;
                    const modelFilters = filters[modelId] || {};
                    
                    // Apply filters to the fetch call
                    if (modelId === 'staff') {
                        data = await fetchMethod(modelFilters);
                    } else if (modelId === 'products') {
                        data = await fetchMethod();
                        // Apply client-side filtering for products
                        if (modelFilters.category || modelFilters.subCategory || modelFilters.brand || modelFilters.stockStatus || modelFilters.search) {
                            data = data.filter(item => {
                                if (modelFilters.category && item.category?.name !== modelFilters.category) return false;
                                if (modelFilters.subCategory && item.subCategory?.name !== modelFilters.subCategory) return false;
                                if (modelFilters.brand && item.brandName !== modelFilters.brand) return false;
                                if (modelFilters.stockStatus === 'in_stock' && item.currentStockLevel <= 0) return false;
                                if (modelFilters.stockStatus === 'out_of_stock' && item.currentStockLevel > 0) return false;
                                if (modelFilters.stockStatus === 'low_stock' && (item.currentStockLevel <= 0 || item.currentStockLevel >= 5)) return false;
                                if (modelFilters.search && !item.name.toLowerCase().includes(modelFilters.search.toLowerCase()) && !item.productCode?.toLowerCase().includes(modelFilters.search.toLowerCase())) return false;
                                return true;
                            });
                        }
                    } else if (modelId === 'customers' || modelId === 'holdOrders' || modelId === 'purchaseReturns') {
                        // These models should fetch all data without filters initially
                        data = await fetchMethod();
                    } else {
                        data = await fetchMethod();
                    }
                    
                    console.log(`Raw data for ${modelId}:`, data?.length || 0, 'records');
                    
                    // Handle paginated responses
                    if (data && data.data && Array.isArray(data.data)) {
                        data = data.data;
                    }
                    
                    // Apply date range filters
                    if (modelFilters.dateRange && (modelFilters.dateRange.startDate || modelFilters.dateRange.endDate)) {
                        data = data.filter(item => {
                            const itemDate = new Date(item.createdAt || item.date);
                            if (modelFilters.dateRange.startDate && itemDate < new Date(modelFilters.dateRange.startDate)) return false;
                            if (modelFilters.dateRange.endDate && itemDate > new Date(modelFilters.dateRange.endDate)) return false;
                            return true;
                        });
                    }
                    
                    // Apply text search filters
                    if (modelFilters.search) {
                        data = data.filter(item => {
                            const searchStr = modelFilters.search.toLowerCase();
                            return Object.values(item).some(val => 
                                val && String(val).toLowerCase().includes(searchStr)
                            );
                        });
                    }
                    
                    // Apply status filters
                    if (modelFilters.status && modelFilters.status !== 'all') {
                        data = data.filter(item => item.status === modelFilters.status);
                    }
                    
                    console.log(`Filtered data for ${modelId}:`, data?.length || 0, 'records');
                    
                    if (data && data.length > 0) {
                        // Convert Mongoose documents to plain objects and remove _id, __v
                        exportData[modelId] = data.map(doc => {
                            const plainDoc = doc.toObject ? doc.toObject() : doc;
                            const { _id, __v, ...rest } = plainDoc;
                            return rest;
                        });
                        console.log(`Added ${modelId} to exportData with ${exportData[modelId].length} records`);
                    } else {
                        console.log(`No data found for ${modelId} after filtering`);
                    }
                }
            } catch (error) {
                console.error(`Error fetching data for ${modelId}:`, error.message);
            }
        }
        
        console.log('Final exportData keys:', Object.keys(exportData));
        
        if (exportType === 'excel') {
            const workbook = XLSX.utils.book_new();
            
            // Create sheets for each model
            for (const [modelId, data] of Object.entries(exportData)) {
                if (data && data.length > 0) {
                    const worksheet = XLSX.utils.json_to_sheet(data);
                    XLSX.utils.book_append_sheet(workbook, worksheet, modelId);
                }
            }
            
            // Write to buffer instead of file
            const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
            const fileBuffer = buffer.toString('base64');

            res.json({
                success: true,
                message: "Excel export completed successfully",
                data: {
                    filename,
                    fileBuffer,
                    modelsExported: Object.keys(exportData),
                },
            });
        } else if (exportType === 'pdf') {
            // PDF export implementation with proper tables
            const PDFDocument = await import('pdfkit');
            const doc = new PDFDocument.default({ margin: 50 });
            const filename = `filtered_backup_${timestamp}.pdf`;
            
            // Collect PDF data into buffer
            const chunks = [];
            doc.on('data', chunk => chunks.push(chunk));
            
            const pdfPromise = new Promise((resolve, reject) => {
                doc.on('end', () => {
                    const buffer = Buffer.concat(chunks);
                    resolve(buffer.toString('base64'));
                });
                doc.on('error', reject);
            });
            
            // Add title
            doc.fontSize(20).text('Filtered Data Export', { align: 'center' });
            doc.moveDown();
            doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
            doc.moveDown();
            doc.moveDown();
            
            // Helper function to format nested objects
            const formatValue = (val) => {
                if (val === null || val === undefined) return '';
                if (typeof val === 'object') {
                    if (Array.isArray(val)) {
                        return val.length > 0 ? `[${val.length} items]` : '[]';
                    }
                    if (val.name) return val.name;
                    if (val.fullName) return val.fullName;
                    if (val.productCode) return val.productCode;
                    return JSON.stringify(val).substring(0, 50);
                }
                if (typeof val === 'boolean') return val ? 'Yes' : 'No';
                if (val instanceof Date) return val.toLocaleDateString();
                return String(val);
            };
            
            // Helper function to draw table
            const drawTable = (data, startY) => {
                if (data.length === 0) return startY;
                
                const tableTop = startY;
                const rowHeight = 30;
                const tableWidth = doc.page.width - 100;
                const pageMargin = 50;
                const bottomMargin = 80;
                
                // Get all unique keys from all items
                const allKeys = [...new Set(data.flatMap(item => Object.keys(item)))].slice(0, 6);
                const numCols = allKeys.length;
                const colWidths = Array(numCols).fill(tableWidth / numCols);
                
                // Define professional colors
                const headerBg = '#e8f4f8';
                const headerBorder = '#b8d4e3';
                const rowBorder = '#e0e0e0';
                const altRowBg = '#f9fbfd';
                const textColor = '#333333';
                
                // Draw header with soft styling
                doc.fontSize(9).font('Helvetica-Bold').fillColor('#2c5282');
                let xPos = pageMargin;
                allKeys.forEach((key, index) => {
                    doc.rect(xPos, tableTop, colWidths[index], rowHeight)
                       .fill(headerBg)
                       .lineWidth(0.5)
                       .stroke(headerBorder);
                    
                    doc.fillColor('#2c5282').text(key.toUpperCase(), xPos + 6, tableTop + 8, {
                        width: colWidths[index] - 12,
                        align: 'left'
                    });
                    xPos += colWidths[index];
                });
                
                let currentY = tableTop + rowHeight;
                
                // Draw rows with alternating colors and soft borders
                doc.font('Helvetica').fontSize(8).fillColor(textColor);
                for (let i = 0; i < data.length; i++) {
                    // Check if we need a new page before drawing the row
                    if (currentY + rowHeight > doc.page.height - bottomMargin) {
                        doc.addPage();
                        currentY = pageMargin;
                        
                        // Redraw header on new page
                        doc.fontSize(9).font('Helvetica-Bold').fillColor('#2c5282');
                        xPos = pageMargin;
                        allKeys.forEach((key, index) => {
                            doc.rect(xPos, currentY, colWidths[index], rowHeight)
                               .fill(headerBg)
                               .lineWidth(0.5)
                               .stroke(headerBorder);
                            doc.fillColor('#2c5282').text(key.toUpperCase(), xPos + 6, currentY + 8, {
                                width: colWidths[index] - 12,
                                align: 'left'
                            });
                            xPos += colWidths[index];
                        });
                        currentY += rowHeight;
                        doc.font('Helvetica').fontSize(8).fillColor(textColor);
                    }
                    
                    const isAltRow = i % 2 === 1;
                    
                    xPos = pageMargin;
                    allKeys.forEach((key, index) => {
                        const value = formatValue(data[i][key]);
                        
                        // Alternating row background
                        if (isAltRow) {
                            doc.rect(xPos, currentY, colWidths[index], rowHeight).fill(altRowBg);
                        }
                        
                        // Soft border
                        doc.rect(xPos, currentY, colWidths[index], rowHeight)
                           .lineWidth(0.3)
                           .stroke(rowBorder);
                        
                        // Text with proper wrapping
                        doc.fillColor(textColor).text(value, xPos + 6, currentY + 8, {
                            width: colWidths[index] - 12,
                            align: 'left',
                            lineGap: 2
                        });
                        xPos += colWidths[index];
                    });
                    
                    currentY += rowHeight;
                }
                
                return currentY + 20;
            };
            
            let currentY = 100;
            
            for (const [modelId, data] of Object.entries(exportData)) {
                if (data.length === 0) continue;
                
                // Check if we need a new page for the model header
                if (currentY > doc.page.height - 100) {
                    doc.addPage();
                    currentY = 50;
                }
                
                // Draw model header
                doc.fontSize(12).font('Helvetica-Bold').fillColor('#333333')
                   .text(`${modelId.toUpperCase()} (${data.length} records)`, 50, currentY);
                currentY += 20;
                
                // Draw table
                currentY = drawTable(data, currentY);
                currentY += 20;
            }
            
            doc.end();
            
            // Wait for PDF to finish generating
            const fileBuffer = await pdfPromise;

            res.json({
                success: true,
                message: "PDF export completed successfully",
                data: {
                    filename,
                    fileBuffer,
                    modelsExported: Object.keys(exportData),
                },
            });
        } else {
            res.status(400).json({
                success: false,
                message: "Invalid export type. Must be 'excel' or 'pdf'",
            });
        }
    } catch (error) {
        console.error("Error during filtered export:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Export failed",
        });
    }
};
