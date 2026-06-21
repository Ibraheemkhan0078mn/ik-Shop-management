import { createMemberService, findMemberService, findOneMemberService, findByIdMemberService, updateMemberService, deleteOneMemberService, countMemberService } from "./member.crud.js";
import { getLocalMemberAttendanceModel } from "../../../configs/connect.db.js";

const memberCreate = async (data) => {
    const MemberModel = require("./member.crud.js").MemberModel || getLocalMemberModel();
    const AttendanceModel = getLocalMemberAttendanceModel();

    const createdMember = await createMemberService(data);

    // Add to today's attendance if hiring date is in the past
    if (createdMember && new Date(createdMember.hiringDate) < new Date()) {
        const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(); endOfDay.setHours(23, 59, 59, 999);
        const attendanceDoc = await AttendanceModel.findOne({ date: { $gte: startOfDay, $lte: endOfDay } });
        if (attendanceDoc) {
            attendanceDoc.members = [...(attendanceDoc.members || []), {
                id: createdMember._id,
                instituteId: createdMember.instituteId,
                name: createdMember.name,
                presenceStatus: 'notFilled',
            }];
            await attendanceDoc.save();
        }
    }

    return createdMember;
};

const memberUpdate = async (id, data) => {
    const MemberModel = require("./member.crud.js").MemberModel || getLocalMemberModel();
    const AttendanceModel = getLocalMemberAttendanceModel();

    const existingMember = await findByIdMemberService(id);
    if (!existingMember) {
        throw new Error("Member not found");
    }

    const updatedMember = await updateMemberService(id, data);

    // Sync name in attendance docs
    await AttendanceModel.updateMany(
        { 'members.id': updatedMember._id },
        { $set: { 'members.$.name': updatedMember.name, 'members.$.instituteId': updatedMember.instituteId } }
    );

    return updatedMember;
};

const memberDelete = async (id) => {
    return await deleteOneMemberService(id);
};

const getAllMemberData = async () => {
    return await findMemberService().sort({ createdAt: -1 }).lean();
};

const getMemberDataOnId = async (id) => {
    return await findByIdMemberService(id).lean();
};

const checkDuplicateMemberInstituteId = async (instituteId) => {
    return await findOneMemberService({ instituteId });
};

export {
    memberCreate,
    memberUpdate,
    memberDelete,
    getAllMemberData,
    getMemberDataOnId,
    checkDuplicateMemberInstituteId,
};
