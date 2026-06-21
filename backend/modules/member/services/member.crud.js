import { getLocalMemberModel } from "../../../configs/connect.db.js";

const createMemberService = (data) => {
    const MemberModel = getLocalMemberModel();
    return MemberModel.create(data);
};

const findMemberService = (query = {}) => {
    const MemberModel = getLocalMemberModel();
    return MemberModel.find(query);
};

const findOneMemberService = (query) => {
    const MemberModel = getLocalMemberModel();
    return MemberModel.findOne(query);
};

const findByIdMemberService = (id) => {
    const MemberModel = getLocalMemberModel();
    return MemberModel.findById(id);
};

const updateMemberService = (id, data) => {
    const MemberModel = getLocalMemberModel();
    return MemberModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

const deleteOneMemberService = (id) => {
    const MemberModel = getLocalMemberModel();
    return MemberModel.findByIdAndDelete(id);
};

const countMemberService = (query) => {
    const MemberModel = getLocalMemberModel();
    return MemberModel.countDocuments(query);
};

export { createMemberService, findMemberService, findOneMemberService, findByIdMemberService, updateMemberService, deleteOneMemberService, countMemberService };
