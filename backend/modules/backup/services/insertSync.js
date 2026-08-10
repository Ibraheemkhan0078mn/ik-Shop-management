import { getLocalChangeTrackModel } from "../../../configs/connect.db.js";
import { getOnlineChangeTrackModel } from "../../../configs/onlineConnect.db.js";
import { deviceIdentityCheckFunction } from "./deviceIdentityCheckFunction.js";

export async function onlineDocsUploadSyncInsert(modelsArray, uploadType = "required", loggedInUserData) {
  try {
    console.log("The online docs uplaos sync inset is running", uploadType, loggedInUserData)
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

  // Fetch online docs directly from online model
  const onlineDocs = await eachModel.online.find(
    { _id: { $in: ids } },
    { _id: 1, updateTimeForSync: 1 }
  );

  const onlineMap = new Map(
    onlineDocs.map(doc => [doc._id.toString(), doc.updateTimeForSync])
  );

  const insertIds = [];
  const updateIds = [];

  for (const localDoc of localDocs) {
    const idStr = localDoc._id.toString();
    const onlineUpdateTime = onlineMap.get(idStr);

    if (onlineUpdateTime === undefined) {
      // Not present online -> insert
      insertIds.push(localDoc._id);
    } else if (localDoc.updateTimeForSync > onlineUpdateTime) {
      // Present online but local is newer -> update
      updateIds.push(localDoc._id);
    }
  }

  console.log("insertIds:", insertIds.length, "updateIds:", updateIds.length);
  return { insertIds, updateIds };
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
      console.log(localDocs.length, eachModel.local.modelName, "The data lenght")
      if (localDocs.length === 0) continue;

      const { insertIds, updateIds } = await classifyDocsForSync(eachModel, localDocs);
    console.log("insert adn udpate id", insertIds, updateIds)
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