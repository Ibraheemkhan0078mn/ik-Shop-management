import { createWastageService, findWastageService, findOneWastageService, findByIdWastageService, updateWastageService, deleteOneWastageService, countWastageService } from "./wastage.crud.js";

const wastageCreate = async (data) => {
    return await createWastageService(data);
};

const getAllWastages = (query = {}) => {
    return findWastageService(query, { populate: [{ path: 'items.product', select: 'name _id' }], sort: { createdAt: -1 } });
};

const getWastageById = async (id) => {
    return await findByIdWastageService(id, { populate: [{ path: 'items.product', select: 'name _id' }] });
};

const wastageUpdate = async (id, data) => {
    return await updateWastageService(id, data);
};

const wastageDelete = async (id) => {
    return await deleteOneWastageService(id);
};

const countWastages = async (query = {}) => {
    return await countWastageService(query);
};

export {
    wastageCreate,
    getAllWastages,
    getWastageById,
    wastageUpdate,
    wastageDelete,
    countWastages,
};
