import { findOneAttendance } from '../crud/memberAttendance.crud.service.js';
import { findDocs, updateDoc, saveDoc } from '../../../../shared/services/dbOperationService/local.dbOperation.service.js';

const todayRange = () => {
    const s = new Date(); s.setHours(0, 0, 0, 0);
    const e = new Date(); e.setHours(23, 59, 59, 999);
    return { startOfDay: s, endOfDay: e };
};

export const syncMemberInAttendance = async (memberDoc) => {
    try {
        const now = new Date();
        const { startOfDay, endOfDay } = todayRange();

        const todayDoc = await findOneAttendance({ date: { $gte: startOfDay, $lte: endOfDay } });

        if (todayDoc) {
            const alreadyIn = todayDoc.members.some(m => m.id.toString() === memberDoc._id.toString());
            const isPast    = new Date(memberDoc.hiringDate) <= now;

            if (isPast && !alreadyIn) {
                todayDoc.members.push({ id: memberDoc._id, instituteId: memberDoc.instituteId, name: memberDoc.name, presenceStatus: 'notFilled' });
                await saveDoc(todayDoc);
            } else if (!isPast && alreadyIn) {
                todayDoc.members = todayDoc.members.filter(m => m.id.toString() !== memberDoc._id.toString());
                await saveDoc(todayDoc);
            }
        }

        // Sync name + instituteId across all attendance docs that include this member
        const allDocsWithMember = await findDocs('memberAttendence', { 'members.id': memberDoc._id });
        const bulkOps = allDocsWithMember.map(doc => ({
            updateOne: {
                filter: { _id: doc._id, 'members.id': memberDoc._id },
                update: { $set: { 'members.$.name': memberDoc.name, 'members.$.instituteId': memberDoc.instituteId } },
            },
        }));

        if (bulkOps.length) {
            // bulkWrite needs the raw model — use the attendance model directly here since bulkWrite is not in the shared service
            const { getLocalMemberAttendenceModel } = await import('../../../../shared/db/localDbConnection.js');
            await getLocalMemberAttendenceModel().bulkWrite(bulkOps);
        }
    } catch (error) {
        console.error('[syncMemberInAttendance] Error:', error);
        throw error;
    }
};
