import { getLocalOrderModel } from "../../../configs/connect.db.js";

const createOrderService = (data) => {
    const OrderModel = getLocalOrderModel();
    return OrderModel.create(data);
};

const findOrderService = (query = {}) => {
    const OrderModel = getLocalOrderModel();
    return OrderModel.find(query);
};

const findOneOrderService = (query) => {
    const OrderModel = getLocalOrderModel();
    return OrderModel.findOne(query);
};

const findByIdOrderService = (id) => {
    const OrderModel = getLocalOrderModel();
    return OrderModel.findById(id);
};

const updateOrderService = (id, data) => {
    const OrderModel = getLocalOrderModel();
    return OrderModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

const deleteOneOrderService = (id) => {
    const OrderModel = getLocalOrderModel();
    return OrderModel.findByIdAndDelete(id);
};

const countOrderService = (query) => {
    const OrderModel = getLocalOrderModel();
    return OrderModel.countDocuments(query);
};

export { createOrderService, findOrderService, findOneOrderService, findByIdOrderService, updateOrderService, deleteOneOrderService, countOrderService };
