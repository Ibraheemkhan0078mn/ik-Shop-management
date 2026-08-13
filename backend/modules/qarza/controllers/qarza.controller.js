import { changeTrackDocsCreationFunc } from '../../../common/ikSync/changeTrackModelCreation.js'
import { imageChangeTrackDocsCreation } from "../../../common/ikSync/imageChangeTrackModelCreation.js";
import {
    qarzaAccountCreate as qarzaAccountCreateService,
    getAllQarzaAccounts as getAllQarzaAccountsService,
    getQarzaAccountById as getQarzaAccountByIdService,
    findQarzaAccountById as findQarzaAccountByIdService,
    findQarzaAccountByTypeAndName as findQarzaAccountByTypeAndNameService,
    qarzaAccountUpdate as qarzaAccountUpdateService,
    qarzaAccountDelete as qarzaAccountDeleteService,
    countQarzaAccounts as countQarzaAccountsService,
} from "../services/qarza.service.js";
import { getLocalQarzaAccountModel } from "../../../configs/connect.db.js";
import { createTransaction, getTransactions, deleteTransaction } from "../../transactions/services/transaction.service.js";






export const qarzaAccountCreate = async (req, res) => {
    try {
        let { name, type, phoneNo, address, notes, isActive } = req.body;
        // console.log(req.file, req.files)
        let file = null;
        let cloudinaryPublicId = null;
        if (req?.file) {
            file = req.file.filename;
            cloudinaryPublicId = req.file.filename; // For Cloudinary, filename is the public_id
        }

        let QarzaAccountModel = getLocalQarzaAccountModel();

        // VALIDATION
        if (!name) {
            return res.json({ success: false, msg: "Name is required" });
        }

        // Default type to 'general' if not provided
        const accountType = type || 'general';

        let createdAccount = await qarzaAccountCreateService({
            qarzaProfileImage: file,
            cloudinaryPublicId,
            name,
            type: accountType,
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
};
















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
        let filterStatus = req.query.filterStatus || "all";
        let filterBalance = req.query.filterBalance || "all";

        let query = { type: "general" };
        
        if (search) {
            query.name = { $regex: search, $options: "i" };
        }
        
        if (filterStatus && filterStatus !== "all") {
            query.isActive = filterStatus === "active";
        }

        let accounts = await getAllQarzaAccountsService(query);
        
        // Filter by balance status on the backend since it requires transaction calculation
        if (filterBalance && filterBalance !== "all") {
            accounts = await Promise.all(accounts.map(async (acc) => {
                const transactions = await getTransactions({ sourceType: 'qarza', sourceId: acc._id });
                const net = transactions.reduce((sum, t) =>
                    t.creditType === "cashin" ? sum + (t.amount || 0) : sum - (t.amount || 0), 0);
                return { ...acc, netBalance: net };
            }));
            
            if (filterBalance === "to_pay") {
                accounts = accounts.filter(acc => acc.netBalance > 0);
            } else if (filterBalance === "to_receive") {
                accounts = accounts.filter(acc => acc.netBalance < 0);
            } else if (filterBalance === "balanced") {
                accounts = accounts.filter(acc => acc.netBalance === 0);
            }
        }
        
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
        let { qarzaAccountId, source, type } = req.query;

        if (!qarzaAccountId) {
            return res.json({ success: false, msg: "Account ID is required" });
        }
        
        // Query for transactions where either:
        // 1. sourceType is 'qarza' AND sourceId matches the qarza account (direct qarza transactions)
        // 2. creditAccount matches the qarza account (POS sale transactions with credit payment)
        let query = {
            $or: [
                { sourceType: 'qarza', sourceId: qarzaAccountId },
                { creditAccount: qarzaAccountId }
            ]
        };
        
        // Apply type filter (map to creditType)
        if (type && type !== 'all' && type !== 'undefined') {
            if (type === 'cashin') {
                query.creditType = 'cashin';
            } else if (type === 'cashout' || type === 'debit') {
                query.creditType = 'cashout';
            }
        }
        
        // Get all transactions for this account
        let transactions = await getTransactions(query);
        
        // Apply pagination manually since getTransactions doesn't support skip/limit
        let total = transactions.length;
        let skip = (page - 1) * limit;
        let paginatedTransactions = transactions.slice(skip, skip + limit);

        return res.json({ 
            success: true, 
            data: paginatedTransactions,
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
        let cloudinaryPublicId = null;
        if (req?.file?.filename) {
            file = req?.file?.filename;
            cloudinaryPublicId = req?.file?.filename; // For Cloudinary, filename is the public_id
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
            cloudinaryPublicId,
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
        const { qarzaAccountId, amount, type, date, notes, orderId, orderNumber, source, paymentMethod } = req.body;
        let QarzaAccountModel = getLocalQarzaAccountModel();

        let existingQarzaAccount = await findQarzaAccountByIdService(qarzaAccountId)
        if (!existingQarzaAccount) {
            return res.json({ success: false, msg: "The qarza account is not found" })
        }

        // Map qarza payment type to transaction creditType
        // cashin = we receive money (cashin), cashout/debit = we give money (cashout)
        const creditType = type === 'cashin' ? 'cashin' : 'cashout';

        // Handle date - use provided date or current date
        const transactionDate = date ? new Date(date) : new Date();
        if (isNaN(transactionDate.getTime())) {
            return res.json({ success: false, msg: "Invalid date provided" });
        }

        // Create transaction instead of qarza payment
        const createdTransaction = await createTransaction({
            sourceType: 'qarza',
            sourceId: qarzaAccountId,
            method: type === 'cashin' ? 'credit' : 'credit', // Both are credit transactions for qarza
            amount: amount,
            cashAmount: type === 'cashin' ? amount : 0,
            creditAmount: type === 'cashout' ? amount : amount,
            creditAccount: qarzaAccountId,
            creditType: creditType,
            transactionDate: transactionDate,
            notes: notes || `Qarza payment: ${type}`,
            createdBy: req.user?._id,
        });

        if (!createdTransaction) {
            return res.json({ success: false, msg: "The payment is not created" })
        }

        await changeTrackDocsCreationFunc("update", QarzaAccountModel.modelName, existingQarzaAccount._id)

        // Get all transactions for this qarza account
        const allTransactions = await getTransactions({ sourceType: 'qarza', sourceId: qarzaAccountId });

        return res.json({ success: true, qarzaPaymentData: allTransactions });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

export const updateQarzaPayment = async (req, res) => {
    try {
        const { _id, qarzaAccountId, amount, type, date, notes, paymentMethod } = req.body;
        let localQarzaAccountModel = getLocalQarzaAccountModel()

        let existingQarzaAccount = await findQarzaAccountByIdService(qarzaAccountId)
        if (!existingQarzaAccount) {
            return res.json({ success: false, msg: "The qarza account is not found" })
        }

        // Map qarza payment type to transaction creditType
        const creditType = type === 'cashin' ? 'cashin' : 'cashout';

        // Handle date - use provided date or keep existing
        const transactionDate = date ? new Date(date) : undefined;
        if (date && isNaN(transactionDate.getTime())) {
            return res.json({ success: false, msg: "Invalid date provided" });
        }

        // Update transaction instead of qarza payment
        const { updateTransaction } = await import("../../transactions/services/transaction.service.js");
        const updateData = {
            amount: amount,
            creditAmount: type === 'cashout' ? amount : amount,
            creditType: creditType,
            notes: notes || `Qarza payment: ${type}`,
        };
        if (transactionDate) {
            updateData.transactionDate = transactionDate;
        }
        await updateTransaction(_id, updateData);

        await changeTrackDocsCreationFunc("update", localQarzaAccountModel.modelName, existingQarzaAccount._id)

        // Get all transactions for this qarza account
        const allTransactions = await getTransactions({ sourceType: 'qarza', sourceId: qarzaAccountId });

        return res.json({ success: true, qarzaPaymentData: allTransactions });
    } catch (err) {
        console.log(err);
        return res.json({ success: false, msg: "Error updating payment" });
    }
};

export const deleteQarzaPayment = async (req, res) => {
    try {
        const { paymentId, qarzaAccountId } = req.body;
        let localQarzaAccountModel = getLocalQarzaAccountModel()

        let existingQarzaAccount = await findQarzaAccountByIdService(qarzaAccountId)
        if (!existingQarzaAccount) {
            return res.json({ success: false, msg: "The qarza account is not found" })
        }

        await deleteTransaction(paymentId);

        await changeTrackDocsCreationFunc("update", localQarzaAccountModel.modelName, existingQarzaAccount._id)

        // Get all transactions for this qarza account
        const allTransactions = await getTransactions({ sourceType: 'qarza', sourceId: qarzaAccountId });

        return res.json({ success: true, qarzaPaymentData: allTransactions });
    } catch (err) {
        console.log(err);
        return res.json({ success: false, msg: "Error deleting payment" });
    }
};

export const getQarzaAccountRelatedPayments = async (req, res) => {
    try {
        let { qarzaAccountId } = req.body;
        let transactions = await getTransactions({ sourceType: 'qarza', sourceId: qarzaAccountId });
        return res.json({ success: true, data: transactions });
    } catch (err) {
        console.log(err);
        return res.json({ success: false, msg: "Error getting payments" });
    }
};

export const getQarzaAccountPaymentsSummary = async (req, res) => {
    try {
        let { qarzaAccountId } = req.query;

        // First verify the account exists
        const account = await getQarzaAccountByIdService(qarzaAccountId);
        
        if (!account) {
            return res.json({ 
                success: false, 
                msg: "Qarza account not found",
                accountExists: false 
            });
        }

        // Get transactions for this account (both direct qarza transactions and POS sale credit payments)
        const transactionFilter = {
            $or: [
                { sourceType: 'qarza', sourceId: qarzaAccountId },
                { creditAccount: qarzaAccountId }
            ]
        };
        const transactions = await getTransactions(transactionFilter);
        
        // Calculate cashin and cashout based on creditType
        const cashIn = transactions
            .filter(t => t.creditType === 'cashin')
            .reduce((sum, t) => sum + (t.amount || 0), 0);
        
        const cashOut = transactions
            .filter(t => t.creditType === 'cashout')
            .reduce((sum, t) => sum + (t.amount || 0), 0);
        
        // Overall calculation: Cash In - Cash Out
        const overall = cashIn - cashOut;

        console.log("Summary calculation:", { cashIn, cashOut, overall, transactionCount: transactions.length });

        return res.json({ 
            success: true, 
            accountExists: true,
            data: {
                account: {
                    _id: account?._id,
                    name: account?.name,
                    type: account?.type,
                    phoneNo: account?.phoneNo,
                    address: account?.address
                },
                cashIn,
                cashOut,
                overall,
                totalTransactions: transactions.length
            }
        });
    } catch (err) {
        console.log(err);
        return res.json({ 
            success: false, 
            msg: "Error getting payment summary",
            accountExists: false 
        });
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

        // Build transaction filter based on date range
        let transactionFilter = { sourceType: 'qarza' };
        if (startDate || endDate) {
            transactionFilter.transactionDate = {};
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                transactionFilter.transactionDate.$gte = start;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                transactionFilter.transactionDate.$lte = end;
            }
        }
        if (direction) {
            if (direction === 'incoming') {
                transactionFilter.creditType = 'cashin';
            } else if (direction === 'outgoing') {
                transactionFilter.creditType = 'cashout';
            }
        }

        console.log(transactionFilter)

        // Get all transactions matching filters
        const transactions = await getTransactions(transactionFilter);

        console.log(transactions, "the transactions in qarza report")
        // Get unique account IDs from transactions
        const accountIdsFromTransactions = [...new Set(transactions.map(t => t.sourceId.toString()))];

        // Build account filter
        let accountFilter = {};
        if (accountId) {
            accountFilter._id = accountId;
        } else if (startDate || endDate) {
            // If date filter is applied, only show accounts with transactions in that period
            accountFilter._id = { $in: accountIdsFromTransactions };
        }
        if (accountType) {
            accountFilter.type = accountType;
        }

        // Get accounts
        const accounts = await getAllQarzaAccountsService(accountFilter);

        // Calculate summary for each account based on actual transactions
        const accountSummaries = accounts.map(account => {
            const accountTransactions = transactions.filter(t => t.sourceId.toString() === account._id.toString());
            
            // Calculate from actual transactions
            const totalPaid = accountTransactions.filter(t => t.creditType === 'cashin').reduce((sum, t) => sum + (t.amount || 0), 0);
            const totalToPay = accountTransactions.filter(t => t.creditType === 'cashout').reduce((sum, t) => sum + (t.amount || 0), 0);
            const remainingBalance = totalToPay - totalPaid; // Positive = need to pay, Negative = they owe us
            
            const lastTransaction = accountTransactions.length > 0 ? accountTransactions[0].transactionDate : null;

            // Determine status based on actual transaction calculation
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
                lastTransaction: lastTransaction ? new Date(lastTransaction).toISOString() : null,
                tag,
                accountStatus,
                transactionCount: accountTransactions.length
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

        const account = await getQarzaAccountByIdService(accountId);
        if (!account) {
            return res.json({ success: false, msg: "Account not found" });
        }

        let transactionFilter = { sourceType: 'qarza', sourceId: accountId };
        if (startDate || endDate) {
            transactionFilter.transactionDate = {};
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                transactionFilter.transactionDate.$gte = start;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                transactionFilter.transactionDate.$lte = end;
            }
        }

        const transactions = await getTransactions(transactionFilter);

        // Calculate running balance
        let runningBalance = 0;
        const ledger = transactions.map(transaction => {
            const amount = transaction.creditType === 'cashin' ? (transaction.amount || 0) : -(transaction.amount || 0);
            runningBalance += amount;
            
            return {
                date: transaction.transactionDate ? new Date(transaction.transactionDate).toISOString() : null,
                description: transaction.notes || '',
                source: 'qarza',
                transactionType: 'credit',
                direction: transaction.creditType === 'cashin' ? 'incoming' : 'outgoing',
                debitAmount: transaction.creditType === 'cashout' ? (transaction.amount || 0) : 0,
                creditAmount: transaction.creditType === 'cashin' ? (transaction.amount || 0) : 0,
                runningBalance,
                orderNumber: '',
                orderId: null
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

export const getPaginatedQarzaPaymentsWithoutAccount = async (req, res) => {
    try {
        let page = parseInt(req.query.page) || 1;
        let limit = parseInt(req.query.limit) || 20;
        let skip = (page - 1) * limit;
        let search = req.query.search || "";
        
        let query = { sourceType: 'qarza', sourceId: { $exists: false } };
        
        if (search) {
            query.$or = [
                { notes: { $regex: search, $options: "i" } }
            ];
        }
        
        let transactions = await getTransactions(query);
        
        // Apply pagination manually
        let total = transactions.length;
        let paginatedTransactions = transactions.slice(skip, skip + limit);

        return res.json({ 
            success: true, 
            data: paginatedTransactions,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        });
    } catch (err) {
        console.log(err);
        return res.json({ success: false, msg: "Error getting payments without account" });
    }
};
