import { createDoc, findDocs, findOneDoc, updateDocs, deleteDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";
import { getLocalOrderModel } from "../../../configs/connect.db.js";

const createOrderService = (data) => {
    const OrderModel = getLocalOrderModel();
    return createDoc({ model: OrderModel, data });
};

const findOrderService = (query = {}, options = {}) => {
    const OrderModel = getLocalOrderModel();
    return findDocs({ model: OrderModel, filter: query, options });
};

const findOneOrderService = (query, options = {}) => {
    const OrderModel = getLocalOrderModel();
    return findOneDoc({ model: OrderModel, filter: query, options });
};

const findByIdOrderService = (id, options = {}) => {
    const OrderModel = getLocalOrderModel();
    return findOneDoc({ model: OrderModel, filter: { _id: id }, options });
};

const updateOrderService = (id, data) => {
    const OrderModel = getLocalOrderModel();
    return updateDocs({ model: OrderModel, filter: { _id: id }, data });
};

const deleteOneOrderService = (id) => {
    const OrderModel = getLocalOrderModel();
    return deleteDocs({ model: OrderModel, filter: { _id: id } });
};

const countOrderService = (query) => {
    const OrderModel = getLocalOrderModel();
    return OrderModel.countDocuments(query);
};

export { createOrderService, findOrderService, findOneOrderService, findByIdOrderService, updateOrderService, deleteOneOrderService, countOrderService };
