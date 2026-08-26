import { changeTrackDocsCreationFunc } from '../../../common/services/onlineSync/changeTrackModelCreation.js'
import {
    createStaffRole as createStaffRoleService,
    getAllStaffRoles as getAllStaffRolesService,
    getStaffRoleById as getStaffRoleByIdService,
    deleteStaffRole as deleteStaffRoleService,
    countStaffRoles as countStaffRolesService
} from "../services/staffRole.service.js";
import { getLocalStaffRoleModel, getLocalStaffModel } from "../../../configs/connect.db.js";
import { findOneDoc } from "../../../common/services/db/mongodbCentralizedCrud.service.js";

export const createStaffRole = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.json({ success: false, msg: "Role name is required" });
        }

        let StaffRoleModel = getLocalStaffRoleModel();

        const existingRole = await findOneDoc({
            model: StaffRoleModel,
            filter: { name, isDeleted: false }
        });
        if (existingRole) {
            return res.json({ success: false, msg: "Role with this name already exists" });
        }

        let createdRole = await createStaffRoleService({ name });

        await changeTrackDocsCreationFunc("create", StaffRoleModel.modelName, createdRole?._id)

        let roles = await getAllStaffRolesService({ isDeleted: false });

        return res.json({ success: true, msg: "Role created", data: roles });
    } catch (err) {
        console.log(err);
        return res.json({ success: false, msg: "Error creating role" });
    }
};

export const getAllStaffRoles = async (req, res) => {
    try {
        let page = parseInt(req.query.page) || 1;
        let limit = parseInt(req.query.limit) || 20;
        let skip = (page - 1) * limit;
        let search = req.query.search || "";

        let query = { isDeleted: false };
        
        if (search) {
            query.name = { $regex: search, $options: "i" };
        }

        let roles = await getAllStaffRolesService(query);
        
        let total = await countStaffRolesService(query);
        
        let paginatedRoles = roles.slice(skip, skip + limit);

        return res.json({ 
            success: true, 
            data: paginatedRoles,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        });
    } catch (err) {
        console.log(err);
        return res.json({ success: false, msg: "Error getting roles" });
    }
};

export const deleteStaffRole = async (req, res) => {
    try {
        // Get _id from body or query parameters
        const { _id } = req.body || {};
        const _idFromQuery = req.query._id;
        const roleId = _id || _idFromQuery;
        
        let StaffRoleModel = getLocalStaffRoleModel();
        let StaffModel = getLocalStaffModel();

        if (!roleId) {
            return res.json({ success: false, msg: "Role ID is required" });
        }

        // Check if any staff member has this role
        const staffWithRole = await findOneDoc({
            model: StaffModel,
            filter: { role: roleId, isDeleted: false }
        });
        if (staffWithRole) {
            return res.json({ success: false, msg: "This role is already integrated with staff. Cannot delete." });
        }

        let deleted = await deleteStaffRoleService(roleId);

        if (!deleted) {
            return res.json({ success: false, msg: "Role not found" });
        }

        await changeTrackDocsCreationFunc("delete", StaffRoleModel.modelName, roleId)

        let roles = await getAllStaffRolesService({ isDeleted: false });

        return res.json({ success: true, msg: "Role deleted", data: roles });
    } catch (err) {
        console.log(err);
        return res.json({ success: false, msg: "Error deleting role" });
    }
};
