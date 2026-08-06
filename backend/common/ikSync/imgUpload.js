import cloudinary from '../../configs/cloudinary.js';
import path from 'path'
import fs from 'fs';
import { getLocalImageChangeTrackModel } from "../../configs/connect.db.js";
import os from 'os'
let homeDir = os.homedir()


export async function ImageUpload(modelArray) {
    try {
        let pathToUploadFolder = path.join(homeDir, "AppData", "Local", "SSIB", "uploads");
        let localImageChangeTrackModel = getLocalImageChangeTrackModel()

        console.log("[ImageUpload] Starting image upload sync...");

        let allImageCTDocs = await localImageChangeTrackModel.find()
        if (allImageCTDocs?.length <= 0) {
            console.log("[ImageUpload] No image change tracking documents found");
            return false;
        }

        console.log(`[ImageUpload] Found ${allImageCTDocs.length} image change tracking documents`);

        for (let eachModel of modelArray) {
            // Only process models that have image tracking documents
            let filteredCTBasicOfModel = allImageCTDocs?.filter(doc =>
                doc?.modelName == eachModel?.local?.modelName &&
                doc?.operationType == "create" // Only process create operations
            )

            if (filteredCTBasicOfModel?.length > 0) {
                console.log(`[ImageUpload] Processing ${filteredCTBasicOfModel.length} create operations for ${eachModel.local.modelName}`);
                
                let orgDocs = await eachModel.local.find({ _id: { $in: filteredCTBasicOfModel?.map(doc => doc?.documentId) } })

                if (orgDocs?.length > 0) {
                    for (let doc of orgDocs) {
                        // Determine the image field name based on model
                        let image;
                        if (eachModel.local.modelName == "student" || eachModel.local.modelName == "teacher") {
                            image = doc?.profileImage
                        } else if (eachModel.local.modelName == "qarzaAccount") {
                            image = doc?.qarzaProfileImage
                        } else if (eachModel.local.modelName == "product" || eachModel.local.modelName == "customer" || eachModel.local.modelName == "supplier") {
                            image = doc?.image
                        } else if (eachModel.local.modelName == "staff" || eachModel.local.modelName == "user") {
                            image = doc?.photo
                        }

                        if (image) {
                            let imagePath = path.join(pathToUploadFolder, image);
                            
                            // Check if image file exists locally before uploading
                            if (!fs.existsSync(imagePath)) {
                                console.warn(`[ImageUpload] Image file not found locally: ${imagePath}`);
                                await localImageChangeTrackModel.deleteMany({ documentId: doc._id });
                                continue;
                            }

                            console.log(`[ImageUpload] Uploading image: ${image} for ${eachModel.local.modelName}`);
                            
                            let result = await cloudinary.uploader.upload(imagePath, {
                                folder: `ssib/${eachModel.local.modelName}`
                            })
                            
                            if (result) {
                                await eachModel.local.findOneAndUpdate({ _id: doc._id }, { cloudinaryPublicId: result?.public_id })
                                await localImageChangeTrackModel.deleteMany({ documentId: doc._id })
                                console.log(`[ImageUpload] Successfully uploaded and tracked: ${image}`);
                            }
                        }
                    }
                }
            }
        }

        console.log("[ImageUpload] Image upload sync completed");

    } catch (error) {
        console.error("[ImageUpload] Error:", error.message);
    }
}