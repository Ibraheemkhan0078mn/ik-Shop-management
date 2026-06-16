import { calculateAllAttendanceMissed } from '../../../reports/reports.controller.js';
import { findMembers } from '../crud/member.crud.service.js';
import { findAttendances } from '../crud/memberAttendance.crud.service.js';

export const getEachMemberAttendanceDataService = async (memberId, startDate, endDate) => {
    if (!startDate || !endDate || !memberId)
        return { success: false, message: 'startDate, endDate, and memberId are required' };

    const start = new Date(startDate); start.setHours(0, 0, 0, 0);
    const end   = new Date(endDate);   end.setHours(23, 59, 59, 999);

    const attendances = await findAttendances(
        { date: { $gte: start, $lte: end }, 'members.id': memberId },
        { sort: { date: 1 } }
    );

    let presentCount = 0, absentCount = 0, leaveCount = 0, totalClasses = 0;
    const classDates = new Set();

    for (const doc of attendances) {
        const record = doc.members?.find(m => m.id?.toString() === memberId.toString());
        if (!record) continue;

        totalClasses++;
        classDates.add(doc.date.toISOString().split('T')[0]);
        const status = record.presenceStatus?.toLowerCase();

        if      (status === 'present')   presentCount++;
        else if (status === 'absent')    absentCount++;
        else if (status === 'leave')     leaveCount++;
        else if (status === 'notfilled') absentCount++;
    }

    const { missedCount, missedReason } = calculateAllAttendanceMissed(start, end, attendances);
    const attendancePercentage = totalClasses > 0
        ? parseFloat(((presentCount / totalClasses) * 100).toFixed(2))
        : 0;

    return {
        success: true,
        data: {
            memberId,
            dateRange: { startDate: start, endDate: end },
            summary: {
                totalClasses, present: presentCount, absent: absentCount, leave: leaveCount,
                allAttendencesMissed: missedCount, attendancePercentage,
                allAttendancesMissedReason: missedReason, allAttendanceData: attendances,
            },
        },
    };
};

export const memberAttendanceRecordService = async (startDate, endDate) => {
    const allMembers = await findMembers({ post: { $ne: 'investor' } }, { lean: true });
    if (!allMembers?.length) return { success: false, msg: 'No members found.' };

    const attendanceRecords = await findAttendances(
        { date: { $gte: new Date(startDate), $lte: new Date(endDate) } },
        { lean: true }
    );

    // Build date array from startDate to endDate
    const allDates = [];
    for (let d = new Date(startDate); d <= new Date(endDate); d.setDate(d.getDate() + 1))
        allDates.push(new Date(d));

    // Key attendance records by date string
    const attendanceByDate = Object.fromEntries(
        attendanceRecords.map(doc => [new Date(doc.date).toISOString().split('T')[0], doc])
    );

    const data = allMembers.map(member => {
        let presenceCount = 0, absentCount = 0, leaveCount = 0, notFilledCount = 0;

        const dailyRecord = allDates.map(date => {
            const dateKey     = date.toISOString().split('T')[0];
            const attendDoc   = attendanceByDate[dateKey];
            let   status      = 'notFilled';

            if (attendDoc) {
                const entry = attendDoc.members?.find(m => m.id?.toString() === member._id?.toString());
                status = entry ? entry.presenceStatus : 'notFound';
            }

            if      (status === 'present')  presenceCount++;
            else if (status === 'absent')   absentCount++;
            else if (status === 'leave')    leaveCount++;
            else                            notFilledCount++;

            return { attendanceId: attendDoc?._id || null, date: dateKey, status };
        });

        const totalDays = allDates.length;
        const attendancePercentage = totalDays > 0
            ? parseFloat(((presenceCount / totalDays) * 100).toFixed(2))
            : 0;

        return {
            memberId: member._id, memberName: member.name,
            memberInstituteId: member.instituteId, phoneNo: member.phoneNo,
            profileImage: member.profileImage, post: member.post,
            summary: { presenceCount, absentCount, leaveCount, notFilledCount, totalDays, attendancePercentage },
            dailyRecord,
        };
    });

    return {
        success: true, msg: 'Member attendance records retrieved.',
        totalMembers: allMembers.length, totalDays: allDates.length,
        startDate, endDate, data,
    };
};
