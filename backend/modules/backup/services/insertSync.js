import { getLocalChangeTrackModel } from "../../../configs/connect.db.js";
import { getOnlineChangeTrackModel } from "../../../configs/onlineConnect.db.js";
import { deviceIdentityCheckFunction } from "./deviceIdentityCheckFunction.js";

export async function onlineDocsUploadSyncInsert(modelsArray, uploadType = "required", loggedInUserData) {
  try {
    if (uploadType === "all") {
      await allInsertUpload(modelsArray);
    } else {
      await requiredInsertUpload(modelsArray);
    }
  } catch (error) {
    console.log(error?.message || error?.stack);
  }
}

/**
 * Single aggregation ($lookup + $facet) classifies docs into insert/update.
 * Single bulkWrite executes both. 2 online DB ops total.
 */
async function classifyDocsForSync(eachModel, localDocs) {
  const ids = localDocs.map(d => d._id);

  const [result] = await eachModel.local.aggregate([
    { $match: { _id: { $in: ids } } },
    { $project: { _id: 1, updateTimeForSync: 1 } },
    {
      $lookup: {
        from: eachModel.online.collection.collectionName,
        localField: "_id",
        foreignField: "_id",
        as: "onlineMatch",
      },
    },
    {
      $facet: {
        toInsert: [
          { $match: { onlineMatch: { $size: 0 } } },
          { $project: { _id: 1 } },
        ],
        toUpdate: [
          { $match: { onlineMatch: { $ne: [] } } },
          {
            $match: {
              $expr: { $gt: ["$updateTimeForSync", { $arrayElemAt: ["$onlineMatch.updateTimeForSync", 0] }] },
            },
          },
          { $project: { _id: 1 } },
        ],
      },
    },
  ]);

  return {
    insertIds: result.toInsert.map(d => d._id),
    updateIds: result.toUpdate.map(d => d._id),
  };
}

/**
 * Builds one bulkWrite ops array covering both inserts and updates,
 * fetching full docs only for the ids that actually need writing.
 */
async function buildBulkOps(eachModel, insertIds, updateIds) {
  const operations = [];

  if (insertIds.length > 0 || updateIds.length > 0) {
    const docsToWrite = await eachModel.local.find({ _id: { $in: [...insertIds, ...updateIds] } });
    const insertIdSet = new Set(insertIds.map(id => id.toString()));

    for (const doc of docsToWrite) {
      const plainDoc = doc.toObject();
      if (insertIdSet.has(doc._id.toString())) {
        operations.push({ insertOne: { document: plainDoc } });
      } else {
        operations.push({ updateOne: { filter: { _id: doc._id }, update: { $set: plainDoc } } });
      }
    }
  }

  return operations;
}

async function allInsertUpload(modelsArray) {
  try {
    const localChangeTrackModel = getLocalChangeTrackModel();

    for (const eachModel of modelsArray) {
      const localDocs = await eachModel.local.find({}, { _id: 1, updateTimeForSync: 1 });
      if (localDocs.length === 0) continue;

      const { insertIds, updateIds } = await classifyDocsForSync(eachModel, localDocs);
      const operations = await buildBulkOps(eachModel, insertIds, updateIds);

      if (operations.length > 0) {
        const bulkWriteResult = await eachModel.online.bulkWrite(operations);
        if (isBulkWriteComplete(bulkWriteResult, operations.length)) {
          await localChangeTrackModel.deleteMany({
            documentId: { $in: localDocs.map(doc => doc._id.toString()) },
            modelName: eachModel.local.modelName,
          });
        }
      } else {
        await localChangeTrackModel.deleteMany({
          documentId: { $in: localDocs.map(doc => doc._id.toString()) },
          modelName: eachModel.local.modelName,
        });
      }

      console.log(`All insert upload completed for model: ${eachModel.local.modelName}`);
    }
  } catch (error) {
    throw new Error(error);
  }
}

async function requiredInsertUpload(modelsArray) {
  try {
    const localChangeTrackModel = getLocalChangeTrackModel();
    const onlineChangeTrackModel = getOnlineChangeTrackModel();
    const { deviceId } = await deviceIdentityCheckFunction();

    const createChangeTrackDocs = await localChangeTrackModel.find({ operationType: "create" });
    if (createChangeTrackDocs.length === 0) return;

    for (const eachModel of modelsArray) {
      const modelChangeTrackDocs = createChangeTrackDocs.filter(
        doc => doc.modelName === eachModel.online.modelName
      );
      if (modelChangeTrackDocs.length === 0) continue;

      const documentIds = modelChangeTrackDocs.map(doc => doc.documentId).filter(id => id != null);
      if (documentIds.length === 0) continue;

      const localDocs = await eachModel.local.find({ _id: { $in: documentIds } }, { _id: 1, updateTimeForSync: 1 });
      if (localDocs.length === 0) continue;

      const { insertIds, updateIds } = await classifyDocsForSync(eachModel, localDocs);
      const operations = await buildBulkOps(eachModel, insertIds, updateIds);

      if (operations.length > 0) {
        const bulkWriteResult = await eachModel.online.bulkWrite(operations);

        const changeTrackOperations = modelChangeTrackDocs.map(doc => ({
          updateOne: {
            filter: { _id: doc._id },
            update: { $set: { ...doc.toObject(), updatedUsers: [deviceId] } },
            upsert: true,
          },
        }));

        const changeTrackResult = await onlineChangeTrackModel.bulkWrite(changeTrackOperations);

        if (
          isBulkWriteComplete(bulkWriteResult, operations.length) &&
          isBulkWriteComplete(changeTrackResult, changeTrackOperations.length)
        ) {
          await localChangeTrackModel.deleteMany({ _id: { $in: modelChangeTrackDocs.map(doc => doc._id) } });
        }
      } else {
        await localChangeTrackModel.deleteMany({ _id: { $in: modelChangeTrackDocs.map(doc => doc._id) } });
      }

      console.log(`Required insert upload completed for model: ${eachModel.local.modelName}`);
    }
  } catch (error) {
    throw new Error(error);
  }
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