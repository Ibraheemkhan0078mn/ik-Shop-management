import { getLocalQarzaAccountModel, getLocalQarzaPaymentModel } from "../../../configs/connect.db.js";
import { changeTrackDocsCreationFunc } from '../../../common/ikSync/changeTrackModelCreation.js'
import { imageChangeTrackDocsCreation } from "../../../common/ikSync/imageChangeTrackModelCreation.js";
import {
    qarzaAccountCreate as qarzaAccountCreateService,
    getAllQarzaAccounts as getAllQarzaAccountsService,
    getQarzaAccountById as getQarzaAccountByIdService,
    findQarzaAccountById as findQarzaAccountByIdService,
    qarzaAccountUpdate as qarzaAccountUpdateService,
    qarzaAccountDelete as qarzaAccountDeleteService,
    countQarzaAccounts as countQarzaAccountsService,
    qarzaPaymentCreate as qarzaPaymentCreateService,
    getAllQarzaPayments as getAllQarzaPaymentsService,
    qarzaPaymentUpdate as qarzaPaymentUpdateService,
    qarzaPaymentDelete as qarzaPaymentDeleteService,
} from "../services/qarza.service.js";






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

        let createdAccount = await qarzaAccountCreateService({
            qarzaProfileImage: file,
            name,
            type,
            phoneNo,
            address,
            notes
        });

        await changeTrackDocsCreationFunc("create", QarzaAccountModel.modelName, createdAccount?._id)
        req?.file?.filename && await imageChangeTrackDocsCreation("create", QarzaAccountModel.modelName, createdAccount._id)

        let accounts = await getAllQarzaAccountsService();

        return res.json({ success: true, msg: "Account created", accounts });
    } catch (err) {
        console.log(err);
        return res.json({ success: false, msg: "Error creating account" });
    }
}
















export const getqarzaAccount = async (req, res) => {
    try {
        let accounts = await getAllQarzaAccountsService();

        return res.json({ success: true, accounts });
    } catch (err) {
        console.log(err);
        return res.json({ success: false, msg: "Error getting accounts" });
    }
}








export const getAllQarzaAccount = async (req, res) => {
    try {
        console.log("The qarza route is hitted.")
        let accounts = await getAllQarzaAccountsService();

        return res.json({ success: true, data: accounts });
    } catch (err) {
        console.log(err);
        return res.json({ success: false, msg: "Error getting accounts" });
    }
}

export const getPaginatedQarzaAccounts = async (req, res) => {
    try {
        let page = parseInt(req.query.page) || 1;
        let limit = parseInt(req.query.limit) || 20;
        let skip = (page - 1) * limit;
        let search = req.query.search || "";

        let query = {};
        
        if (search) {
            query.name = { $regex: search, $options: "i" };
        }

        let accounts = await getAllQarzaAccountsService(query);
        
        let total = await countQarzaAccountsService(query);
        
        let paginatedAccounts = accounts.slice(skip, skip + limit);

        return res.json({ 
            success: true, 
            data: paginatedAccounts,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        });
    } catch (err) {
        console.log(err);
        return res.json({ success: false, msg: "Error getting accounts" });
    }
};

export const getPaginatedQarzaPayments = async (req, res) => {
    try {
        let page = parseInt(req.query.page) || 1;
        let limit = parseInt(req.query.limit) || 20;
        let skip = (page - 1) * limit;
        let { qarzaAccountId } = req.query;

        if (!qarzaAccountId) {
            return res.json({ success: false, msg: "Account ID is required" });
        }

        const QarzaPaymentModel = getLocalQarzaPaymentModel();
        
        let payments = await QarzaPaymentModel.find({ qarzaAccountId })
            .sort({ date: -1 })
            .limit(limit)
            .skip(skip);

        let total = await QarzaPaymentModel.countDocuments({ qarzaAccountId });

        return res.json({ 
            success: true, 
            data: payments,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        });
    } catch (err) {
        console.log(err);
        return res.json({ success: false, msg: "Error getting payments" });
    }
};

