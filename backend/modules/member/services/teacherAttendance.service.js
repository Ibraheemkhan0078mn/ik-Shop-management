import { calculateAllAttendanceMissed } from "../../controllers/reports.controller.js";
import { getLocalAttendenceModel, getLocalMemberModel, getLocalMemberAttendanceModel } from "../../../../configs/connect.db.js";








export async function getEachTeacherAttendanceDataService(teacherId, startDate, endDate) {
    try {


        let Attendance = getLocalMemberAttendanceModel()

        // console.log(startDate, endDate, teacherId, "Get teacjr attendace summary")
        // Validation
        if (!startDate || !endDate || !teacherId) {
            return ({
                success: false,
                message: 'startDate, endDate, and teacherId are required'
            });
        }

        // Convert to proper start and end of day
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        // Fetch all attendance records within the date range
        const attendances = await Attendance.find({
            date: {
                $gte: start,
                $lte: end
            },
            'teachers.id': teacherId
        }).sort({ date: 1 });


        console.log(attendances, "All attendance from summay")

        // Initialize counters
        let presentCount = 0;
        let absentCount = 0;
        let leaveCount = 0;
        let totalClasses = 0;

        // Track dates when teacher had a class
        const classDates = new Set();

        // Loop through all attendance documents
        attendances.forEach(attendance => {
            // Check if teachers field exists and is an array
            if (attendance.teachers && Array.isArray(attendance.teachers)) {
                // Find the teacher in the teachers array
                const teacherRecord = attendance.teachers.find(
                    teacher => teacher.id && teacher.id.toString() === teacherId.toString()
                );

                // If teacher found in this attendance record
                if (teacherRecord) {
                    totalClasses++;
                    classDates.add(attendance.date.toISOString().split('T')[0]);

                    // Count based on presence status
                    const status = teacherRecord.presenceStatus?.toLowerCase();

                    if (status === 'present') {
                        presentCount++;
                    } else if (status === 'absent') {
                        absentCount++;
                    } else if (status === 'leave') {
                        leaveCount++;
                    } else if (status === "notFilled") {
                        absentCount++
                    }
                }
            }
        });

        // Calculate attendance missed (excluding weekends)
        const { missedCount, missedReason } = calculateAllAttendanceMissed(
            start,
            end,
            attendances
        );

        // Calculate attendance percentage
        const attendancePercentage = totalClasses > 0
            ? ((presentCount / totalClasses) * 100).toFixed(2)
            : 0;

        // Response
        return ({
            success: true,
            data: {
                teacherId,
                dateRange: {
                    startDate: start,
                    endDate: end
                },
                summary: {
                    totalClasses,
                    present: presentCount,
                    absent: absentCount,
                    leave: leaveCount,
                    allAttendencesMissed: missedCount,
                    attendancePercentage: parseFloat(attendancePercentage),
                    allAttendancesMissedReason: missedReason,
                    allAttendanceData: attendances
                }
            }
        });

    } catch (error) {
        console.error('Error in getTeacherAttendanceSummary:', error);
        throw new Error(error?.message)
    }
};















export const teacherAttendanceRecordService = async (startDate, endDate) => {
    try {

        // STEP 1: Models initialize karo
        let TeacherModel = getLocalMemberModel()
        let TeacherAttendanceModel = getLocalMemberAttendanceModel()


        // STEP 2: Sare active teachers fetch karo
        let allTeachers = await TeacherModel.find({ post: { $ne: "investor" } }).lean()

        if (!allTeachers?.length) return { success: false, msg: "No teachers found." }


        // STEP 3: Date range ke andar ke attendance records fetch karo
        let attendanceRecords = await TeacherAttendanceModel.find({
            date: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        }).lean()


        // STEP 4: startDate se endDate tak ki SAARI dates ka array banao
        let allDates = []
        let current = new Date(startDate)
        let end = new Date(endDate)

        while (current <= end) {
            allDates.push(new Date(current))
            current.setDate(current.getDate() + 1)
        }


        // STEP 5: Attendance records ko date-keyed map mein convert karo
        let attendanceByDate = {}
        attendanceRecords.forEach((doc) => {
            let dateKey = new Date(doc.date).toISOString().split("T")[0]
            attendanceByDate[dateKey] = doc
        })


        // STEP 6: Har teacher ke liye summary + daily record banao
        let teachersAttendanceSummary = allTeachers.map((teacher) => {

            let presenceCount = 0
            let absentCount = 0
            let leaveCount = 0
            let notFilledCount = 0

            // STEP 6a: Har date ke liye is teacher ka status determine karo
            let dailyRecord = allDates.map((date) => {

                let dateKey = date.toISOString().split("T")[0]
                let attendanceDoc = attendanceByDate[dateKey]
                let status = "notFilled"

                if (attendanceDoc) {
                    let teacherEntry = attendanceDoc.teachers?.find(
                        (t) => t.id?.toString() === teacher._id?.toString()
                    )
                    status = teacherEntry ? teacherEntry.presenceStatus : "notFound"
                }

                if (status === "present") presenceCount++
                else if (status === "absent") absentCount++
                else if (status === "leave") leaveCount++
                else notFilledCount++

                return {
                    attendanceId: attendanceDoc?._id || null,
                    date: dateKey,
                    status: status,
                }
            })


            // STEP 6b: Attendance percentage calculate karo
            let totalDays = allDates.length
            let attendancePercentage = totalDays > 0
                ? parseFloat(((presenceCount / totalDays) * 100).toFixed(2))
                : 0


            // STEP 6c: Is teacher ka complete record return karo
            return {
                teacherId: teacher._id,
                teacherName: teacher.name,
                teacherInstituteId: teacher.instituteId,
                phoneNo: teacher.phoneNo,
                profileImage: teacher.profileImage,
                post: teacher.post,
                summary: {
                    presenceCount,
                    absentCount,
                    leaveCount,
                    notFilledCount,
                    totalDays,
                    attendancePercentage,
                },
                dailyRecord,
            }
        })


        // STEP 7: Final response return karo
        return {
            success: true,
            msg: "Teacher attendance records retrieved.",
            totalTeachers: allTeachers.length,
            totalDays: allDates.length,
            startDate,
            endDate,
            data: teachersAttendanceSummary,
        }

    } catch (error) {
        console.log("teacherAttendanceRecordService error:", error)
        return { success: false, msg: "Error retrieving teacher attendance records." }
    }
}