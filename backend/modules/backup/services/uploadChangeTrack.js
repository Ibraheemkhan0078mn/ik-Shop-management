import { getOnlineChangeTrackModel } from "../../../configs/onlineConnect.db.js";
import { deviceIdentityCheckFunction } from "./deviceIdentityCheckFunction.js";

/**
 * Upload change track documents to online database
 * 
 * @param {Array} changeTrackDocs - Array of change track documents to upload
 * @param {String} modelName - Model name for the documents
 * @param {String} operationType - Operation type (create/update/delete)
 * @param {String} userId - Current user ID performing the sync
 * @returns {Object} - { success: boolean, uploadedCount: number, error?: string }
 */
export async function uploadChangeTrack(changeTrackDocs, modelName, operationType, userId) {
  try {
    if (!changeTrackDocs || changeTrackDocs.length === 0) {
      return { success: true, uploadedCount: 0 };
    }

    const onlineChangeTrackModel = getOnlineChangeTrackModel();
    const { deviceId } = await deviceIdentityCheckFunction();

    // Process each change track document
    const bulkOperations = [];

    for (const doc of changeTrackDocs) {
      if (!doc.documentId || !doc.modelName) {
        console.warn(`⚠️ Skipping invalid change track doc:`, doc);
        continue;
      }

      // Check if change track already exists online for this documentId, modelName, and operationType
      const existingChangeTrack = await onlineChangeTrackModel.findOne({
        documentId: doc.documentId,
        modelName: doc.modelName,
        operationType: doc.operationType
      }).lean();

      if (existingChangeTrack) {
        // Update existing change track: update timing and ensure only current userId is in users array
        bulkOperations.push({
          updateOne: {
            filter: {
              documentId: doc.documentId,
              modelName: doc.modelName,
              operationType: doc.operationType
            },
            update: {
              $set: {
                updateTimeForSync: new Date(),
                updatedUsers: [deviceId] // Only current user
              },
              $addToSet: {
                users: userId // Add userId to users array without duplicates
              }
            }
          }
        });
      } else {
        // Create new change track with only current userId in users array
        bulkOperations.push({
          updateOne: {
            filter: {
              documentId: doc.documentId,
              modelName: doc.modelName,
              operationType: doc.operationType
            },
            update: {
              $set: {
                ...doc,
                users: [userId], // Store only current userId
                updatedUsers: [deviceId],
                createdTimeForSync: new Date(),
                updateTimeForSync: new Date()
              }
            },
            upsert: true
          }
        });
      }
    }

    if (bulkOperations.length === 0) {
      return { success: true, uploadedCount: 0 };
    }

    // Execute bulk write
    const result = await onlineChangeTrackModel.bulkWrite(bulkOperations);
    
    const uploadedCount = (result.upsertedCount || 0) + (result.modifiedCount || 0);
    console.log(`✅ Uploaded ${uploadedCount} change tracks for ${modelName} (${operationType})`);

    return {
      success: true,
      uploadedCount,
      result
    };

  } catch (error) {
    console.error(`❌ Error uploading change tracks:`, error);
    return {
      success: false,
      uploadedCount: 0,
      error: error?.message || error?.stack
    };
  }
}
