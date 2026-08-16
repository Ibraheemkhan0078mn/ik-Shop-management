import { createDoc, findDocs, findOneDoc, updateDocs, deleteDocs, countDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";
import { getOnlineUserModel } from "../../../configs/onlineConnect.db.js";

const createOnlineUserService = (data) => {
    const UserModel = getOnlineUserModel();
    if (!UserModel) return null;
    return createDoc({ model: UserModel, data });
};

const findOnlineUserService = (query = {}, options = {}) => {
    const UserModel = getOnlineUserModel();
    if (!UserModel) return null;
    return findDocs({ model: UserModel, filter: query, options });
};

const findOneOnlineUserService = (query, options = {}) => {
    const UserModel = getOnlineUserModel();
    if (!UserModel) return null;
    const { select, lean = true } = options;
    return findOneDoc({ model: UserModel, filter: query, options: { select, lean } });
};

const findByIdOnlineUserService = (id, options = {}) => {
    const UserModel = getOnlineUserModel();
    if (!UserModel) return null;
    const { select } = options;
    return findOneDoc({ model: UserModel, filter: { _id: id }, options: { select } });
};

const updateOnlineUserService = (id, data) => {
    const UserModel = getOnlineUserModel();
    if (!UserModel) return null;
    return updateDocs({ model: UserModel, filter: { _id: id }, data });
};

const deleteOneOnlineUserService = (id) => {
    const UserModel = getOnlineUserModel();
    if (!UserModel) return null;
    return deleteDocs({ model: UserModel, filter: { _id: id } });
};

const countOnlineUserService = (query) => {
    const UserModel = getOnlineUserModel();
    if (!UserModel) return null;
    return countDocs({ model: UserModel, filter: query });
};

export { 
    createOnlineUserService, 
    findOnlineUserService, 
    findOneOnlineUserService, 
    findByIdOnlineUserService, 
    updateOnlineUserService, 
    deleteOneOnlineUserService, 
    countOnlineUserService 
};
