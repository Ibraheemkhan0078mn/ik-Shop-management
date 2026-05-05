import { getLocalMemberModel } from "../../../configs/connect.db.js";
import { teacherAttendenceCalcFunc } from "./teacherAttendanceCalculation.js";
import { changeTrackDocsCreationFunc } from '../../../common/ikSync/changeTrackModelCreation.js'



export async function teacherReminderHandler(startTime, endTime) {


    let now = new Date()
    if (!startTime) { startTime = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0) }
    if (!endTime) { endTime = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999) }






    let localTeacherModel = getLocalMemberModel()
    let localReminderModel = getLocalReminderModel()


    let allTeachers = await localTeacherModel.find().populate("salaryPayments")
    for (let teacher of allTeachers) {

        let perAbsenceCut = teacher?.perAttendenceCut
        let teacherSalary = teacher?.salary
        let totalPaidAmount = 0;

        let filteredPayment = teacher.salaryPayments.filter(p => p.date >= startTime && p.date <= endTime)
        if (filteredPayment?.length > 0) {
            totalPaidAmount = filteredPayment.reduce((acc, p) => { return acc + p.salaryAmount }, 0)
        }




        let {
            absence } = await teacherAttendenceCalcFunc(startTime, endTime, teacher?._id)



        let totalAmountToCut = perAbsenceCut * absence
        if (teacherSalary - (totalPaidAmount + totalAmountToCut) > 0) {


            let existingReminder = await localReminderModel.findOneAndUpdate({
                type: "teacherSalaryUnpaid",
                forDocumentId: teacher?._id,
                forModelName: localTeacherModel.modelName
            },
                {
                    activationDate: new Date(),
                    note: `${teacher.name} salary of amount ${teacherSalary - (totalPaidAmount + totalAmountToCut)}/- of month ${new Date().toLocaleDateString()} is remaining`
                },
                {
                    new: true
                })

            if (!existingReminder) {
                let createdReminder = await localReminderModel.create({
                    type: "teacherSalaryUnpaid",
                    forDocumentId: teacher?._id,
                    forModelName: localTeacherModel.modelName,
                    activationDate: new Date(),
                    note: `${teacher.name} salary of amount ${teacherSalary - (totalPaidAmount + totalAmountToCut)}/- of month ${new Date().toLocaleDateString()} is remaining`
                })
                await changeTrackDocsCreationFunc("create", localReminderModel.modelName, createdReminder._id)
            } else {
                await changeTrackDocsCreationFunc("update", localReminderModel.modelName, existingReminder._id)
            }




        }
        else {
            let toDeleteReminder = await localReminderModel.findOne({
                type: "teacherSalaryUnpaid",
                forDocumentId: teacher?._id,
                forModelName: localTeacherModel.modelName
            })
            await localReminderModel.findOneAndDelete({
                type: "teacherSalaryUnpaid",
                forDocumentId: teacher?._id,
                forModelName: localTeacherModel.modelName
            })
            await changeTrackDocsCreationFunc("delete", localReminderModel.modelName, toDeleteReminder?._id)
        }



    }
}