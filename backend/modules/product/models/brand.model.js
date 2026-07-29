import mongoose from "mongoose";

const brandSchema = new mongoose.Schema(
    {
        name: { 
            type: String, 
            required: true, 
            unique: true, 
            trim: true,
            index: true 
        },
        description: { 
            type: String, 
            trim: true 
        },
        isActive: { 
            type: Boolean, 
            default: true 
        },
        
        // Soft Delete Fields
        isDeleted: { 
            type: Boolean, 
            default: false, 
            index: true 
        },
        deletedAt: { 
            type: Date, 
            default: null 
        },

        created: { 
            type: Date, 
            default: Date.now 
        },
        updated: { 
            type: Date 
        },
    },
    { 
        timestamps: true 
    }
);

export default brandSchema;
