import cloudinary from "../../configs/cloudinary.js"
import { getLocalImageChangeTrackModel } from "../../configs/connect.db.js"
import path from 'path'

export async function imgDelete(modelArray) {
    try {
        let localImageCTModel = getLocalImageChangeTrackModel()
        console.log("[imgDelete] Starting image deletion sync...");

        for (let eachModel of modelArray) {
            let toDeleteImageCT = await localImageCTModel.find({ 
                operationType: "delete", 
                modelName: eachModel?.local?.modelName 
            })
            
            if (toDeleteImageCT?.length > 0) {
                console.log(`[imgDelete] Processing ${toDeleteImageCT.length} delete operations for ${eachModel.local.modelName}`);
                
                for (let eachCT of toDeleteImageCT) {
                    if (eachCT?.cloudinaryPublicId) {
                        console.log(`[imgDelete] Deleting image from Cloudinary: ${eachCT.cloudinaryPublicId}`);
                        let result = await cloudinary.uploader.destroy(eachCT?.cloudinaryPublicId)
                        
                        if (result?.result === "ok" || result?.result === "not found") {
                            await localImageCTModel.findOneAndDelete({ _id: eachCT._id })
                            console.log(`[imgDelete] Successfully deleted tracking document for ${eachCT.cloudinaryPublicId}`);
                        } else {
                            console.warn(`[imgDelete] Cloudinary deletion failed: ${result?.result}`);
                        }
                    } else {
                        console.warn(`[imgDelete] No cloudinaryPublicId found in tracking document, removing it`);
                        await localImageCTModel.findOneAndDelete({ _id: eachCT._id });
                    }
                }
            }
        }

        console.log("[imgDelete] Image deletion sync completed");

    } catch (error) {
        console.error("[imgDelete] Error:", error?.message);
    }
}