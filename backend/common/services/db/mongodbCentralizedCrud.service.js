import mongoose from "mongoose";

const resolveModel = ({ model, modelName }) => {
  if (model) return model;
  if (!modelName) throw new Error("model or modelName required");
  if (mongoose.models[modelName]) return mongoose.models[modelName];
  throw new Error(`Model "${modelName}" not registered`);
};

export const createDoc = async ({ model, modelName, data }) => {
  const Model = resolveModel({ model, modelName });
  // Add sync timestamps for create operations
  const dataWithSyncTimestamps = {
    ...data,
    createdTimeForSync: new Date(),
    updateTimeForSync: new Date()
  };
  return Model.create(dataWithSyncTimestamps);
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
  const { select, populate, lean = true, includeDeleted = false } = options;

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

  // Add sync timestamp for update operations
  const dataWithSyncTimestamp = {
    ...data,
    updateTimeForSync: new Date()
  };

  if (many) return Model.updateMany(finalFilter, dataWithSyncTimestamp, { runValidators, upsert });
  return Model.findOneAndUpdate(finalFilter, dataWithSyncTimestamp, { returnDocument: returnNew ? 'after' : 'before', runValidators, upsert });
};

export const deleteDocs = async ({ model, modelName, filter, options = {} }) => {
  const Model = resolveModel({ model, modelName });
  const { many = false, hardDelete = false } = options;

  // Soft delete by default - just mark as deleted
  if (!hardDelete) {
    const updateData = {
      isDeleted: true,
      deletedAt: new Date(),
      updateTimeForSync: new Date()
    };

    if (many) {
      return Model.updateMany(filter, updateData);
    }
    return Model.findOneAndUpdate(filter, updateData, { returnDocument: 'after' });
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
  return Model.findOneAndUpdate({ ...filter, isDeleted: true }, updateData, { returnDocument: 'after' });
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

/**
 * Aggregate documents with soft delete support
 * Note: Aggregation pipelines that need isDeleted filtering should include it in the pipeline
 */
export const aggregateDocs = async ({ model, modelName, pipeline = [], options = {} }) => {
  const Model = resolveModel({ model, modelName });
  const { includeDeleted = false } = options;

  // If not including deleted and pipeline doesn't already handle isDeleted, add it
  if (!includeDeleted) {
    const hasDeletedFilter = pipeline.some(stage => 
      stage.$match && (stage.$match.isDeleted !== undefined || stage.$match.isDeleted !== null)
    );
    
    if (!hasDeletedFilter && pipeline.length > 0) {
      // Add isDeleted filter to the first $match stage or create a new one
      const firstMatchIndex = pipeline.findIndex(stage => stage.$match);
      if (firstMatchIndex >= 0) {
        pipeline[firstMatchIndex].$match.isDeleted = { $ne: true };
      } else {
        pipeline.unshift({ $match: { isDeleted: { $ne: true } } });
      }
    }
  }

  return Model.aggregate(pipeline);
};