import { createDoc, findDocs, findOneDoc, updateDocs, deleteDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";
import { getLocalStaffSalaryPaymentModel } from "../../../configs/connect.db.js";

const createStaffSalaryPaymentService = (data) => {
    const StaffSalaryPaymentModel = getLocalStaffSalaryPaymentModel();
    return createDoc({ model: StaffSalaryPaymentModel, data });
};

const findStaffSalaryPaymentService = (query = {}, options = {}) => {
    const StaffSalaryPaymentModel = getLocalStaffSalaryPaymentModel();
    return findDocs({ model: StaffSalaryPaymentModel, filter: query, options });
};

const findOneStaffSalaryPaymentService = (query, options = {}) => {
    const StaffSalaryPaymentModel = getLocalStaffSalaryPaymentModel();
    return findOneDoc({ model: StaffSalaryPaymentModel, filter: query, options });
};

const findByIdStaffSalaryPaymentService = (id, options = {}) => {
    const StaffSalaryPaymentModel = getLocalStaffSalaryPaymentModel();
    return findOneDoc({ model: StaffSalaryPaymentModel, filter: { _id: id }, options });
};

const updateStaffSalaryPaymentService = (id, data) => {
    const StaffSalaryPaymentModel = getLocalStaffSalaryPaymentModel();
    return updateDocs({ model: StaffSalaryPaymentModel, filter: { _id: id }, data });
};

const deleteOneStaffSalaryPaymentService = (id) => {
    const StaffSalaryPaymentModel = getLocalStaffSalaryPaymentModel();
    return deleteDocs({ model: StaffSalaryPaymentModel, filter: { _id: id } });
};

const countStaffSalaryPaymentService = (query) => {
    const StaffSalaryPaymentModel = getLocalStaffSalaryPaymentModel();
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
