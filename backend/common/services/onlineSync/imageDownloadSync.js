import path from "path";
import cloudinary from "../../config/cloudinary.js";
// import { getLocalProductModel } from "../../db/localDbConnection.js";
import os from "os";
let homeDir = os.homedir()
import fs from "fs";
import { changeTrackDocsCreationFunc } from '../onlineSync/changeTrackModelCreation.js'
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


    // Take all models and filter the models only which have images only.
    let allowedModels = modelArray.filter(m => {
      return ["student", "member", "qarzaAccount"].includes(m.local.modelName)
    })




    if (allowedModels?.length == 0) {
      throw new Error("Allowed model is not found.")
    }















    // Running loop on this filtered models
    for (let eachModel of allowedModels) {

      // this array have all the images info which have cloudinray public id (means synced with cloudinayr) and also related info with it in form of array of objects
      let imagesToDownloadCloudinaryPublicUrl = []

      // Take all docs which have cloundinary public id (means which are already synced. and which have not then it means it was not synced and impossible to recover. and does not have need in download becuase in download we only need the synced downments only)
      let allDocs = await eachModel.local.find({
        cloudinaryPublicId: { $exists: true, $ne: null }
      });



      // checking each image is already present local and if not then push it in array for tracking purpose.
      // for (let doc of allDocs) {
      //   // let image;
      //   if (eachModel.local.modelName == "student" || eachModel.local.modelName == "member") {
      //     (!fs.existsSync(path.join(localImagePath, doc?.profileImage))) && imagesToDownloadCloudinaryPublicUrl.push({ cloudinaryPublicId: doc?.cloudinaryPublicId, localImageName: doc?.profileImage, documentId: doc._id })
      //   } else if (eachModel.local.modelName == "qarzaAccount") {
      //     (!fs.existsSync(path.join(localImagePath, doc?.qarzaProfileImage))) && imagesToDownloadCloudinaryPublicUrl.push({ cloudinaryPublicId: doc?.cloudinaryPublicId, localImageName: doc?.qarzaProfileImage, documentId: doc._id })
      //   }
      // }


      // checking each image is already present local and if not then push it in array
      for (let doc of allDocs) {
        if (eachModel.local.modelName == "student" || eachModel.local.modelName == "member") {
          // ✅ Guard: skip if profileImage is null/undefined
          if (!doc?.profileImage) continue;

          (!fs.existsSync(path.join(localImagePath, doc.profileImage))) &&
            imagesToDownloadCloudinaryPublicUrl.push({
              cloudinaryPublicId: doc?.cloudinaryPublicId,
              localImageName: doc.profileImage,
              documentId: doc._id
            });

        } else if (eachModel.local.modelName == "qarzaAccount") {
          // ✅ Guard: skip if qarzaProfileImage is null/undefined
          if (!doc?.qarzaProfileImage) continue;

          (!fs.existsSync(path.join(localImagePath, doc.qarzaProfileImage))) &&
            imagesToDownloadCloudinaryPublicUrl.push({
              cloudinaryPublicId: doc?.cloudinaryPublicId,
              localImageName: doc.qarzaProfileImage,
              documentId: doc._id
            });
        }
      }












      if (imagesToDownloadCloudinaryPublicUrl?.length > 0) {

        // Running loop on all the data which are sync but not present in local.
        for (let obj of imagesToDownloadCloudinaryPublicUrl) {

          // ✅ Extra guard just in case
          if (!obj.localImageName || !obj.cloudinaryPublicId) {
            console.warn("Skipping entry with missing localImageName or cloudinaryPublicId:", obj);
            continue;
          }



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
            throw new Error("error in fetch", error?.message)
          }



          // Full path of image in local, save the image with the help of buffer, take public id of cloudinary with helper function and update the original doc with this new cloudinary id. 
          if (response?.data) {
            // const filename = Date.now() + ".jpg";
            fs.mkdirSync(localImagePath, { recursive: true });

            let savePath = path.join(localImagePath, obj.localImageName);
            fs.writeFileSync(savePath, response.data);

            let publicIdFromUrl = getCloudinaryPublicId(downloadUrl);

            let updatedDocument = await eachModel.local.findOne(
              { _id: new mongoose.Types.ObjectId(obj.documentId) }
            );
            updatedDocument.cloudinaryPublicId = publicIdFromUrl
            await updatedDocument.save()
            await changeTrackDocsCreationFunc("update", eachModel.local.modelName, updatedDocument._id)
          }









        }




      }


    }






  } catch (error) {
    console.error(error)
    // throw new Error(error?.message, error.stack)
  }



}







 




















