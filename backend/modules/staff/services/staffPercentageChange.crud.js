import { createDoc, findDocs, findOneDoc, updateDocs, deleteDocs, countDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";
import { getLocalStaffPercentageChangeModel } from "../../../configs/connect.db.js";

const createStaffPercentageChangeService = (data) => {
    const StaffPercentageChangeModel = getLocalStaffPercentageChangeModel();
    return createDoc({ model: StaffPercentageChangeModel, data });
};

const findStaffPercentageChangeService = (query = {}, options = {}) => {
    const StaffPercentageChangeModel = getLocalStaffPercentageChangeModel();
    return findDocs({ model: StaffPercentageChangeModel, filter: query, options });
};

const findOneStaffPercentageChangeService = (query, options = {}) => {
    const StaffPercentageChangeModel = getLocalStaffPercentageChangeModel();
    return findOneDoc({ model: StaffPercentageChangeModel, filter: query, options });
};

const findByIdStaffPercentageChangeService = (id, options = {}) => {
    const StaffPercentageChangeModel = getLocalStaffPercentageChangeModel();
    return findOneDoc({ model: StaffPercentageChangeModel, filter: { _id: id }, options });
};

const updateStaffPercentageChangeService = (id, data) => {
    const StaffPercentageChangeModel = getLocalStaffPercentageChangeModel();
    return updateDocs({ model: StaffPercentageChangeModel, filter: { _id: id }, data });
};

const deleteOneStaffPercentageChangeService = (id) => {
    const StaffPercentageChangeModel = getLocalStaffPercentageChangeModel();
    return deleteDocs({ model: StaffPercentageChangeModel, filter: { _id: id } });
};

const countStaffPercentageChangeService = (query) => {
    const StaffPercentageChangeModel = getLocalStaffPercentageChangeModel();
    return countDocs({ model: StaffPercentageChangeModel, filter: query });
};

export { 
    createStaffPercentageChangeService, 
    findStaffPercentageChangeService, 
    findOneStaffPercentageChangeService, 
    findByIdStaffPercentageChangeService, 
    updateStaffPercentageChangeService, 
    deleteOneStaffPercentageChangeService,
    countStaffPercentageChangeService 
};
