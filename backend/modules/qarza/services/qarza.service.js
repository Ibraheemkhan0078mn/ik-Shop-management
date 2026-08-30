import { createQarzaAccountService, findQarzaAccountService, findOneQarzaAccountService, findByIdQarzaAccountService, updateQarzaAccountService, deleteOneQarzaAccountService, countQarzaAccountService } from "./qarzaAccount.crud.js";
import { createQarzaPaymentService, findQarzaPaymentService, findOneQarzaPaymentService, findByIdQarzaPaymentService, updateQarzaPaymentService, deleteOneQarzaPaymentService, countQarzaPaymentService } from "./qarzaPayment.crud.js";

const qarzaAccountCreate = async (data) => {
    return await createQarzaAccountService(data);
};

const getAllQarzaAccounts = async (query = {}) => {
    return await findQarzaAccountService(query, { populate: "payments", sort: { createdAt: -1 } });
};

const getQarzaAccountById = async (id) => {
    return await findByIdQarzaAccountService(id, { populate: "payments" });
};

const findQarzaAccountById = async (id) => {
    return await findOneQarzaAccountService({ _id: id });
};

const findQarzaAccountByTypeAndName = async (type, name) => {
    return await findOneQarzaAccountService({ type, name });
};

const qarzaAccountUpdate = async (id, data) => {
    return await updateQarzaAccountService(id, data);
};

const qarzaAccountDelete = async (id) => {
    return await deleteOneQarzaAccountService(id);
};

const countQarzaAccounts = async (query = {}) => {
    return await countQarzaAccountService(query);
};

// Search qarza accounts by name or phone
const searchQarzaAccounts = async (query = "", limit = 20) => {
    if (!query || query.length < 1) {
        return [];
    }

    const searchRegex = new RegExp(query, 'i');
    const startsWithRegex = new RegExp(`^${query}`, 'i');

    // Get results that start with the query (higher priority)
    const startsWithResults = await findQarzaAccountService({
        $or: [
            { name: startsWithRegex },
            { phoneNo: startsWithRegex }
        ],
        isActive: { $ne: false }
    }, {
        limit: parseInt(limit),
        sort: { name: 1 }
    });

    // If we have enough results from startsWith, return them
    if (startsWithResults.length >= limit) {
        return startsWithResults.slice(0, limit);
    }

    // Get results that contain the query anywhere (lower priority)
    const containsResults = await findQarzaAccountService({
        $or: [
            { name: searchRegex },
            { phoneNo: searchRegex }
        ],
        isActive: { $ne: false },
        _id: { $nin: startsWithResults.map(q => q._id) } // Exclude already found
    }, {
        limit: parseInt(limit) - startsWithResults.length,
        sort: { name: 1 }
    });

    // Combine: startsWith results first, then contains results
    return [...startsWithResults, ...containsResults];
};

const qarzaPaymentCreate = async (data) => {
    return await createQarzaPaymentService(data);
};

const getAllQarzaPayments = async (query = {}) => {
    return await findQarzaPaymentService(query, { sort: { date: -1 } });
};

const getPaginatedQarzaPayments = async (query = {}, skip = 0, limit = 20) => {
    return await findQarzaPaymentService(query, { sort: { date: -1 }, skip, limit });
};

const countQarzaPayments = async (query = {}) => {
    return await countQarzaPaymentService(query);
};

const qarzaPaymentUpdate = async (id, data) => {
    return await updateQarzaPaymentService(id, data);
};

const qarzaPaymentDelete = async (id) => {
    return await deleteOneQarzaPaymentService(id);
};

export {
    qarzaAccountCreate,
    getAllQarzaAccounts,
    getQarzaAccountById,
    findQarzaAccountById,
    findQarzaAccountByTypeAndName,
    qarzaAccountUpdate,
    qarzaAccountDelete,
    countQarzaAccounts,
    searchQarzaAccounts,
    qarzaPaymentCreate,
    getAllQarzaPayments,
    getPaginatedQarzaPayments,
    countQarzaPayments,
    qarzaPaymentUpdate,
    qarzaPaymentDelete,
};
