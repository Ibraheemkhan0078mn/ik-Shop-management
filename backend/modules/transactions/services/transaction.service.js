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
    
    return await findTransactionService(query, {
        populate: ['creditAccount', 'paymentMethod', 'createdBy'],
        sort: { transactionDate: -1 }
    });
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
    deleteTransaction
};
