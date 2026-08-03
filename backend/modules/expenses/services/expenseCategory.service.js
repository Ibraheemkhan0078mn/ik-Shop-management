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

export {
    expenseCatagCreate,
    expenseCatagGetAll,
    expenseCatagDelete,
};
