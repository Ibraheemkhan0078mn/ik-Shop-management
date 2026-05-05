import { getLocalMemberModel, getLocalMemberInvestmentModel, getLocalMemberAttendanceModel, getLocalMemberInvoiceModel, getLocalMemberPaymentModel } from "../../../configs/connect.db.js";
import { getCurrentMonthRange } from "../../../common/services/date.js";




export async function getTeacherMainDetails(teacherId) {
    try {
        let localTeacherModel = getLocalMemberModel();

        // Validate input
        if (!teacherId) {
            throw new Error("Teacher ID is required");
        }

        // Find teacher with populated data
        let teacher = await localTeacherModel.findById(teacherId).populate([
            { path: "givenClasses", select: "className name classFee" },
            { path: "salaryPayments" },
            { path: "invoices" },
            { path: "investmentMoney" }
        ]);

        // Check if teacher exists
        if (!teacher) {
            throw new Error("Teacher not found");
        }

        // ===== BASIC PERSONAL INFORMATION =====
        let personalInfo = {
            teacherId: teacher._id,
            instituteId: teacher.instituteId,
            name: teacher.name,
            profileImage: teacher.profileImage,
            fatherName: teacher.fatherName,
            cnic: teacher.cnic,
            email: teacher.email,
            post: teacher.post,
            hiringDate: teacher.hiringDate,
            isActive: teacher.isActive,
            phoneNo: teacher.phoneNo,
            email: teacher.email,
            address: teacher.address,
            salary: teacher.salary,
            bankName: teacher.bankName,
            accountNumber: teacher.accountNumber,
            perAttendenceCut: teacher.perAttendenceCut || 0,
            advancedBalance: teacher.advancedBalance || 0,
            education: teacher.education,
            educationDegrees: teacher.educationDegrees || [],
            languages: teacher.languages || [],
            skills: teacher.skills || [],
            experiences: teacher.experiences || [],
            givenClasses: teacher.givenClasses || [],
            totalClassesAssigned: teacher.givenClasses?.length || 0,
            isPartner: teacher.isPartner || false,
            partnerType: teacher.partnerType,
            overallPartnerShareValue: teacher.overallPartnerShareValue || 0,
            investmentMoney: teacher.investmentMoney || []
            // totalSalaryPayments: teacher.salaryPayments?.length || 0

        };

        // ===== FINAL RESPONSE =====
        return {
            success: true,
            personalInfo
        };

    } catch (error) {
        throw new Error(error);
    }
}






