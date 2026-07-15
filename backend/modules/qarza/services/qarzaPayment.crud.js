import { createDoc, findDocs, findOneDoc, updateDocs, deleteDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";
import { getLocalQarzaPaymentModel } from "../../../configs/connect.db.js";

const QarzaPaymentModel = getLocalQarzaPaymentModel();

const createQarzaPaymentService = (data) => {
    return createDoc({ model: QarzaPaymentModel, data });
};

const findQarzaPaymentService = (query = {}) => {
    return findDocs({ model: QarzaPaymentModel, filter: query });
};

const findOneQarzaPaymentService = (query) => {
    return findOneDoc({ model: QarzaPaymentModel, filter: query });
};

const findByIdQarzaPaymentService = (id) => {
    return findOneDoc({ model: QarzaPaymentModel, filter: { _id: id } });
};

const updateQarzaPaymentService = (id, data) => {
    return updateDocs({ model: QarzaPaymentModel, filter: { _id: id }, data });
};

const deleteOneQarzaPaymentService = (id) => {
    return deleteDocs({ model: QarzaPaymentModel, filter: { _id: id } });
};

const countQarzaPaymentService = (query) => {
    return QarzaPaymentModel.countDocuments(query);
};

export { createQarzaPaymentService, findQarzaPaymentService, findOneQarzaPaymentService, findByIdQarzaPaymentService, updateQarzaPaymentService, deleteOneQarzaPaymentService, countQarzaPaymentService };
