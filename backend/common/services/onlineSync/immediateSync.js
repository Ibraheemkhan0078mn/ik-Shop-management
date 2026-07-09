import mongoose from "mongoose";
import { getLocalChangeTrackModel } from "../../db/localDbConnection.js";
import { getOnlineChangeTrackModel } from "../../db/onlineDbConnection.js";
import { deviceIdentityCheckFunction } from "./deviceIdentityCheckFunction.js";

// ─── Immediate Sync for Single Document ───────────────────────────────────────
// This function uploads a single document change immediately when data changes
// instead of waiting for the full sync cycle

export async function immediateUploadSingleDoc(operation, modelName, documentId, loggedInUserData) {
    try {
        const localCT = getLocalChangeTrackModel();
        const onlineCT = getOnlineChangeTrackModel();
        const { deviceId } = await deviceIdentityCheckFunction();

        // Check if online DB is connected
        const { getOnlineDbInstance } = await import("../../db/onlineDbConnection.js");
        const onlineDb = getOnlineDbInstance();
        
        if (!onlineDb || onlineDb.readyState !== 1) {
            console.log("[immediateSync] Online DB not connected, skipping immediate sync");
            return { success: false, reason: "no_connection" };
        }

        // Permission filtering is done at CT creation level in changeTrackModelCreation.js
        // If CT record exists, user has permission (or it was created before permission change)
        // Additional check here for safety during permission changes
        if (loggedInUserData && loggedInUserData?.role !== "admin") {
            const { getPermissionStringForModel } = await import("./modelHelper.js");
            const permissionString = getPermissionStringForModel(modelName);
            
            if (permissionString) {
                const hasPermission = permissionString.some(p => 
                    loggedInUserData.permissions?.includes(p)
                );
                if (!hasPermission) {
                    console.log(`[immediateSync] BLOCKED ${modelName} - user has no permission. No data will sync to Atlas.`);
                    // Delete local CT record so it doesn't pile up
                    await localCT.deleteOne({
                        documentId: documentId.toString(),
                        modelName,
                        operationType: operation,
                    });
                    return { success: false, reason: "no_permission" };
                }
            }
        }

        // Find the CT record for this document
        const ctDoc = await localCT.findOne({
            documentId: documentId.toString(),
            modelName,
            operationType: operation,
        }).lean();

        if (!ctDoc) {
            console.log("[immediateSync] No CT record found for immediate sync");
            return { success: false, reason: "no_ct_record" };
        }

        // Get the model from the model array (need to import syncOrganizedRunner's model array)
        // For now, we'll use a simpler approach - get the model dynamically
        const { getLocalModelByName, getOnlineModelByName } = await import("./modelHelper.js");
        
        const localModel = getLocalModelByName(modelName);
        const onlineModel = getOnlineModelByName(modelName);

        if (!localModel || !onlineModel) {
            console.log("[immediateSync] Model not found for:", modelName);
            return { success: false, reason: "model_not_found" };
        }

        // Fetch the actual document
        const doc = await localModel.findById(documentId).lean();
        if (!doc) {
            console.log("[immediateSync] Document not found locally:", documentId);
            return { success: false, reason: "doc_not_found" };
        }

        // Upload to online
        if (operation === "create") {
            await onlineModel.updateOne(
                { _id: doc._id },
                { $set: doc },
                { upsert: true }
            );
        } else if (operation === "update") {
            // Only update if online version is older
            await onlineModel.updateOne(
                { _id: doc._id, updatedAt: { $lt: doc.updatedAt } },
                { $set: doc },
                { upsert: false }
            );
        } else if (operation === "delete") {
            await onlineModel.deleteOne({ _id: documentId });
        }

        // Upsert online CT with deviceId (REPLACE logic)
        await onlineCT.updateOne(
            { _id: ctDoc._id },
            { $set: { ...ctDoc, updatedUsers: [deviceId] } },
            { upsert: true }
        );

        // Delete local CT after successful upload
        await localCT.deleteOne({ _id: ctDoc._id });

        console.log(`[immediateSync] Successfully synced ${operation} for ${modelName}:${documentId}`);
        return { success: true };

    } catch (error) {
        console.error("[immediateSync] Error:", error?.message);
        return { success: false, error: error?.message };
    }
}

// ─── Batch Immediate Sync for Multiple Documents ──────────────────────────────
export async function immediateUploadBatch(ctDocs) {
    try {
        const { deviceId } = await deviceIdentityCheckFunction();
        const { getOnlineDbInstance } = await import("../../db/onlineDbConnection.js");
        const onlineDb = getOnlineDbInstance();
        
        if (!onlineDb || onlineDb.readyState !== 1) {
            return { success: false, reason: "no_connection" };
        }

        const results = [];
        
        for (const ctDoc of ctDocs) {
            const result = await immediateUploadSingleDoc(
                ctDoc.operationType,
                ctDoc.modelName,
                ctDoc.documentId
            );
            results.push(result);
        }

        const successCount = results.filter(r => r.success).length;
        console.log(`[immediateSync] Batch sync: ${successCount}/${ctDocs.length} successful`);
        
        return { success: true, results, successCount };

    } catch (error) {
        console.error("[immediateSync] Batch error:", error?.message);
        return { success: false, error: error?.message };
    }
}
