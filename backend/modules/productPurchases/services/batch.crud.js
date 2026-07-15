import { createDoc, findDocs, findOneDoc, updateDocs, deleteDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";
import { getLocalBatchModel } from "../../../configs/connect.db.js";

const createBatchService = (data) => {
    const BatchModel = getLocalBatchModel();
    return createDoc({ model: BatchModel, data });
};

const findBatchService = (query = {}) => {
    const BatchModel = getLocalBatchModel();
    return findDocs({ model: BatchModel, filter: query });
};

const findOneBatchService = (query) => {
    const BatchModel = getLocalBatchModel();
    return findOneDoc({ model: BatchModel, filter: query });
};

const findByIdBatchService = (id) => {
    const BatchModel = getLocalBatchModel();
    return findOneDoc({ model: BatchModel, filter: { _id: id } });
};

const updateBatchService = (id, data) => {
    const BatchModel = getLocalBatchModel();
    return updateDocs({ model: BatchModel, filter: { _id: id }, data });
};

const deleteOneBatchService = (id) => {
    const BatchModel = getLocalBatchModel();
    return deleteDocs({ model: BatchModel, filter: { _id: id } });
};

const deleteManyBatchService = (query) => {
    const BatchModel = getLocalBatchModel();
    return BatchModel.deleteMany(query);
};

const countBatchService = (query) => {
    const BatchModel = getLocalBatchModel();
    return BatchModel.countDocuments(query);
};

export { createBatchService, findBatchService, findOneBatchService, findByIdBatchService, updateBatchService, deleteOneBatchService, deleteManyBatchService, countBatchService };
