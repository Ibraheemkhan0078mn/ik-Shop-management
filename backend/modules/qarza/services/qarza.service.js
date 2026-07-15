import { createQarzaAccountService, findQarzaAccountService, findOneQarzaAccountService, findByIdQarzaAccountService, updateQarzaAccountService, deleteOneQarzaAccountService, countQarzaAccountService } from "./qarzaAccount.crud.js";
import { createQarzaPaymentService, findQarzaPaymentService, findOneQarzaPaymentService, findByIdQarzaPaymentService, updateQarzaPaymentService, deleteOneQarzaPaymentService, countQarzaPaymentService } from "./qarzaPayment.crud.js";

const qarzaAccountCreate = async (data) => {
    return await createQarzaAccountService(data);
};

const getAllQarzaAccounts = async (query = {}) => {
    return await findQarzaAccountService(query).populate("payments");
};

const getQarzaAccountById = async (id) => {
    return await findByIdQarzaAccountService(id).populate("payments");
};

const findQarzaAccountById = async (id) => {
    return await findOneQarzaAccountService({ _id: id });
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

const qarzaPaymentCreate = async (data) => {
    return await createQarzaPaymentService(data);
};

const getAllQarzaPayments = async (query = {}) => {
    return await findQarzaPaymentService(query).sort({ date: -1 });
};

const getPaginatedQarzaPayments = async (query = {}, skip = 0, limit = 20) => {
    return await findQarzaPaymentService(query)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit);
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
    qarzaAccountUpdate,
    qarzaAccountDelete,
    countQarzaAccounts,
    qarzaPaymentCreate,
    getAllQarzaPayments,
    getPaginatedQarzaPayments,
    countQarzaPayments,
    qarzaPaymentUpdate,
    qarzaPaymentDelete,
};
