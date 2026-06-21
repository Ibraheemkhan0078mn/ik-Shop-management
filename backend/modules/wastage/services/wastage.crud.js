import { getLocalWastageModel } from "../../../configs/connect.db.js";

const createWastageService = (data) => {
    const WastageModel = getLocalWastageModel();
    return WastageModel.create(data);
};

const findWastageService = (query = {}) => {
    const WastageModel = getLocalWastageModel();
    return WastageModel.find(query);
};

const findOneWastageService = (query) => {
    const WastageModel = getLocalWastageModel();
    return WastageModel.findOne(query);
};

const findByIdWastageService = (id) => {
    const WastageModel = getLocalWastageModel();
    return WastageModel.findById(id);
};

const updateWastageService = (id, data) => {
    const WastageModel = getLocalWastageModel();
    return WastageModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

const deleteOneWastageService = (id) => {
    const WastageModel = getLocalWastageModel();
    return WastageModel.findByIdAndDelete(id);
};

const countWastageService = (query) => {
    const WastageModel = getLocalWastageModel();
    return WastageModel.countDocuments(query);
};

export { createWastageService, findWastageService, findOneWastageService, findByIdWastageService, updateWastageService, deleteOneWastageService, countWastageService };
