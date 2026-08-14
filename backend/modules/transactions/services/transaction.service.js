import { createDoc, findDocs, findOneDoc, updateDocs, deleteDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";
import { getLocalTransactionModel } from "../../../configs/connect.db.js";

const createTransactionService = (data) => {
    const TransactionModel = getLocalTransactionModel();
    return createDoc({ model: TransactionModel, data });
};

const findTransactionService = (query = {}, options = {}) => {
    const TransactionModel = getLocalTransactionModel();
    return findDocs({ model: TransactionModel, filter: query, options });
};

const findOneTransactionService = (query) => {
    const TransactionModel = getLocalTransactionModel();
    return findOneDoc({ model: TransactionModel, filter: query });
};

const findByIdTransactionService = (id, options = {}) => {
    const TransactionModel = getLocalTransactionModel();
    return findOneDoc({ model: TransactionModel, filter: { _id: id }, options });
};

const updateTransactionService = (id, data) => {
    const TransactionModel = getLocalTransactionModel();
    return updateDocs({ model: TransactionModel, filter: { _id: id }, data });
};

const deleteOneTransactionService = (id) => {
    const TransactionModel = getLocalTransactionModel();
    return deleteDocs({ model: TransactionModel, filter: { _id: id } });
};

const countTransactionService = (query) => {
    const TransactionModel = getLocalTransactionModel();
    return TransactionModel.countDocuments(query);
};

// Module service functions with business logic
const getTransactions = async (filter = {}) => {
    // Build query from filter object
    const query = { isDeleted: false };
    
    if (filter.sourceType) {
        query.sourceType = filter.sourceType;
    }
    if (filter.sourceId) {
        query.sourceId = filter.sourceId;
    }
    if (filter.method) {
        query.method = filter.method;
    }
    if (filter.creditAccount) {
        query.creditAccount = filter.creditAccount;
    }
    if (filter.paymentMethod) {
        query.paymentMethod = filter.paymentMethod;
    }
    if (filter.createdBy) {
        query.createdBy = filter.createdBy;
    }
    
    // Pass-through for MongoDB operators and creditType
    if (filter.$or) {
        query.$or = filter.$or;
    }
    if (filter.$and) {
        query.$and = filter.$and;
    }
    if (filter.creditType) {
        query.creditType = filter.creditType;
    }
    
    // Date range filters
    if (filter.startDate || filter.endDate) {
        query.transactionDate = {};
        if (filter.startDate) {
            query.transactionDate.$gte = new Date(filter.startDate);
        }
        if (filter.endDate) {
            query.transactionDate.$lte = new Date(filter.endDate);
        }
    }
    
    const result = await findTransactionService(query, {
        populate: ['creditAccount', 'paymentMethod', 'createdBy'],
        sort: { transactionDate: -1 }
    });
    
    // Return array directly, unwrapping if result has data property
    return Array.isArray(result) ? result : (result?.data || []);
};

const getTransactionById = async (id) => {
    return await findByIdTransactionService(id, {
        populate: ['creditAccount', 'paymentMethod', 'createdBy']
    });
};

const getTransactionsBySource = async (sourceType, sourceId) => {
    return await findTransactionService(
        { sourceType, sourceId, isDeleted: false },
        { 
            populate: ['creditAccount', 'paymentMethod'],
            sort: { transactionDate: -1 } 
        }
    );
};

const createTransaction = async (data) => {
    return await createTransactionService(data);
};

const updateTransaction = async (id, data) => {
    return await updateTransactionService(id, data);
};

const deleteTransaction = async (id) => {
    return await deleteOneTransactionService(id);
};

/**
 * Create transaction(s) for a purchase payment
 * - Cash: creates 1 transaction
 * - Credit: creates 1 transaction with credit account
 * - Hybrid: creates 2 transactions (1 cash, 1 credit)
 */
const createPurchaseTransaction = async (paymentData) => {
    const {
        purchase,
        paymentMethod,
        amount,
        cashAmount,
        creditAmount,
        creditAccount,
        paymentMethodId,
        paymentMethodName,
        paymentDate,
        notes,
        createdBy
    } = paymentData;

    const transactions = [];

    if (paymentMethod === 'cash') {
        // Single cash transaction
        const cashTransaction = await createTransactionService({
            sourceType: 'purchase',
            sourceId: purchase,
            method: 'cash',
            amount: amount,
            cashAmount: cashAmount || amount,
            creditAmount: 0,
            paymentMethod: paymentMethodId,
            paymentMethodName: paymentMethodName,
            transactionDate: paymentDate,
            notes: notes || `Cash payment for purchase`,
            createdBy,
        });
        transactions.push(cashTransaction);

    } else if (paymentMethod === 'credit') {
        // Single credit transaction
        const creditTransaction = await createTransactionService({
            sourceType: 'purchase',
            sourceId: purchase,
            method: 'credit',
            amount: amount,
            cashAmount: 0,
            creditAmount: creditAmount || amount,
            creditAccount: creditAccount,
            creditType: 'cashin', // We're receiving credit, so it's cashin
            transactionDate: paymentDate,
            notes: notes || `Credit payment for purchase`,
            createdBy,
        });
        transactions.push(creditTransaction);

    } else if (paymentMethod === 'hybrid') {
        // Two transactions: one cash, one credit
        const cashTransaction = await createTransactionService({
            sourceType: 'purchase',
            sourceId: purchase,
            method: 'cash',
            amount: cashAmount,
            cashAmount: cashAmount,
            creditAmount: 0,
            paymentMethod: paymentMethodId,
            paymentMethodName: paymentMethodName,
            transactionDate: paymentDate,
            notes: notes ? `${notes} (cash portion)` : `Cash portion of hybrid payment for purchase`,
            createdBy,
        });
        transactions.push(cashTransaction);

        const creditTransaction = await createTransactionService({
            sourceType: 'purchase',
            sourceId: purchase,
            method: 'credit',
            amount: creditAmount,
            cashAmount: 0,
            creditAmount: creditAmount,
            creditAccount: creditAccount,
            creditType: 'cashin', // We're receiving credit, so it's cashin
            transactionDate: paymentDate,
            notes: notes ? `${notes} (credit portion)` : `Credit portion of hybrid payment for purchase`,
            createdBy,
        });
        transactions.push(creditTransaction);
    }

    return transactions;
};

/**
 * Create transaction(s) for a POS order payment
 * - Cash: creates 1 transaction with type 'pos-order-payment'
 * - Credit: creates 1 transaction with credit account
 * - Hybrid: creates 2 transactions (1 cash, 1 credit)
 */
const createSaleTransaction = async (paymentData) => {
    const {
        order,
        paymentMethod,
        amount,
        cashAmount,
        creditAmount,
        creditAccount,
        paymentMethodId,
        paymentMethodName,
        paymentDate,
        notes,
        createdBy
    } = paymentData;

    const transactions = [];

    if (paymentMethod === 'cash') {
        // Single cash transaction
        const cashTransaction = await createTransactionService({
            sourceType: 'sale',
            sourceId: order,
            method: 'cash',
            amount: amount,
            cashAmount: cashAmount || amount,
            creditAmount: 0,
            paymentMethod: paymentMethodId,
            paymentMethodName: paymentMethodName,
            transactionDate: paymentDate,
            notes: notes || `Cash payment for POS order`,
            createdBy,
        });
        transactions.push(cashTransaction);

    } else if (paymentMethod === 'credit') {
        // Single credit transaction
        const creditTransaction = await createTransactionService({
            sourceType: 'sale',
            sourceId: order,
            method: 'credit',
            amount: amount,
            cashAmount: 0,
            creditAmount: creditAmount || amount,
            creditAccount: creditAccount,
            creditType: 'cashout', // We're giving credit, so it's cashout
            transactionDate: paymentDate,
            notes: notes || `Credit payment for POS order`,
            createdBy,
        });
        transactions.push(creditTransaction);

    } else if (paymentMethod === 'hybrid') {
        // Two transactions: one cash, one credit
        const cashTransaction = await createTransactionService({
            sourceType: 'sale',
            sourceId: order,
            method: 'cash',
            amount: cashAmount,
            cashAmount: cashAmount,
            creditAmount: 0,
            paymentMethod: paymentMethodId,
            paymentMethodName: paymentMethodName,
            transactionDate: paymentDate,
            notes: notes ? `${notes} (cash portion)` : `Cash portion of hybrid payment for POS order`,
            createdBy,
        });
        transactions.push(cashTransaction);

        const creditTransaction = await createTransactionService({
            sourceType: 'sale',
            sourceId: order,
            method: 'credit',
            amount: creditAmount,
            cashAmount: 0,
            creditAmount: creditAmount,
            creditAccount: creditAccount,
            creditType: 'cashout', // We're giving credit, so it's cashout
            transactionDate: paymentDate,
            notes: notes ? `${notes} (credit portion)` : `Credit portion of hybrid payment for POS order`,
            createdBy,
        });
        transactions.push(creditTransaction);
    }

    return transactions;
};

/**
 * Create transaction(s) for a purchase return refund
 * - Cash: creates 1 transaction (cash outflow - we're refunding money)
 * - Credit: creates 1 transaction with credit account (reducing credit balance)
 * - Hybrid: creates 2 transactions (1 cash, 1 credit)
 */
const createPurchaseReturnTransaction = async (paymentData) => {
    const {
        purchaseReturn,
        paymentMethod,
        amount,
        cashAmount,
        creditAmount,
        creditAccount,
        paymentMethodId,
        paymentMethodName,
        paymentDate,
        notes,
        createdBy
    } = paymentData;

    const transactions = [];

    if (paymentMethod === 'cash') {
        // Single cash transaction (outflow - we're giving money back)
        const cashTransaction = await createTransactionService({
            sourceType: 'purchaseReturn',
            sourceId: purchaseReturn,
            method: 'cash',
            amount: amount,
            cashAmount: cashAmount || amount,
            creditAmount: 0,
            paymentMethod: paymentMethodId,
            paymentMethodName: paymentMethodName,
            transactionDate: paymentDate,
            notes: notes || `Cash refund for purchase return`,
            createdBy,
        });
        transactions.push(cashTransaction);

    } else if (paymentMethod === 'credit') {
        // Single credit transaction (reducing credit balance - cashout)
        const creditTransaction = await createTransactionService({
            sourceType: 'purchaseReturn',
            sourceId: purchaseReturn,
            method: 'credit',
            amount: amount,
            cashAmount: 0,
            creditAmount: creditAmount || amount,
            creditAccount: creditAccount,
            creditType: 'cashout', // We're reducing credit owed to us, so it's cashout
            transactionDate: paymentDate,
            notes: notes || `Credit refund for purchase return`,
            createdBy,
        });
        transactions.push(creditTransaction);

    } else if (paymentMethod === 'hybrid') {
        // Two transactions: one cash, one credit
        const cashTransaction = await createTransactionService({
            sourceType: 'purchaseReturn',
            sourceId: purchaseReturn,
            method: 'cash',
            amount: cashAmount,
            cashAmount: cashAmount,
            creditAmount: 0,
            paymentMethod: paymentMethodId,
            paymentMethodName: paymentMethodName,
            transactionDate: paymentDate,
            notes: notes ? `${notes} (cash portion)` : `Cash portion of hybrid refund for purchase return`,
            createdBy,
        });
        transactions.push(cashTransaction);

        const creditTransaction = await createTransactionService({
            sourceType: 'purchaseReturn',
            sourceId: purchaseReturn,
            method: 'credit',
            amount: creditAmount,
            cashAmount: 0,
            creditAmount: creditAmount,
            creditAccount: creditAccount,
            creditType: 'cashout', // We're reducing credit owed to us, so it's cashout
            transactionDate: paymentDate,
            notes: notes ? `${notes} (credit portion)` : `Credit portion of hybrid refund for purchase return`,
            createdBy,
        });
        transactions.push(creditTransaction);
    }

    return transactions;
};

/**
 * Create transaction(s) for an order return refund
 * - Cash: creates 1 transaction (cash outflow - we're refunding money)
 * - Credit: creates 1 transaction with credit account (receiving credit back - cashin)
 * - Hybrid: creates 2 transactions (1 cash, 1 credit)
 */
const createOrderReturnTransaction = async (paymentData) => {
    const {
        productReturn,
        paymentMethod,
        amount,
        cashAmount,
        creditAmount,
        creditAccount,
        paymentMethodId,
        paymentMethodName,
        paymentDate,
        notes,
        createdBy
    } = paymentData;

    const transactions = [];

    if (paymentMethod === 'cash') {
        // Single cash transaction (outflow - we're giving money back)
        const cashTransaction = await createTransactionService({
            sourceType: 'orderReturn',
            sourceId: productReturn,
            method: 'cash',
            amount: amount,
            cashAmount: cashAmount || amount,
            creditAmount: 0,
            paymentMethod: paymentMethodId,
            paymentMethodName: paymentMethodName,
            transactionDate: paymentDate,
            notes: notes || `Cash refund for order return`,
            createdBy,
        });
        transactions.push(cashTransaction);

    } else if (paymentMethod === 'credit') {
        // Single credit transaction (receiving credit back - cashin)
        const creditTransaction = await createTransactionService({
            sourceType: 'orderReturn',
            sourceId: productReturn,
            method: 'credit',
            amount: amount,
            cashAmount: 0,
            creditAmount: creditAmount || amount,
            creditAccount: creditAccount,
            creditType: 'cashin', // We're receiving credit back from customer, so it's cashin
            transactionDate: paymentDate,
            notes: notes || `Credit refund for order return`,
            createdBy,
        });
        transactions.push(creditTransaction);

    } else if (paymentMethod === 'hybrid') {
        // Two transactions: one cash, one credit
        const cashTransaction = await createTransactionService({
            sourceType: 'orderReturn',
            sourceId: productReturn,
            method: 'cash',
            amount: cashAmount,
            cashAmount: cashAmount,
            creditAmount: 0,
            paymentMethod: paymentMethodId,
            paymentMethodName: paymentMethodName,
            transactionDate: paymentDate,
            notes: notes ? `${notes} (cash portion)` : `Cash portion of hybrid refund for order return`,
            createdBy,
        });
        transactions.push(cashTransaction);

        const creditTransaction = await createTransactionService({
            sourceType: 'orderReturn',
            sourceId: productReturn,
            method: 'credit',
            amount: creditAmount,
            cashAmount: 0,
            creditAmount: creditAmount,
            creditAccount: creditAccount,
            creditType: 'cashin', // We're receiving credit back from customer, so it's cashin
            transactionDate: paymentDate,
            notes: notes ? `${notes} (credit portion)` : `Credit portion of hybrid refund for order return`,
            createdBy,
        });
        transactions.push(creditTransaction);
    }

    return transactions;
};

export {
    createTransactionService,
    findTransactionService,
    findOneTransactionService,
    findByIdTransactionService,
    updateTransactionService,
    deleteOneTransactionService,
    countTransactionService,
    getTransactions,
    getTransactionById,
    getTransactionsBySource,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    createPurchaseTransaction,
    createSaleTransaction,
    createPurchaseReturnTransaction,
    createOrderReturnTransaction
};
