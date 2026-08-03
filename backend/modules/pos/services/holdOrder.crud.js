import { createDoc, findDocs, findOneDoc, updateDocs, deleteDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";
import { getLocalHoldOrderModel } from "../../../configs/connect.db.js";

const createHoldOrderService = (data) => {
    const HoldOrderModel = getLocalHoldOrderModel();
    return createDoc({ model: HoldOrderModel, data });
};

const findHoldOrderService = (query = {}, options = {}) => {
    const HoldOrderModel = getLocalHoldOrderModel();
    return findDocs({ model: HoldOrderModel, filter: query, options });
};

const findOneHoldOrderService = (query, options = {}) => {
    const HoldOrderModel = getLocalHoldOrderModel();
    return findOneDoc({ model: HoldOrderModel, filter: query, options });
};

const findByIdHoldOrderService = (id, options = {}) => {
    const HoldOrderModel = getLocalHoldOrderModel();
    return findOneDoc({ model: HoldOrderModel, filter: { _id: id }, options });
};

const updateHoldOrderService = (id, data) => {
    const HoldOrderModel = getLocalHoldOrderModel();
    return updateDocs({ model: HoldOrderModel, filter: { _id: id }, data });
};

const deleteOneHoldOrderService = (id) => {
    const HoldOrderModel = getLocalHoldOrderModel();
    return deleteDocs({ model: HoldOrderModel, filter: { _id: id } });
};

const countHoldOrderService = (query) => {
    const HoldOrderModel = getLocalHoldOrderModel();
    return HoldOrderModel.countDocuments(query);
};

export { createHoldOrderService, findHoldOrderService, findOneHoldOrderService, findByIdHoldOrderService, updateHoldOrderService, deleteOneHoldOrderService, countHoldOrderService };
