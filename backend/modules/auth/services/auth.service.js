import { create, findOne } from "./user.crud.js";

const userCreate = async (data) => {
    return await create(data);
};

const findUserByEmail = async (email) => {
    return await findOne({ email });
};

const findUserById = async (id) => {
    return await findOne({ _id: id });
};

export {
    userCreate,
    findUserByEmail,
    findUserById,
};
