import mongoose from "mongoose";




const imageChangeTrackSchema = new mongoose.Schema({
    documentId: {
        type: String
    },
    modelName: {
        type: String
    },
    operationType: {
        type: String
    },
    updatedDevices: [
        {
            type: String
        }
    ],
    cloudinaryPublicId:{
        type:String
    }
},
    {
        timestamps: true
    })







export default imageChangeTrackSchema;


