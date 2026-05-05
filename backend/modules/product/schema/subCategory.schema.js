import * as yup from "yup";

export const createSubCategorySchema = yup.object({
    name: yup.string().required("Subcategory name is required"),
    category: yup.string().required("Parent category ID is required"),
    description: yup.string().nullable(),
    image: yup.string().nullable(),
    isActive: yup.boolean().default(true),
});

export const updateSubCategorySchema = yup.object({
    name: yup.string(),
    category: yup.string(),
    description: yup.string().nullable(),
    image: yup.string().nullable(),
    isActive: yup.boolean(),
});
