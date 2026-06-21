import { create, find, findOne, findById, update, deleteOne } from "./expenseCategory.crud.js";

const expenseCatagCreate = async (catagName) => {
    return await create({ name: catagName });
};

const expenseCatagGetAll = async () => {
    return await find();
};

const expenseCatagDelete = async (id) => {
    return await deleteOne(id);
};

export {
    expenseCatagCreate,
    expenseCatagGetAll,
    expenseCatagDelete,
};
