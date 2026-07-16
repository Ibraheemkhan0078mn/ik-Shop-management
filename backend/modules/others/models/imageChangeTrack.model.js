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
    },
    // Soft Delete Fields
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null }
},
    {
        timestamps: true
    })







export default imageChangeTrackSchema;


