import { getLocalMemberModel, getLocalMemberAttendanceModel, getLocalMemberInvoiceModel, getLocalMemberPaymentModel } from '../../../configs/connect.db.js';
import { teacherAttendenceCalcFunc } from '../services/teacherAttendanceCalculation.js';
import { teacherReminderHandler } from '../services/teacherReminderHandler.js';
import { ApiError } from '../../../common/services/apiResponses.js';
import { changeTrackDocsCreationFunc } from '../../../common/ikSync/changeTrackModelCreation.js'
import { recalculateAndRefillTeacherInvoices, removeDublicateSalaryInvoicesOfTeacher } from '../services/teacher.service.js'

import fs from 'fs';
import path from 'path';
import { imageChangeTrackDocsCreation } from '../../../common/ikSync/imageChangeTrackModelCreation.js';
import { generateTeacherSalaryInvoices } from '../services/teacher.service.js';
import { partnerInvestmentCreationFuntion } from '../services/partnership.service.js';
import { updateCurrentMonthTeacherInvoice } from '../services/teacherMain.service.js';
import mongoose from 'mongoose';
import { getCustomStartEndMonthRanges } from '../../../common/services/date.js';





export const teacherCreation = async (req, res) => {
    try {
        let { teacherId,
            name,
            isPartner,
            partnerType,
            overallPartnerShareValue,
            hiringDate,
            bankName,
            accountNumber,
            fatherName,
            phone,
            givenClasses,
            email,
            address,
            salary,
            education,
            perAttendenceCut,
            post,
            documents,
            languages,
            notes,
            skills,
            educationDegrees,
            cnicNo,
            experiences,
            isActive } = req.body;


        let isPartnerResult = (isPartner && isPartner == "true") ? true : false
        let isActiveResult = (isActive && isActive == "true") ? true : false
        console.log(req.body, "From teacher create", isPartnerResult)

        let filename;
        if (req.file) {
            filename = req?.file?.filename;
        }
        let localTeacherModel = getLocalMemberModel()
        let localTeacherAttendanceModel = getLocalMemberAttendanceModel()



        languages = JSON.parse(languages || '[]');
        skills = JSON.parse(skills || '[]');
        experiences = JSON.parse(experiences || '[]');
        educationDegrees = JSON.parse(educationDegrees || '[]');
        givenClasses = JSON.parse(givenClasses || '[]');





        let createdTeacher = await localTeacherModel.create({
            profileImage: filename ? filename : "",
            instituteId: teacherId,
            name,
            fatherName,
            phoneNo: phone,
            email,
            address,
            salary,
            education,
            givenClasses,
            perAttendenceCut,
            post,
            documents,
            languages,
            skills,
            educationDegrees,
            experiences,
            isPartner: isPartnerResult,
            partnerType: isPartner && partnerType,
            overallPartnerShareValue: (isPartner && partnerType) && overallPartnerShareValue,
            bankName,
            accountNumber: accountNumber && Number(accountNumber),
            hiringDate: hiringDate && new Date(hiringDate),
            isActive: isActiveResult,
            notes,
            cnic: cnicNo
        })
        console.log(createdTeacher, "The created teacher data", isPartner, bankName, accountNumber)

        if (createdTeacher) {
            // Aaj ki date range nikaalne ke liye
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0); // Raat ke 12:00:00 AM

            const endOfDay = new Date();
            endOfDay.setHours(23, 59, 59, 999); // Raat ke 11:59:59 PM



            // Agar aapko query banani hai:
            // filters.createdAt = { $gte: startOfDay, $lte: endOfDay };
            let existingAttendanceDoc = await localTeacherAttendanceModel.findOne({ date: { $gte: startOfDay, $lte: endOfDay } })

            if (existingAttendanceDoc) {


                let objectToFit = {
                    id: createdTeacher._id,
                    instituteId: createdTeacher.instituteId,
                    name: createdTeacher.name,
                    presenceStatus: "notFilled"
                }

                existingAttendanceDoc.teachers = [...existingAttendanceDoc.teachers, objectToFit]
                await existingAttendanceDoc.save()
            }
        }







        await changeTrackDocsCreationFunc("create", localTeacherModel.modelName, createdTeacher?._id)
        filename && await imageChangeTrackDocsCreation("create", localTeacherModel.modelName, createdTeacher._id)



        await generateTeacherSalaryInvoices(createdTeacher?._id, true)


        return res.json({ success: true, msg: "Teacher is created", createdTeacher })


    } catch (error) {
        console.log(error)
        return ApiError(error, res)
    }
}










