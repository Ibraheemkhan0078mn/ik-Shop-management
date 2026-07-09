

import mongoose from "mongoose";
import { getLocalChangeTrackModel } from "../../db/localDbConnection.js";
import { getOnlineChangeTrackModel } from "../../db/onlineDbConnection.js";
import { deviceIdentityCheckFunction } from "./deviceIdentityCheckFunction.js";
import { getLocalCtDocs, getOnlineCtDocs } from "./crud.js";




// ─── Main Export ──────────────────────────────────────────────────────────────
export async function deleteOnlineSync(modelsArray) {
  try {
    await deleteFromLocal(modelsArray);
    await deleteFromOnline(modelsArray);
    return { result: true };
  } catch (error) {
    console.error(error?.message);
    throw new Error(error);
  }
}





// ─── Delete from Local (online ne delete kiya, local se hatao) ────────────────
async function deleteFromLocal(modelsArray) {
  try {
    let localChangeTrackModel = getLocalChangeTrackModel();

    // Sirf zaruri fields fetch karo — data transfer minimize
    let allOnlineDeleteCT = await getOnlineCtDocs("delete", { _id: 0, documentId: 1, modelName: 1 })


    if (!allOnlineDeleteCT?.length) return;



    for (let eachCollectionObject of modelsArray) {
      let modelName = eachCollectionObject.local?.modelName;

      let filteredCT = allOnlineDeleteCT.filter(doc => doc.modelName === modelName);
      if (!filteredCT.length) continue;

      let objectIds = filteredCT.map(doc => new mongoose.Types.ObjectId(doc.documentId));


      await eachCollectionObject.local.deleteMany({ _id: { $in: objectIds } })

    }

    // ─── Step 2: Local CT cleanup promise tayar karo ─────────────────────────
    let allStringIds = allOnlineDeleteCT.map(doc => doc.documentId);


    await localChangeTrackModel.deleteMany({ documentId: { $in: allStringIds } })

  } catch (error) {
    throw new Error(error);
  }
}




// ─── Delete from Online (is device ne delete kiya, online se hatao) ───────────
async function deleteFromOnline(modelsArray) {
  try {
    let { deviceId } = await deviceIdentityCheckFunction();
    let localChangeTrackModel = getLocalChangeTrackModel();
    let onlineChangeTrackModel = getOnlineChangeTrackModel();

    // Sirf zaruri fields fetch karo
    let allLocalDeleteCT = await getLocalCtDocs("delete", { _id: 0, documentId: 1, modelName: 1, operationType: 1 })
    if (!allLocalDeleteCT?.length) return;


    for (let eachCollectionObject of modelsArray) {
      let modelName = eachCollectionObject.local?.modelName;

      let modelCT = allLocalDeleteCT.filter(doc => doc.modelName === modelName);
      if (!modelCT.length) continue;

      let docObjectIds = modelCT.map(doc => new mongoose.Types.ObjectId(doc.documentId));
      let docStringIds = modelCT.map(doc => doc.documentId);

      // Step 1: Online se actual documents delete karo
      await eachCollectionObject.online.deleteMany({ _id: { $in: docObjectIds } });

      // Step 2 + 3: Online CT — purani entries hata ke fresh upsert karo
      let onlineCTUpsertOps = modelCT.map(doc => ({
        updateOne: {
          filter: { modelName: doc.modelName, documentId: doc.documentId },
          update: { $set: { ...doc, updatedUsers: [deviceId] } },
          upsert: true,
        },
      }));



      // first delete others to clean ct and then insert only delte ct that other also delete from their loca. 
      await onlineChangeTrackModel.deleteMany({ documentId: { $in: docStringIds } });
      // promises.push(onlineChangeTrackModel.bulkWrite(onlineCTUpsertOps, { ordered: false }));
      await onlineChangeTrackModel.bulkWrite(onlineCTUpsertOps, { ordered: false })

      // Step 4: Local CT clean karo — kaam ho gaya
      await localChangeTrackModel.deleteMany({ documentId: { $in: docStringIds } });
    }




  } catch (error) {
    console.error(error, "The error of delete online sync")
    throw new Error(error);
  }
}





















































// import mongoose from "mongoose";
// import { getLocalChangeTrackModel } from "../../db/localDbConnection.js";
// import { getOnlineChangeTrackModel } from "../../db/onlineDbConnection.js";
// import { deviceIdentityCheckFunction } from "./deviceIdentityCheckFunction.js";

// // ─── Single point of control for chunk size ───────────────────────────────────
// const CHUNK_SIZE = 200;
// // ─────────────────────────────────────────────────────────────────────────────

// // Helper: array ko chunks mein todna
// function chunkArray(array, size) {
//   let chunks = [];
//   for (let i = 0; i < array.length; i += size) {
//     chunks.push(array.slice(i, i + size));
//   }
//   return chunks;
// }




