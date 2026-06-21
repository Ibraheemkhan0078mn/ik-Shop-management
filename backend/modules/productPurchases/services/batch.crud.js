import { getLocalBatchModel } from "../../../configs/connect.db.js";

const createBatchService = (data) => {
    const BatchModel = getLocalBatchModel();
    return BatchModel.create(data);
};

const findBatchService = (query = {}) => {
    const BatchModel = getLocalBatchModel();
    return BatchModel.find(query);
};

const findOneBatchService = (query) => {
    const BatchModel = getLocalBatchModel();
    return BatchModel.findOne(query);
};

const findByIdBatchService = (id) => {
    const BatchModel = getLocalBatchModel();
    return BatchModel.findById(id);
};

const updateBatchService = (id, data) => {
    const BatchModel = getLocalBatchModel();
    return BatchModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

const deleteOneBatchService = (id) => {
    const BatchModel = getLocalBatchModel();
    return BatchModel.findByIdAndDelete(id);
};

const countBatchService = (query) => {
    const BatchModel = getLocalBatchModel();
    return BatchModel.countDocuments(query);
};

export { createBatchService, findBatchService, findOneBatchService, findByIdBatchService, updateBatchService, deleteOneBatchService, countBatchService };
