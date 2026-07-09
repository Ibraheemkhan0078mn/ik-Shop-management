









import mongoose from "mongoose";
import { getLocalChangeTrackModel } from "../../db/localDbConnection.js";
import { getOnlineChangeTrackModel } from "../../db/onlineDbConnection.js";
import { deviceIdentityCheckFunction } from "./deviceIdentityCheckFunction.js";

// ─── Single point of control for chunk size ───────────────────────────────────
const CHUNK_SIZE = 1000;
// ─────────────────────────────────────────────────────────────────────────────

// Helper: array ko chunks mein todna
function chunkArray(array, size) {
  let chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}




// ─── Main Export ──────────────────────────────────────────────────────────────
export async function downloadOnlineSync(modelsArray, downloadType = "required", loggedInUserData) {
  try {

    if (downloadType == "all") {
      await allDownload(modelsArray, loggedInUserData);
    } else {
      await requiredDownload(modelsArray, loggedInUserData);
    }

    return { result: true };

  } catch (error) {
    console.error("❌ Download sync failed:", error);
    return { result: false, error: error?.message };
  }
}




// ─── All Download ─────────────────────────────────────────────────────────────
// Jab downloadType = "all" — online se sab docs local mein upsert karo
async function allDownload(modelsArray, loggedInUserData) {
  try {

    // console.debug("All download started")
    let isAdmin = loggedInUserData?.role == "admin";
    let allowedClasses = loggedInUserData?.allowedClases || [];

    for (let eachCollectionObject of modelsArray) {

      let modelName = eachCollectionObject?.local?.modelName;
      let allDocs = [];

      // Admin ko sab milega, non-admin ko sirf allowed data
      if (isAdmin) {
        allDocs = await eachCollectionObject?.online.find().lean();
      } else {
        if (modelName == "class") {
          // Sirf allowed classes download karo
          allDocs = await eachCollectionObject?.online.find({
            _id: { $in: allowedClasses }
          }).lean();
        } else if (modelName == "student") {
          // Sirf allowed classes ke students download karo
          allDocs = await eachCollectionObject?.online.find({
            classId: { $in: allowedClasses }
          }).lean();
        } else {
          allDocs = await eachCollectionObject?.online.find().lean();
        }
      }

      if (!allDocs?.length) continue;

      // Chunked bulkWrite local mein
      let chunks = chunkArray(allDocs, CHUNK_SIZE);
      for (let chunk of chunks) {
        // let operations = chunk.map(eachDoc => ({
        //   updateOne: {
        //     filter: { _id: eachDoc._id },
        //     update: { $set: eachDoc },
        //     upsert: true,
        //   },
        // }));
        // let operations = chunk.map(eachDoc => {
        //   const { _id, ...rest } = eachDoc;  // _id alag karo
        //   return {
        //     updateOne: {
        //       filter: { _id },
        //       update: { $set: rest },    // _id ke baghair set karo
        //       upsert: true,
        //     },
        //   };
        // });
        // await eachCollectionObject?.local?.bulkWrite(operations);
        let operations = chunk.map(eachDoc => {
          const { _id, ...rest } = eachDoc;
          return {
            updateOne: {
              filter: { _id },
              update: { $set: rest },
              upsert: true,
            },
          };
        });
        await eachCollectionObject?.local?.bulkWrite(operations, { ordered: false });
      }

    }

  } catch (error) {
    throw new Error(error);
  }
}




// ─── Required Download ────────────────────────────────────────────────────────
// Jab downloadType = "required" — sirf CT wale changed docs download karo
async function requiredDownload(modelsArray, loggedInUserData) {
  try {

    console.debug("require download starts")
    let localChangeTrackModel = getLocalChangeTrackModel();
    let onlineChangeTrackModel = getOnlineChangeTrackModel();
    let { deviceId } = await deviceIdentityCheckFunction();

    let isAdmin = loggedInUserData?.role == "admin";
    let allowedClasses = loggedInUserData?.allowedClases || [];

    // Online se sare CT docs ek baar fetch karo
    let allOnlineCTDocs = await onlineChangeTrackModel.find().lean();
    if (!allOnlineCTDocs?.length) return;

    for (let eachCollectionObject of modelsArray) {

      let modelName = eachCollectionObject?.local?.modelName;

      // Is model ke CT docs filter karo — sirf jo is device ne abhi tak nahi dekhe
      let filteredCT = allOnlineCTDocs.filter(eachDoc =>
        eachDoc?.modelName == modelName &&
        !eachDoc.updatedUsers?.includes(deviceId)
      );
      if (!filteredCT?.length) continue;

      // CT se changed doc IDs nikalo
      let changedDocsIds = filteredCT
        .map(eachDoc => new mongoose.Types.ObjectId(eachDoc.documentId))
        .filter(id => id != null);

      // Non-admin ke liye class aur student filter karo
      if (!isAdmin) {
        if (modelName == "class" && allowedClasses?.length > 0) {
          // Sirf allowed classes ka data lo
          changedDocsIds = changedDocsIds.filter(id =>
            allowedClasses.some(ac => ac?.toString() == id?.toString())
          );
        } else if (modelName == "student" && allowedClasses?.length > 0) {
          // Student ke liye online se fetch karke classId check karo
          let studentDocs = await eachCollectionObject.online.find({
            _id: { $in: changedDocsIds }
          }).lean();
          changedDocsIds = studentDocs
            .filter(doc => allowedClasses.some(ac => ac?.toString() == doc?.classId?.toString()))
            .map(doc => doc._id);
        }
      }

      if (!changedDocsIds?.length) continue;

      // Online se original docs fetch karo
      let orgDocs = await eachCollectionObject.online.find({
        _id: { $in: changedDocsIds }
      }).lean();
      if (!orgDocs?.length) continue;


      // Step 1: Local mein chunked upsert karo
      let docChunks = chunkArray(orgDocs, CHUNK_SIZE);
      for (let chunk of docChunks) {
        let operations = chunk.map(eachDoc => ({
          updateOne: {
            filter: { _id: eachDoc._id },
            update: { $set: eachDoc },
            upsert: true,
          },
        }));
        await eachCollectionObject?.local?.bulkWrite(operations, { ordered: false });
      }


      // Step 2: Online CT mein is device ko updatedUsers mein replace karo
      // Agar throw nahi kiya toh success — count check ki zaroorat nahi
      let ctChunks = chunkArray(filteredCT, CHUNK_SIZE);
      for (let chunk of ctChunks) {
        let ctOperations = chunk.map(eachDoc => ({
          updateOne: {
            filter: { _id: eachDoc._id },
            update: {
              $set: {
                ...eachDoc,
                updatedUsers: [deviceId],
              },
            },
            upsert: true,
          },
        }));
        await onlineChangeTrackModel?.bulkWrite(ctOperations);
      }

    }

  } catch (error) {
    throw new Error(error);
  }
}





