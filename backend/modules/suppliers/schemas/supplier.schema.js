import * as yup from "yup";

export const createSupplierSchema = yup.object({
    name: yup.string().required("Supplier name is required"),
    contactPerson: yup.string().nullable(),
    email: yup.string().email("Invalid email format").nullable(),
    phone: yup.string().nullable(),
    address: yup.string().nullable(),
    isActive: yup.boolean().default(true),
    notes: yup.string().nullable(),
    type: yup.string().nullable(),
});

export const updateSupplierSchema = yup.object({
    name: yup.string(),
    contactPerson: yup.string().nullable(),
    email: yup.string().email("Invalid email format").nullable(),
    phone: yup.string().nullable(),
    address: yup.string().nullable(),
    isActive: yup.boolean(),
    notes: yup.string().nullable(),
    type: yup.string().nullable(),
});