export const qarzaAccountUpdate = async (req, res) => {
    try {
        let { _id, name, type, phoneNo, address, notes, isActive } = req.body;
        let file = null;
        if (req?.file?.filename) {
            file = req?.file?.filename
        }

        let QarzaAccountModel = getLocalQarzaAccountModel();

        if (!_id) {
            return res.json({ success: false, msg: "Account ID is required" });
        }

        let existingAcc = await findQarzaAccountByIdService(_id)
        if (!existingAcc) {
            return res.json({ success: false, msg: "The account is not found" })
        }

        let updated = await qarzaAccountUpdateService(_id, {
            qarzaProfileImage: file,
            name, type, phoneNo, address, notes, isActive
        });

        if (!updated) {
            return res.json({ success: false, msg: "Account not found" });
        }

        await changeTrackDocsCreationFunc("update", QarzaAccountModel.modelName, updated?._id)
        existingAcc?.qarzaProfileImage && await imageChangeTrackDocsCreation("delete", QarzaAccountModel.modelName, existingAcc?._id, existingAcc?.cloudinaryPublicId)
        req?.file?.filename && await imageChangeTrackDocsCreation("create", QarzaAccountModel.modelName, updated._id)

        let accounts = await getAllQarzaAccountsService();

        return res.json({ success: true, msg: "Account updated", accounts });
    } catch (err) {
        console.log(err);
        return res.json({ success: false, msg: "Error updating account" });
    }
};

export const qarzaAccountDelete = async (req, res) => {
    try {
        let { _id } = req.body;
        let QarzaAccountModel = getLocalQarzaAccountModel();

        if (!_id) {
            return res.json({ success: false, msg: "Account ID is required" });
        }

        let deleted = await qarzaAccountDeleteService(_id);

        if (!deleted) {
            return res.json({ success: false, msg: "Account not found" });
        }

        await changeTrackDocsCreationFunc("delete", QarzaAccountModel.modelName, _id)

        let accounts = await getAllQarzaAccountsService();

        return res.json({ success: true, msg: "Account deleted", accounts });
    } catch (err) {
        console.log(err);
        return res.json({ success: false, msg: "Error deleting account" });
    }
};

