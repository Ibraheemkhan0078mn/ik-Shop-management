import { create, find, findOne, findById, update, deleteOne, count } from "./supplier.crud.js";

const supplierCreate = async (data) => {
    return await create(data);
};

const getAllSuppliers = async (query = {}) => {
    return await find(query).sort({ createdAt: -1 });
};

const getSupplierById = async (id) => {
    return await findById(id);
};

const findSupplierByName = async (name) => {
    return await findOne({ name });
};

const supplierUpdate = async (id, data) => {
    return await update(id, data);
};

const supplierDelete = async (id) => {
    return await deleteOne(id);
};

const countSuppliers = async (query = {}) => {
    return await count(query);
};

export {
    supplierCreate,
    getAllSuppliers,
    getSupplierById,
    findSupplierByName,
    supplierUpdate,
    supplierDelete,
    countSuppliers,
};
