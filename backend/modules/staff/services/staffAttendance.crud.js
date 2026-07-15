import { createDoc, findDocs, findOneDoc, updateDocs, deleteDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";
import { getLocalStaffAttendanceModel } from "../../../configs/connect.db.js";

const createStaffAttendanceService = (data) => {
    const StaffAttendanceModel = getLocalStaffAttendanceModel();
    return createDoc({ model: StaffAttendanceModel, data });
};

const findStaffAttendanceService = (query = {}) => {
    const StaffAttendanceModel = getLocalStaffAttendanceModel();
    return findDocs({ model: StaffAttendanceModel, filter: query });
};

const findOneStaffAttendanceService = (query) => {
    const StaffAttendanceModel = getLocalStaffAttendanceModel();
    return findOneDoc({ model: StaffAttendanceModel, filter: query });
};

const findByIdStaffAttendanceService = (id) => {
    const StaffAttendanceModel = getLocalStaffAttendanceModel();
    return findOneDoc({ model: StaffAttendanceModel, filter: { _id: id } });
};

const updateStaffAttendanceService = (id, data) => {
    const StaffAttendanceModel = getLocalStaffAttendanceModel();
    return updateDocs({ model: StaffAttendanceModel, filter: { _id: id }, data });
};

const deleteOneStaffAttendanceService = (id) => {
    const StaffAttendanceModel = getLocalStaffAttendanceModel();
    return deleteDocs({ model: StaffAttendanceModel, filter: { _id: id } });
};

const countStaffAttendanceService = (query) => {
    const StaffAttendanceModel = getLocalStaffAttendanceModel();
    return StaffAttendanceModel.countDocuments(query);
};

export { 
    createStaffAttendanceService, 
    findStaffAttendanceService, 
    findOneStaffAttendanceService, 
    findByIdStaffAttendanceService, 
    updateStaffAttendanceService, 
    deleteOneStaffAttendanceService,
    countStaffAttendanceService 
};
