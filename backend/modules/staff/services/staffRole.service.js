import {
    createStaffRoleService,
    findStaffRoleService,
    findOneStaffRoleService,
    findByIdStaffRoleService,
    updateStaffRoleService,
    deleteOneStaffRoleService,
    countStaffRoleService
} from "./staffRole.crud.js";

const createStaffRole = async (data) => {
    return await createStaffRoleService(data);
};

const getAllStaffRoles = async (query = {}) => {
    return await findStaffRoleService(query);
};

const getStaffRoleById = async (id) => {
    return await findByIdStaffRoleService(id);
};

const findStaffRoleByName = async (name) => {
    return await findOneStaffRoleService({ name });
};

const updateStaffRole = async (id, data) => {
    return await updateStaffRoleService(id, data);
};

const deleteStaffRole = async (id) => {
    return await deleteOneStaffRoleService(id);
};

const countStaffRoles = async (query = {}) => {
    return await countStaffRoleService(query);
};

export {
    createStaffRole,
    getAllStaffRoles,
    getStaffRoleById,
    findStaffRoleByName,
    updateStaffRole,
    deleteStaffRole,
    countStaffRoles
};
