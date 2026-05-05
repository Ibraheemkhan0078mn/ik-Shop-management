import { getLocalChangeTrackModel, getLocalDeviceIdentityModel } from "../../db/localDbConnection.js";
import { getOnlineChangeTrackModel } from "../../db/onlineDbConnection.js";
import { deviceIdentityCheckFunction } from "./deviceIdentityCheckFunction.js";




export async function onlineDocsUploadSyncInsert(modelsArray, uploadType = "required", loggedInUserData) {
  try {


    if (uploadType == "all") {
      await allInsertUpload(modelsArray)
    }
    else {
      await requiredInserUpload(modelsArray)
    }



  } catch (error) {
    console.log(error?.message || error?.stack)
  }
}












export async function onlineDocsUploadSyncUpdate(modelsArray, uploadType = "required", loggedInUserData) {
  try {


    if (uploadType == "all") {
      await allUpdateUpload(modelsArray)
    }
    else {
      await requiredUpdateUpload(modelsArray)
    }


  } catch (error) {
    console.log(error?.message || error?.stack)
  }
}






























async function allInsertUpload(modelsArray) {
  try {

    let localChangeTrackModel = getLocalChangeTrackModel()



    for (let eachModel of modelsArray) {



      // check if permittted then only running otherwise not intterate on another and again check and so on...
      // let userPermissions = loggedInUserData?.permissions
      // if (userPermissions && userPermissions?.length > 0) {
      //   if (!(userPermissions?.includes(eachModel.permissionString)) && loggedInUserData?.role != "admin") {
      //     continue;
      //   }
      // }



      // take all document directly from model and make operation on the basis of it.
      let orgDocs = await eachModel?.local.find()
      let operations = orgDocs.map((eachDoc) => {
        return {
          updateOne: {
            filter: { _id: eachDoc._id },
            update: { $set: eachDoc },
            upsert: true,
          },
        };
      });



      let allUploadResult = await eachModel?.online?.bulkWrite(operations)
      // we remove the other change track becuase its total upload and in thsi we does not manage the thigns with the help fo change track so deleting the change track is not neccessary. 
      // but in the future if uplaod this then the data which is already uplaod will be removed from cahnge track which is cleaning fucntion type


      if (
        allUploadResult?.insertedCount +
        allUploadResult?.modifiedCount +
        allUploadResult?.deletedCount +
        allUploadResult?.upsertedCount >=
        operations?.length
      ) {
        await localChangeTrackModel.deleteMany({ documentId: { $in: orgDocs?.map(doc => doc?._id?.toString()) }, modelName: eachModel?.local?.modelName })
      }



    }



  } catch (error) {
    throw new Error(error)
  }
}





async function requiredInserUpload(modelsArray) {
  try {
    let localChangeTrackModel = getLocalChangeTrackModel()
    let onlineChangeTrackModel = getOnlineChangeTrackModel()
    let { deviceId } = await deviceIdentityCheckFunction()



    let createOperationsChangeTrackDocs = await localChangeTrackModel.find({ operationType: "create" })
    if (createOperationsChangeTrackDocs?.length > 0) {


      for (let eachModel of modelsArray) {

        // filtered cureent running model in this loop. find original docs on the basis of this ct. make operation on it. do bulk writes
        let orgDocsIds = createOperationsChangeTrackDocs
          .filter(doc => { return doc?.modelName == eachModel?.online?.modelName })
          .map(doc => doc?.documentId)
          .filter(doc => doc != null)

        // console.log(orgDocsIds, "Filtered change track docs")

        let orgDocs = await eachModel?.local.find({ _id: { $in: orgDocsIds } })
        console.log("The ord docuemnt", orgDocs)
        let operations = orgDocs.map((eachDoc) => {
          return {
            updateOne: {
              filter: { _id: eachDoc._id },
              update: { $set: eachDoc },
              upsert: true,
            },
          };
        });



        let insertBulkWriteResult = await eachModel?.online?.bulkWrite(operations)



        if (insertBulkWriteResult) {




          let filteredChangeTrackDocOnModel = createOperationsChangeTrackDocs.filter(doc => { return doc?.modelName == eachModel?.online?.modelName })

          let changeTrackUpdateOperation = filteredChangeTrackDocOnModel.map(
            (eachDoc) => {
              return {
                updateOne: {
                  filter: { _id: eachDoc._id }, // find by _id
                  update: {
                    $set: { ...eachDoc?.toObject(), updatedUsers: [deviceId], },
                  }, // update with the new data
                  upsert: true, // insert if not exists
                },
              };
            }
          );

          let changeTrackOnlineBulkWriteResult = await onlineChangeTrackModel?.bulkWrite(changeTrackUpdateOperation);


          if (changeTrackOnlineBulkWriteResult?.insertedCount +
            changeTrackOnlineBulkWriteResult?.modifiedCount +
            changeTrackOnlineBulkWriteResult?.deletedCount +
            changeTrackOnlineBulkWriteResult?.upsertedCount >=
            changeTrackUpdateOperation?.length
            &&
            insertBulkWriteResult?.insertedCount +
            insertBulkWriteResult?.modifiedCount +
            insertBulkWriteResult?.deletedCount +
            insertBulkWriteResult?.upsertedCount >=
            operations?.length
          ) {

            await localChangeTrackModel.deleteMany({ _id: { $in: filteredChangeTrackDocOnModel?.map(doc => doc?._id) } })

          }


        }



      }
    }
  } catch (error) {
    throw new Error(error)
  }
}






