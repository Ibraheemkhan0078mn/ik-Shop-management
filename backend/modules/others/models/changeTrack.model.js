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
    ]
},
    {
        timestamps: true
    })


export default changeTrackSchema;