export const createQarzaPayment = async (req, res) => {
    try {
        const { qarzaAccountId, amount, type, date, notes, orderId, orderNumber, source } = req.body;
        let QarzaAccountModel = getLocalQarzaAccountModel();
        let QarzaPayment = getLocalQarzaPaymentModel();

        let existingQarzaAccount = await findQarzaAccountByIdService(qarzaAccountId)
        if (!existingQarzaAccount) {
            return res.json({ success: false, msg: "The qarza account is not found" })
        }

        let createdQarzaPayment = await qarzaPaymentCreateService({
            qarzaAccountId,
            amount,
            type,
            date: new Date(date),
            notes,
            orderId: orderId || null,
            orderNumber: orderNumber || "",
            source: source || "manual",
        });
        if (!createdQarzaPayment) {
            return res.json({ success: false, msg: "The payment is not created" })
        }

        existingQarzaAccount.payments = [...existingQarzaAccount.payments, createdQarzaPayment?._id]
        await existingQarzaAccount.save()

        await existingQarzaAccount.populate("payments")

        await changeTrackDocsCreationFunc("update", QarzaAccountModel.modelName, existingQarzaAccount._id)
        await changeTrackDocsCreationFunc("create", QarzaPayment.modelName, createdQarzaPayment?._id)

        const allPayments = await getAllQarzaPaymentsService({ qarzaAccountId: qarzaAccountId });

        return res.json({ success: true, qarzaPaymentData: allPayments });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

export const updateQarzaPayment = async (req, res) => {
    try {
        const { _id, qarzaAccountId, amount, type, date, notes } = req.body;
        let QarzaPayment = getLocalQarzaPaymentModel()
        let localQarzaAccountModel = getLocalQarzaAccountModel()

        let existingQarzaAccount = await findQarzaAccountByIdService(qarzaAccountId)
        if (!existingQarzaAccount) {
            return res.json({ success: false, msg: "THe qarza account is not found" })
        }

        await qarzaPaymentUpdateService(_id, {
            amount,
            type,
            date: new Date(date),
            notes,
        });

        await changeTrackDocsCreationFunc("update", QarzaPayment.modelName, _id)

        const allPayments = await getAllQarzaPaymentsService({ qarzaAccountId: qarzaAccountId });

        return res.json({ success: true, qarzaPaymentData: allPayments });
    } catch (err) {
        console.log(err);
        return res.json({ success: false, msg: "Error updating payment" });
    }
};

export const deleteQarzaPayment = async (req, res) => {
    try {
        const { paymentId, qarzaAccountId } = req.body;
        let QarzaPayment = getLocalQarzaPaymentModel()
        let localQarzaAccountModel = getLocalQarzaAccountModel()

        let existingQarzaAccount = await findQarzaAccountByIdService(qarzaAccountId)
        if (!existingQarzaAccount) {
            return res.json({ success: false, msg: "The qarza account is not found" })
        }

        await qarzaPaymentDeleteService(paymentId);

        existingQarzaAccount.payments = existingQarzaAccount.payments.filter(id => id.toString() !== paymentId)
        await existingQarzaAccount.save()

        await changeTrackDocsCreationFunc("delete", QarzaPayment.modelName, paymentId)
        await changeTrackDocsCreationFunc("update", localQarzaAccountModel.modelName, existingQarzaAccount._id)

        const allPayments = await getAllQarzaPaymentsService({ qarzaAccountId: qarzaAccountId });

        return res.json({ success: true, qarzaPaymentData: allPayments });
    } catch (err) {
        console.log(err);
        return res.json({ success: false, msg: "Error deleting payment" });
    }
};

export const getQarzaAccountRelatedPayments = async (req, res) => {
    try {
        let { qarzaAccountId } = req.body;
        let payments = await getAllQarzaPaymentsService({ qarzaAccountId });
        return res.json({ success: true, data: payments });
    } catch (err) {
        console.log(err);
        return res.json({ success: false, msg: "Error getting payments" });
    }
};

export const getQarzaAccountPaymentsSummary = async (req, res) => {
    try {
        let { qarzaAccountId } = req.query;

        if (!qarzaAccountId) {
            return res.json({ success: false, msg: "Account ID is required" });
        }

        const QarzaPaymentModel = getLocalQarzaPaymentModel();
        
        const payments = await QarzaPaymentModel.find({ qarzaAccountId });
        
        const totalIn = payments.filter(p => p.type === "cashin").reduce((sum, p) => sum + p.amount, 0);
        const totalOut = payments.filter(p => p.type === "cashout").reduce((sum, p) => sum + p.amount, 0);
        const net = totalIn - totalOut;

        return res.json({ 
            success: true, 
            data: {
                totalIn,
                totalOut,
                net,
                totalPayments: payments.length
            }
        });
    } catch (err) {
        console.log(err);
        return res.json({ success: false, msg: "Error getting payment summary" });
    }
};

export const getCreditsDebitsReport = async (req, res) => {
    try {
        const {
            startDate,
            endDate,
            accountId,
            accountType,
            transactionType,
            direction,
            source,
            status
        } = req.query;

        const QarzaAccountModel = getLocalQarzaAccountModel();
        const QarzaPaymentModel = getLocalQarzaPaymentModel();

        // Build account filter
        let accountFilter = {};
        if (accountId) {
            accountFilter._id = accountId;
        }
        if (accountType) {
            accountFilter.type = accountType;
        }

        // Get accounts
        const accounts = await QarzaAccountModel.find(accountFilter);

        // Build payment filter
        let paymentFilter = {};
        if (startDate || endDate) {
            paymentFilter.date = {};
            if (startDate) paymentFilter.date.$gte = new Date(startDate);
            if (endDate) paymentFilter.date.$lte = new Date(endDate);
        }
        if (accountId) {
            paymentFilter.qarzaAccountId = accountId;
        }
        if (source) {
            paymentFilter.source = source;
        }
        if (transactionType) {
            // For transaction type, we need to check notes or source
            if (transactionType === 'cash') {
                paymentFilter.$or = [
                    { source: 'manual' },
                    { notes: /cash/i }
                ];
            } else if (transactionType === 'credit') {
                paymentFilter.$or = [
                    { source: 'purchase' },
                    { notes: /credit/i }
                ];
            } else if (transactionType === 'hybrid') {
                paymentFilter.notes = /hybrid/i;
            }
        }
        if (direction) {
            if (direction === 'incoming') {
                paymentFilter.type = 'cashin';
            } else if (direction === 'outgoing') {
                paymentFilter.type = 'debit';
            }
        }

        // Get all payments for filtered accounts
        const accountIds = accounts.map(a => a._id);
        if (accountIds.length > 0) {
            paymentFilter.qarzaAccountId = { $in: accountIds };
        }

        const payments = await QarzaPaymentModel.find(paymentFilter).sort({ date: -1 });

        // Calculate summary for each account
        const accountSummaries = accounts.map(account => {
            const accountPayments = payments.filter(p => p.qarzaAccountId.toString() === account._id.toString());
            
            const totalDebit = accountPayments.filter(p => p.type === 'debit').reduce((sum, p) => sum + p.amount, 0);
            const totalCredit = accountPayments.filter(p => p.type === 'cashin').reduce((sum, p) => sum + p.amount, 0);
            
            // Calculate cash, credit, hybrid amounts
            const cashAmount = accountPayments.filter(p => p.source === 'manual' || p.notes?.includes('cash')).reduce((sum, p) => sum + p.amount, 0);
            const creditAmount = accountPayments.filter(p => p.source === 'purchase' || p.notes?.includes('credit')).reduce((sum, p) => sum + p.amount, 0);
            const hybridAmount = accountPayments.filter(p => p.notes?.includes('hybrid')).reduce((sum, p) => sum + p.amount, 0);
            
            const currentBalance = account.balance || 0;
            const lastTransaction = accountPayments.length > 0 ? accountPayments[0].date : null;

            // Determine tag
            let tag = 'cleared';
            if (currentBalance < 0) {
                tag = 'advance';
            } else if (currentBalance > 10000) {
                tag = 'overdue';
            } else if (currentBalance > 0) {
                tag = 'partial';
            }

            return {
                account: {
                    _id: account._id,
                    name: account.name,
                    type: account.type,
                    phoneNo: account.phoneNo,
                    address: account.address
                },
                totalDebit,
                totalCredit,
                cashAmount,
                creditAmount,
                hybridAmount,
                currentBalance,
                lastTransaction,
                tag,
                transactionCount: accountPayments.length
            };
        });

        // Calculate overall summary
        const totalAccounts = accounts.length;
        const totalCreditAmount = accountSummaries.reduce((sum, a) => sum + a.totalCredit, 0);
        const totalDebitAmount = accountSummaries.reduce((sum, a) => sum + a.totalDebit, 0);
        const totalBalanceDue = totalCreditAmount - totalDebitAmount;
        const totalCashTransactions = accountSummaries.reduce((sum, a) => sum + a.cashAmount, 0);
        const totalCreditTransactions = accountSummaries.reduce((sum, a) => sum + a.creditAmount, 0);
        const totalHybridTransactions = accountSummaries.reduce((sum, a) => sum + a.hybridAmount, 0);

        return res.json({
            success: true,
            data: {
                summary: {
                    totalAccounts,
                    totalCreditAmount,
                    totalDebitAmount,
                    totalBalanceDue,
                    totalCashTransactions,
                    totalCreditTransactions,
                    totalHybridTransactions
                },
                accounts: accountSummaries
            }
        });
    } catch (err) {
        console.log(err);
        return res.json({ success: false, msg: "Error getting credits/debits report" });
    }
};

export const getAccountLedger = async (req, res) => {
    try {
        const { accountId } = req.params;
        const { startDate, endDate } = req.query;

        const QarzaAccountModel = getLocalQarzaAccountModel();
        const QarzaPaymentModel = getLocalQarzaPaymentModel();

        const account = await QarzaAccountModel.findById(accountId);
        if (!account) {
            return res.json({ success: false, msg: "Account not found" });
        }

        let paymentFilter = { qarzaAccountId: accountId };
        if (startDate || endDate) {
            paymentFilter.date = {};
            if (startDate) paymentFilter.date.$gte = new Date(startDate);
            if (endDate) paymentFilter.date.$lte = new Date(endDate);
        }

        const payments = await QarzaPaymentModel.find(paymentFilter).sort({ date: 1 });

        // Calculate running balance
        let runningBalance = 0;
        const ledger = payments.map(payment => {
            const amount = payment.type === 'cashin' ? payment.amount : -payment.amount;
            runningBalance += amount;
            
            return {
                date: payment.date,
                description: payment.notes || '',
                source: payment.source,
                transactionType: payment.source === 'manual' ? 'cash' : (payment.source === 'purchase' ? 'credit' : 'hybrid'),
                direction: payment.type === 'cashin' ? 'incoming' : 'outgoing',
                debitAmount: payment.type === 'debit' ? payment.amount : 0,
                creditAmount: payment.type === 'cashin' ? payment.amount : 0,
                runningBalance,
                orderNumber: payment.orderNumber || '',
                orderId: payment.orderId || null
            };
        });

        return res.json({
            success: true,
            data: {
                account: {
                    _id: account._id,
                    name: account.name,
                    type: account.type,
                    phoneNo: account.phoneNo,
                    address: account.address,
                    currentBalance: account.balance
                },
                ledger
            }
        });
    } catch (err) {
        console.log(err);
        return res.json({ success: false, msg: "Error getting account ledger" });
    }
};
