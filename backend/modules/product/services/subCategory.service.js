import { create, find, findOne, findById, update, deleteOne } from "./subCategory.crud.js";

const getSubCategories = async () => {
    return await find().populate("category", "name").sort({ createdAt: -1 });
};

const getPaginationSubCategories = async (filters = {}) => {
    const { page = 1, limit = 20 } = filters;
    const query = {};
    const subcategories = await find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .populate("category");
    const total = await require("./subCategory.crud.js").count(query);
    return {
        data: subcategories,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
    };
};

const createSubCategory = async (data) => {
    const { name, category } = data;
    const subCategoryExists = await findOne({ name, category });
    if (subCategoryExists) {
        throw new Error("Subcategory with this name already exists in this category");
    }
    return await create(data);
};

const updateSubCategory = async (id, data) => {
    const subcategory = await findById(id);
    if (!subcategory) {
        throw new Error("Subcategory not found");
    }
    return await update(id, data);
};

const deleteSubCategory = async (id) => {
    const subcategory = await findById(id);
    if (!subcategory) {
        throw new Error("Subcategory not found");
    }
    return await deleteOne(id);
};

const getSubCategoriesById = async (id) => {
    const subcategory = await findById(id);
    if (!subcategory) {
        throw new Error("Subcategory not found");
    }
    return subcategory;
};

const getSubCategoriesByCatagId = async (id) => {
    const subcategory = await find({ category: id }).populate("category", "name");
    if (!subcategory) {
        throw new Error("Subcategory not found");
    }
    return subcategory;
};

export {
    getSubCategories,
    getPaginationSubCategories,
    createSubCategory,
    updateSubCategory,
    deleteSubCategory,
    getSubCategoriesById,
    getSubCategoriesByCatagId,
};
