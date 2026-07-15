import { createDoc, findDocs, findOneDoc, updateDocs, deleteDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";
import { getLocalStaffSalaryPaymentModel } from "../../../configs/connect.db.js";

const StaffSalaryPaymentModel = getLocalStaffSalaryPaymentModel();

const createStaffSalaryPaymentService = (data) => {
    return createDoc({ model: StaffSalaryPaymentModel, data });
};

const findStaffSalaryPaymentService = (query = {}) => {
    return findDocs({ model: StaffSalaryPaymentModel, filter: query });
};

const findOneStaffSalaryPaymentService = (query) => {
    return findOneDoc({ model: StaffSalaryPaymentModel, filter: query });
};

const findByIdStaffSalaryPaymentService = (id) => {
    return findOneDoc({ model: StaffSalaryPaymentModel, filter: { _id: id } });
};

const updateStaffSalaryPaymentService = (id, data) => {
    return updateDocs({ model: StaffSalaryPaymentModel, filter: { _id: id }, data });
};

const deleteOneStaffSalaryPaymentService = (id) => {
    return deleteDocs({ model: StaffSalaryPaymentModel, filter: { _id: id } });
};

const countStaffSalaryPaymentService = (query) => {
    return StaffSalaryPaymentModel.countDocuments(query);
};

export { 
    createStaffSalaryPaymentService, 
    findStaffSalaryPaymentService, 
    findOneStaffSalaryPaymentService, 
    findByIdStaffSalaryPaymentService, 
    updateStaffSalaryPaymentService, 
    deleteOneStaffSalaryPaymentService,
    countStaffSalaryPaymentService 
};
