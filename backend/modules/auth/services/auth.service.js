import { createUserService, findOneUserService } from "./user.crud.js";

const userCreate = async (data) => {
    return await createUserService(data);
};

const findUserByEmail = async (email) => {
    return await findOneUserService({ email });
};

const findUserById = async (id) => {
    return await findOneUserService({ _id: id });
};

export {
    userCreate,
    findUserByEmail,
    findUserById,
};
