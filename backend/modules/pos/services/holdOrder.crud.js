import { createDoc, findDocs, findOneDoc, updateDocs, deleteDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";
import { getLocalHoldOrderModel } from "../../../configs/connect.db.js";

const HoldOrderModel = getLocalHoldOrderModel();

const createHoldOrderService = (data) => {
    return createDoc({ model: HoldOrderModel, data });
};

const findHoldOrderService = (query = {}) => {
    return findDocs({ model: HoldOrderModel, filter: query });
};

const findOneHoldOrderService = (query) => {
    return findOneDoc({ model: HoldOrderModel, filter: query });
};

const findByIdHoldOrderService = (id) => {
    return findOneDoc({ model: HoldOrderModel, filter: { _id: id } });
};

const updateHoldOrderService = (id, data) => {
    return updateDocs({ model: HoldOrderModel, filter: { _id: id }, data });
};

const deleteOneHoldOrderService = (id) => {
    return deleteDocs({ model: HoldOrderModel, filter: { _id: id } });
};

const countHoldOrderService = (query) => {
    return HoldOrderModel.countDocuments(query);
};

export { createHoldOrderService, findHoldOrderService, findOneHoldOrderService, findByIdHoldOrderService, updateHoldOrderService, deleteOneHoldOrderService, countHoldOrderService };
