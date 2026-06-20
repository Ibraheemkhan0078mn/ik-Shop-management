import { getLocalQarzaAccountModel, getLocalQarzaPaymentModel } from "../../../configs/connect.db.js";
import { changeTrackDocsCreationFunc } from '../../../common/ikSync/changeTrackModelCreation.js'
import { imageChangeTrackDocsCreation } from "../../../common/ikSync/imageChangeTrackModelCreation.js";






export const qarzaAccountCreate = async (req, res) => {
    try {
        let { name, type, phoneNo, address, notes, isActive } = req.body;
        // console.log(req.file, req.files)
        let file = null;
        if (req?.file) {
            file = req.file.filename
        }


        let QarzaAccountModel = getLocalQarzaAccountModel();

        // VALIDATION
        if (!name) {
            return res.json({ success: false, msg: "Name is required" });
        }

        let createdAccount = await QarzaAccountModel.create({
            qarzaProfileImage: file,
            name,
            type,
            phoneNo,
            address,
            notes
        });

        await changeTrackDocsCreationFunc("create", QarzaAccountModel.modelName, createdAccount?._id)
        req?.file?.filename && await imageChangeTrackDocsCreation("create", QarzaAccountModel.modelName, createdAccount._id)

        let accounts = await QarzaAccountModel.find().sort({ createdAt: -1 });

        return res.json({ success: true, msg: "Account created", accounts });
    } catch (err) {
        console.log(err);
        return res.json({ success: false, msg: "Error creating account" });
    }
}
















export const getqarzaAccount = async (req, res) => {
    try {
        let QarzaAccountModel = getLocalQarzaAccountModel();

        let accounts = await QarzaAccountModel.find().populate("payments").sort({ createdAt: -1 });

        return res.json({ success: true, accounts });
    } catch (err) {
        console.log(err);
        return res.json({ success: false, msg: "Error getting accounts" });
    }
}








export const getAllQarzaAccount = async (req, res) => {
    try {
        console.log("The qarza route is hitted.")
        let QarzaAccountModel = getLocalQarzaAccountModel();

        let accounts = await QarzaAccountModel.find().populate("payments").sort({ createdAt: -1 });

        return res.json({ success: true, data: accounts });
    } catch (err) {
        console.log(err);
        return res.json({ success: false, msg: "Error getting accounts" });
    }
}

export const getPaginatedQarzaAccounts = async (req, res) => {
    try {
        let QarzaAccountModel = getLocalQarzaAccountModel();
        let page = parseInt(req.query.page) || 1;
        let limit = parseInt(req.query.limit) || 20;
        let skip = (page - 1) * limit;
        let search = req.query.search || "";

        let query = {};
        
        if (search) {
            query.name = { $regex: search, $options: "i" };
        }

        let accounts = await QarzaAccountModel
            .find(query)
            .populate("payments")
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip);

        let total = await QarzaAccountModel.countDocuments(query);

        return res.json({ 
            success: true, 
            data: accounts,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        });
    } catch (err) {
        console.log(err);
        return res.json({ success: false, msg: "Error getting accounts" });
    }
}








export const qarzaAccountUpdate = async (req, res) => {
    try {
        let { _id, name, type, phoneNo, address, notes, isActive } = req.body;
        // console.log(req.file, req.files)
        let file = null;
        if (req?.file?.filename) {
            file = req?.file?.filename
        }




        let QarzaAccountModel = getLocalQarzaAccountModel();

        if (!_id) {
            return res.json({ success: false, msg: "Account ID is required" });
        }

        let existingAcc = await QarzaAccountModel.findOne({ _id: _id })
        if (!existingAcc) {
            return res.json({ success: false, msg: "The account is not found" })
        }

        let updated = await QarzaAccountModel.findOneAndUpdate(
            { _id: _id },
            {
                qarzaProfileImage: file,
                name, type, phoneNo, address, notes, isActive
            },
            { new: true }
        );

        if (!updated) {
            return res.json({ success: false, msg: "Account not found" });
        }


        await changeTrackDocsCreationFunc("update", QarzaAccountModel.modelName, updated?._id)
        // console.log(req.file.filename)
        existingAcc?.qarzaProfileImage && await imageChangeTrackDocsCreation("delete", QarzaAccountModel.modelName, existingAcc?._id, existingAcc?.cloudinaryPublicId)
        req?.file?.filename && await imageChangeTrackDocsCreation("create", QarzaAccountModel.modelName, updated._id)

        let accounts = await QarzaAccountModel.find().sort({ createdAt: -1 });

        return res.json({ success: true, msg: "Account updated", accounts });
    } catch (err) {
        console.log(err);
        return res.json({ success: false, msg: "Error updating account" });
    }
}













