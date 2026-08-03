import { createDoc, findDocs, findOneDoc, updateDocs, deleteDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";
import { getLocalQarzaPaymentModel } from "../../../configs/connect.db.js";

const createQarzaPaymentService = (data) => {
    const QarzaPaymentModel = getLocalQarzaPaymentModel();
    return createDoc({ model: QarzaPaymentModel, data });
};

const findQarzaPaymentService = (query = {}, options = {}) => {
    const QarzaPaymentModel = getLocalQarzaPaymentModel();
    return findDocs({ model: QarzaPaymentModel, filter: query, options });
};

const findOneQarzaPaymentService = (query, options = {}) => {
    const QarzaPaymentModel = getLocalQarzaPaymentModel();
    return findOneDoc({ model: QarzaPaymentModel, filter: query, options });
};

const findByIdQarzaPaymentService = (id, options = {}) => {
    const QarzaPaymentModel = getLocalQarzaPaymentModel();
    return findOneDoc({ model: QarzaPaymentModel, filter: { _id: id }, options });
};

const updateQarzaPaymentService = (id, data) => {
    const QarzaPaymentModel = getLocalQarzaPaymentModel();
    return updateDocs({ model: QarzaPaymentModel, filter: { _id: id }, data });
};

const deleteOneQarzaPaymentService = (id) => {
    const QarzaPaymentModel = getLocalQarzaPaymentModel();
    return deleteDocs({ model: QarzaPaymentModel, filter: { _id: id } });
};

const countQarzaPaymentService = (query) => {
    const QarzaPaymentModel = getLocalQarzaPaymentModel();
    return QarzaPaymentModel.countDocuments(query);
};

export { createQarzaPaymentService, findQarzaPaymentService, findOneQarzaPaymentService, findByIdQarzaPaymentService, updateQarzaPaymentService, deleteOneQarzaPaymentService, countQarzaPaymentService };
