import { createDoc, findDocs, findOneDoc, updateDocs, deleteDocs, countDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";
import { getLocalStaffModel } from "../../../configs/connect.db.js";

const createStaffService = (data) => {
    const StaffModel = getLocalStaffModel();
    return createDoc({ model: StaffModel, data });
};

const findStaffService = (query = {}, options = {}) => {
    const StaffModel = getLocalStaffModel();
    return findDocs({ model: StaffModel, filter: query, options });
};

const findOneStaffService = (query) => {
    const StaffModel = getLocalStaffModel();
    return findOneDoc({ model: StaffModel, filter: query });
};

const findByIdStaffService = (id) => {
    const StaffModel = getLocalStaffModel();
    return findOneDoc({ model: StaffModel, filter: { _id: id } });
};

const updateStaffService = (id, data) => {
    const StaffModel = getLocalStaffModel();
    return updateDocs({ model: StaffModel, filter: { _id: id }, data });
};

const deleteOneStaffService = (id) => {
    const StaffModel = getLocalStaffModel();
    return deleteDocs({ model: StaffModel, filter: { _id: id } });
};

const countStaffService = (query) => {
    const StaffModel = getLocalStaffModel();
    return countDocs({ model: StaffModel, filter: query });
};

export { 
    createStaffService, 
    findStaffService, 
    findOneStaffService, 
    findByIdStaffService, 
    updateStaffService, 
    deleteOneStaffService,
    countStaffService 
};
