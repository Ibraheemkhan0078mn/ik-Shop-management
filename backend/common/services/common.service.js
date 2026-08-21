import { findDocs, countDocs } from "./db/mongodbCentralizedCrud.service.js";

export const paginateModel = async ({ model, page = 1, limit = 20, populate = [], sort = { createdAt: -1 }, includeDeleted = false }) => {
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Use centralized db service functions
    const [data, total] = await Promise.all([
        findDocs({
            model,
            filter: includeDeleted ? {} : { isDeleted: { $ne: true } },
            options: { sort, skip, limit: limitNum, populate, lean: false }
        }),
        countDocs({
            model,
            filter: includeDeleted ? {} : { isDeleted: { $ne: true } }
        })
    ]);

    return {
        data,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        hasMore: pageNum * limitNum < total
    };
};