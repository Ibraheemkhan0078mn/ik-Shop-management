import mongoose from "mongoose";
import { getOnlineChangeTrackModel } from "../../../configs/onlineConnect.db.js";
import { deviceIdentityCheckFunction } from "./deviceIdentityCheckFunction.js";

export async function downloadOnlineSync(modelsArray, downloadType = "required", loggedInUserData) {
  try {
    const onlineChangeTrackModel = getOnlineChangeTrackModel();
    const { deviceId } = await deviceIdentityCheckFunction();

    if (downloadType === "all") {
      for (const eachCollectionObject of modelsArray) {
        if (!isPermitted(eachCollectionObject, loggedInUserData)) continue;

        const docs = await fetchAllowedDocs(eachCollectionObject, loggedInUserData);
        const newerDocs = await filterDocsNewerThanLocal(eachCollectionObject, docs);
        await upsertToLocal(eachCollectionObject, newerDocs);
      }
    } else {
      const allChangeTrackDocs = await onlineChangeTrackModel.find().lean();

      for (const eachCollectionObject of modelsArray) {
        if (!isPermitted(eachCollectionObject, loggedInUserData)) continue;

        const filteredChangeTrackDocs = allChangeTrackDocs.filter(
          (doc) =>
            doc.modelName === eachCollectionObject.local.modelName &&
            !doc.updatedUsers?.includes(deviceId)
        );

        if (filteredChangeTrackDocs.length === 0) continue;

        const changedDocsIds = filteredChangeTrackDocs.map(
          (doc) => new mongoose.Types.ObjectId(doc.documentId)
        );

        let orgDocs = await eachCollectionObject.online.find({ _id: { $in: changedDocsIds } }).lean();
        orgDocs = filterDocsByAllowedClasses(eachCollectionObject, orgDocs, loggedInUserData);
        orgDocs = await filterDocsNewerThanLocal(eachCollectionObject, orgDocs);

        const allowedIds = new Set(orgDocs.map((d) => d._id.toString()));
        const relevantChangeTrackDocs = filteredChangeTrackDocs.filter((doc) =>
          allowedIds.has(doc.documentId?.toString())
        );

        const bulkWriteResult = await upsertToLocal(eachCollectionObject, orgDocs);

        if (bulkWriteResult && isBulkWriteComplete(bulkWriteResult, orgDocs.length) && relevantChangeTrackDocs.length > 0) {
          const changeTrackUpdateOperations = relevantChangeTrackDocs.map((doc) => ({
            updateOne: {
              filter: { _id: doc._id },
              update: { $set: { ...doc, updatedUsers: [...doc.updatedUsers, deviceId] } },
              upsert: true,
            },
          }));

          await onlineChangeTrackModel.bulkWrite(changeTrackUpdateOperations);
        }
      }
    }

    return { result: true };
  } catch (error) {
    console.error("❌ Atlas upload sync failed:", error);
    return { result: false, error: error?.message };
  }
}

/**
 * Checks permission for a collection based on logged-in user's role/permissions
 */
function isPermitted(eachCollectionObject, loggedInUserData) {
  const userPermissions = loggedInUserData?.permissions;
  if (userPermissions && userPermissions.length > 0) {
    if (!userPermissions.includes(eachCollectionObject.permissionString) && loggedInUserData?.role !== "admin") {
      return false;
    }
  }
  return true;
}

/**
 * Fetches docs from online collection scoped to user's allowed classes (for "all" download)
 */
async function fetchAllowedDocs(eachCollectionObject, loggedInUserData) {
  if (loggedInUserData?.role === "admin") {
    return eachCollectionObject.online.find().lean();
  }

  const allowedClasses = loggedInUserData?.allowedClases;
  const modelName = eachCollectionObject.local?.modelName;

  if (modelName === "class") {
    return eachCollectionObject.online.find({ _id: { $in: allowedClasses } }).lean();
  }
  if (modelName === "student") {
    return eachCollectionObject.online.find({ classId: { $in: allowedClasses } }).lean();
  }
  return eachCollectionObject.online.find().lean();
}

/**
 * Filters already-fetched docs by allowed classes for the "required" (changeTrack) path
 */
function filterDocsByAllowedClasses(eachCollectionObject, docs, loggedInUserData) {
  const allowedClasses = loggedInUserData?.allowedClases || [];
  const modelName = eachCollectionObject.local.modelName;

  if (!loggedInUserData || allowedClasses.length === 0) return docs;

  if (modelName === "class") {
    return docs.filter((doc) => allowedClasses.includes(doc._id.toString()));
  }
  if (modelName === "student") {
    return docs.filter((doc) => allowedClasses.includes(doc.classId?.toString()));
  }
  return docs;
}

/**
 * Builds upsert bulkWrite ops and writes docs into the local collection
 */
async function upsertToLocal(eachCollectionObject, docs) {
  if (!eachCollectionObject?.local || !docs?.length) return null;

  const operations = docs.map((doc) => ({
    updateOne: {
      filter: { _id: doc._id },
      update: { $set: doc },
      upsert: true,
    },
  }));

  return eachCollectionObject.local.bulkWrite(operations);
}

async function filterDocsNewerThanLocal(eachCollectionObject, docs) {
  if (!eachCollectionObject?.local || !docs?.length) return [];

  const documentIds = docs.map(doc => doc._id);
  const localDocs = await eachCollectionObject.local.find(
    { _id: { $in: documentIds } },
    { _id: 1, updateTimeForSync: 1 },
  ).lean();
  const localTimes = new Map(
    localDocs.map(doc => [doc._id.toString(), new Date(doc.updateTimeForSync || 0).getTime()]),
  );

  return docs.filter(doc => {
    const localTime = localTimes.get(doc._id.toString());
    if (localTime === undefined) return true;

    const onlineTime = new Date(doc.updateTimeForSync || 0).getTime();
    return onlineTime > localTime;
  });
}

function isBulkWriteComplete(bulkWriteResult, expectedCount) {
  if (!bulkWriteResult) return false;
  const processedCount =
    (bulkWriteResult.insertedCount || 0) +
    (bulkWriteResult.modifiedCount || 0) +
    (bulkWriteResult.deletedCount || 0) +
    (bulkWriteResult.upsertedCount || 0);
  return processedCount >= expectedCount;
}