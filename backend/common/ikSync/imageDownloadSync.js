import path from "path";
import cloudinary from "../../configs/cloudinary.js";
// import { getLocalProductModel } from "../../db/localDbConnection.js";
import os from "os";
let homeDir = os.homedir()
import fs from "fs";
import { changeTrackDocsCreationFunc } from './changeTrackModelCreation.js'
import mongoose from "mongoose";
// import axios from "axios";






// we have download config and whcih have cloudinary publick url information so this function just do that it extract this cloudirnay publick url.
function getCloudinaryPublicId(url) {
  if (!url) return null;

  try {
    // Remove query params (e.g., ?something=1)
    url = url.split("?")[0];

    // Split at upload/
    let afterUpload = url.split("/upload/")[1];
    if (!afterUpload) return null;

    // Remove known transformation prefixes
    afterUpload = afterUpload
      .replace(/^fl_attachment\/v\d+\//, "") // fl_attachment/v1/...
      .replace(/^v\d+\//, ""); // v123456/...

    // Remove file extension (.jpg, .png, .webp, etc.)
    afterUpload = afterUpload.replace(/\.[a-zA-Z0-9]+$/, "");

    return afterUpload;
  } catch {
    return null;
  }
}




















// image donwload function


export async function imageDownloadSync(modelArray, loggedInUserData) {
  try {

    let localImagePath = path.join(homeDir, "AppData", "Local", "SSIB", "uploads");

    console.log("[imageDownloadSync] Starting image download sync...");

    // Take all models and filter the models only which have images only.
    let allowedModels = modelArray.filter(m => {
      return ["student", "teacher", "qarzaAccount", "product", "customer", "supplier", "staff", "user"].includes(m.local.modelName)
    })

    if (allowedModels?.length == 0) {
      console.log("[imageDownloadSync] No image-enabled models found");
      return;
    }

    console.log(`[imageDownloadSync] Processing ${allowedModels.length} models:`, allowedModels.map(m => m.local.modelName));

    // Running loop on this filtered models
    for (let eachModel of allowedModels) {
      console.log(`[imageDownloadSync] Processing model: ${eachModel.local.modelName}`);

      // this array have all the images info which have cloudinray public id (means synced with cloudinayr) and also related info with it in form of array of objects
      let imagesToDownloadCloudinaryPublicUrl = []

      // Take all docs which have cloundinary public id (means which are already synced. and which have not then it means it was not synced and impossible to recover. and does not have need in download becuase in download we only need the synced downments only)
      let allDocs = await eachModel.local.find({
        cloudinaryPublicId: { $exists: true, $ne: null }
      });

      console.log(`[imageDownloadSync] Found ${allDocs.length} docs with cloudinaryPublicId for ${eachModel.local.modelName}`);

      // checking each image is already present local and if not then push it in array
      for (let doc of allDocs) {
        let imageField = null;
        
        // Determine the image field name based on model
        if (eachModel.local.modelName == "student" || eachModel.local.modelName == "teacher") {
          imageField = "profileImage";
        } else if (eachModel.local.modelName == "qarzaAccount") {
          imageField = "qarzaProfileImage";
        } else if (eachModel.local.modelName == "product" || eachModel.local.modelName == "customer" || eachModel.local.modelName == "supplier") {
          imageField = "image";
        } else if (eachModel.local.modelName == "staff" || eachModel.local.modelName == "user") {
          imageField = "photo";
        }
        
        // Skip if the image field is null/undefined
        if (!doc?.[imageField]) continue;

        (!fs.existsSync(path.join(localImagePath, doc[imageField]))) &&
          imagesToDownloadCloudinaryPublicUrl.push({
            cloudinaryPublicId: doc?.cloudinaryPublicId,
            localImageName: doc[imageField],
            documentId: doc._id
          });
      }

      console.log(`[imageDownloadSync] Found ${imagesToDownloadCloudinaryPublicUrl.length} missing images to download for ${eachModel.local.modelName}`);

      if (imagesToDownloadCloudinaryPublicUrl?.length > 0) {

        // Running loop on all the data which are sync but not present in local.
        for (let obj of imagesToDownloadCloudinaryPublicUrl) {

          // ✅ Extra guard just in case
          if (!obj.localImageName || !obj.cloudinaryPublicId) {
            console.warn("[imageDownloadSync] Skipping entry with missing localImageName or cloudinaryPublicId:", obj);
            continue;
          }

          console.log(`[imageDownloadSync] Downloading image: ${obj.localImageName} from Cloudinary`);

          // we define cloudinary configuraton which also have cloudinary public id in it.
          const downloadUrl = cloudinary.url(obj.cloudinaryPublicId, {
            secure: true,
            format: "jpg",
            flags: "attachment",
          });

          // Fetch the image, convert to buffer and get the buffer of image in response.
          let response;
          try {
            const res = await fetch(downloadUrl);
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

            // Get the data as an ArrayBuffer (like axios responseType: 'arraybuffer')
            const data = await res.arrayBuffer();

            response = { data: Buffer.from(data) };

          } catch (error) {
            console.error(`[imageDownloadSync] Error fetching image ${obj.localImageName}:`, error.message);
            continue;
          }

          // Full path of image in local, save the image with the help of buffer
          if (response?.data) {
            try {
              fs.mkdirSync(localImagePath, { recursive: true });

              let savePath = path.join(localImagePath, obj.localImageName);
              fs.writeFileSync(savePath, response.data);

              let updatedDocument = await eachModel.local.findOne(
                { _id: new mongoose.Types.ObjectId(obj.documentId) }
              );
              if (updatedDocument) {
                // The cloudinaryPublicId is already correct, just ensure it's set
                if (!updatedDocument.cloudinaryPublicId) {
                  updatedDocument.cloudinaryPublicId = obj.cloudinaryPublicId;
                  await updatedDocument.save();
                }
                console.log(`[imageDownloadSync] Successfully downloaded: ${obj.localImageName}`);
              }
            } catch (error) {
              console.error(`[imageDownloadSync] Error saving image ${obj.localImageName}:`, error.message);
            }
          }
        }
      }
    }

    console.log("[imageDownloadSync] Image download sync completed");

  } catch (error) {
    console.error("[imageDownloadSync] Error:", error.message);
  }
}







 




















