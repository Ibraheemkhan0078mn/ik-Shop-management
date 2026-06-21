import { getLocalQarzaPaymentModel } from "../../../configs/connect.db.js";

const createQarzaPaymentService = (data) => {
    const QarzaPaymentModel = getLocalQarzaPaymentModel();
    return QarzaPaymentModel.create(data);
};

const findQarzaPaymentService = (query = {}) => {
    const QarzaPaymentModel = getLocalQarzaPaymentModel();
    return QarzaPaymentModel.find(query);
};

const findOneQarzaPaymentService = (query) => {
    const QarzaPaymentModel = getLocalQarzaPaymentModel();
    return QarzaPaymentModel.findOne(query);
};

const findByIdQarzaPaymentService = (id) => {
    const QarzaPaymentModel = getLocalQarzaPaymentModel();
    return QarzaPaymentModel.findById(id);
};

const updateQarzaPaymentService = (id, data) => {
    const QarzaPaymentModel = getLocalQarzaPaymentModel();
    return QarzaPaymentModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

const deleteOneQarzaPaymentService = (id) => {
    const QarzaPaymentModel = getLocalQarzaPaymentModel();
    return QarzaPaymentModel.findByIdAndDelete(id);
};

const countQarzaPaymentService = (query) => {
    const QarzaPaymentModel = getLocalQarzaPaymentModel();
    return QarzaPaymentModel.countDocuments(query);
};

export { createQarzaPaymentService, findQarzaPaymentService, findOneQarzaPaymentService, findByIdQarzaPaymentService, updateQarzaPaymentService, deleteOneQarzaPaymentService, countQarzaPaymentService };
