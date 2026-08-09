import mongoose from 'mongoose'




let expenseCatagSchema= new mongoose.Schema({
    name: {
        type: String
    },
    // Sync Fields
    createdTimeForSync: { type: Date, default: Date.now },
    updateTimeForSync: { type: Date, default: Date.now },
    // Soft Delete Fields
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null }
},
{
    timestamps: true
})



export default expenseCatagSchema