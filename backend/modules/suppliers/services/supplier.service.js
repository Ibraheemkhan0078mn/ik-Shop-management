import { createSupplierService, findSupplierService, findOneSupplierService, findByIdSupplierService, updateSupplierService, deleteOneSupplierService, countSupplierService } from "./supplier.crud.js";

const supplierCreate = async (data) => {
    return await createSupplierService(data);
};

const getAllSuppliers = async (query = {}) => {
    return await findSupplierService(query).sort({ createdAt: -1 });
};

const getSupplierById = async (id) => {
    return await findByIdSupplierService(id);
};

const findSupplierByName = async (name) => {
    return await findOneSupplierService({ name });
};

const supplierUpdate = async (id, data) => {
    return await updateSupplierService(id, data);
};

const supplierDelete = async (id) => {
    return await deleteOneSupplierService(id);
};

const countSuppliers = async (query = {}) => {
    return await countSupplierService(query);
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
