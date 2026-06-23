import * as yup from "yup";

export const createCustomerSchema = yup.object({
    name: yup.string().required("Customer name is required"),
    image: yup.string().nullable(),
    phoneNo: yup.string().nullable(),
    cnic: yup.string().nullable(),
    address: yup.string().nullable(),
    isActive: yup.boolean().default(true),
});

export const updateCustomerSchema = yup.object({
    name: yup.string(),
    image: yup.string().nullable(),
    phoneNo: yup.string().nullable(),
    cnic: yup.string().nullable(),
    address: yup.string().nullable(),
    isActive: yup.boolean(),
});
