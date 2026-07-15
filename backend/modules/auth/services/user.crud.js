import { createDoc, findDocs, findOneDoc, updateDocs, deleteDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";
import { getLocalUserModel } from "../../../configs/connect.db.js";

const UserModel = getLocalUserModel();

const createUserService = (data) => {
    return createDoc({ model: UserModel, data });
};

const findUserService = (query = {}) => {
    return findDocs({ model: UserModel, filter: query });
};

const findOneUserService = (query, options = {}) => {
    const { select } = options;
    return findOneDoc({ model: UserModel, filter: query, options: { select } });
};

const findByIdUserService = (id, options = {}) => {
    const { select } = options;
    return findOneDoc({ model: UserModel, filter: { _id: id }, options: { select } });
};

const updateUserService = (id, data) => {
    return updateDocs({ model: UserModel, filter: { _id: id }, data });
};

const deleteOneUserService = (id) => {
    return deleteDocs({ model: UserModel, filter: { _id: id } });
};

const countUserService = (query) => {
    return UserModel.countDocuments(query);
};

export { createUserService, findUserService, findOneUserService, findByIdUserService, updateUserService, deleteOneUserService, countUserService };
