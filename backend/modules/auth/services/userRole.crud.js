import { createDoc, findDocs, findOneDoc, updateDocs, deleteDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";
import { getLocalUserRoleModel } from "../../../configs/connect.db.js";

const createUserRoleService = (data) => {
    const UserRoleModel = getLocalUserRoleModel();
    return createDoc({ model: UserRoleModel, data });
};

const findUserRoleService = (query = {}, options = {}) => {
    const UserRoleModel = getLocalUserRoleModel();
    return findDocs({ model: UserRoleModel, filter: query, options });
};

const findOneUserRoleService = (query, options = {}) => {
    const UserRoleModel = getLocalUserRoleModel();
    const { select, lean = true } = options;
    return findOneDoc({ model: UserRoleModel, filter: query, options: { select, lean } });
};

const findByIdUserRoleService = (id, options = {}) => {
    const UserRoleModel = getLocalUserRoleModel();
    const { select } = options;
    return findOneDoc({ model: UserRoleModel, filter: { _id: id }, options: { select } });
};

const updateUserRoleService = (id, data) => {
    const UserRoleModel = getLocalUserRoleModel();
    return updateDocs({ model: UserRoleModel, filter: { _id: id }, data });
};

const deleteOneUserRoleService = (id) => {
    const UserRoleModel = getLocalUserRoleModel();
    return deleteDocs({ model: UserRoleModel, filter: { _id: id } });
};

const countUserRoleService = (query) => {
    const UserRoleModel = getLocalUserRoleModel();
    return UserRoleModel.countDocuments(query);
};

export { createUserRoleService, findUserRoleService, findOneUserRoleService, findByIdUserRoleService, updateUserRoleService, deleteOneUserRoleService, countUserRoleService };
