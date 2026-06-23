import {
    createCustomerService,
    findCustomerService,
    findOneCustomerService,
    findByIdCustomerService,
    updateCustomerService,
    deleteOneCustomerService,
    countCustomerService,
} from "./customer.crud.js";

const customerCreate = async (data) => await createCustomerService(data);

const getAllCustomers = async (query = {}) => await findCustomerService(query).sort({ createdAt: -1 });

const getCustomerById = async (id) => await findByIdCustomerService(id);

const findCustomerByPhoneOrCnic = async (query) => await findOneCustomerService(query);

const customerUpdate = async (id, data) => await updateCustomerService(id, data);

const customerDelete = async (id) => await deleteOneCustomerService(id);

const countCustomers = async (query = {}) => await countCustomerService(query);

export {
    customerCreate,
    getAllCustomers,
    getCustomerById,
    findCustomerByPhoneOrCnic,
    customerUpdate,
    customerDelete,
    countCustomers,
};
