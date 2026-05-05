import mongoose from 'mongoose'


const memberSchema = new mongoose.Schema({
    cloudinaryPublicId: { type: String },
    profileImage: { type: String },
    instituteId: { type: String },
    name: { type: String },
    fatherName: { type: String },
    phoneNo: { type: String },
    email: { type: String },
    salary: { type: String },
    perAttendenceCut: { type: Number },
    education: { type: String },
    hasReminderSnooze: { type: Boolean },
    reminderSnoozeTime: { type: Date },
    givenClasses: [{ type: mongoose.Schema.Types.ObjectId, ref: "class" }],
    address: { type: String },
    post: { type: String },
    salaryPayments: [{ type: mongoose.Schema.Types.ObjectId, ref: "teacherSalaryPayment" }],
    languages: { type: [String], },
    skills: { type: [String], },
    experiences: { type: [String], },
    educationDegrees: { type: [String], },
    documents: { type: [String], },
    isPartner: { type: Boolean, default: false },
    partnerType: { type: String, default: "custom" },
    overallPartnerShareValue: { type: String, default: 0 },
    investmentMoney: [{ type: mongoose.Schema.Types.ObjectId, ref: "teacher", }],
    bankName: { type: String },
    accountNumber: { type: String },
    hiringDate: { type: Date, default: Date.now },
    invoices: [{ type: mongoose.Schema.Types.ObjectId, ref: "teacherInvoice" }],
    advancedBalance: { type: Number, default: 0 },
    isActive: { type: Boolean, default: false },
    notes: { type: String, default: "" },
    cnic: { type: Number }


},
    {
        timestamps: true
    })





export default memberSchema