export const teacherUpdate = async (req, res) => {
    try {
        let { teacherDocId,
            teacherId,
            name,
            fatherName,
            phone,
            isPartner,
            partnerType,
            overallPartnerShareValue,
            bankName,
            accountNumber,
            givenClasses,
            email,
            address,
            salary,
            education,
            perAttendenceCut,
            post,
            languages,
            skills,
            experiences,
            educationDegrees,
            hiringDate,
            notes,
            cnicNo
        } = req.body;
        // console.log(req.body)



        let localTeacherModel = getLocalMemberModel()
        let teacherProfileImageFilename = "";
        let documents = []
        if (req.files?.teacherProfileImage?.length) {
            teacherProfileImageFilename = req.files.teacherProfileImage[0].filename;
        }
        if (req?.files?.documents?.length > 0) {
            documents = req.files.documents?.length > 0 ? req.files.documents.map(d => d.filename) : []
        }



        languages = JSON.parse(languages || '[]');
        skills = JSON.parse(skills || '[]');
        experiences = JSON.parse(experiences || '[]');
        educationDegrees = JSON.parse(educationDegrees || '[]');
        givenClasses = JSON.parse(givenClasses || '[]');

        let existingTeacher = await localTeacherModel.findOne({ _id: teacherDocId })
        if (!existingTeacher) {
            return res.json({ success: false, msg: "The teacher is not found" })
        }

        console.log(isPartner, "THe partner is here")
        let udpatedTeacher = await localTeacherModel.findOneAndUpdate(
            {
                _id: teacherDocId
            },
            {
                profileImage: teacherProfileImageFilename ? teacherProfileImageFilename : existingTeacher?.profileImage,
                instituteId: teacherId,
                name,
                fatherName,
                phoneNo: phone,
                email,
                address,
                salary,
                education,
                givenClasses,
                perAttendenceCut,
                post,
                documents,
                skills,
                languages,
                experiences,
                educationDegrees,
                isPartner,
                partnerType: isPartner && partnerType,
                overallPartnerShareValue: (isPartner && partnerType) && overallPartnerShareValue,
                bankName,
                accountNumber,
                hiringDate: new Date(hiringDate),
                notes,
                cnic: cnicNo
            },
            { new: true })


        if (!udpatedTeacher) {
            return res.json({ success: false, msg: "Teacher is not updated" })
        }






        if (existingTeacher.salary != udpatedTeacher.salary) {
            await updateCurrentMonthTeacherInvoice(udpatedTeacher._id, udpatedTeacher.salary)
        }




        await changeTrackDocsCreationFunc("update", localTeacherModel.modelName, udpatedTeacher?._id)


        teacherProfileImageFilename && await imageChangeTrackDocsCreation("delete", localTeacherModel.modelName, udpatedTeacher._id, existingTeacher?.cloudinaryPublicId)
        teacherProfileImageFilename && await imageChangeTrackDocsCreation("create", localTeacherModel.modelName, udpatedTeacher._id)
        // for(let d of documents){
        //     await imageChangeTrackDocsCreation("create", localTeacherModel.modelName, createdTeacher._id)
        // }





        await recalculateAndRefillTeacherInvoices(existingTeacher._id, new Date(udpatedTeacher.hiringDate))





        return res.json({ success: true, msg: "Teacher is created", udpatedTeacher })


    } catch (error) {
        console.log(error)
        return ApiError(error, res)
    }
}


export const teacherDelete = async (req, res) => {
    try {

        let { teacherDocId } = req.body;

        if (!teacherDocId) {
            return res.json({ success: false, msg: "teacher id is not found" })
        }


        let localTeacherModel = getLocalMemberModel()


        await localTeacherModel.findOneAndDelete(
            {
                _id: teacherDocId
            }
        )


        let existingTeacher = await localTeacherModel.findOne({ _id: teacherDocId })
        if (existingTeacher) {
            return res.json({ success: false, msg: "The teacher is not deleted" })
        }





        // CHANGE TRACK CREATION
        await changeTrackDocsCreationFunc("delete", localTeacherModel.modelName, teacherDocId)


        let allTeachers = await localTeacherModel?.find()

        return res.json({ success: true, msg: "The teacher is deleted", allTeachers })


    } catch (error) {
        return res.json({ success: false, msg: "error", error: error?.message || error?.stack })
    }
}


export const getAllTeacherData = async (req, res) => {
    try {

        let allTeacherData = await getLocalMemberModel().find().sort({ createdAt: -1 })
        if (allTeacherData?.length > 0) {
            return res.json({ success: true, msg: "All teachers age getted", allTeacherData })
        }

        return res.json({ success: false, msg: "No Teachers are found" })

    } catch (error) {
        return res.json({ success: false, msg: "error", error: error?.message || error?.stack })
    }
}



export const getTeacherDataOnId = async (req, res) => {
    try {
        let { teacherId } = req.body;
        let localTeacherModel = getLocalMemberModel()
        let teacherdata = await localTeacherModel.findOne({ _id: teacherId })
        if (teacherdata) {
            return res.json({ success: true, msg: "All teachers age getted", teacherdata })
        }

        return res.json({ success: false, msg: "No Teachers are found" })

    } catch (error) {
        return res.json({ success: false, msg: "error", error: error?.message || error?.stack })
    }
}




export async function checkDublicateTeacherInstituteId(req, res) {
    try {
        const { teacherId } = req.params;

        let teacherModel = getLocalMemberModel();

        let existingTeacher = await teacherModel.findOne({ teacherInstituteId: teacherId });

        if (existingTeacher) {
            return res.json({ success: true, duplicate: true, msg: "Teacher with this Institute ID already exists" });
        }

        return res.json({ success: true, duplicate: false, msg: "Institute ID is available" });

    } catch (error) {
        return ApiError(error, res);
    }
}


















