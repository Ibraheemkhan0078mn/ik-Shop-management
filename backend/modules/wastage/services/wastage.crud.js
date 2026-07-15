import { createDoc, findDocs, findOneDoc, updateDocs, deleteDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";
import { getLocalWastageModel } from "../../../configs/connect.db.js";

const createWastageService = (data) => {
    const WastageModel = getLocalWastageModel();
    return createDoc({ model: WastageModel, data });
};

const findWastageService = (query = {}, options = {}) => {
    const WastageModel = getLocalWastageModel();
    return findDocs({ model: WastageModel, filter: query, options });
};

const findOneWastageService = (query, options = {}) => {
    const WastageModel = getLocalWastageModel();
    return findOneDoc({ model: WastageModel, filter: query, options });
};

const findByIdWastageService = (id, options = {}) => {
    const WastageModel = getLocalWastageModel();
    return findOneDoc({ model: WastageModel, filter: { _id: id }, options });
};

const updateWastageService = (id, data) => {
    const WastageModel = getLocalWastageModel();
    return updateDocs({ model: WastageModel, filter: { _id: id }, data });
};

const deleteOneWastageService = (id) => {
    const WastageModel = getLocalWastageModel();
    return deleteDocs({ model: WastageModel, filter: { _id: id } });
};

const countWastageService = (query) => {
    const WastageModel = getLocalWastageModel();
    return WastageModel.countDocuments(query);
};

export { createWastageService, findWastageService, findOneWastageService, findByIdWastageService, updateWastageService, deleteOneWastageService, countWastageService };
