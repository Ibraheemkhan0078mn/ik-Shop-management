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
    if (!query || query.length < 2) {
        return [];
    }
    
    const searchRegex = new RegExp(query, 'i');
    
    const categories = await findExpenseCategoryService({
        name: searchRegex,
        isDeleted: { $ne: true }
    }, {
        limit: parseInt(limit),
        sort: { name: 1 }
    });
    
    return categories;
};

export {
    expenseCatagCreate,
    expenseCatagGetAll,
    expenseCatagDelete,
    expenseCatagSearch,
};
