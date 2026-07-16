import { createDoc, findDocs, findOneDoc, updateDocs, deleteDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";
import { getLocalStaffSaleBillModel } from "../../../configs/connect.db.js";

const createStaffSaleBillService = (data) => {
    const StaffSaleBillModel = getLocalStaffSaleBillModel();
    return createDoc({ model: StaffSaleBillModel, data });
};

const findStaffSaleBillService = (query = {}, options = {}) => {
    const StaffSaleBillModel = getLocalStaffSaleBillModel();
    return findDocs({ model: StaffSaleBillModel, filter: query, options });
};

const findOneStaffSaleBillService = (query, options = {}) => {
    const StaffSaleBillModel = getLocalStaffSaleBillModel();
    return findOneDoc({ model: StaffSaleBillModel, filter: query, options });
};

const findByIdStaffSaleBillService = (id, options = {}) => {
    const StaffSaleBillModel = getLocalStaffSaleBillModel();
    return findOneDoc({ model: StaffSaleBillModel, filter: { _id: id }, options });
};

const updateStaffSaleBillService = (id, data) => {
    const StaffSaleBillModel = getLocalStaffSaleBillModel();
    return updateDocs({ model: StaffSaleBillModel, filter: { _id: id }, data });
};

const deleteOneStaffSaleBillService = (id) => {
    const StaffSaleBillModel = getLocalStaffSaleBillModel();
    return deleteDocs({ model: StaffSaleBillModel, filter: { _id: id } });
};

const countStaffSaleBillService = (query) => {
    const StaffSaleBillModel = getLocalStaffSaleBillModel();
    return StaffSaleBillModel.countDocuments(query);
};

export { 
    createStaffSaleBillService, 
    findStaffSaleBillService, 
    findOneStaffSaleBillService, 
    findByIdStaffSaleBillService, 
    updateStaffSaleBillService, 
    deleteOneStaffSaleBillService,
    countStaffSaleBillService 
};
