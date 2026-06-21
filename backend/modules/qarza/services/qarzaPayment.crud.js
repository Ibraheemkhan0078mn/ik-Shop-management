import { getLocalQarzaPaymentModel } from "../../../configs/connect.db.js";

const QarzaPaymentModel = getLocalQarzaPaymentModel();

const create = (data) => QarzaPaymentModel.create(data);

const find = (query = {}) => QarzaPaymentModel.find(query);

const findOne = (query) => QarzaPaymentModel.findOne(query);

const findById = (id) => QarzaPaymentModel.findById(id);

const update = (id, data) => QarzaPaymentModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });

const deleteOne = (id) => QarzaPaymentModel.findByIdAndDelete(id);

const count = (query) => QarzaPaymentModel.countDocuments(query);

export { create, find, findOne, findById, update, deleteOne, count };
