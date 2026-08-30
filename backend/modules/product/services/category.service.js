import {
    createCategoryService,
    findCategoryService,
    findOneCategoryService,
    findByIdCategoryService,
    updateCategoryService,
    deleteOneCategoryService,
    countCategoryService,
} from "./category.crud.js";
import { findDocs, countDocs } from '../../../common/services/db/mongodbCentralizedCrud.service.js';
import { getLocalCategoryModel } from '../../../configs/connect.db.js';

export const getCategories = async () => {
    return findCategoryService({}, { sort: { createdAt: -1 } });
};

export const getPaginationCategories = async (filters = {}) => {
    const { page = 1, limit = 20 } = filters;
    const CategoryModel = getLocalCategoryModel();
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [data, total] = await Promise.all([
        findDocs({
            model: CategoryModel,
            filter: { isDeleted: { $ne: true } },
            options: { sort: { createdAt: -1 }, skip, limit: limitNum, lean: false }
        }),
        countDocs({
            model: CategoryModel,
            filter: { isDeleted: { $ne: true } }
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

export const getCategoryById = async (id) => {
    return findByIdCategoryService(id);
};

export const createCategory = async (data) => {
    const { name } = data;
    const categoryExists = await findOneCategoryService({ name });
    
    if (categoryExists) {
        throw new Error("Category with this name already exists");
    }
    
    return createCategoryService(data);
};

export const updateCategory = async (id, data) => {
    const category = await findByIdCategoryService(id);
    
    if (!category) {
        throw new Error("Category not found");
    }
    
    if (data.name && data.name !== category.name) {
        const nameExists = await findOneCategoryService({ name: data.name });
        if (nameExists) {
            throw new Error("Category with this name already exists");
        }
    }
    
    return updateCategoryService(id, data);
};

export const deleteCategory = async (id) => {
    const category = await findByIdCategoryService(id);
    
    if (!category) {
        throw new Error("Category not found");
    }
    
    return deleteOneCategoryService(id);
};

export const searchCategories = async (query = "", limit = 20) => {
    const CategoryModel = getLocalCategoryModel();
    
    if (!query || query.length < 1) {
        return [];
    }
    
    const searchRegex = new RegExp(query, 'i');
    const startsWithRegex = new RegExp(`^${query}`, 'i');
    
    // Get results that start with the query (higher priority)
    const startsWithResults = await findDocs({
        model: CategoryModel,
        filter: {
            isDeleted: { $ne: true },
            isActive: { $ne: false },
            name: startsWithRegex
        },
        options: {
            limit: parseInt(limit),
            sort: { name: 1 }
        }
    });
    
    // If we have enough results from startsWith, return them
    if (startsWithResults.length >= limit) {
        return startsWithResults.slice(0, limit);
    }
    
    // Get results that contain the query anywhere (lower priority)
    const containsResults = await findDocs({
        model: CategoryModel,
        filter: {
            isDeleted: { $ne: true },
            isActive: { $ne: false },
            name: searchRegex,
            _id: { $nin: startsWithResults.map(c => c._id) } // Exclude already found
        },
        options: {
            limit: parseInt(limit) - startsWithResults.length,
            sort: { name: 1 }
        }
    });
    
    // Combine: startsWith results first, then contains results
    return [...startsWithResults, ...containsResults];
};