export const teacherFincancedataOnIdService = async (teacherId, startDate, endDate) => {
    try {



        // VALIDATE INPUT
        if (!teacherId) {
            return ({ success: false, msg: "teacherId is required" })
        }

        // GET MODELS
        let teacherModel = getLocalMemberModel();
        let teacherSalaryPaymentModel = getLocalMemberPaymentModel();
        let teacherInvoiceModel = getLocalMemberInvoiceModel();
        let teacherAttendanceModel = getLocalMemberAttendanceModel();

        // VALIDATE TEACHER EXISTS
        let existingTeacher = await teacherModel.findOne({ _id: teacherId });
        if (!existingTeacher) {
            return ({
                success: false, msg: "Teacher not found"
            });
        }

        let advancedBalance = existingTeacher?.advancedBalance || 0

        // GET ALL SALARY PAYMENTS FOR THIS TEACHER
        let paymentCondition = {
            teacher: teacherId
        }
        if (startDate && endDate) {
            let { startOfMonth, endOfMonth } = getCurrentMonthRange(startDate, endDate)
            paymentCondition["date"] = { $gte: startOfMonth, $lte: endOfMonth }
        }

        let payments = await teacherSalaryPaymentModel.find(paymentCondition).sort({ date: 1 });






        // GET ALL INVOICES FOR THIS TEACHER
        let invoicesCondition = { teacherId: teacherId }
        if (startDate && endDate) {
            let { startOfMonth, endOfMonth } = getCurrentMonthRange(startDate, endDate)
            invoicesCondition["invoiceGeneratedFor"] = { $gte: startOfMonth, $lte: endOfMonth }
        }
        let invoices = await teacherInvoiceModel.find(invoicesCondition).sort({ invoiceGeneratedFor: 1 });




        // CALCULATE TOTAL PAYMENTS
        let totalPayments = payments?.reduce((sum, payment) => {
            return sum + (Number(payment.salaryAmount) || 0);
        }, 0);

        // CALCULATE INVOICE TOTALS
        let totalInvoiceAmount = invoices?.reduce((sum, invoice) => {
            return sum + (Number(invoice.invoiceAmount) || 0);
        }, 0);

        // let totalExpensesCut = invoices.reduce((sum, invoice) => {
        //     return sum + (Number(invoice.expensesCut) || 0);
        // }, 0);

        let totalPaidAmount = invoices?.reduce((sum, invoice) => {
            return sum + (Number(invoice.paidAmount) || 0);
        }, 0);

        let totalRemainingAmount = invoices?.reduce((sum, invoice) => {
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
                record?.teachers?.forEach(teacher => {
                    if (teacher?.teacherId?.toString() === teacherId?.toString() &&
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

        return ({
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
        throw new Error(error)
    }
}






export const getTeacherAsPartnerInvestmentsRecordService = async (teacherId, startDate, endDate) => {
    try {




        if (!teacherId) {
            return ({
                success: false,
                msg: "Partner ID is required"
            });
        }

        let localTeacherModel = getLocalMemberModel();
        let localPartnerInvestmentModel = getLocalMemberInvestmentModel();

        // Validate partner exists
        let teacher = await localTeacherModel.findById(teacherId);

        if (!teacher) {
            return ({
                success: false,
                msg: "Teacher/Partner not found"
            });
        }
        console.log("THe new teacher partner check", teacher.isPartner)

        if (!teacher.isPartner) {
            return ({
                success: false,
                msg: "The provided teacher is not registered as a partner"
            });
        }


        if (startDate && endDate) {
            let { startOfMonth, endOfMonth } = getCurrentMonthRange(startDate, endData)
            startDate = startOfMonth
            endDate = endOfMonth
        } else {
            let startDateLocal = teacher?.hiringDate
            let endDateLocal = new Date()
            let { startOfMonth, endOfMonth } = getCurrentMonthRange(startDateLocal, endDateLocal)
            startDate = startOfMonth
            endDate = endOfMonth
        }


        // Get all investments for this partner
        let investmentCondition = { partnerId: teacherId, date: { $gte: startDate, $lte: endDate } }

        let investments = await localPartnerInvestmentModel.find(investmentCondition).sort({ date: -1 });

        // Calculate total investment
        let totalInvestment = investments.reduce((sum, inv) => sum + inv.amount, 0);

        return ({
            success: true,
            msg: "Partner investments retrieved successfully",
            partnerName: teacher.name,
            count: investments.length,
            totalInvestment,
            investments
        });


    } catch (error) {
        throw new Error(error)
    }
}








































export const updateCurrentMonthTeacherInvoice = async (teacherId, newSalaryAmount) => {
    try {
        // console.log("the udpate invoice is start", teacherId, newSalaryAmount)
        let TeacherInvoice = getLocalMemberInvoiceModel()
        const now = new Date();
        // console.log(now, "The date fo now")
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const invoice = await TeacherInvoice.findOne({
            teacherId,
            invoiceGeneratedFor: {
                $gte: startOfMonth,
                $lte: endOfMonth
            }
        });
        // console.log(invoice, "The invoice form update")

        if (!invoice) return { success: false, message: "No invoice found for current month" };

        invoice.invoiceAmount = newSalaryAmount;
        // invoice.remainingAmount = newSalaryAmount - invoice.paidAmount;

        await invoice.save();
        // console.log("update invoice is end", )

        return { success: true, message: "Invoice updated", invoice };
    } catch (err) {
        console.error("updateCurrentMonthTeacherInvoice error:", err);
        return { success: false, message: err.message };
    }
};