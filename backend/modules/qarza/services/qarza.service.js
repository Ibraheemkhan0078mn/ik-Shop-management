import { create, find, findOne, findById, update, deleteOne, count } from "./qarzaAccount.crud.js";
import { create as createPayment, find as findPayment, update as updatePayment, deleteOne as deletePayment } from "./qarzaPayment.crud.js";

const qarzaAccountCreate = async (data) => {
    return await create(data);
};

const getAllQarzaAccounts = async (query = {}) => {
    return await find(query).populate("payments").sort({ createdAt: -1 });
};

const getQarzaAccountById = async (id) => {
    return await findById(id).populate("payments");
};

const findQarzaAccountById = async (id) => {
    return await findOne({ _id: id });
};

const qarzaAccountUpdate = async (id, data) => {
    return await update(id, data);
};

const qarzaAccountDelete = async (id) => {
    return await deleteOne(id);
};

const countQarzaAccounts = async (query = {}) => {
    return await count(query);
};

const qarzaPaymentCreate = async (data) => {
    return await createPayment(data);
};

const getAllQarzaPayments = async (query = {}) => {
    return await findPayment(query).sort({ date: -1 });
};

const qarzaPaymentUpdate = async (id, data) => {
    return await updatePayment(id, data);
};

const qarzaPaymentDelete = async (id) => {
    return await deletePayment(id);
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
    qarzaPaymentUpdate,
    qarzaPaymentDelete,
};
