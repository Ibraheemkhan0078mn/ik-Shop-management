import { createDoc, findDocs, findOneDoc, updateDocs, deleteDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";
import { getLocalWastageModel } from "../../../configs/connect.db.js";

const WastageModel = getLocalWastageModel();

const createWastageService = (data) => {
    return createDoc({ model: WastageModel, data });
};

const findWastageService = (query = {}) => {
    return findDocs({ model: WastageModel, filter: query });
};

const findOneWastageService = (query) => {
    return findOneDoc({ model: WastageModel, filter: query });
};

const findByIdWastageService = (id) => {
    return findOneDoc({ model: WastageModel, filter: { _id: id } });
};

const updateWastageService = (id, data) => {
    return updateDocs({ model: WastageModel, filter: { _id: id }, data });
};

const deleteOneWastageService = (id) => {
    return deleteDocs({ model: WastageModel, filter: { _id: id } });
};

const countWastageService = (query) => {
    return WastageModel.countDocuments(query);
};

export { createWastageService, findWastageService, findOneWastageService, findByIdWastageService, updateWastageService, deleteOneWastageService, countWastageService };
