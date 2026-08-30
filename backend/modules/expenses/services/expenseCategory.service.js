import { createExpenseCategoryService, findExpenseCategoryService, findOneExpenseCategoryService, findByIdExpenseCategoryService, updateExpenseCategoryService, deleteOneExpenseCategoryService } from "./expenseCategory.crud.js";

const expenseCatagCreate = async (catagName) => {
    return await createExpenseCategoryService({ name: catagName });
};

const expenseCatagGetAll = async () => {
    return await findExpenseCategoryService();
};

const expenseCatagDelete = async (id) => {
    return await deleteOneExpenseCategoryService(id);
};

const expenseCatagSearch = async (query = "", limit = 20) => {
    if (!query || query.length < 1) {
        return [];
    }
    
    const searchRegex = new RegExp(query, 'i');
    const startsWithRegex = new RegExp(`^${query}`, 'i');
    
    // Get results that start with the query (higher priority)
    const startsWithResults = await findExpenseCategoryService({
        name: startsWithRegex,
        isDeleted: { $ne: true }
    }, {
        limit: parseInt(limit),
        sort: { name: 1 }
    });
    
    // If we have enough results from startsWith, return them
    if (startsWithResults.length >= limit) {
        return startsWithResults.slice(0, limit);
    }
    
    // Get results that contain the query anywhere (lower priority)
    const containsResults = await findExpenseCategoryService({
        name: searchRegex,
        isDeleted: { $ne: true },
        _id: { $nin: startsWithResults.map(c => c._id) } // Exclude already found
    }, {
        limit: parseInt(limit) - startsWithResults.length,
        sort: { name: 1 }
    });
    
    // Combine: startsWith results first, then contains results
    return [...startsWithResults, ...containsResults];
};

export {
    expenseCatagCreate,
    expenseCatagGetAll,
    expenseCatagDelete,
    expenseCatagSearch,
};
