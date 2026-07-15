import { createDoc, findDocs, findOneDoc, updateDocs, deleteDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";
import { getLocalUserModel } from "../../../configs/connect.db.js";

const createUserService = (data) => {
    const UserModel = getLocalUserModel();
    return createDoc({ model: UserModel, data });
};

const findUserService = (query = {}, options = {}) => {
    const UserModel = getLocalUserModel();
    return findDocs({ model: UserModel, filter: query, options });
};

const findOneUserService = (query, options = {}) => {
    const UserModel = getLocalUserModel();
    const { select } = options;
    return findOneDoc({ model: UserModel, filter: query, options: { select } });
};

const findByIdUserService = (id, options = {}) => {
    const UserModel = getLocalUserModel();
    const { select } = options;
    return findOneDoc({ model: UserModel, filter: { _id: id }, options: { select } });
};

const updateUserService = (id, data) => {
    const UserModel = getLocalUserModel();
    return updateDocs({ model: UserModel, filter: { _id: id }, data });
};

const deleteOneUserService = (id) => {
    const UserModel = getLocalUserModel();
    return deleteDocs({ model: UserModel, filter: { _id: id } });
};

const countUserService = (query) => {
    const UserModel = getLocalUserModel();
    return UserModel.countDocuments(query);
};

export { createUserService, findUserService, findOneUserService, findByIdUserService, updateUserService, deleteOneUserService, countUserService };