// // ─── Main Export ──────────────────────────────────────────────────────────────
// export async function deleteOnlineSync(modelsArray, loggedInUserData) {
//   try {
//     await deleteFromLocal(modelsArray);
//     await deleteFromOnline(modelsArray);
//     return { result: true };
//   } catch (error) {
//     console.error(error?.message);
//     throw new Error(error);
//   }
// }




// // ─── Delete from Local (online ne delete kiya, local se hatao) ────────────────
// async function deleteFromLocal(modelsArray) {
//   try {
//     let onlineChangeTrackModel = getOnlineChangeTrackModel();
//     let localChangeTrackModel = getLocalChangeTrackModel();

//     // Online se saare delete CT docs ek baar fetch karo
//     let allOnlineDeleteCT = await onlineChangeTrackModel
//       .find({ operationType: "delete" })
//       .lean();

//     if (!allOnlineDeleteCT?.length) return;

//     // Model ke hisaab se IDs group karo
//     // { student: [ObjectId, ObjectId], member: [ObjectId] }
//     let deleteIdsByModel = {};
//     let allStringIds = []; // local CT cleanup ke liye

//     allOnlineDeleteCT.forEach(doc => {
//       if (!deleteIdsByModel[doc.modelName]) {
//         deleteIdsByModel[doc.modelName] = [];
//       }
//       deleteIdsByModel[doc.modelName].push(new mongoose.Types.ObjectId(doc.documentId));
//       allStringIds.push(doc.documentId); // string rakho local CT ke liye
//     });


//     // Har model ke liye chunked delete
//     for (let eachCollectionObject of modelsArray) {
//       let modelName = eachCollectionObject.local?.modelName;
//       let idsToDelete = deleteIdsByModel[modelName];
//       if (!idsToDelete?.length) continue;

//       // Chunks mein delete karo
//       let chunks = chunkArray(idsToDelete, CHUNK_SIZE);
//       for (let chunk of chunks) {
//         await eachCollectionObject.local.deleteMany({ _id: { $in: chunk } });
//       }
//     }


//     // Local CT clean karo — string IDs se
//     let stringIdChunks = chunkArray(allStringIds, CHUNK_SIZE);
//     for (let chunk of stringIdChunks) {
//       await localChangeTrackModel.deleteMany({ documentId: { $in: chunk } });
//     }

//   } catch (error) {
//     throw new Error(error);
//   }
// }




// // ─── Delete from Online (is device ne delete kiya, online se hatao) ───────────
// async function deleteFromOnline(modelsArray) {
//   try {
//     let { deviceId } = await deviceIdentityCheckFunction();
//     let localChangeTrackModel = getLocalChangeTrackModel();
//     let onlineChangeTrackModel = getOnlineChangeTrackModel();

//     // Local se saare delete CT docs ek baar fetch karo
//     let allLocalDeleteCT = await localChangeTrackModel
//       .find({ operationType: "delete" })
//       .lean();

//     if (!allLocalDeleteCT?.length) return;


//     for (let eachCollectionObject of modelsArray) {

//       // Is model ke CT docs filter karo
//       let filteredCT = allLocalDeleteCT.filter(
//         doc => doc?.modelName === eachCollectionObject?.local?.modelName
//       );
//       if (!filteredCT?.length) continue;

//       // ObjectIds — online doc delete ke liye
//       let objectIds = filteredCT.map(doc => new mongoose.Types.ObjectId(doc.documentId));

//       // String IDs — CT operations ke liye
//       let stringIds = filteredCT.map(doc => doc.documentId);


//       // Step 1: Online se documents chunked delete karo
//       let objectIdChunks = chunkArray(objectIds, CHUNK_SIZE);
//       for (let chunk of objectIdChunks) {
//         await eachCollectionObject.online.deleteMany({ _id: { $in: chunk } });
//       }


//       // Step 2: Online CT mein pehle purani entries clean karo (duplicates se bachao)
//       let stringIdChunks = chunkArray(stringIds, CHUNK_SIZE);
//       for (let chunk of stringIdChunks) {
//         await onlineChangeTrackModel.deleteMany({ documentId: { $in: chunk } });
//       }


//       // Step 3: Fresh CT upsert karo — doosre devices ko pata chale ke delete ho gaya
//       let ctOperations = filteredCT.map(doc => ({
//         updateOne: {
//           filter: {
//             modelName: doc.modelName,
//             documentId: doc.documentId
//           },
//           update: {
//             $set: { ...doc, updatedUsers: [deviceId] }
//           },
//           upsert: true,
//         },
//       }));

//       let ctChunks = chunkArray(ctOperations, CHUNK_SIZE);
//       for (let chunk of ctChunks) {
//         await onlineChangeTrackModel.bulkWrite(chunk);
//       }


//       // Step 4: Local CT clean karo — kaam ho gaya
//       for (let chunk of stringIdChunks) {
//         await localChangeTrackModel.deleteMany({ documentId: { $in: chunk } });
//       }

//     }

//   } catch (error) {
//     throw new Error(error);
//   }
// }





























