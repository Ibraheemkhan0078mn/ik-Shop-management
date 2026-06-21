import { getLocalUserModel } from "../../../configs/connect.db.js";

const createUserService = (data) => {
    const UserModel = getLocalUserModel();
    return UserModel.create(data);
};

const findUserService = (query = {}) => {
    const UserModel = getLocalUserModel();
    return UserModel.find(query);
};

const findOneUserService = (query) => {
    const UserModel = getLocalUserModel();
    return UserModel.findOne(query);
};

const findByIdUserService = (id) => {
    const UserModel = getLocalUserModel();
    return UserModel.findById(id);
};

const updateUserService = (id, data) => {
    const UserModel = getLocalUserModel();
    return UserModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

const deleteOneUserService = (id) => {
    const UserModel = getLocalUserModel();
    return UserModel.findByIdAndDelete(id);
};

const countUserService = (query) => {
    const UserModel = getLocalUserModel();
    return UserModel.countDocuments(query);
};

export { createUserService, findUserService, findOneUserService, findByIdUserService, updateUserService, deleteOneUserService, countUserService };
