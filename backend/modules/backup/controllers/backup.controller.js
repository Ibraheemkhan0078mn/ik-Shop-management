import { connectOnlineDb } from "../../../configs/onlineConnect.db.js";
import { onlineDocsUploadSyncInsert, onlineDocsUploadSyncUpdate } from "../services/uploadSync.js";
import { docsSyncOrganizer } from "../services/syncOrganizedRunner.js";

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
