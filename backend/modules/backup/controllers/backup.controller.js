import { getOnlineDbConnection } from "../../../configs/onlineConnect.db.js";
import { onlineDocsUploadSyncInsert, onlineDocsUploadSyncUpdate } from "../../../common/ikSync/uploadSync.js";
import { docsSyncOrganizer } from "../../../common/ikSync/syncOrganizedRunner.js";

// Global sync cancellation flag
let syncInProgress = false;
let syncAbortController = null;

export const getStorageInfo = async (req, res) => {
    try {
        const onlineDb = getOnlineDbConnection();
        
        // Get database stats from MongoDB Atlas
        const stats = await onlineDb.db.stats();
        
        const totalStorage = stats.dataSize + stats.indexSize + stats.storageSize;
        const usedStorage = stats.dataSize;
        const remainingStorage = stats.storageSize - stats.dataSize;
        const percentageUsed = ((usedStorage / totalStorage) * 100).toFixed(2);

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

        // Run sync with type "all"
        await docsSyncOrganizer("all", req.user);

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

        // Run sync with type "required"
        await docsSyncOrganizer("required", req.user);

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
