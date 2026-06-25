import { getLocalQarzaAccountModel } from "../../../configs/connect.db.js";

const createQarzaAccountService = (data) => {
    const QarzaAccountModel = getLocalQarzaAccountModel();
    return QarzaAccountModel.create(data);
};

const findQarzaAccountService = (query = {}) => {
    const QarzaAccountModel = getLocalQarzaAccountModel();
    return QarzaAccountModel.find(query).sort({ createdAt: -1 });
};

const findOneQarzaAccountService = (query) => {
    const QarzaAccountModel = getLocalQarzaAccountModel();
    return QarzaAccountModel.findOne(query);
};

const findByIdQarzaAccountService = (id) => {
    const QarzaAccountModel = getLocalQarzaAccountModel();
    return QarzaAccountModel.findById(id);
};

const updateQarzaAccountService = (id, data) => {
    const QarzaAccountModel = getLocalQarzaAccountModel();
    return QarzaAccountModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

const deleteOneQarzaAccountService = (id) => {
    const QarzaAccountModel = getLocalQarzaAccountModel();
    return QarzaAccountModel.findByIdAndDelete(id);
};

const countQarzaAccountService = (query) => {
    const QarzaAccountModel = getLocalQarzaAccountModel();
    return QarzaAccountModel.countDocuments(query);
};

export { createQarzaAccountService, findQarzaAccountService, findOneQarzaAccountService, findByIdQarzaAccountService, updateQarzaAccountService, deleteOneQarzaAccountService, countQarzaAccountService };
