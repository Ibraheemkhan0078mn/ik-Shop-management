import { createUserService, findUserService, findOneUserService, findByIdUserService, updateUserService, deleteOneUserService, countUserService } from "./user.crud.js";

const getAllUsers = async (query = {}) => {
    return await findUserService(query, { select: "-password", sort: { createdAt: -1 } });
};

const getUserById = async (id) => {
    return await findByIdUserService(id, { select: "-password" });
};

const findUserById = async (id) => {
    return await findOneUserService({ _id: id });
};

const userUpdate = async (id, data) => {
    return await updateUserService(id, data);
};

const userDelete = async (id) => {
    // Soft delete the user - marks as deleted but keeps in database
    return await deleteOneUserService(id);
};

const countUsers = async (query = {}) => {
    return await countUserService(query);
};

export {
    getAllUsers,
    getUserById,
    findUserById,
    userUpdate,
    userDelete,
    countUsers,
};
