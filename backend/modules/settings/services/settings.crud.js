import { createDoc, findDocs, findOneDoc, updateDocs, deleteDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";
import { getLocalSettingsModel } from "../../../configs/connect.db.js";

const createSettingsService = (data) => {
    const SettingsModel = getLocalSettingsModel();
    return createDoc({ model: SettingsModel, data });
};

const findSettingsService = (query = {}) => {
    const SettingsModel = getLocalSettingsModel();
    return findDocs({ model: SettingsModel, filter: query });
};

const findOneSettingsService = (query) => {
    const SettingsModel = getLocalSettingsModel();
    return findOneDoc({ model: SettingsModel, filter: query });
};

const findByIdSettingsService = (id) => {
    const SettingsModel = getLocalSettingsModel();
    return findOneDoc({ model: SettingsModel, filter: { _id: id } });
};

const updateSettingsService = (filter, data) => {
    const SettingsModel = getLocalSettingsModel();
    return updateDocs({ model: SettingsModel, filter, data });
};

const findOneAndUpdateSettingsService = (filter, data, options = {}) => {
    const SettingsModel = getLocalSettingsModel();
    return SettingsModel.findOneAndUpdate(filter, data, { new: true, upsert: true, ...options });
};

const deleteOneSettingsService = (id) => {
    const SettingsModel = getLocalSettingsModel();
    return deleteDocs({ model: SettingsModel, filter: { _id: id } });
};

const countSettingsService = (query) => {
    const SettingsModel = getLocalSettingsModel();
    return SettingsModel.countDocuments(query);
};

export { 
    createSettingsService, 
    findSettingsService, 
    findOneSettingsService, 
    findByIdSettingsService, 
    updateSettingsService,
    findOneAndUpdateSettingsService,
    deleteOneSettingsService,
    countSettingsService 
};