export const getInvesterPayments = async (req, res) => {
    try {

        let { teacherId } = req.body;

        if (!teacherId) {
            return res.json({ success: false, msg: "No teacher id is provided" })
        }

        let teacherModel = getLocalMemberModel()

        let existingTeacher = await teacherModel.findById(teacherId).populate("salaryPayments")

        if (!existingTeacher) {
            return res.json({ success: false, msg: "No teacher is found." })
        }

        if (!existingTeacher.salaryPayments || existingTeacher.salaryPayments.length === 0) {
            return res.json({ success: false, msg: "No salary payments are found for this teacher." })
        }

        let totalPayments = existingTeacher.salaryPayments
            .filter((payment) => { return payment.paymentType == "investerPayment" })
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .reduce((acc, payment) => acc + payment.salaryAmount, 0)

        return res.json({
            success: true,
            msg: "Teacher salary payments are found.",
            salaryPayments: existingTeacher.salaryPayments,
            totalPayments
        })


    } catch (error) {
        console.log(error?.message, error?.stack)
        return res.json({ success: false, msg: "error", error: error?.message || error?.stack })
    }
}























export const getSelectedDayTeachersAttendenceData = async (req, res) => {
    try {

        let { date } = req.body;

        let teacherAttendenceModel = getLocalMemberAttendanceModel()

        if (!date) {
            return res.json({ success: false, msg: "No data is found" })
        }


        const givenDate = new Date(date);
        const startOfDay = new Date(givenDate.getFullYear(), givenDate.getMonth(), givenDate.getDate(), 0, 0, 0, 0);
        const endOfDay = new Date(givenDate.getFullYear(), givenDate.getMonth(), givenDate.getDate(), 23, 59, 59, 999);



        let existingAttendence = await teacherAttendenceModel.findOne({ date: { $gte: startOfDay, $lte: endOfDay } })
        if (!existingAttendence) {
            return res.json({ success: false, msg: "No teacher attendence is found." })
        }


        return res.json({ success: true, msg: "Teacher attednece is found.", teacherAttendence: existingAttendence })


    } catch (error) {
        console.log(error?.message, error?.stack)
        return res.json({ success: false, msg: "error", error: error?.message || error?.stack })
    }
}



export const createdSeletedDayTeacherAttendence = async (req, res) => {
    try {

        let { date } = req.body;


        let teacherModel = getLocalMemberModel()
        let teacherAttendenceModel = getLocalMemberAttendanceModel()

        if (!date) {
            return res.json({ success: false, msg: "No date is found" })
        }


        let allTeacherData = await teacherModel.find({ post: { $ne: "investor" } })
        if (allTeacherData?.length < 1) {
            return res.json({ success: false, msg: "No Teachers are found, That's why no attendence is created." })
        }



        let teacherArrayFormatedRowAttendenceData = allTeacherData?.map((eachTeacherData) => {
            return {
                id: eachTeacherData?._id,
                instituteId: eachTeacherData?.instituteId,
                name: eachTeacherData?.name,
                presenceStatus: "notFilled"
            }
        })

        let createdAttendence = await teacherAttendenceModel.create({
            teachers: teacherArrayFormatedRowAttendenceData,
            date: date
        })


        if (!createdAttendence) {
            return res.json({ success: false, msg: "Teacher attendence is not successfuly created." })
        }









        await changeTrackDocsCreationFunc("create", teacherAttendenceModel?.modelName, createdAttendence?._id)







        return res.json({ success: true, msg: "Teacher attendence is created", teacherAttendence: createdAttendence })

    } catch (error) {
        return res.json({ success: false, msg: "Error", error: error?.message || error?.stack })
    }
}




export const setTeacherAttendence = async (req, res) => {
    try {
        let { teacherDocId, presenceStatus, currentAttendenceDocumentId } = req.body;

        let teacherAttendenceModel = getLocalMemberAttendanceModel()


        let exisitingAttendenceDoc = await teacherAttendenceModel?.findOne({ _id: currentAttendenceDocumentId })

        if (!exisitingAttendenceDoc) {
            return res.json({ success: false, msg: "No attendence is found on this id." })
        }


        for (let eachTeacher of exisitingAttendenceDoc?.teachers) {
            if (eachTeacher?.id == teacherDocId) {
                eachTeacher.presenceStatus = presenceStatus
            }
        }

        await exisitingAttendenceDoc.save()





        await changeTrackDocsCreationFunc("update", teacherAttendenceModel.modelName, exisitingAttendenceDoc?._id)




        return res.json({ success: true, msg: "The attendence is changed", attendenceData: exisitingAttendenceDoc })



    } catch (error) {
        return res.json({ success: false, msg: "Error", error: error?.message || error?.stack })
    }
}



export const fromTillTimeAttendenceCalculation = async (req, res) => {
    try {

        let { fromDate, tillDate, teacherDocId } = req.body;

        console.log(req.body)

        let { totalClasses, presence, absence, leave, presencePercentage } = await teacherAttendenceCalcFunc(fromDate, tillDate, teacherDocId)

        console.log(totalClasses, presence, absence, leave, presencePercentage)

        return res.json({ success: true, msg: "Data is found", totalClasses, presence, absence, leave, presencePercentage })

    } catch (error) {
        console.log(error)
        return res.json({ success: false, msg: "Error", error: error?.message || error?.stack })
    }
}
























export const teacherInvoiceGeneration = async (req, res) => {
    try {
        let { teacherId, recursive = false } = req.body
        if (!teacherId || !recursive) {
            return res.json({ success: false, msg: "The teacher id or recursive is not found" })
        }

        let result = await generateTeacherSalaryInvoices(teacherId, recursive)

        return res.json({ ...result })

    } catch (error) {
        return ApiError(error, res)
    }
}