export const qarzaAccountDelete = async (req, res) => {
    try {
        let { _id } = req.body;
        let QarzaAccountModel = getLocalQarzaAccountModel();

        if (!_id) {
            return res.json({ success: false, msg: "Account ID is required" });
        }

        let existingAcc = await QarzaAccountModel.findOne({ _id: _id })
        if (!existingAcc) {
            return res.json({ success: false, msg: "The Qarza Account is not deleted." })
        }
        let deleted = await QarzaAccountModel.findOneAndDelete({ _id });

        if (!deleted) {
            return res.json({ success: false, msg: "Account not found" });
        }


        await changeTrackDocsCreationFunc("delete", QarzaAccountModel.modelName, deleted?._id)
        await imageChangeTrackDocsCreation("delete", QarzaAccountModel.modelName, existingAcc._id, existingAcc.cloudinaryPublicId)


        let accounts = await QarzaAccountModel.find().sort({ createdAt: -1 });

        return res.json({ success: true, msg: "Account deleted", accounts });
    } catch (err) {
        console.log(err);
        return res.json({ success: false, msg: "Error deleting account" });
    }
}








export const createQarzaPayment = async (req, res) => {
    try {
        const { qarzaAccountId, amount, type, date, notes } = req.body;

        let QarzaPayment = getLocalQarzaPaymentModel()
        let QarzaAccountModel = getLocalQarzaAccountModel()


        let existingQarzaAccount = await QarzaAccountModel.findOne({ _id: qarzaAccountId })
        if (!existingQarzaAccount) {
            return res.json({ success: false, msg: "The qarza account is not found" })
        }



        let createdQarzaPayment = await QarzaPayment.create({
            qarzaAccountId,
            amount,
            type,
            date: new Date(date),
            notes,
        });
        if (!createdQarzaPayment) {
            return res.json({ success: false, msg: "The payment is not created" })
        }

        existingQarzaAccount.payments = [...existingQarzaAccount.payments, createdQarzaPayment?._id]
        await existingQarzaAccount.save()




        await existingQarzaAccount.populate("payments")



        await changeTrackDocsCreationFunc("update", QarzaAccountModel.modelName, existingQarzaAccount._id)
        await changeTrackDocsCreationFunc("create", QarzaPayment.modelName, createdQarzaPayment?._id)



        const allPayments = await QarzaPayment.find({ qarzaAccountId: qarzaAccountId }).sort({ date: -1 });

        return res.json({ success: true, qarzaPaymentData: allPayments });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}







export const updateQarzaPayment = async (req, res) => {
    try {
        const { _id, qarzaAccountId, amount, type, date, notes } = req.body;
        let QarzaPayment = getLocalQarzaPaymentModel()
        let localQarzaAccountModel = getLocalQarzaAccountModel()




        let existingQarzaAccount = await localQarzaAccountModel.findOne({ _id: qarzaAccountId })
        if (!existingQarzaAccount) {
            return res.json({ success: false, msg: "THe qarza account is not found" })
        }

        await QarzaPayment.findOneAndUpdate({ _id: _id }, {
            amount,
            type,
            date: new Date(date),
            notes,
        });





        await existingQarzaAccount.populate("payments")




        await changeTrackDocsCreationFunc("update", QarzaPayment.modelName, _id)


        const allPayments = await QarzaPayment.find({ qarzaAccountId: qarzaAccountId }).sort({ date: -1 });
        res.json({ success: true, data: allPayments });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}








export const deleteQarzaPayment = async (req, res) => {
    try {
        const { paymentId, qarzaAccountId } = req.body;
        let QarzaPayment = getLocalQarzaPaymentModel()
        let localQarzaAccountModel = getLocalQarzaAccountModel()

        let qarzaAccount = await localQarzaAccountModel.findOne({ _id: qarzaAccountId })
        if (!qarzaAccount) {
            return res.json({ success: false, msg: "The qarza account is not found" })
        }




        await QarzaPayment.findOneAndDelete({ _id: paymentId });


        qarzaAccount.payments = qarzaAccount.payments.filter((p) => { return !(p == paymentId) })
        await qarzaAccount.save()





        await qarzaAccount.populate("payments")


        await changeTrackDocsCreationFunc("delete", QarzaPayment.modelName, paymentId)
        await changeTrackDocsCreationFunc("update", localQarzaAccountModel.modelName, qarzaAccount._id)





        const allPayments = await QarzaPayment.find({ qarzaAccountId: qarzaAccountId }).sort({ date: -1 });

        res.json({ success: true, data: allPayments });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
















export const getQarzaAccountRelatedPayments = async (req, res) => {
    try {
        const { qarzaAccountId, startDate, endDate } = req.body;
        let QarzaPayment = getLocalQarzaPaymentModel()

        const results = await QarzaPayment.find({
            qarzaAccountId: qarzaAccountId,
            // date: { $gte: startDate, $lte: endDate },
        }).sort({ date: -1 });

        res.json({ success: true, data: results });
    } catch (err) {
        console.log(err.message, err.stack)
        res.status(500).json({ success: false, error: err.message });
    }
}
