async function allUpdateUpload(modelsArray) {
  try {
    let localChangeTrackModel = getLocalChangeTrackModel()


    for (let eachModel of modelsArray) {

      // take all from current local model. make the operations and upload in atlas wiht bulk writes
      let orgDocs = await eachModel?.local.find()
      let operations = orgDocs.map((eachDoc) => {
        return {
          updateOne: {
            filter: { _id: eachDoc._id }, // find by _id
            update: { $set: eachDoc }, // update with the new data
            upsert: true, // insert if not exists
          },
        };
      });

      let updateAllBulkWritesResult = await eachModel?.online?.bulkWrite(operations)
      // we remove the other change track becuase its total upload and in thsi we does not manage the thigns with the help fo change track so deleting the change track is not neccessary. 
      // but in the future if uplaod this then the data which is already uplaod will be removed from cahnge track which is cleaning fucntion type
      if (
        updateAllBulkWritesResult?.insertedCount +
        updateAllBulkWritesResult?.modifiedCount +
        updateAllBulkWritesResult?.deletedCount +
        updateAllBulkWritesResult?.upsertedCount >=
        operations?.length
      ) {
        await localChangeTrackModel.deleteMany({ documentId: { $in: orgDocs?.map(doc => doc?._id?.toString()) }, modelName: eachModel?.local?.modelName })
      }

    }



  } catch (error) {
    throw new Error(error)
  }
}





async function requiredUpdateUpload(modelsArray) {
  try {


    let localChangeTrackModel = getLocalChangeTrackModel()
    let onlineChangeTrackModel = getOnlineChangeTrackModel()
    let { deviceId } = await deviceIdentityCheckFunction()



    // TAKE ALL LOCAL CHANGE TRACK MODELS WITH OPERATION TYPE "UPDATE"
    let createOperationsChangeTrackDocs = await localChangeTrackModel.find({ operationType: "update" })



    if (createOperationsChangeTrackDocs?.length > 0) {

      for (let eachModel of modelsArray) {


        // FILTER ACCORDING TO MODEL
        let filteredChangeTrackDocOnModel = createOperationsChangeTrackDocs?.filter(doc => {
          return doc?.modelName == eachModel?.online?.modelName
        })
        // TAKE ORIGINAL DOCS WITH THE HELP OF CT
        let orgDocs = await eachModel?.local.find({ _id: { $in: filteredChangeTrackDocOnModel?.map(doc => doc?.documentId) } })
        // MALE OPERATIONS FOR IT.
        let operations = orgDocs.map((eachDoc) => {
          return {
            updateOne: {
              // filter: { _id: eachDoc._id }, // find by _id
              filter: {
                _id: eachDoc._id,
                updatedAt: { $lt: eachDoc.updatedAt }
              },
              update: { $set: eachDoc }, // update with the new data
              upsert: false, // insert if not exists
            },
          };
        });


        // BULK WRITES UPDATE OF UPDATED DOCS
        let updateBulkWriteResult = await eachModel?.online?.bulkWrite(operations)


        if (updateBulkWriteResult) {


          // IF PARTIAL TRACES OF DONE THEN ALSO UPLOAD CHANGE TRACK OF LOCAL IN ATLAS
          let changeTrackUpdateOperation = filteredChangeTrackDocOnModel.map(
            (eachDoc) => {
              return {
                updateOne: {
                  filter: { _id: eachDoc._id }, // find by _id
                  update: {
                    $set: {
                      ...eachDoc?.toObject(),
                      updatedUsers: [deviceId],
                    },
                  }, // update with the new data
                  upsert: true, // insert if not exists
                },
              };
            }
          );

          let changeTrackOnlineBulkWriteResult = await onlineChangeTrackModel?.bulkWrite(changeTrackUpdateOperation);


          // NOW CHECK IF CHANGE TRACK UPLOADATION IN ATLAS AND OTHER DOCS IS COMPLETELY DONE 
          // AND NO LITTLE THING IS REMAINING THEN DELETE CT FROM LOCAL
          if (changeTrackOnlineBulkWriteResult?.insertedCount +
            changeTrackOnlineBulkWriteResult?.modifiedCount +
            changeTrackOnlineBulkWriteResult?.deletedCount +
            changeTrackOnlineBulkWriteResult?.upsertedCount >=
            changeTrackUpdateOperation?.length
            &&
            updateBulkWriteResult?.insertedCount +
            updateBulkWriteResult?.modifiedCount +
            updateBulkWriteResult?.deletedCount +
            updateBulkWriteResult?.upsertedCount >=
            operations?.length
          ) {

            await localChangeTrackModel.deleteMany({ _id: { $in: filteredChangeTrackDocOnModel?.map(doc => doc?._id) } })

          }


        }



      }
    }

  } catch (error) {
    throw new Error(error)
  }
}