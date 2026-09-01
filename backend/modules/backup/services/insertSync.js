import { getLocalChangeTrackModel } from "../../../configs/connect.db.js";
import { uploadChangeTrack } from "./uploadChangeTrack.js";

export async function onlineDocsUploadSyncInsert(modelsArray, uploadType = "required", loggedInUserData) {
  try {
    console.log("The online docs uplaos sync inset is running", uploadType, loggedInUserData)
    if (uploadType === "all") {
      await allInsertUpload(modelsArray, loggedInUserData);
    } else {
      await requiredInsertUpload(modelsArray, loggedInUserData);
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
  ).lean();

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
    } else if (new Date(localDoc.updateTimeForSync || 0).getTime() > new Date(onlineUpdateTime || 0).getTime()) {
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
      const localDocs = await eachModel.local.find({}, { _id: 1, updateTimeForSync: 1 }).lean();
      console.log(localDocs.length, eachModel.local.modelName, "The data lenght")
      if (localDocs.length === 0) continue;

      const { insertIds, updateIds } = await classifyDocsForSync(eachModel, localDocs);
    console.log("insert adn udpate id", insertIds, updateIds)
      const operations = await buildBulkOps(eachModel, insertIds, updateIds);

      if (operations.length > 0) {
        const bulkWriteResult = await eachModel.online.bulkWrite(operations);
        if (isBulkWriteComplete(bulkWriteResult, operations.length)) {
          await localChangeTrackModel.deleteMany({
            documentId: { $in: [...insertIds, ...updateIds].map(id => id.toString()) },
            modelName: eachModel.local.modelName,
          });
        }
      } else {
        continue;
      }

      console.log(`All insert upload completed for model: ${eachModel.local.modelName}`);
    }
  } catch (error) {
    throw new Error(error);
  }
}

async function requiredInsertUpload(modelsArray, loggedInUserData) {
  try {
    const localChangeTrackModel = getLocalChangeTrackModel();
    const userId = loggedInUserData?._id?.toString();

    const createChangeTrackDocs = await localChangeTrackModel.find({ operationType: "create" }).lean();
    if (createChangeTrackDocs.length === 0) return;

    for (const eachModel of modelsArray) {
      const modelChangeTrackDocs = createChangeTrackDocs.filter(
        doc => doc.modelName === eachModel.online.modelName
      );
      if (modelChangeTrackDocs.length === 0) continue;

      const documentIds = modelChangeTrackDocs.map(doc => doc.documentId).filter(id => id != null);
      if (documentIds.length === 0) continue;

      const localDocs = await eachModel.local.find({ _id: { $in: documentIds } }, { _id: 1, updateTimeForSync: 1 }).lean();
      if (localDocs.length === 0) continue;

      const { insertIds, updateIds } = await classifyDocsForSync(eachModel, localDocs);
      const operations = await buildBulkOps(eachModel, insertIds, updateIds);

      if (operations.length > 0) {
        // Upload documents to online DB
        const bulkWriteResult = await eachModel.online.bulkWrite(operations);

        // If documents uploaded successfully, upload their change tracks
        if (isBulkWriteComplete(bulkWriteResult, operations.length)) {
          const syncedDocumentIds = new Set([...insertIds, ...updateIds].map(id => id.toString()));
          const syncedChangeTrackDocs = modelChangeTrackDocs.filter(doc =>
            syncedDocumentIds.has(doc.documentId?.toString())
          );

          // Upload change tracks using the new function
          const changeTrackUploadResult = await uploadChangeTrack(
            syncedChangeTrackDocs,
            eachModel.online.modelName,
            "create",
            userId
          );

          // Clear local change tracks only if upload was successful
          if (changeTrackUploadResult.success) {
            await localChangeTrackModel.deleteMany({ 
              _id: { $in: syncedChangeTrackDocs.map(doc => doc._id) } 
            });
            console.log(`✅ Cleared ${syncedChangeTrackDocs.length} local change tracks for ${eachModel.local.modelName}`);
          }
        }
      } else {
        // No operations needed, clear the change tracks
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