import { createDoc, findDocs, findOneDoc, updateDocs, deleteDocs, countDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";
import { getLocalStaffSalaryChangeModel } from "../../../configs/connect.db.js";

const createStaffSalaryChangeService = (data) => {
    const StaffSalaryChangeModel = getLocalStaffSalaryChangeModel();
    return createDoc({ model: StaffSalaryChangeModel, data });
};

const findStaffSalaryChangeService = (query = {}, options = {}) => {
    const StaffSalaryChangeModel = getLocalStaffSalaryChangeModel();
    return findDocs({ model: StaffSalaryChangeModel, filter: query, options });
};

const findOneStaffSalaryChangeService = (query, options = {}) => {
    const StaffSalaryChangeModel = getLocalStaffSalaryChangeModel();
    return findOneDoc({ model: StaffSalaryChangeModel, filter: query, options });
};

const findByIdStaffSalaryChangeService = (id, options = {}) => {
    const StaffSalaryChangeModel = getLocalStaffSalaryChangeModel();
    return findOneDoc({ model: StaffSalaryChangeModel, filter: { _id: id }, options });
};

const updateStaffSalaryChangeService = (id, data) => {
    const StaffSalaryChangeModel = getLocalStaffSalaryChangeModel();
    return updateDocs({ model: StaffSalaryChangeModel, filter: { _id: id }, data });
};

const deleteOneStaffSalaryChangeService = (id) => {
    const StaffSalaryChangeModel = getLocalStaffSalaryChangeModel();
    return deleteDocs({ model: StaffSalaryChangeModel, filter: { _id: id } });
};

const countStaffSalaryChangeService = (query) => {
    const StaffSalaryChangeModel = getLocalStaffSalaryChangeModel();
    return countDocs({ model: StaffSalaryChangeModel, filter: query });
};

export { 
    createStaffSalaryChangeService, 
    findStaffSalaryChangeService, 
    findOneStaffSalaryChangeService, 
    findByIdStaffSalaryChangeService, 
    updateStaffSalaryChangeService, 
    deleteOneStaffSalaryChangeService,
    countStaffSalaryChangeService 
};
