import mongoose from "mongoose";

const resolveModel = ({ model, modelName }) => {
  if (model) return model;
  if (!modelName) throw new Error("model or modelName required");
  if (mongoose.models[modelName]) return mongoose.models[modelName];
  throw new Error(`Model "${modelName}" not registered`);
};

export const createDoc = async ({ model, modelName, data }) => {
  const Model = resolveModel({ model, modelName });
  return Model.create(data);
};

export const findDocs = async ({ model, modelName, filter = {}, options = {} }) => {
  const Model = resolveModel({ model, modelName });
  const { select, sort, limit, skip, populate, lean = true } = options;
  let query = Model.find(filter);
  if (select) query = query.select(select);
  if (sort) query = query.sort(sort);
  if (typeof skip === "number") query = query.skip(skip);
  if (typeof limit === "number") query = query.limit(limit);
  if (populate) query = query.populate(populate);
  if (lean) query = query.lean();
  return query.exec();
};

export const findOneDoc = async ({ model, modelName, filter = {}, options = {} }) => {
  const Model = resolveModel({ model, modelName });
  const { select, populate, lean = false } = options;
  let query = Model.findOne(filter);
  if (select) query = query.select(select);
  if (populate) query = query.populate(populate);
  if (lean) query = query.lean();
  return query.exec();
};

export const updateDocs = async ({ model, modelName, filter, data, options = {} }) => {
  const Model = resolveModel({ model, modelName });
  const { many = false, new: returnNew = true, runValidators = true, upsert = false } = options;
  if (many) return Model.updateMany(filter, data, { runValidators, upsert });
  return Model.findOneAndUpdate(filter, data, { new: returnNew, runValidators, upsert });
};

export const deleteDocs = async ({ model, modelName, filter, options = {} }) => {
  const Model = resolveModel({ model, modelName });
  const { many = false } = options;
  if (many) return Model.deleteMany(filter);
  return Model.findOneAndDelete(filter);
};