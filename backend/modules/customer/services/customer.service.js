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

// Search customers by name, phone, or cnic
const searchCustomers = async (query = "", limit = 20) => {
    if (!query || query.length < 1) {
        return [];
    }

    const searchRegex = new RegExp(query, 'i');
    const startsWithRegex = new RegExp(`^${query}`, 'i');

    // Get results that start with the query (higher priority)
    const startsWithResults = await findCustomerService({
        $or: [
            { name: startsWithRegex },
            { phoneNo: startsWithRegex },
            { cnic: startsWithRegex }
        ],
        isActive: { $ne: false }
    }, {
        limit: parseInt(limit),
        sort: { name: 1 }
    });

    // If we have enough results from startsWith, return them
    if (startsWithResults.length >= limit) {
        return startsWithResults.slice(0, limit);
    }

    // Get results that contain the query anywhere (lower priority)
    const containsResults = await findCustomerService({
        $or: [
            { name: searchRegex },
            { phoneNo: searchRegex },
            { cnic: searchRegex }
        ],
        isActive: { $ne: false },
        _id: { $nin: startsWithResults.map(c => c._id) } // Exclude already found
    }, {
        limit: parseInt(limit) - startsWithResults.length,
        sort: { name: 1 }
    });

    // Combine: startsWith results first, then contains results
    return [...startsWithResults, ...containsResults];
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
    searchCustomers,
};
