import { createDoc, findDocs, findOneDoc, updateDocs, deleteDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";
import { getLocalStaffModel } from "../../../configs/connect.db.js";

const StaffModel = getLocalStaffModel();

const createStaffService = (data) => {
    return createDoc({ model: StaffModel, data });
};

const findStaffService = (query = {}) => {
    return findDocs({ model: StaffModel, filter: query });
};

const findOneStaffService = (query) => {
    return findOneDoc({ model: StaffModel, filter: query });
};

const findByIdStaffService = (id) => {
    return findOneDoc({ model: StaffModel, filter: { _id: id } });
};

const updateStaffService = (id, data) => {
    return updateDocs({ model: StaffModel, filter: { _id: id }, data });
};

const deleteOneStaffService = (id) => {
    return deleteDocs({ model: StaffModel, filter: { _id: id } });
};

const countStaffService = (query) => {
    return StaffModel.countDocuments(query);
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
