import { createUserService, findOneUserService, findByIdUserService } from "./user.crud.js";

const userCreate = async (data) => {
    return await createUserService(data);
};

const findUserByEmail = async (email) => {
    return await findOneUserService({ email });
};

const findUserByEmailWithPassword = async (email) => {
    return await findOneUserService({ email }, { select: "+password" });
};

const findUserById = async (id) => {
    return await findOneUserService({ _id: id });
};

const findUserByIdWithoutPassword = async (id) => {
    return await findByIdUserService(id, { select: "-password" });
};

export {
    userCreate,
    findUserByEmail,
    findUserByEmailWithPassword,
    findUserById,
    findUserByIdWithoutPassword,
};
