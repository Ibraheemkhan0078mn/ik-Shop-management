import { createDoc, findDocs, findOneDoc, updateDocs, deleteDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";
import { getLocalStaffAttendanceModel } from "../../../configs/connect.db.js";

const StaffAttendanceModel = getLocalStaffAttendanceModel();

const createStaffAttendanceService = (data) => {
    return createDoc({ model: StaffAttendanceModel, data });
};

const findStaffAttendanceService = (query = {}) => {
    return findDocs({ model: StaffAttendanceModel, filter: query });
};

const findOneStaffAttendanceService = (query) => {
    return findOneDoc({ model: StaffAttendanceModel, filter: query });
};

const findByIdStaffAttendanceService = (id) => {
    return findOneDoc({ model: StaffAttendanceModel, filter: { _id: id } });
};

const updateStaffAttendanceService = (id, data) => {
    return updateDocs({ model: StaffAttendanceModel, filter: { _id: id }, data });
};

const deleteOneStaffAttendanceService = (id) => {
    return deleteDocs({ model: StaffAttendanceModel, filter: { _id: id } });
};

const countStaffAttendanceService = (query) => {
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
