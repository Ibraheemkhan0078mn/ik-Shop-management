import cloudinary from '../../config/cloudinary.js';
import path from 'path'
import { getLocalImageChangeTrackModel } from "../../db/localDbConnection.js";
import os from 'os'
let homeDir = os.homedir()


export async function ImageUpload(modelArray) {
    try {
        let pathToUploadFolder = path.join(homeDir, "AppData", "Local", "SSIB", "uploads");
        let localImageChangeTrackModel = getLocalImageChangeTrackModel()



        let allImageCTDocs = await localImageChangeTrackModel.find()
        if (allImageCTDocs?.length <= 0) {
            return false;
        }

        // console.log(allImageCTDocs, "Image ct docs")


        for (let eachModel of modelArray) {



            let filteredCTBasicOfModel = allImageCTDocs?.filter(doc =>
                doc?.modelName == eachModel?.local?.modelName
            )
            // console.log(filteredCTBasicOfModel, "Filted ct docs")

            if (filteredCTBasicOfModel?.length > 0) {
                let orgDocs = await eachModel.local.find({ _id: { $in: filteredCTBasicOfModel?.map(doc => doc?.documentId) } })

                // console.log(orgDocs, "original docs")


                if (orgDocs?.length > 0) {
                    for (let doc of orgDocs) {


                        // The images are stored on different names in each docs thats why i also store in it.
                        let image;
                        if (eachModel.local.modelName == "student" || eachModel.local.modelName == "teacher") {
                            image = doc?.profileImage
                        } else if (eachModel.local.modelName == "qarzaAccount") {
                            image = doc?.qarzaProfileImage
                        }
                        // }

                        // console.log(doc, "THe document")
                        if (image) {
                            // console.log(image)
                            let result = await cloudinary.uploader.upload(path.join(pathToUploadFolder, image), {
                                folder: `ssib/${eachModel.local.modelName}`
                            })
                            // console.log(result, "The cloudinary updalod result")
                            if (result) {
                                await eachModel.local.findOneAndUpdate({ _id: doc._id }, { cloudinaryPublicId: result?.public_id })
                                await localImageChangeTrackModel.deleteMany({ documentId: doc._id })
                            }
                        }

                    }
                }



            }






        }

    } catch (error) {
        console.log(error)
    }
}