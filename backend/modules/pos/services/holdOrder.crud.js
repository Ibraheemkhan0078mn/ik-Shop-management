import { getLocalHoldOrderModel } from "../../../configs/connect.db.js";

const createHoldOrderService = (data) => {
    const HoldOrderModel = getLocalHoldOrderModel();
    return HoldOrderModel.create(data);
};

const findHoldOrderService = (query = {}) => {
    const HoldOrderModel = getLocalHoldOrderModel();
    return HoldOrderModel.find(query);
};

const findOneHoldOrderService = (query) => {
    const HoldOrderModel = getLocalHoldOrderModel();
    return HoldOrderModel.findOne(query);
};

const findByIdHoldOrderService = (id) => {
    const HoldOrderModel = getLocalHoldOrderModel();
    return HoldOrderModel.findById(id);
};

const updateHoldOrderService = (id, data) => {
    const HoldOrderModel = getLocalHoldOrderModel();
    return HoldOrderModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

const deleteOneHoldOrderService = (id) => {
    const HoldOrderModel = getLocalHoldOrderModel();
    return HoldOrderModel.findByIdAndDelete(id);
};

const countHoldOrderService = (query) => {
    const HoldOrderModel = getLocalHoldOrderModel();
    return HoldOrderModel.countDocuments(query);
};

export { createHoldOrderService, findHoldOrderService, findOneHoldOrderService, findByIdHoldOrderService, updateHoldOrderService, deleteOneHoldOrderService, countHoldOrderService };
