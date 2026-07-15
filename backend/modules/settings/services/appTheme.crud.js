import { createDoc, findDocs, findOneDoc, updateDocs, deleteDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";
import { getLocalAppThemeModel } from "../../../configs/connect.db.js";

const AppThemeModel = getLocalAppThemeModel();

const createAppThemeService = (data) => {
    return createDoc({ model: AppThemeModel, data });
};

const findAppThemeService = (query = {}) => {
    return findDocs({ model: AppThemeModel, filter: query });
};

const findOneAppThemeService = (query) => {
    return findOneDoc({ model: AppThemeModel, filter: query });
};

const findByIdAppThemeService = (id) => {
    return findOneDoc({ model: AppThemeModel, filter: { _id: id } });
};

const updateAppThemeService = (id, data) => {
    return updateDocs({ model: AppThemeModel, filter: { _id: id }, data });
};

const updateManyAppThemeService = (filter, data) => {
    return AppThemeModel.updateMany(filter, data);
};

const deleteOneAppThemeService = (id) => {
    return deleteDocs({ model: AppThemeModel, filter: { _id: id } });
};

const countAppThemeService = (query) => {
    return AppThemeModel.countDocuments(query);
};

export { 
    createAppThemeService, 
    findAppThemeService, 
    findOneAppThemeService, 
    findByIdAppThemeService, 
    updateAppThemeService, 
    updateManyAppThemeService,
    deleteOneAppThemeService,
    countAppThemeService 
};
