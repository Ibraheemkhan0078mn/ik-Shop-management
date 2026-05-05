import mongoose from "mongoose";
import { getLocalChangeTrackModel } from "../../db/localDbConnection.js";

import { getOnlineChangeTrackModel } from "../../db/onlineDbConnection.js";
import { deviceIdentityCheckFunction } from "./deviceIdentityCheckFunction.js";








export async function deleteOnlineSync(modelsArray, loggedInUserData) {
  try {

    await deleteFromLocal(modelsArray)
    await deleteFromOnline(modelsArray)


    return { result: true };

  } catch (error) {
    console.log(error?.message);
    throw new Error(error)
  }
}










async function deleteFromLocal(modelsArray) {
  try {
    let onlineChangeTrackModel = getOnlineChangeTrackModel();
    let localChangeTrackModel = getLocalChangeTrackModel();

    // Ek hi baar sare delete CT docs fetch karo
    let allOnlineDeleteChangeTrack = await onlineChangeTrackModel.find({
      operationType: "delete"
    }).lean(); // .lean() for faster queries

    if (!allOnlineDeleteChangeTrack?.length) return;

    // Group IDs by model name
    let deleteIdsByModel = {};
    allOnlineDeleteChangeTrack.forEach(doc => {
      if (!deleteIdsByModel[doc.modelName]) {
        deleteIdsByModel[doc.modelName] = [];
      }
      deleteIdsByModel[doc.modelName].push(new mongoose.Types.ObjectId(doc.documentId));
    });

    // Batch delete operations
    let deletePromises = [];

    for (let eachCollectionObject of modelsArray) {
      let modelName = eachCollectionObject.local?.modelName;
      let idsToDelete = deleteIdsByModel[modelName];

      if (idsToDelete?.length > 0) {
        deletePromises.push(
          eachCollectionObject.local.deleteMany({ _id: { $in: idsToDelete } })
        );
      }
    }

    // Sare delete operations ek saath run karo
    await Promise.all(deletePromises);

    // Ek hi baar sare CT docs delete karo
    let allIdsToDelete = Object.values(deleteIdsByModel).flat();
    if (allIdsToDelete.length > 0) {
      await localChangeTrackModel.deleteMany({
        documentId: { $in: allIdsToDelete }
      });
    }

  } catch (error) {
    throw new Error(error);
  }
}



async function deleteFromOnline(modelsArray) {
  try {
    let { deviceId } = await deviceIdentityCheckFunction();
    let currentDeviceId = deviceId;

    let localChangeTrackModel = getLocalChangeTrackModel();
    let onlineChangeTrackModel = getOnlineChangeTrackModel();

    // Ek baar sare delete CT docs fetch karo
    let allChangeTrackDocs = await localChangeTrackModel.find({
      operationType: "delete"
    }).lean();

    if (!allChangeTrackDocs?.length) return;

    // Sare delete operations ek saath collect karo
    let allDeletePromises = [];
    let allTrackOperations = [];
    let allDeletedIds = [];

    for (let eachCollectionObject of modelsArray) {

      // Filter kar ke IDs nikalo current model ke liye
      let changedDocsIds = allChangeTrackDocs
        .filter(eachDoc => eachDoc?.modelName === eachCollectionObject?.local?.modelName)
        .map(eachDoc => new mongoose.Types.ObjectId(eachDoc.documentId))
        .filter(eachDoc => eachDoc != null)
      console.log(changedDocsIds, eachCollectionObject.local.modelName)

      // Agar koi IDs hain toh delete operations add karo
      if (eachCollectionObject?.online && changedDocsIds?.length > 0) {

        // Online se delete
        allDeletePromises.push(
          eachCollectionObject.online.deleteMany({ _id: { $in: changedDocsIds } })
        );

        // CT se bhi delete
        allDeletePromises.push(
          onlineChangeTrackModel.deleteMany({ documentId: { $in: changedDocsIds } })
        );

        // Track operations prepare karo
        let filteredChangeTrackDocs = allChangeTrackDocs.filter(
          eachDoc => eachDoc?.modelName === eachCollectionObject?.local?.modelName
        );

        filteredChangeTrackDocs.forEach(eachDoc => {
          allTrackOperations.push({
            updateOne: {
              filter: {
                modelName: eachDoc.modelName,
                documentId: eachDoc.documentId
              },
              update: {
                $set: { ...eachDoc, updatedUsers: [currentDeviceId] }
              },
              upsert: true,
            },
          });
        });

        // Deleted IDs collect karo
        allDeletedIds.push(...changedDocsIds);
      }
    }

    // Sare delete operations ek saath run karo
    if (allDeletePromises.length > 0) {
      await Promise.all(allDeletePromises);
    }

    // CT bulk write ek baar mein
    if (allTrackOperations.length > 0) {
      let changeTrackBulkWriteResult = await onlineChangeTrackModel.bulkWrite(allTrackOperations);

      // Agar sab operations successful hain toh local CT se delete karo
      let totalOperations = changeTrackBulkWriteResult.insertedCount +
        changeTrackBulkWriteResult.modifiedCount +
        changeTrackBulkWriteResult.deletedCount +
        changeTrackBulkWriteResult.upsertedCount;
      // console.log(totalOperations, allTrackOperations.length, "ldkjfldsjlskdj")

      if (totalOperations >= allTrackOperations.length) {
        await localChangeTrackModel.deleteMany({
          documentId: { $in: allDeletedIds }
        });
      }
    }

  } catch (error) {
    throw new Error(error);
  }
}