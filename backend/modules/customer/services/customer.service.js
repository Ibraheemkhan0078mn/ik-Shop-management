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

const getAllCustomers = async (query = {}) => await findCustomerService(query, { sort: { createdAt: -1 } });

const getCustomerById = async (id) => await findByIdCustomerService(id);

const findCustomerByPhoneOrCnic = async (query) => await findOneCustomerService(query);

const customerUpdate = async (id, data) => await updateCustomerService(id, data);

const customerDelete = async (id) => await deleteOneCustomerService(id);

const countCustomers = async (query = {}) => await countCustomerService(query);

const getPaginatedCustomers = async (filters = {}) => {
    const { page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;
    
    const customers = await findCustomerService({}, {
        sort: { createdAt: -1 },
        skip,
        limit: parseInt(limit)
    });
    
    const total = await countCustomerService({});
    
    return {
        data: customers,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
    };
};

export {
    customerCreate,
    getAllCustomers,
    getCustomerById,
    findCustomerByPhoneOrCnic,
    customerUpdate,
    customerDelete,
    countCustomers,
    getPaginatedCustomers,
};
