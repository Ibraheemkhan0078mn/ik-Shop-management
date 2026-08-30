import { createSupplierService, findSupplierService, findOneSupplierService, findByIdSupplierService, updateSupplierService, deleteOneSupplierService, countSupplierService } from "./supplier.crud.js";

const supplierCreate = async (data) => {
    return await createSupplierService(data);
};

const getAllSuppliers = async (query = {}) => {
    return await findSupplierService(query, { sort: { createdAt: -1 } });
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

// Search suppliers by name, phone, or address - without pagination
const searchSuppliers = async (query = "", limit = 20) => {
    if (!query || query.length < 1) {
        return [];
    }

    const searchRegex = new RegExp(query, 'i');
    const startsWithRegex = new RegExp(`^${query}`, 'i');

    // Get results that start with the query (higher priority)
    const startsWithResults = await findSupplierService({
        $or: [
            { name: startsWithRegex },
            { phone: startsWithRegex },
            { address: startsWithRegex }
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
    const containsResults = await findSupplierService({
        $or: [
            { name: searchRegex },
            { phone: searchRegex },
            { address: searchRegex }
        ],
        isActive: { $ne: false },
        _id: { $nin: startsWithResults.map(s => s._id) } // Exclude already found
    }, {
        limit: parseInt(limit) - startsWithResults.length,
        sort: { name: 1 }
    });

    // Combine: startsWith results first, then contains results
    return [...startsWithResults, ...containsResults];
};

export {
    supplierCreate,
    getAllSuppliers,
    getSupplierById,
    findSupplierByName,
    supplierUpdate,
    supplierDelete,
    countSuppliers,
    searchSuppliers,
};
