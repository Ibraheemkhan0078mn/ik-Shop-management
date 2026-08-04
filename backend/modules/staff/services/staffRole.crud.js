import { createDoc, findDocs, findOneDoc, updateDocs, deleteDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";
import { getLocalStaffRoleModel } from "../../../configs/connect.db.js";

const createStaffRoleService = (data) => {
    const StaffRoleModel = getLocalStaffRoleModel();
    return createDoc({ model: StaffRoleModel, data });
};

const findStaffRoleService = (query = {}) => {
    const StaffRoleModel = getLocalStaffRoleModel();
    return findDocs({ model: StaffRoleModel, filter: query });
};

const findOneStaffRoleService = (query) => {
    const StaffRoleModel = getLocalStaffRoleModel();
    return findOneDoc({ model: StaffRoleModel, filter: query });
};

const findByIdStaffRoleService = (id) => {
    const StaffRoleModel = getLocalStaffRoleModel();
    return findOneDoc({ model: StaffRoleModel, filter: { _id: id } });
};

const updateStaffRoleService = (id, data) => {
    const StaffRoleModel = getLocalStaffRoleModel();
    return updateDocs({ model: StaffRoleModel, filter: { _id: id }, data });
};

const deleteOneStaffRoleService = (id) => {
    const StaffRoleModel = getLocalStaffRoleModel();
    return deleteDocs({ model: StaffRoleModel, filter: { _id: id } });
};

const countStaffRoleService = (query) => {
    const StaffRoleModel = getLocalStaffRoleModel();
    return StaffRoleModel.countDocuments(query);
};

export { 
    createStaffRoleService, 
    findStaffRoleService, 
    findOneStaffRoleService, 
    findByIdStaffRoleService, 
    updateStaffRoleService, 
    deleteOneStaffRoleService,
    countStaffRoleService 
};
