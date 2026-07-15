import { createDoc, findDocs, findOneDoc, updateDocs, deleteDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";
import { getLocalBatchModel } from "../../../configs/connect.db.js";

const BatchModel = getLocalBatchModel();

const createBatchService = (data) => {
    return createDoc({ model: BatchModel, data });
};

const findBatchService = (query = {}) => {
    return findDocs({ model: BatchModel, filter: query });
};

const findOneBatchService = (query) => {
    return findOneDoc({ model: BatchModel, filter: query });
};

const findByIdBatchService = (id) => {
    return findOneDoc({ model: BatchModel, filter: { _id: id } });
};

const updateBatchService = (id, data) => {
    return updateDocs({ model: BatchModel, filter: { _id: id }, data });
};

const deleteOneBatchService = (id) => {
    return deleteDocs({ model: BatchModel, filter: { _id: id } });
};

const deleteManyBatchService = (query) => {
    return BatchModel.deleteMany(query);
};

const countBatchService = (query) => {
    return BatchModel.countDocuments(query);
};

export { createBatchService, findBatchService, findOneBatchService, findByIdBatchService, updateBatchService, deleteOneBatchService, deleteManyBatchService, countBatchService };
