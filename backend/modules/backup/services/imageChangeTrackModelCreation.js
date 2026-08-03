import { getLocalImageChangeTrackModel } from "../../configs/connect.db.js";

export async function imageChangeTrackDocsCreation(
    operation,
    modelName,
    documentId,
    cloudinaryPublicId
) {
    try {

        // console.log(operation, modelName, documentId)

        // Take values opreration (create, update, delete), 
        // modelName means which models have done the operation and 
        // documentId means which documentId is need to sync and 
        // when there is delete ooperation then we also send the cloudinary publicid which we also attack with it which help to clean the deleted image from cloudinary

        if (!operation || !modelName || !documentId) {
            return;
        }

        let imageChangeTrackModel = getLocalImageChangeTrackModel()


        // console.log((operation == "delete") && (!cloudinaryPublicId), operation, cloudinaryPublicId, documentId)
        if ((operation == "delete") && (!cloudinaryPublicId)) {
            await imageChangeTrackModel?.deleteMany({ documentId: documentId?.toString() })
            return;
        }





        let createdImageChangeTrackDocs = await imageChangeTrackModel.create({
            documentId,
            operationType: operation,
            modelName,
            cloudinaryPublicId: operation == "delete" && cloudinaryPublicId || null
        })










    } catch (error) {
        console.log(error);
    }
}
