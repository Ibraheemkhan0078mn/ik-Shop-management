import { createDoc, findDocs, findOneDoc, updateDocs, deleteDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";
import { getLocalQarzaAccountModel } from "../../../configs/connect.db.js";

const createQarzaAccountService = (data) => {
    const QarzaAccountModel = getLocalQarzaAccountModel();
    return createDoc({ model: QarzaAccountModel, data });
};

const findQarzaAccountService = (query = {}, options = {}) => {
    const QarzaAccountModel = getLocalQarzaAccountModel();
    return findDocs({ model: QarzaAccountModel, filter: query, options });
};

const findOneQarzaAccountService = (query, options = {}) => {
    const QarzaAccountModel = getLocalQarzaAccountModel();
    return findOneDoc({ model: QarzaAccountModel, filter: query, options });
};

const findByIdQarzaAccountService = (id, options = {}) => {
    const QarzaAccountModel = getLocalQarzaAccountModel();
    return findOneDoc({ model: QarzaAccountModel, filter: { _id: id }, options });
};

const updateQarzaAccountService = (id, data) => {
    const QarzaAccountModel = getLocalQarzaAccountModel();
    return updateDocs({ model: QarzaAccountModel, filter: { _id: id }, data });
};

const deleteOneQarzaAccountService = (id) => {
    const QarzaAccountModel = getLocalQarzaAccountModel();
    return deleteDocs({ model: QarzaAccountModel, filter: { _id: id } });
};

const countQarzaAccountService = (query) => {
    const QarzaAccountModel = getLocalQarzaAccountModel();
    return QarzaAccountModel.countDocuments(query);
};

export { createQarzaAccountService, findQarzaAccountService, findOneQarzaAccountService, findByIdQarzaAccountService, updateQarzaAccountService, deleteOneQarzaAccountService, countQarzaAccountService };
