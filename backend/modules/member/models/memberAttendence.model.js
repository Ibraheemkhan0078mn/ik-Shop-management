import mongoose from "mongoose";


const memberAttendenceSchema= new mongoose.Schema({
    teachers:[
        {
            id:{
                type: mongoose.Schema.Types.ObjectId,
                ref:"teacher"
            },
            instituteId:{
                type:String
            },
            name:{
                type:String
            },
            presenceStatus:{
                type:String,
            }
        }
    ],
    date: {
        type: Date, 
        default: Date.now
    }
},
{
 timestamps:true
})











export default memberAttendenceSchema;