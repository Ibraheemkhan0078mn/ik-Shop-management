import { 
    createOnlineUserService, 
    findOneOnlineUserService, 
    findByIdOnlineUserService 
} from "./onlineUser.crud.js";

const onlineUserCreate = async (data) => {
    return await createOnlineUserService(data);
};

const findOnlineUserByEmail = async (email) => {
    return await findOneOnlineUserService({ email });
};

const findOnlineUserByEmailWithPassword = async (email) => {
    return await findOneOnlineUserService({ email }, { select: "+password", lean: false });
};

const findOnlineUserById = async (id) => {
    return await findOneOnlineUserService({ _id: id });
};

const findOnlineUserByIdWithoutPassword = async (id) => {
    return await findByIdOnlineUserService(id, { select: "-password" });
};

export {
    onlineUserCreate,
    findOnlineUserByEmail,
    findOnlineUserByEmailWithPassword,
    findOnlineUserById,
    findOnlineUserByIdWithoutPassword,
};