export const recalculateAndRefiltTeacherInvoicesAll = async (req, res) => {
    try {
        let { teacherId } = req.body
        if (!teacherId) {
            return res.json({ success: false, msg: "The teacherId is not provided." })
        }


        let localTeacherModel = getLocalMemberModel()

        let existingTeacher = await localTeacherModel.findOne({ _id: teacherId })

        let hiringDate = new Date(existingTeacher.hiringDate)

        console.log(hiringDate, "From teacher recalculation")


        // await removeDublicateSalaryInvoicesOfTeacher(teacherId)
        let result = await recalculateAndRefillTeacherInvoices(teacherId, hiringDate)


        return res.json({ ...result })
    } catch (error) {
        return ApiError(error, res)
    }
}




export const getTeacherFinanceData = async (req, res) => {
    try {
        const { teacherId } = req.body;

        // VALIDATE INPUT
        if (!teacherId) {
            return res.status(400).json({
                success: false,
                msg: "teacherId is required"
            });
        }

        // GET MODELS
        let teacherModel = getLocalMemberModel();
        let teacherSalaryPaymentModel = getLocalMemberPaymentModel();
        let teacherInvoiceModel = getLocalMemberInvoiceModel();
        let teacherAttendanceModel = getLocalMemberAttendanceModel();

        // VALIDATE TEACHER EXISTS
        let existingTeacher = await teacherModel.findOne({ _id: teacherId });

        if (!existingTeacher) {
            return res.status(404).json({
                success: false,
                msg: "Teacher not found"
            });
        }

        let advancedBalance = existingTeacher?.advancedBalance || 0
        console.log("The waleet money of teacher", advancedBalance)
        // GET ALL SALARY PAYMENTS FOR THIS TEACHER
        let payments = await teacherSalaryPaymentModel.find({
            teacher: teacherId
        }).sort({ date: 1 });

        // GET ALL INVOICES FOR THIS TEACHER
        let invoices = await teacherInvoiceModel.find({
            teacherId: teacherId
        }).sort({ invoiceGeneratedFor: 1 });

        // CALCULATE TOTAL PAYMENTS
        let totalPayments = payments.reduce((sum, payment) => {
            return sum + (Number(payment.salaryAmount) || 0);
        }, 0);

        // CALCULATE INVOICE TOTALS
        let totalInvoiceAmount = invoices.reduce((sum, invoice) => {
            return sum + (Number(invoice.invoiceAmount) || 0);
        }, 0);

        // let totalExpensesCut = invoices.reduce((sum, invoice) => {
        //     return sum + (Number(invoice.expensesCut) || 0);
        // }, 0);

        let totalPaidAmount = invoices.reduce((sum, invoice) => {
            return sum + (Number(invoice.paidAmount) || 0);
        }, 0);

        let totalRemainingAmount = invoices.reduce((sum, invoice) => {
            return sum + (Number(invoice.remainingAmount) || 0);
        }, 0);

        // GET TEACHER SALARY
        let teacherSalary = Number(existingTeacher.salary) || 0;
        let perAttendenceCut = Number(existingTeacher.perAttendenceCut) || 0;

        // GET TOTAL ABSENCES - CORRECTED LOGIC
        let attendanceRecords = await teacherAttendanceModel.find({
            "teachers.id": teacherId
        });

        let totalAbsences = 0;

        attendanceRecords?.forEach(record => {
            if (record.teachers && record.teachers.length > 0) {
                record.teachers.forEach(teacher => {
                    if (teacher.teacherId?.toString() === teacherId?.toString() &&
                        teacher.presenceStatus === "absent" || teacher.presenceStatus == "notFilled") {
                        totalAbsences++;
                    }
                });
            }
        });

        // CALCULATE TOTAL ABSENCE CUT and absence percentage
        let totalAbsenceCut = totalAbsences * perAttendenceCut;
        let absencePercentage = totalAbsences / attendanceRecords?.length * 100

        // GET PAID, UNPAID, PARTIAL INVOICES COUNT
        let paidInvoicesCount = invoices.filter(inv => inv.paidStatus === "paid").length;
        let unpaidInvoicesCount = invoices.filter(inv => inv.paidStatus === "unpaid").length;
        let partialInvoicesCount = invoices.filter(inv => inv.paidStatus === "partial").length;

        return res.status(200).json({
            success: true,
            msg: "Teacher payments and invoices fetched successfully",
            data: {
                payments: payments,
                invoices: invoices,
                teacher: {
                    id: existingTeacher._id,
                    name: existingTeacher.name,
                    salary: teacherSalary,
                    perAttendenceCut: perAttendenceCut,
                    hiringDate: existingTeacher.hiringDate,

                },
                calculations: {
                    advancedBalance: advancedBalance,
                    totalPayments: totalPayments,
                    totalInvoiceAmount: totalInvoiceAmount,
                    absencePercentage,
                    totalAbsences: totalAbsences,
                    totalAbsenceCut: totalAbsenceCut,
                    totalPaidAmount: totalPaidAmount,
                    totalRemainingAmount: totalRemainingAmount,
                    paidInvoicesCount: paidInvoicesCount,
                    unpaidInvoicesCount: unpaidInvoicesCount,
                    partialInvoicesCount: partialInvoicesCount,
                    totalInvoicesCount: invoices.length,
                    totalPaymentsCount: payments.length
                }
            }
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            msg: "Error in fetching teacher payments and invoices",
            reason: error?.message
        });
    }
};







