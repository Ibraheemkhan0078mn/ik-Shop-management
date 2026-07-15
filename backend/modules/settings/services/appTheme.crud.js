import { createDoc, findDocs, findOneDoc, updateDocs, deleteDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";
import { getLocalAppThemeModel } from "../../../configs/connect.db.js";

const createAppThemeService = (data) => {
    const AppThemeModel = getLocalAppThemeModel();
    return createDoc({ model: AppThemeModel, data });
};

const findAppThemeService = (query = {}) => {
    const AppThemeModel = getLocalAppThemeModel();
    return findDocs({ model: AppThemeModel, filter: query });
};

const findOneAppThemeService = (query) => {
    const AppThemeModel = getLocalAppThemeModel();
    return findOneDoc({ model: AppThemeModel, filter: query });
};

const findByIdAppThemeService = (id) => {
    const AppThemeModel = getLocalAppThemeModel();
    return findOneDoc({ model: AppThemeModel, filter: { _id: id } });
};

const updateAppThemeService = (id, data) => {
    const AppThemeModel = getLocalAppThemeModel();
    return updateDocs({ model: AppThemeModel, filter: { _id: id }, data });
};

const updateManyAppThemeService = (filter, data) => {
    const AppThemeModel = getLocalAppThemeModel();
    return AppThemeModel.updateMany(filter, data);
};

const deleteOneAppThemeService = (id) => {
    const AppThemeModel = getLocalAppThemeModel();
    return deleteDocs({ model: AppThemeModel, filter: { _id: id } });
};

const countAppThemeService = (query) => {
    const AppThemeModel = getLocalAppThemeModel();
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
