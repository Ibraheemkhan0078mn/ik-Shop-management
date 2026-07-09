import cloudinary from "../../config/cloudinary.js"
import { getLocalImageChangeTrackModel } from "../../db/localDbConnection.js"
import path from 'path'

export async function imgDelete(modelArray) {
    try {

        let localImageCTModel = getLocalImageChangeTrackModel()




        for (let eachModel of modelArray) {
            let toDeleteImageCT = await localImageCTModel.find({ operationType: "delete", modelName: eachModel?.local?.modelName })
            if (toDeleteImageCT?.length > 0) {
                for (let eachCT of toDeleteImageCT) {
                    let result = await cloudinary.uploader.destroy(eachCT?.cloudinaryPublicId)
                    if (result) {
                        await localImageCTModel.findOneAndDelete({ _id: eachCT._id })
                    }
                }

            }
        }

    } catch (error) {
        console.error(error?.message, "error catch")
    }
}