export const updateTeacherInvoice = async (req, res) => {
    try {
        const {
            invoiceId,
            invoiceAmount,
            // revenueType,
            // invoiceGeneratedFor,
            // teacherUniqueId,
        } = req.body

        if (!invoiceId) {
            return res.json({ success: false, msg: "invoiceId is required." })
        }

        let teacherInvoiceModel = getLocalMemberInvoiceModel()

        let invoice = await teacherInvoiceModel.findById(invoiceId)
        if (!invoice) {
            return res.json({ success: false, msg: "Invoice not found." })
        }

        // Update fields
        if (invoiceAmount !== undefined) invoice.invoiceAmount = invoiceAmount
        // if (revenueType !== undefined) invoice.revenueType = revenueType
        // if (invoiceGeneratedFor !== undefined) invoice.invoiceGeneratedFor = new Date(invoiceGeneratedFor)
        // if (teacherUniqueId !== undefined) invoice.teacherUniqueId = teacherUniqueId

        // Remaining auto recalculate karo jab invoiceAmount change ho
        // if (invoiceAmount !== undefined) {
        //     invoice.remainingAmount = invoice.invoiceAmount - invoice.absenceCut - invoice.paidAmount

        //     if (invoice.remainingAmount <= 0) {
        //         invoice.paidStatus = "paid"
        //         invoice.remainingAmount = 0
        //     } else if (invoice.paidAmount > 0) {
        //         invoice.paidStatus = "partial"
        //     } else {
        //         invoice.paidStatus = "unpaid"
        //     }
        // }

        await invoice.save()
        await changeTrackDocsCreationFunc("update", teacherInvoiceModel.modelName, invoice._id)

        return res.json({ success: true, msg: "Invoice updated successfully.", invoice })

    } catch (error) {
        return ApiError(error, res)
    }
}












export const getTeacherPayslip = async (req, res) => {
    try {
        const { teacherId, startDate, endDate } = req.body;

        if (!teacherId || !startDate || !endDate) {
            return res.json({ success: false, msg: "teacherId, startDate and endDate are required" });
        }

        const teacherModel = getLocalMemberModel();
        const teacherInvoiceModel = getLocalMemberInvoiceModel();
        const teacherAttendanceModel = getLocalMemberAttendanceModel();

        // NORMALIZE DATES
        let { startDateFormat: start, endDateFormat: end } = getCustomStartEndMonthRanges(startDate, endDate)
        // const start = new Date(startDate);
        // start.setHours(0, 0, 0, 0);

        // const end = new Date(endDate);
        // end.setHours(23, 59, 59, 999);

        // ─── 1. TEACHER DATA ───────────────────────────────────────────
        const teacher = await teacherModel.findOne({ _id: teacherId });
        if (!teacher) return res.json({ success: false, msg: "Teacher not found" });

        // ─── 2. INVOICES ───────────────────────────────────────────────
        const invoices = await teacherInvoiceModel.find({
            teacherId: teacherId,
            invoiceGeneratedFor: { $gte: start, $lte: end }
        }).sort({ invoiceGeneratedFor: 1 });

        const totalInvoiceAmount = invoices.reduce((acc, inv) => acc + Number(inv.invoiceAmount || 0), 0);
        const totalAbsenceCut = invoices.reduce((acc, inv) => acc + Number(inv.absenceCut || 0), 0);
        const totalPaidAmount = invoices.reduce((acc, inv) => acc + Number(inv.paidAmount || 0), 0);
        const totalRemainingAmount = invoices.reduce((acc, inv) => acc + Number(inv.remainingAmount || 0), 0);

        // ─── 3. ATTENDANCE ─────────────────────────────────────────────
        const attendanceDocs = await teacherAttendanceModel.find({
            date: { $gte: start, $lte: end },
            "teachers.id": new mongoose.Types.ObjectId(teacherId)
        });

        let totalDays = 0;
        let present = 0;
        let absent = 0;
        let leave = 0;
        let notFilled = 0;

        console.log(attendanceDocs, start, end, "The attenadnces docs is here. ")

        for (let doc of attendanceDocs) {
            console.log(doc, "The doc")
            const teacherEntry = doc.teachers.find(t => t.id.toString() === teacherId.toString());
            if (!teacherEntry) continue;

            totalDays++;
            const status = teacherEntry.presenceStatus?.toLowerCase();

            if (status === "present") present++;
            else if (status === "absent") absent++;
            else if (status === "leave") leave++;
            else notFilled++;
        }

        // ─── 4. ABSENCE CUT CALCULATION ────────────────────────────────
        const perDayCut = Number(teacher.perAttendenceCut || 0);
        const calculatedAbsenceCut = absent * perDayCut;

        // ─── 5. PAYSLIP RESPONSE ───────────────────────────────────────
        const payslip = {
            teacher: {
                id: teacher._id,
                name: teacher.name,
                fatherName: teacher.fatherName,
                instituteId: teacher.instituteId,
                post: teacher.post,
                phoneNo: teacher.phoneNo,
                email: teacher.email,
                bankName: teacher.bankName,
                accountNumber: teacher.accountNumber,
                profileImage: teacher.profileImage,
            },
            period: {
                startDate: start,
                endDate: end,
            },
            invoiceSummary: {
                totalInvoices: invoices.length,
                totalInvoiceAmount,
                totalAbsenceCut,
                totalPaidAmount,
                totalRemainingAmount,
                netPayable: totalInvoiceAmount - totalAbsenceCut,
                invoices,
            },
            attendanceSummary: {
                totalDays,
                present,
                absent,
                leave,
                notFilled,
            },
            deductions: {
                perDayCut,
                totalAbsenceDays: absent,
                calculatedAbsenceCut,
            },
            advancedBalance: teacher.advancedBalance || 0,
        };

        return res.json({ success: true, payslip });

    } catch (error) {
        console.log(error);
        return res.json({ success: false, msg: "Error generating payslip", reason: error?.message });
    }
};









