
























import mongoose from "mongoose";
import { getLocalChangeTrackModel } from "../../db/localDbConnection.js";
import { getOnlineChangeTrackModel } from "../../db/onlineDbConnection.js";
import { deviceIdentityCheckFunction } from "./deviceIdentityCheckFunction.js";

const CHUNK_SIZE = 500;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

function upsertOps(docs) {
  return docs.map((doc) => ({
    updateOne: { filter: { _id: doc._id }, update: { $set: doc }, upsert: true },
  }));
}

function bulkWriteOk(result, expected) {
  const { upsertedCount = 0, modifiedCount = 0, matchedCount = 0, insertedCount = 0 } = result ?? {};
  return upsertedCount + modifiedCount + matchedCount + insertedCount >= expected;
}

// ─── Core: Upload all docs for a model, upsert online, delete local CT only after all chunks done ──

async function uploadAllDocs(model, localCT) {

  const docs = await model.local.find().lean();

  if (!docs.length) return;

  const chunks = chunkArray(docs, CHUNK_SIZE);
  const cleanupIds = [];

  for (const chunk of chunks) {
    const result = await model.online.bulkWrite(upsertOps(chunk));
    if (!bulkWriteOk(result, chunk.length)) {
      console.warn(`[allUpload] Chunk failed for ${model.local.modelName}, skipping cleanup for this chunk.`);
      continue;
    }
    cleanupIds.push(...chunk.map((d) => d._id.toString()));
  }

  // Delete local CT only after all successful chunks are confirmed
  if (cleanupIds.length) {
    await localCT.deleteMany({
      documentId: { $in: cleanupIds },
      modelName: model.local.modelName,
    });
  }
}

// ─── Core: Upload only CT-tracked docs, sync online CT, delete local CT after all chunks done ──

async function uploadTrackedDocs(model, operationType, localCT, onlineCT, deviceId, loggedInUserData) {
  // Permission filtering is now done at syncOrganizedRunner level
  // All models reaching this function are already permission-approved

  // Fetch CT docs for this model and operationType
  const ctDocs = await localCT.find({
    modelName: model.local.modelName,
    operationType,
  }).lean();

  if (!ctDocs.length) return;

  const docIds = ctDocs.map((ct) => new mongoose.Types.ObjectId(ct.documentId));
  const docs = await model.local.find({ _id: { $in: docIds } }).lean();
  if (!docs.length) return;

  const ctByDocId = Object.fromEntries(ctDocs.map((ct) => [ct.documentId.toString(), ct]));

  const chunks = chunkArray(docs, CHUNK_SIZE);
  const cleanupCtIds = [];

  for (const docChunk of chunks) {
    const ctChunk = docChunk.map((d) => ctByDocId[d._id.toString()]).filter(Boolean);

    // 1. Upsert or update online docs
    let docOps;
    if (operationType === "create") {
      docOps = upsertOps(docChunk);
    } else {
      // update: only if local is newer
      docOps = docChunk.map((doc) => ({
        updateOne: {
          filter: { _id: doc._id, updatedAt: { $lt: doc.updatedAt } },
          update: { $set: doc },
          upsert: false,
        },
      }));
    }

    const docResult = await model.online.bulkWrite(docOps);

    // For updates: matchedCount covers "already up to date" — not a failure
    const docOk = operationType === "create"
      ? bulkWriteOk(docResult, docChunk.length)
      : (docResult?.matchedCount || 0) >= docChunk.length;

    if (!docOk) {
      console.warn(`[trackedUpload:${operationType}] Doc chunk failed for ${model.local.modelName}`);
      continue;
    }

    // 2. Upsert online CT with deviceId
    const ctOps = ctChunk.map((ct) => ({
      updateOne: {
        filter: { _id: ct._id },
        update: { $set: { ...ct, updatedUsers: [deviceId] } },
        upsert: true,
      },
    }));
    const ctResult = await onlineCT.bulkWrite(ctOps);
    if (!bulkWriteOk(ctResult, ctChunk.length)) {
      console.warn(`[trackedUpload:${operationType}] CT chunk failed for ${model.local.modelName}`);
      continue;
    }

    cleanupCtIds.push(...ctChunk.map((ct) => ct._id));
  }

  // Delete local CT only after all successful chunks
  if (cleanupCtIds.length) {
    await localCT.deleteMany({ _id: { $in: cleanupCtIds } });
  }
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export async function onlineDocsUploadSyncInsert(modelsArray, uploadType = "required", loggedInUserData) {
  try {
    const localCT = getLocalChangeTrackModel();

    if (uploadType === "all") {
      for (const model of modelsArray) await uploadAllDocs(model, localCT);
    } else {
      const onlineCT = getOnlineChangeTrackModel();
      const { deviceId } = await deviceIdentityCheckFunction();
      for (const model of modelsArray) await uploadTrackedDocs(model, "create", localCT, onlineCT, deviceId, loggedInUserData);
    }
  } catch (err) {
    console.error("[onlineDocsUploadSyncInsert]", err?.message || err?.stack);
  }
}

export async function onlineDocsUploadSyncUpdate(modelsArray, uploadType = "required", loggedInUserData) {
  try {
    const localCT = getLocalChangeTrackModel();

    if (uploadType === "all") {
      for (const model of modelsArray) await uploadAllDocs(model, localCT);
    } else {
      const onlineCT = getOnlineChangeTrackModel();
      const { deviceId } = await deviceIdentityCheckFunction();
      for (const model of modelsArray) await uploadTrackedDocs(model, "update", localCT, onlineCT, deviceId, loggedInUserData);
    }
  } catch (err) {
    console.error("[onlineDocsUploadSyncUpdate]", err?.message || err?.stack);
  }
}


