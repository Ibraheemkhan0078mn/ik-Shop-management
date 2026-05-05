import { getLocalMemberAttendanceModel } from "../../../configs/connect.db.js";
import { getCurrentMonthRange } from "../../../common/services/date.js";



export async function teacherAttendenceCalcFunc(fromDate, tillDate, teacherDocId) {
    try {


        let teacherAttendenceModel = getLocalMemberAttendanceModel()
        let totalClasses = 0;
        let presence = 0;
        let absence = 0;
        let leave = 0;
        let presencePercentage = 0;

        if (!fromDate || !tillDate) {
            return { success: false, msg: "date is not found" }
        }


        let { startOfMonth, endOfMonth } = getCurrentMonthRange(fromDate, tillDate)

        let attendenceDocs = await teacherAttendenceModel.find({
            date: { $gte: startOfMonth, $lte: endOfMonth },
            "teachers.id": teacherDocId
        });




        if (!attendenceDocs?.length > 0) {
            return { success: false, msg: "No attendence is found" }
        }




        for (let eachAttendenceDocs of attendenceDocs) {
            for (let eachTeacher of eachAttendenceDocs.teachers) {
                if (teacherDocId.toString() == eachTeacher?.id.toString()) {


                    if (eachTeacher?.presenceStatus == "present") {
                        presence++
                    }
                    else if (eachTeacher?.presenceStatus == "absent") {
                        absence++
                    }
                    else if (eachTeacher?.presenceStatus == "leave") {
                        leave++
                    }
                    else if (eachTeacher?.presenceStatus == "notFilled") {
                        absence++
                    }
                }
            }
        }



        totalClasses = attendenceDocs?.length


        presencePercentage = (presence / totalClasses) * 100


        return { totalClasses, presence, absence, leave, presencePercentage, attendenceDocs }




    } catch (error) {
        console.log(error)
    }
}