export const createTeacherSalaryPayment = async (req, res) => {
    try {
        let { teacherId, paymentType, salaryAmount, paymentMethod, date, notes } = req.body;

        let localSalaryModel = getLocalMemberPaymentModel();
        let localTeacherModel = getLocalMemberModel()

        let existingTeacher = await localTeacherModel.findOne({ _id: teacherId })
        if (!existingTeacher) {
            return res.json({ success: false, msg: "The teacher is not found" })
        }


        let newSalary = await localSalaryModel.create({
            teacher: teacherId,
            salaryAmount,
            paymentType,
            paymentMethod,
            date,
            notes
        });

        if (!newSalary) {
            return res.json({ success: false, msg: "Salary payment is not created" });
        }





        existingTeacher.salaryPayments = [...existingTeacher.salaryPayments, newSalary._id]
        await existingTeacher.save()



        await changeTrackDocsCreationFunc("create", localSalaryModel.modelName, newSalary?._id);
        await changeTrackDocsCreationFunc("update", localTeacherModel.modelName, existingTeacher._id)



        await teacherReminderHandler()


        // check and create all teh invoices if not present for teacher.
        // make empty and again refill all the invoces
        await recalculateAndRefillTeacherInvoices(existingTeacher._id, new Date(existingTeacher?.hiringDate))



        // Get all payments of this teacher
        let allTeacherPayments = await localSalaryModel.find({ teacher: teacherId });


        return res.json({
            success: true,
            msg: "Salary payment created",
            newSalary,
            allTeacherPayments
        });

    } catch (error) {
        return res.json({ success: false, msg: "error", error: error?.message });
    }
};



export const getTeacherSalaryPayments = async (req, res) => {
    try {

        let { teacherId } = req.body;

        let localTeacherSalaryPaymentModel = getLocalMemberPaymentModel();

        let salaryList = await localTeacherSalaryPaymentModel.find({ teacher: teacherId }).sort({ date: -1, createdAt: -1 });

        return res.json({ success: true, salaryList });

    } catch (error) {
        return res.json({ success: false, msg: "error", error: error?.message });
    }
};



export const getCurrentMonthSalaryPayments = async (req, res) => {
    try {

        let { teacherId } = req.body;
        let localTeacherModel = getLocalMemberModel()
        let localSalaryPayments = getLocalMemberPaymentModel()

        const now = new Date();

        const startOfMonth = new Date(
            now.getFullYear(),
            now.getMonth(),
            1,
            0, 0, 0, 0
        );


        const endOfMonth = new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            0,
            23, 59, 59, 999
        );


        let payments = await localSalaryPayments.find({ teacher: teacherId, date: { $lte: endOfMonth, $gte: startOfMonth } })
        if (!payments?.length > 0) {
            return res.json({ success: false, msg: "The payment is not found" })
        }

        return res.json({ success: true, msg: "The payments is found", payments })



    } catch (error) {
        return res.json({ success: false, msg: error?.message })
    }
}


export const updateSalaryPayment = async (req, res) => {
    try {
        let { salaryPaymentId, salaryAmount, paymentMethod, date, notes } = req.body;
        let localSalaryModel = getLocalMemberPaymentModel();

        let updatedSalary = await localSalaryModel.findOneAndUpdate(
            { _id: salaryPaymentId },
            { salaryAmount, paymentMethod, date, notes },
            { new: true }
        );

        if (!updatedSalary) {
            return res.json({ success: false, msg: "Salary payment is not updated" });
        }

        await recalculateAndRefillTeacherInvoices(updatedSalary.teacher, true)

        await changeTrackDocsCreationFunc("update", localSalaryModel.modelName, updatedSalary?._id);

        return res.json({ success: true, msg: "Salary payment updated", updatedSalary });

    } catch (error) {
        return res.json({ success: false, msg: "error", error: error?.message });
    }
};




export const deleteSalaryPayment = async (req, res) => {
    try {
        let { salaryId, teacherId } = req.body;
        let localSalaryModel = getLocalMemberPaymentModel();
        let localTeacherModel = getLocalMemberModel()

        let existingTeacher = await localTeacherModel.findOne({ _id: teacherId })
        if (!existingTeacher) {
            return res.json({ success: false, msg: "The teacher is not found" })
        }




        let deletedSalary = await localSalaryModel.findOneAndDelete({ _id: salaryId });

        if (!deletedSalary) {
            return res.json({ success: false, msg: "Salary payment not deleted" });
        }



        if (existingTeacher.salaryPayments && existingTeacher.salaryPayments.length > 0) {
            existingTeacher.salaryPayments = existingTeacher.salaryPayments.filter(p => !(p == salaryId))
            await existingTeacher.save()
            await changeTrackDocsCreationFunc("update", localTeacherModel.modelName, existingTeacher._id)
        }

        await changeTrackDocsCreationFunc("delete", localSalaryModel.modelName, deletedSalary?._id);






        await recalculateAndRefillTeacherInvoices(teacherId, true)






        let salaryList = await localSalaryModel.find({ teacher: teacherId }).sort({ date: -1 });


        return res.json({ success: true, msg: "Salary payment deleted", salaryPayments: salaryList });

    } catch (error) {
        return res.json({ success: false, msg: "error", error: error?.message });
    }
};





