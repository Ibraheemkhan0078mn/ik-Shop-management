import { create, find, findOne, findById, update, deleteOne, count } from "./wastage.crud.js";

const wastageCreate = async (data) => {
    return await create(data);
};

const getAllWastages = async (query = {}) => {
    return await find(query).populate("items.product").populate("createdBy", "name email").populate("approvedBy", "name email").sort({ createdAt: -1 });
};

const getWastageById = async (id) => {
    return await findById(id).populate("items.product").populate("createdBy", "name email").populate("approvedBy", "name email");
};

const wastageUpdate = async (id, data) => {
    return await update(id, data);
};

const wastageDelete = async (id) => {
    return await deleteOne(id);
};

const countWastages = async (query = {}) => {
    return await count(query);
};

export {
    wastageCreate,
    getAllWastages,
    getWastageById,
    wastageUpdate,
    wastageDelete,
    countWastages,
};
