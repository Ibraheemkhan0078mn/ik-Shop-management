import { createDoc, findDocs, findOneDoc, updateDocs, deleteDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";
import { getLocalOrderModel } from "../../../configs/connect.db.js";

const OrderModel = getLocalOrderModel();

const createOrderService = (data) => {
    return createDoc({ model: OrderModel, data });
};

const findOrderService = (query = {}) => {
    return findDocs({ model: OrderModel, filter: query });
};

const findOneOrderService = (query) => {
    return findOneDoc({ model: OrderModel, filter: query });
};

const findByIdOrderService = (id) => {
    return findOneDoc({ model: OrderModel, filter: { _id: id } });
};

const updateOrderService = (id, data) => {
    return updateDocs({ model: OrderModel, filter: { _id: id }, data });
};

const deleteOneOrderService = (id) => {
    return deleteDocs({ model: OrderModel, filter: { _id: id } });
};

const countOrderService = (query) => {
    return OrderModel.countDocuments(query);
};

export { createOrderService, findOrderService, findOneOrderService, findByIdOrderService, updateOrderService, deleteOneOrderService, countOrderService };