export const uploadTeacherDocuments = async (req, res) => {
    try {
        const { teacherDocId } = req.body;
        console.log(req.body)
        const files = req.files; // Assuming you are using middleware like 'multer'

        // 1. Initial Validation
        if (!teacherDocId) {
            return res.json({ success: false, msg: "Teacher ID is required." });
        }

        if (!files || files.length === 0) {
            return res.json({ success: false, msg: "No files were uploaded." });
        }

        const localTeacherModel = getLocalMemberModel();

        // 2. Check if Teacher exists
        const teacherExists = await localTeacherModel.findById(teacherDocId);
        if (!teacherExists) {
            return res.json({ success: false, msg: "Teacher not found in database." });
        }

        // 3. Extract filenames and prepare the update
        // We map through the files array to get only the filenames
        const newFileNames = files.map(file => file.filename);

        // 4. Update the document
        // $push adds the new filenames to the existing 'documents' array
        // { new: true } returns the updated document instead of the old one
        const updatedTeacher = await localTeacherModel.findByIdAndUpdate(
            teacherDocId,
            { $push: { documents: { $each: newFileNames } } },
            { new: true }
        );

        // 5. Change Track Logging
        await changeTrackDocsCreationFunc("update", localTeacherModel.modelName, teacherDocId);

        // 6. Return the updated documents array
        return res.json({
            success: true,
            msg: "Documents uploaded successfully",
            documents: updatedTeacher.documents
        });

    } catch (error) {
        console.log(error)
        return res.json({
            success: false,
            msg: "Server Error",
            error: error?.message
        });
    }
};






export const deleteTeacherDocument = async (req, res) => {
    try {
        const { teacherDocId, fileName } = req.body;

        // 1. Validation according to your style
        if (!teacherDocId) {
            return res.json({ success: false, msg: "Teacher ID is missing" });
        }
        if (!fileName) {
            return res.json({ success: false, msg: "File name is required for deletion" });
        }

        const localTeacherModel = getLocalMemberModel();

        // 2. Check Teacher Existence
        const existingTeacher = await localTeacherModel.findById(teacherDocId);
        if (!existingTeacher) {
            return res.json({ success: false, msg: "Teacher not found" });
        }

        // 3. Filter out the image name from the documents array
        // We use .filter() to create a new array without the target fileName
        const updatedDocuments = existingTeacher.documents.filter(doc => doc !== fileName);

        // 4. Update the Teacher document in DB
        existingTeacher.documents = updatedDocuments;
        await existingTeacher.save();


        try {
            // This points to: C:\Users\<User>\AppData\Local
            const localAppData = process.env.LOCALAPPDATA;

            if (!localAppData) {
                console.error("Local AppData environment variable not found");
            } else {
                // Path: Local\SSIB\uploads\<fileName>
                const filePath = path.join(localAppData, 'SSIB', 'uploads', fileName);

                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log("File deleted from system storage:", fileName);
                } else {
                    console.warn("File not found at system path:", filePath);
                }
            }
        } catch (fileError) {
            console.error("Error during physical file deletion:", fileError.message);
        }

        // 6. CHANGE TRACK CREATION
        await changeTrackDocsCreationFunc("update", localTeacherModel.modelName, teacherDocId);

        let teacher = await localTeacherModel.findOne({ _id: teacherDocId })

        return res.json({
            success: true,
            msg: "Document deleted successfully",
            documents: teacher.documents // Returning the full list so your state update works perfectly
        });

    } catch (error) {
        return res.json({
            success: false,
            msg: "Error deleting document",
            error: error?.message || error?.stack
        });
    }
};










































// Create Partner Investment
export const partnerInvestmentCreation = async (req, res) => {
    try {
        let {
            partnerId,
            amount,
            date,
            notes,
            paymentMethod,
        } = req.body;


        let existingTeacher = await getLocalMemberModel()?.findOne({ _id: partnerId })
        if (!existingTeacher) {
            return res.json({ success: false, msg: "The partner is not found" })
        }


        let result = await partnerInvestmentCreationFuntion({
            name: existingTeacher?.name,
            partnerId,
            amount,
            date,
            notes,
            paymentMethod,
        })
        console.log(req.body, result)


        return res.json({ ...result })
    } catch (error) {
        console.log(error);
        return ApiError(error, res);
    }
};

// Read All Partner Investments
export const getAllPartnerInvestments = async (req, res) => {
    try {
        let localPartnerInvestmentModel = getLocalMemberInvestmentModel();

        let investments = await localPartnerInvestmentModel.find()
            .populate('partnerId', 'name email phoneNo isPartner partnerType')
            .sort({ createdAt: -1 });

        return res.json({
            success: true,
            msg: "Partner investments retrieved successfully",
            count: investments.length,
            investments
        });

    } catch (error) {
        console.log(error);
        return ApiError(error, res);
    }
};

