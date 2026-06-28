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
        let { qarzaAccountId, source } = req.query;

        if (!qarzaAccountId) {
            return res.json({ success: false, msg: "Account ID is required" });
        }

        const QarzaPaymentModel = getLocalQarzaPaymentModel();
        
        let query = { qarzaAccountId };
        if (source && source !== 'all') {
            query.source = source;
        }
        
        let payments = await QarzaPaymentModel.find(query)
            .sort({ date: -1 })
            .limit(limit)
            .skip(skip);

        let total = await QarzaPaymentModel.countDocuments(query);

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
            status,
            sortBy,
            page = 1,
            limit = 20
        } = req.query;
        console.log(req.query, "the query")

        const QarzaAccountModel = getLocalQarzaAccountModel();
        const QarzaPaymentModel = getLocalQarzaPaymentModel();

        // Build payment filter based on date range
        let paymentFilter = {};
        if (startDate || endDate) {
            paymentFilter.date = {};
            if (startDate) paymentFilter.date.$gte = new Date(startDate);
            if (endDate) paymentFilter.date.$lte = new Date(endDate);
        }
        if (source && source !== 'all') {
            paymentFilter.source = source;
        }
        if (transactionType) {
            if (transactionType === 'cash') {
                paymentFilter.$or = [
                    { source: 'manual' },
                    { notes: /cash/i }
                ];
            } else if (transactionType === 'credit') {
                paymentFilter.$or = [
                    { source: 'purchaseProducts' },
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

        console.log(paymentFilter)

        // Get all payments matching filters
        const payments = await QarzaPaymentModel.find(paymentFilter).sort({ date: -1 });

        console.log(payments, "the payemnt in qarza report")
        // Get unique account IDs from payments
        const accountIdsFromPayments = [...new Set(payments.map(p => p.qarzaAccountId.toString()))];

        // Build account filter
        let accountFilter = {};
        if (accountId) {
            accountFilter._id = accountId;
        } else if (startDate || endDate) {
            // If date filter is applied, only show accounts with transactions in that period
            accountFilter._id = { $in: accountIdsFromPayments };
        }
        if (accountType) {
            accountFilter.type = accountType;
        }

        // Get accounts
        const accounts = await QarzaAccountModel.find(accountFilter);

        // Calculate summary for each account based on actual payments
        const accountSummaries = accounts.map(account => {
            const accountPayments = payments.filter(p => p.qarzaAccountId.toString() === account._id.toString());
            
            // Calculate from actual payments
            const totalPaid = accountPayments.filter(p => p.type === 'cashin').reduce((sum, p) => sum + p.amount, 0);
            const totalToPay = accountPayments.filter(p => p.type === 'debit').reduce((sum, p) => sum + p.amount, 0);
            const remainingBalance = totalToPay - totalPaid; // Positive = need to pay, Negative = they owe us
            
            const lastTransaction = accountPayments.length > 0 ? accountPayments[0].date : null;

            // Determine status based on actual payment calculation
            let accountStatus = 'cleared';
            if (remainingBalance > 0) {
                accountStatus = 'to_pay'; // We need to pay them
            } else if (remainingBalance < 0) {
                accountStatus = 'to_receive'; // They need to pay us
            }

            // Determine tag based on remaining balance
            let tag = 'cleared';
            if (remainingBalance < 0) {
                tag = 'advance'; // They paid in advance
            } else if (remainingBalance > 10000) {
                tag = 'overdue'; // Large amount pending
            } else if (remainingBalance > 0) {
                tag = 'partial'; // Some balance remaining
            }

            return {
                account: {
                    _id: account._id,
                    name: account.name,
                    type: account.type,
                    phoneNo: account.phoneNo,
                    address: account.address
                },
                totalPaid,
                totalToPay,
                remainingBalance,
                lastTransaction,
                tag,
                accountStatus,
                transactionCount: accountPayments.length
            };
        });

        // Sort accounts
        if (sortBy === 'to_pay') {
            accountSummaries.sort((a, b) => b.remainingBalance - a.remainingBalance);
        } else if (sortBy === 'to_receive') {
            accountSummaries.sort((a, b) => a.remainingBalance - b.remainingBalance);
        }

        // Filter by status if specified
        let filteredSummaries = accountSummaries;
        if (status && status !== 'all') {
            filteredSummaries = accountSummaries.filter(a => a.accountStatus === status);
        }

        // Pagination
        const total = filteredSummaries.length;
        const skip = (page - 1) * limit;
        const paginatedAccounts = filteredSummaries.slice(skip, skip + parseInt(limit));

        // Calculate KPI based on filtered results
        const totalAccounts = filteredSummaries.length;
        const totalDebitOnMe = filteredSummaries.reduce((sum, a) => sum + (a.remainingBalance < 0 ? Math.abs(a.remainingBalance) : 0), 0); // Others owe me (they paid in advance)
        const totalDebitOnOthers = filteredSummaries.reduce((sum, a) => sum + (a.remainingBalance > 0 ? a.remainingBalance : 0), 0); // I owe others (need to pay)
        const finalAmount = totalDebitOnOthers - totalDebitOnMe; // Positive = I need to receive, Negative = Others owe me

        return res.json({
            success: true,
            data: {
                kpi: {
                    totalAccounts,
                    totalDebitOnMe,
                    totalDebitOnOthers,
                    finalAmount
                },
                accounts: paginatedAccounts,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                }
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
