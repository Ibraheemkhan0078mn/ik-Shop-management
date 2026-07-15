import { createDoc, findDocs, findOneDoc, updateDocs, deleteDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";
import { getLocalSettingsModel } from "../../../configs/connect.db.js";

const SettingsModel = getLocalSettingsModel();

const createSettingsService = (data) => {
    return createDoc({ model: SettingsModel, data });
};

const findSettingsService = (query = {}) => {
    return findDocs({ model: SettingsModel, filter: query });
};

const findOneSettingsService = (query) => {
    return findOneDoc({ model: SettingsModel, filter: query });
};

const findByIdSettingsService = (id) => {
    return findOneDoc({ model: SettingsModel, filter: { _id: id } });
};

const updateSettingsService = (filter, data) => {
    return updateDocs({ model: SettingsModel, filter, data });
};

const findOneAndUpdateSettingsService = (filter, data, options = {}) => {
    return SettingsModel.findOneAndUpdate(filter, data, { new: true, upsert: true, ...options });
};

const deleteOneSettingsService = (id) => {
    return deleteDocs({ model: SettingsModel, filter: { _id: id } });
};

const countSettingsService = (query) => {
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
