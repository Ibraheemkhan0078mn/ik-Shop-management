import { createDoc, findDocs, findOneDoc, updateDocs, deleteDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";
import { getLocalQarzaAccountModel } from "../../../configs/connect.db.js";

const QarzaAccountModel = getLocalQarzaAccountModel();

const createQarzaAccountService = (data) => {
    return createDoc({ model: QarzaAccountModel, data });
};

const findQarzaAccountService = (query = {}) => {
    return QarzaAccountModel.find(query).sort({ createdAt: -1 });
};

const findOneQarzaAccountService = (query) => {
    return findOneDoc({ model: QarzaAccountModel, filter: query });
};

const findByIdQarzaAccountService = (id) => {
    return findOneDoc({ model: QarzaAccountModel, filter: { _id: id } });
};

const updateQarzaAccountService = (id, data) => {
    return updateDocs({ model: QarzaAccountModel, filter: { _id: id }, data });
};

const deleteOneQarzaAccountService = (id) => {
    return deleteDocs({ model: QarzaAccountModel, filter: { _id: id } });
};

const countQarzaAccountService = (query) => {
    return QarzaAccountModel.countDocuments(query);
};

export { createQarzaAccountService, findQarzaAccountService, findOneQarzaAccountService, findByIdQarzaAccountService, updateQarzaAccountService, deleteOneQarzaAccountService, countQarzaAccountService };
