import { createDoc, findDocs, findOneDoc, updateDocs, deleteDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";
import { getLocalStaffSaleBillModel } from "../../../configs/connect.db.js";

const StaffSaleBillModel = getLocalStaffSaleBillModel();

const createStaffSaleBillService = (data) => {
    return createDoc({ model: StaffSaleBillModel, data });
};

const findStaffSaleBillService = (query = {}) => {
    return findDocs({ model: StaffSaleBillModel, filter: query });
};

const findOneStaffSaleBillService = (query) => {
    return findOneDoc({ model: StaffSaleBillModel, filter: query });
};

const findByIdStaffSaleBillService = (id) => {
    return findOneDoc({ model: StaffSaleBillModel, filter: { _id: id } });
};

const updateStaffSaleBillService = (id, data) => {
    return updateDocs({ model: StaffSaleBillModel, filter: { _id: id }, data });
};

const deleteOneStaffSaleBillService = (id) => {
    return deleteDocs({ model: StaffSaleBillModel, filter: { _id: id } });
};

const countStaffSaleBillService = (query) => {
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
