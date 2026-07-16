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
  const { select, sort, limit, skip, populate, lean = true, includeDeleted = false } = options;
  
  // Add isDeleted filter unless explicitly requested to include deleted documents
  const finalFilter = includeDeleted ? filter : { ...filter, isDeleted: { $ne: true } };
  
  let query = Model.find(finalFilter);
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
  const { select, populate, lean = false, includeDeleted = false } = options;
  
  // Add isDeleted filter unless explicitly requested to include deleted documents
  const finalFilter = includeDeleted ? filter : { ...filter, isDeleted: { $ne: true } };
  
  let query = Model.findOne(finalFilter);
  if (select) query = query.select(select);
  if (populate) query = query.populate(populate);
  if (lean) query = query.lean();
  return query.exec();
};

export const updateDocs = async ({ model, modelName, filter, data, options = {} }) => {
  const Model = resolveModel({ model, modelName });
  const { many = false, new: returnNew = true, runValidators = true, upsert = false, includeDeleted = false } = options;
  
  // Add isDeleted filter unless explicitly requested to include deleted documents
  const finalFilter = includeDeleted ? filter : { ...filter, isDeleted: { $ne: true } };
  
  if (many) return Model.updateMany(finalFilter, data, { runValidators, upsert });
  return Model.findOneAndUpdate(finalFilter, data, { new: returnNew, runValidators, upsert });
};

export const deleteDocs = async ({ model, modelName, filter, options = {} }) => {
  const Model = resolveModel({ model, modelName });
  const { many = false, hardDelete = false } = options;
  
  // Soft delete by default - just mark as deleted
  if (!hardDelete) {
    const updateData = { 
      isDeleted: true, 
      deletedAt: new Date() 
    };
    
    if (many) {
      return Model.updateMany(filter, updateData);
    }
    return Model.findOneAndUpdate(filter, updateData, { new: true });
  }
  
  // Hard delete - permanently remove from database
  if (many) return Model.deleteMany(filter);
  return Model.findOneAndDelete(filter);
};

/**
 * Restore soft-deleted document(s)
 */
export const restoreDocs = async ({ model, modelName, filter, options = {} }) => {
  const Model = resolveModel({ model, modelName });
  const { many = false } = options;
  
  const updateData = { 
    isDeleted: false, 
    deletedAt: null 
  };
  
  if (many) {
    return Model.updateMany({ ...filter, isDeleted: true }, updateData);
  }
  return Model.findOneAndUpdate({ ...filter, isDeleted: true }, updateData, { new: true });
};

/**
 * Count documents with soft delete support
 */
export const countDocs = async ({ model, modelName, filter = {}, options = {} }) => {
  const Model = resolveModel({ model, modelName });
  const { includeDeleted = false } = options;
  
  // Add isDeleted filter unless explicitly requested to include deleted documents
  const finalFilter = includeDeleted ? filter : { ...filter, isDeleted: { $ne: true } };
  
  return Model.countDocuments(finalFilter);
};