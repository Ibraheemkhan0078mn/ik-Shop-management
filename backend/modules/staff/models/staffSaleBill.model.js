import mongoose from "mongoose";

const staffSaleBillSchema = new mongoose.Schema({
    staffId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff',
        required: true
    },
    items: [{
        name: {
            type: String,
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        price: {
            type: Number,
            required: true
        }
    }],
    totalAmount: {
        type: Number,
        required: true
    },
    percentage: {
        type: Number,
        required: true
    },
    earnedAmount: {
        type: Number,
        required: true
    },
    isPaid: {
        type: Boolean,
        default: false
    },
    paidAt: {
        type: Date
    },
    source: {
        type: String,
        // enum: ['manual', 'pos'],
        default: 'manual'
    },
    posOrderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

export default staffSaleBillSchema;
