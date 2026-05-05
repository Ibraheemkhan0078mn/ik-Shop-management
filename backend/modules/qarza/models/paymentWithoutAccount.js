import mongoose from 'mongoose'



const paymentWithoutAccountSchema = new mongoose.Schema({
    name: {
        type: String
    },
    amount: {
        type: Number
    },
    address: {
        type: String
    },
    phoneNo: {
        type: String
    },
    type: {
        type: String
    },
    notes: {
        type: String,
    },
    isActive: {
        type: String
    },
    date: {
        type: String
    },
    isReminded: {
        type: Boolean
    },
    remindingDate: {
        type: Date
    }
},
    {
        timestamps: true
    })







export default paymentWithoutAccountSchema