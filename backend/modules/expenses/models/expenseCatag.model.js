import mongoose from 'mongoose'




let expenseCatagSchema= new mongoose.Schema({
    name: {
        type: String
    }
},
{
    timestamps: true
})



export default expenseCatagSchema