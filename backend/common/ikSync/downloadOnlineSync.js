import mongoose from "mongoose";
import { getLocalChangeTrackModel } from "../../db/localDbConnection.js";
import { getOnlineChangeTrackModel } from "../../db/onlineDbConnection.js";
import { deviceIdentityCheckFunction } from "./deviceIdentityCheckFunction.js";

export async function downloadOnlineSync(
  modelsArray,
  downloadType = "required",
  loggedInUserData
) {
  try {
    let changeTrackModel = getLocalChangeTrackModel();
    let onlineChangeTrackModel = getOnlineChangeTrackModel();
    let { deviceId } = await deviceIdentityCheckFunction();

    if (downloadType == "all") {
      for (let eachCollectionObject of modelsArray) {


        // check if permittted then only running otherwise not intterate on another and again check and so on...
        let userPermissions = loggedInUserData?.permissions
        if (userPermissions && userPermissions?.length > 0) {
          if (!(userPermissions?.includes(eachCollectionObject.permissionString)) && loggedInUserData?.role != "admin") {
            continue;
          }
        }

        let allowedClassedToUser = loggedInUserData?.allowedClases

        let allDocOfCollection = []
        if (loggedInUserData.role == "admin") {
          allDocOfCollection = await eachCollectionObject?.online.find().lean();
        } else {

          if (loggedInUserData && eachCollectionObject?.local?.modelName == "class") {
            allDocOfCollection = await eachCollectionObject?.online.find({ _id: { $in: allowedClassedToUser } }).lean();
          }
          else if (loggedInUserData && eachCollectionObject?.local?.modelName == "student") {
            allDocOfCollection = await eachCollectionObject?.online.find({ classId: { $in: allowedClassedToUser } }).lean();
          }
          else {
            allDocOfCollection = await eachCollectionObject?.online.find().lean();
          }

        }









        let operations = allDocOfCollection.map((eachDoc) => {
          return {
            updateOne: {
              filter: { _id: eachDoc._id }, // find by _id
              update: { $set: eachDoc }, // update with the new data
              upsert: true, // insert if not exists
            },
          };
        });

        if (eachCollectionObject?.local && operations?.length > 0) {
          let bulkWritesResult = await eachCollectionObject?.local?.bulkWrite(
            operations
          );

          if (bulkWritesResult) {
            if (
              bulkWritesResult.insertedCount +
              bulkWritesResult.modifiedCount +
              bulkWritesResult.deletedCount +
              bulkWritesResult.upsertedCount >=
              operations?.length
            ) {

            }
          }
        }
      }
    } else {
      let allChangeTrackDocs = await onlineChangeTrackModel.find();

      for (let eachCollectionObject of modelsArray) {


        // check if permittted then only running otherwise not intterate on another and again check and so on...
        let userPermissions = loggedInUserData?.permissions
        if (userPermissions && userPermissions?.length > 0) {
          if (!(userPermissions?.includes(eachCollectionObject.permissionString)) && loggedInUserData?.role != "admin") {
            continue;
          }
        }






        let filteredChangeTrackDocs = allChangeTrackDocs?.filter((eachDoc) => {
          if (
            eachDoc?.modelName == eachCollectionObject?.local?.modelName &&
            !eachDoc.updatedUsers?.includes(deviceId)
          ) {
            return true;
          }
        });

        let changedDocsIds = filteredChangeTrackDocs.map((eachDoc) => {
          return new mongoose.Types.ObjectId(eachDoc.documentId);
        });





        // Filter the docs which are not allowed to current logged in users
        let allowedClasses = loggedInUserData?.allowedClases || []
        if (changedDocsIds?.length > 0 && allowedClasses?.length > 0 && loggedInUserData && eachCollectionObject.local.modelName == "class") {
          changedDocsIds = changedDocsIds.filter(dId => allowedClasses?.includes(dId))
        } else if (changedDocsIds?.length > 0 && allowedClasses?.length > 0 && loggedInUserData && eachCollectionObject.local.modelName == "student") {
          changedDocsIds = changedDocsIds.filter(dId => allowedClasses?.includes(dId?.classId))
        }




        let orgDocs = await eachCollectionObject.online.find({
          _id: { $in: changedDocsIds }
        });



        let operations = orgDocs.map((eachDoc) => {
          return {
            updateOne: {
              filter: { _id: eachDoc._id }, // find by _id
              update: { $set: eachDoc }, // update with the new data
              upsert: true, // insert if not exists
            },
          };
        });

        if (eachCollectionObject?.local && operations?.length > 0) {
          let bulkWritesResult = await eachCollectionObject?.local?.bulkWrite(
            operations
          );

          if (bulkWritesResult) {
            // let { insertedCount, modifiedCount, deletedCount, upsertedCount } =
            //   bulkWritesResult;
            if (
              bulkWritesResult.insertedCount +
              bulkWritesResult.modifiedCount +
              bulkWritesResult.deletedCount +
              bulkWritesResult.upsertedCount >=
              operations?.length
            ) {
              let changeTrackUpdateOperation = filteredChangeTrackDocs.map(
                (eachDoc) => {
                  return {
                    updateOne: {
                      filter: { _id: eachDoc._id }, // find by _id
                      update: {
                        $set: {
                          ...eachDoc?.toObject(),
                          updatedUsers: [...eachDoc?.updatedUsers, deviceId],
                        },
                      }, // update with the new data
                      upsert: true, // insert if not exists
                    },
                  };
                }
              );

              await onlineChangeTrackModel?.bulkWrite(
                changeTrackUpdateOperation
              );
            }
          }
        }
      }
    }

    return { result: true };
  } catch (error) {
    console.error("❌ Atlas upload sync failed:", error);
    return { result: false, error: error?.message };
  }
}
