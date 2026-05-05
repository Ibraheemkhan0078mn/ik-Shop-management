import * as yup from "yup";

export const createCategorySchema = yup.object({
    name: yup.string().required("Category name is required"),
    description: yup.string().nullable(),
    image: yup.string().nullable(),
    isActive: yup.boolean().default(true),
});

export const updateCategorySchema = yup.object({
    name: yup.string(),
    description: yup.string().nullable(),
    image: yup.string().nullable(),
    isActive: yup.boolean(),
});