// Read One Partner Investment by ID
export const getPartnerInvestmentById = async (req, res) => {
    try {
        let { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                msg: "Investment ID is required"
            });
        }

        let localPartnerInvestmentModel = getLocalMemberInvestmentModel();

        let investment = await localPartnerInvestmentModel.findById(id)
            .populate('partnerId', 'name email phoneNo isPartner partnerType overallPartnerShareValue');

        if (!investment) {
            return res.status(404).json({
                success: false,
                msg: "Partner investment not found"
            });
        }

        return res.json({
            success: true,
            msg: "Partner investment retrieved successfully",
            investment
        });

    } catch (error) {
        console.log(error);
        return ApiError(error, res);
    }
};

// Update Partner Investment
export const updatePartnerInvestment = async (req, res) => {
    try {
        let { id } = req.params;
        let {
            name,
            partnerId,
            amount,
            date,
            notes,
            paymentMethod,
            usedIn
        } = req.body;

        if (!id) {
            return res.status(400).json({
                success: false,
                msg: "Investment ID is required"
            });
        }

        let localPartnerInvestmentModel = getLocalMemberInvestmentModel();
        let localTeacherModel = getLocalMemberModel();

        // Find existing investment
        let existingInvestment = await localPartnerInvestmentModel.findById(id);

        if (!existingInvestment) {
            return res.status(404).json({
                success: false,
                msg: "Partner investment not found"
            });
        }

        // If partnerId is being changed, validate new partner
        if (partnerId && partnerId !== existingInvestment.partnerId.toString()) {
            let newTeacher = await localTeacherModel.findById(partnerId);

            if (!newTeacher) {
                return res.status(404).json({
                    success: false,
                    msg: "New teacher/partner not found"
                });
            }
            console.log("THe new teacher partner check", newTeacher.isPartner)
            if (!newTeacher.isPartner) {
                return res.status(400).json({
                    success: false,
                    msg: "The provided teacher is not registered as a partner"
                });
            }

            // Remove from old teacher's investments array
            let oldTeacher = await localTeacherModel.findById(existingInvestment.partnerId);
            if (oldTeacher && oldTeacher.investments) {
                oldTeacher.investments = oldTeacher.investments.filter(
                    inv => inv.toString() !== id
                );
                await oldTeacher.save();
            }

            // Add to new teacher's investments array
            if (!newTeacher.investments) {
                newTeacher.investments = [];
            }
            newTeacher.investments.push(id);
            await newTeacher.save();
        }

        // Update investment
        let updateData = {};
        if (name) updateData.name = name;
        if (partnerId) updateData.partnerId = partnerId;
        if (amount) updateData.amount = Number(amount);
        if (date) updateData.date = new Date(date);
        if (notes !== undefined) updateData.notes = notes;
        if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;
        if (usedIn !== undefined) updateData.usedIn = usedIn;

        let updatedInvestment = await localPartnerInvestmentModel.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('partnerId', 'name email phoneNo isPartner partnerType');

        // Track changes
        await changeTrackDocsCreationFunc("update", localPartnerInvestmentModel.modelName, updatedInvestment?._id);

        return res.json({
            success: true,
            msg: "Partner investment updated successfully",
            updatedInvestment
        });

    } catch (error) {
        console.log(error);
        return ApiError(error, res);
    }
};

// Delete Partner Investment
export const deletePartnerInvestment = async (req, res) => {
    try {
        let { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                msg: "Investment ID is required"
            });
        }

        let localPartnerInvestmentModel = getLocalMemberInvestmentModel();
        let localTeacherModel = getLocalMemberModel();

        // Find investment to delete
        let investment = await localPartnerInvestmentModel.findById(id);

        if (!investment) {
            return res.status(404).json({
                success: false,
                msg: "Partner investment not found"
            });
        }

        // Remove from teacher's investments array
        let teacher = await localTeacherModel.findById(investment.partnerId);
        if (teacher && teacher.investments) {
            teacher.investments = teacher.investments.filter(
                inv => inv.toString() !== id
            );
            await teacher.save();
        }

        // Delete investment
        await localPartnerInvestmentModel.findByIdAndDelete(id);

        // Track changes
        await changeTrackDocsCreationFunc("delete", localPartnerInvestmentModel.modelName, id);

        return res.json({
            success: true,
            msg: "Partner investment deleted successfully"
        });

    } catch (error) {
        console.log(error);
        return ApiError(error, res);
    }
};

// Get all investments for a specific partner
export const getInvestmentsByPartnerId = async (req, res) => {
    try {
        let { partnerId } = req.params;

        if (!partnerId) {
            return res.status(400).json({
                success: false,
                msg: "Partner ID is required"
            });
        }

        let localTeacherModel = getLocalMemberModel();
        let localPartnerInvestmentModel = getLocalMemberInvestmentModel();

        // Validate partner exists
        let teacher = await localTeacherModel.findById(partnerId);

        if (!teacher) {
            return res.status(404).json({
                success: false,
                msg: "Teacher/Partner not found"
            });
        }
        console.log("THe new teacher partner check", teacher.isPartner)

        if (!teacher.isPartner) {
            return res.status(400).json({
                success: false,
                msg: "The provided teacher is not registered as a partner"
            });
        }

        // Get all investments for this partner
        let investments = await localPartnerInvestmentModel.find({ partnerId })
            .sort({ date: -1 });

        // Calculate total investment
        let totalInvestment = investments.reduce((sum, inv) => sum + inv.amount, 0);

        return res.json({
            success: true,
            msg: "Partner investments retrieved successfully",
            partnerName: teacher.name,
            count: investments.length,
            totalInvestment,
            investments
        });

    } catch (error) {
        console.log(error);
        return ApiError(error, res);
    }
};






























