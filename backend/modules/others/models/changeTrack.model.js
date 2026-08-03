import mongoose from 'mongoose'

const changeTrackSchema = new mongoose.Schema({
    documentId: {
        type: String
    },
    modelName: {
        type: String
    },
    operationType: {
        type: String
    },
    updatedUsers: [
        {
            type: String
        }
    ],
    // Soft Delete Fields
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null }
},
    {
        timestamps: true
    })


export default changeTrackSchema;