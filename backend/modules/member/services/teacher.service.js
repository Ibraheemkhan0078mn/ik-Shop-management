import { getLocalMemberModel, getLocalMemberAttendanceModel, getLocalMemberInvoiceModel, getLocalMemberPaymentModel } from "../../../configs/connect.db.js";









export const recalculateAndRefillTeacherInvoices = async (teacherId, startDate) => {
    try {
        // GET MODELS
        let teacherModel = getLocalMemberModel();
        let teacherSalaryPaymentModel = getLocalMemberPaymentModel();
        let teacherInvoiceModel = getLocalMemberInvoiceModel();



        // first generate teacher all invoices
        generateTeacherSalaryInvoices(teacherId, true)




        // NORMALIZE START DATE
        startDate = new Date(startDate);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);

        // VALIDATE INPUT
        if (!teacherId || !startDate) {
            return { success: false, msg: "teacherId and startDate are required" };
        }

        // GET TEACHER DATA
        let existingTeacher = await teacherModel.findOne({ _id: teacherId });

        if (!existingTeacher) {
            return { success: false, msg: "Teacher not found" };
        }

        // console.log("From calculate and refill", startDate, teacherId)
        // GET ALL SALARY PAYMENTS FROM START DATE ONWARDS
        let salaryPayments = await teacherSalaryPaymentModel.find({
            teacher: teacherId,
            date: { $gte: startDate },
            paymentType: "salary"
        }).sort({ date: 1 });

        // GET ALL PAYMENT IDS FROM INVOICES
        let paymentIdsFromInvoices = [];

        if (salaryPayments && salaryPayments.length > 0) {
            salaryPayments.forEach(payment => {
                paymentIdsFromInvoices.push(payment._id.toString());
            });
        }

        // GET ALL RELEVANT INVOICES
        let allRelevantInvoices = await teacherInvoiceModel.find({
            teacherId: teacherId,
            invoiceGeneratedFor: { $gte: startDate }
        }).sort({ invoiceGeneratedFor: 1 });

        if (!allRelevantInvoices || allRelevantInvoices.length === 0) {
            return { success: false, msg: "No invoices found to recalculate" };
        }

        // console.log(`Found ${salaryPayments.length} payments and ${allRelevantInvoices.length} invoices to process`);

        // RESET ALL INVOICES TO ORIGINAL STATE (CLEAR PAYMENT DATA) AND TEACHER advanced  MONEY
        if (existingTeacher.advancedBalance) { existingTeacher.advancedBalance = 0; await existingTeacher.save() }

        for (let invoice of allRelevantInvoices) {
            let remainingAmount = Number(invoice.invoiceAmount)
            await teacherInvoiceModel.findOneAndUpdate(
                { _id: invoice._id },
                {
                    $set: {
                        paymentRecord: [],
                        paidAmount: 0,
                        remainingAmount: remainingAmount,
                        paidStatus: "unpaid"
                    }
                },
                { new: true }
            );
        }




        // IF NO PAYMENTS, RETURN AFTER RESETTING INVOICES
        if (!salaryPayments || salaryPayments.length === 0) {
            let updatedInvoices = await teacherInvoiceModel.find({
                _id: { $in: allRelevantInvoices.map(inv => inv._id) }
            }).sort({ invoiceGeneratedFor: 1 });

            // console.log(allRelevantInvoices.map(iv => iv._id), "The invoices.");

            return {
                success: true,
                msg: "No payments found. All invoices have been reset to unpaid status.",
                data: {
                    processedPayments: 0,
                    processedInvoices: updatedInvoices.length,
                    payments: [],
                    invoices: updatedInvoices
                }
            };
        }

        // PROCESS EACH SALARY PAYMENT AND FILL INVOICES (FIFO)
        for (let payment of salaryPayments) {
            let remainingPaymentAmount = payment.salaryAmount;

            // GET REMAINING INVOICES (SORTED BY DATE - FIFO)
            let remainingInvoices = await teacherInvoiceModel.find({
                teacherId: teacherId,
                paidStatus: { $in: ["unpaid", "partial"] },
                invoiceGeneratedFor: { $lte: payment.date }
            }).sort({ invoiceGeneratedFor: 1 });


            // IF INVOICES ARE NOT PRSENT THEN STORE MONEY IN TEACHER WALLET
            if (remainingInvoices == 0) {
                existingTeacher.advancedBalance += remainingPaymentAmount
                await existingTeacher.save()
                continue;
            }



            console.log(remainingInvoices?.map(iv => iv._id));

            // FILL INVOICES WITH THIS PAYMENT AMOUNT
            for (let invoice of remainingInvoices) {
                if (remainingPaymentAmount <= 0) break;

                if (invoice.remainingAmount > 0) {
                    let amountToUse = 0;

                    if (invoice.remainingAmount <= remainingPaymentAmount) {
                        // PAYMENT CAN PAY FULL INVOICE
                        amountToUse = invoice.remainingAmount;
                        invoice.remainingAmount = 0;
                        invoice.paidStatus = "paid";
                    } else {
                        // PAYMENT CAN PARTIALLY PAY INVOICE
                        // to use it later
                        amountToUse = remainingPaymentAmount;

                        // invoice data
                        invoice.remainingAmount = invoice.remainingAmount - remainingPaymentAmount;
                        invoice.paidStatus = "partial";
                    }

                    // ADD PAYMENT RECORD TO INVOICE
                    let paymentRecord = {
                        paymentId: payment._id.toString(),
                        usedAmountByPayment: amountToUse,
                        date: payment.date
                    };

                    invoice.paymentRecord.push(paymentRecord);

                    // RECALCULATE TOTAL PAID
                    invoice.paidAmount = invoice.paymentRecord.reduce((acc, pr) => {
                        return acc + (Number(pr.usedAmountByPayment) || 0);
                    }, 0);

                    await invoice.save();

                    remainingPaymentAmount -= amountToUse;
                }
            }




            // AFTER  INVOICS IF MONEY IS REMAINING THEN STORE IT IN TEACHER WALLET  
            if (remainingPaymentAmount) {
                existingTeacher.advancedBalance += remainingPaymentAmount
                await existingTeacher.save()
            }

            console.log(`Payment ${payment._id} processed. Remaining amount: ${remainingPaymentAmount}`);
        }

        // GET UPDATED DATA
        let updatedInvoices = await teacherInvoiceModel.find({
            _id: { $in: allRelevantInvoices.map(inv => inv._id) }
        }).sort({ invoiceGeneratedFor: 1 });

        let updatedPayments = await teacherSalaryPaymentModel.find({
            _id: { $in: salaryPayments.map(payment => payment._id) }
        }).sort({ date: 1 });

        return {
            success: true,
            msg: "Teacher invoices recalculated and refilled successfully",
            data: {
                processedPayments: updatedPayments.length,
                processedInvoices: updatedInvoices.length,
                payments: updatedPayments,
                invoices: updatedInvoices
            }
        };

    } catch (error) {
        console.log(error);
        return {
            success: false,
            msg: "Error in recalculating teacher invoices",
            reason: error?.message,
            errorPlace: error?.stack
        };
    }
};











export const generateTeacherSalaryInvoices = async (teacherId, recursive = false) => {
    try {
        // GET MODELS
        let teacherModel = getLocalMemberModel();
        let teacherInvoiceModel = getLocalMemberInvoiceModel();

        // VALIDATE INPUT
        if (!teacherId) {
            return { success: false, msg: "teacherId is required" };
        }

        // GET TEACHER DATA
        let existingTeacher = await teacherModel.findOne({ _id: teacherId });

        if (!existingTeacher) {
            return { success: false, msg: "Teacher not found" };
        }

        // GET CURRENT MONTH DATE
        let currentMonthDate = new Date();
        currentMonthDate.setDate(1);
        currentMonthDate.setHours(0, 0, 0, 0);

        // IF NOT RECURSIVE, JUST CREATE CURRENT MONTH INVOICE
        if (recursive === false) {
            let result = await createTeacherSalaryInvoice(teacherId, currentMonthDate);
            return result;
        }

        // IF RECURSIVE, FIND MISSING MONTHS AND CREATE INVOICES
        // GET HIRING DATE
        let hiringDate = new Date(existingTeacher.hiringDate);
        hiringDate.setDate(1);
        hiringDate.setHours(0, 0, 0, 0);

        // GET ALL EXISTING INVOICES FOR THIS TEACHER
        let allExistingInvoices = await teacherInvoiceModel.find({
            teacherId: teacherId
        }).select('invoiceGeneratedFor');

        // CREATE SET OF EXISTING INVOICE MONTHS
        let existingInvoiceMonths = new Set();
        allExistingInvoices.forEach(invoice => {
            let invoiceMonth = new Date(invoice.invoiceGeneratedFor);
            invoiceMonth.setDate(1);
            invoiceMonth.setHours(0, 0, 0, 0);
            existingInvoiceMonths.add(invoiceMonth.getTime());
        });

        // FIND MISSING MONTHS
        let missingMonths = [];
        let tempDate = new Date(hiringDate);

        while (tempDate <= currentMonthDate) {
            let tempDateTimestamp = tempDate.getTime();

            if (!existingInvoiceMonths.has(tempDateTimestamp)) {
                missingMonths.push(new Date(tempDate));
            }

            // MOVE TO NEXT MONTH
            tempDate.setMonth(tempDate.getMonth() + 1);
        }

        console.log(`Found ${missingMonths.length} missing months for teacher ${existingTeacher.name}`);

        // CREATE INVOICES FOR MISSING MONTHS
        let results = [];

        for (let missingMonth of missingMonths) {
            let result = await createTeacherSalaryInvoice(teacherId, missingMonth);
            results.push(result);
        }

        return {
            success: true,
            msg: `Created ${results.length} missing invoices for teacher`,
            data: {
                teacher: {
                    id: existingTeacher._id,
                    name: existingTeacher.name,
                    hiringDate: existingTeacher.hiringDate
                },
                totalInvoicesCreated: results.length,
                results: results
            }
        };

    } catch (error) {
        console.log(error);
        return {
            success: false,
            msg: "Error in generating teacher salary invoices",
            reason: error?.message,
            errorPlace: error?.stack
        };
    }
};









export const createTeacherSalaryInvoice = async (teacherId, invoiceDate) => {
    try {
        // GET MODELS
        let teacherModel = getLocalMemberModel();
        let teacherInvoiceModel = getLocalMemberInvoiceModel();
        let teacherAttendanceModel = getLocalMemberAttendanceModel(); // YOU NEED THIS MODEL

        // NORMALIZE INVOICE DATE TO MONTH START
        let invoiceGeneratedFor = new Date(invoiceDate);
        invoiceGeneratedFor.setDate(1);
        invoiceGeneratedFor.setHours(0, 0, 0, 0);

        // GET MONTH END DATE
        let monthEndDate = new Date(invoiceGeneratedFor);
        monthEndDate.setMonth(monthEndDate.getMonth() + 1);
        monthEndDate.setDate(0);
        monthEndDate.setHours(23, 59, 59, 999);

        // VALIDATE INPUT
        if (!teacherId) {
            return { success: false, msg: "teacherId is required" };
        }

        if (!invoiceDate) {
            return { success: false, msg: "invoiceDate is required" };
        }

        // GET TEACHER DATA
        let existingTeacher = await teacherModel.findOne({ _id: teacherId });

        if (!existingTeacher) {
            return { success: false, msg: "Teacher not found" };
        }

        // CHECK IF TEACHER HAS SALARY
        if (!existingTeacher.salary || existingTeacher.salary === "" || existingTeacher.salary === "0") {
            return { success: false, msg: "Teacher does not have a salary assigned" };
        }

        // CONVERT SALARY TO NUMBER
        let salaryAmount = Number(existingTeacher.salary);

        if (isNaN(salaryAmount) || salaryAmount <= 0) {
            return { success: false, msg: "Invalid salary amount" };
        }

        // GET PER ATTENDANCE CUT AMOUNT
        let perAbsenceCut = Number(existingTeacher.perAttendenceCut) || 0;

        // CHECK IF INVOICE ALREADY EXISTS FOR THIS MONTH
        let existingInvoice = await teacherInvoiceModel.findOne({
            teacherId: teacherId,
            invoiceGeneratedFor: {
                $gte: invoiceGeneratedFor,
                $lte: monthEndDate
            }
        });

        if (existingInvoice) {
            return {
                success: false,
                msg: "Invoice already exists for this month",
                data: existingInvoice
            };
        }

        // // GET TEACHER ABSENCES FOR THIS MONTH
        // let absenceCount = await teacherAttendanceModel.countDocuments({
        //     teacherId: teacherId,
        //     date: { $gte: invoiceGeneratedFor, $lte: monthEndDate },
        //     status: { $in: ["absent", "notFilled"] } // OR WHATEVER YOUR ABSENCE STATUS IS
        // });

        // // CALCULATE TOTAL ABSENCE CUT
        // let totalAbsenceCut = absenceCount * perAttendenceCut;

        // CALCULATE FINAL INVOICE AMOUNT AFTER DEDUCTING ABSENCES
        // let finalInvoiceAmount = salaryAmount - totalAbsenceCut;
        let finalInvoiceAmount = salaryAmount

        // MAKE SURE FINAL AMOUNT IS NOT NEGATIVE
        if (finalInvoiceAmount < 0) {
            finalInvoiceAmount = 0;
        }

        // CREATE TEACHER INVOICE
        let newTeacherInvoice = new teacherInvoiceModel({
            teacherUniqueId: existingTeacher._id.toString(),
            teacherId: existingTeacher._id,
            revenueType: "salary",
            revenueReasonRecord: ["Monthly Salary"],
            invoiceAmount: salaryAmount,
            // absenceCount: 0,
            absenceCut: perAbsenceCut,
            paidAmount: 0,
            remainingAmount: finalInvoiceAmount,
            paidStatus: finalInvoiceAmount === 0 ? "paid" : "unpaid",
            paymentRecord: [],
            invoiceGeneratedFor: invoiceGeneratedFor
        });

        // SAVE INVOICE
        let savedInvoice = await newTeacherInvoice.save();


        existingTeacher.invoices.push(savedInvoice._id)
        await existingTeacher.save()

        // console.log(`Teacher invoice created for ${existingTeacher.name}`);
        // console.log(`Salary: ${salaryAmount}, Absences: ${absenceCount}, Absence Cut: ${totalAbsenceCut}, Final Amount: ${finalInvoiceAmount}`);

        return {
            success: true,
            msg: "Teacher salary invoice created successfully",
            data: {
                invoice: savedInvoice,
                teacher: {
                    id: existingTeacher._id,
                    name: existingTeacher.name,
                    salary: salaryAmount,
                    absenceCount: absenceCount,
                    perAttendenceCut: perAttendenceCut,
                    totalAbsenceCut: totalAbsenceCut,
                    finalInvoiceAmount: finalInvoiceAmount
                }
            }
        };

    } catch (error) {
        console.log(error);
        return {
            success: false,
            msg: "Error in creating teacher salary invoice",
            reason: error?.message,
            errorPlace: error?.stack
        };
    }
};






















export async function removeDublicateSalaryInvoicesOfTeacher(teacherId) {
    try {
        // Teacher ID ko MongoDB ObjectId mein convert karo
        teacherId = new mongoose.Types.ObjectId(teacherId)

        // Is teacher ke saare invoices database se nikalo aur creation date ke hisaab se sort karo (purane pehle)
        let TeacherInvoice = getLocalMemberInvoiceModel()
        const invoices = await TeacherInvoice.find({ teacherId }).lean()

        // Agar 2 se kam invoices hain to duplicate ho hi nahi sakte
        if (!invoices || invoices.length < 2) {
            return { success: false, message: "No duplicates found" }
        }

        // Ye array duplicate invoice IDs store karega jo delete karni hain
        const duplicateIds = []

        // Ye Set track karega ke kon se invoices already check ho chuke hain
        const processedIds = new Set()

        // BAHAR WALA LOOP - Har invoice ko parent ki tarah treat karo
        for (let i = 0; i < invoices.length; i++) {
            const parentInvoice = invoices[i]

            // Agar ye invoice pehle hi check ho chuka hai to skip karo
            if (processedIds.has(parentInvoice._id.toString())) continue

            // Parent invoice ki important details nikalo
            const parentRevenueType = parentInvoice.revenueType // Kaunsa type ka invoice hai (salary, bonus, etc)
            const parentGeneratedForDate = parentInvoice.invoiceGeneratedFor // Kis month/date ke liye generate hua

            // Agar date nahi hai to is invoice ko skip karo
            if (!parentGeneratedForDate) continue

            // Parent invoice ka month aur year nikalo
            const parentMonth = new Date(parentGeneratedForDate).getMonth() // 0-11 (Jan=0, Dec=11)
            const parentYear = new Date(parentGeneratedForDate).getFullYear() // 2024, 2025, etc

            // ANDAR WALA LOOP - Parent ke baad wale saare invoices ko child ki tarah check karo
            for (let j = i + 1; j < invoices.length; j++) {
                const childInvoice = invoices[j]

                // Agar ye child invoice already duplicate mark ho chuka hai to skip karo
                if (processedIds.has(childInvoice._id.toString())) continue

                // Child invoice ki important details nikalo
                const childRevenueType = childInvoice.revenueType
                const childGeneratedForDate = childInvoice.invoiceGeneratedFor

                // Revenue type match nahi karta? Skip karo - different type ka invoice hai
                if (childRevenueType !== parentRevenueType) continue

                // Date nahi hai? Skip karo
                if (!childGeneratedForDate) continue

                // Child invoice ka month aur year nikalo
                const childMonth = new Date(childGeneratedForDate).getMonth()
                const childYear = new Date(childGeneratedForDate).getFullYear()

                // AB DUPLICATE CHECK KARO:
                // Agar same month + same year + same revenue type = DUPLICATE!
                if (parentMonth === childMonth && parentYear === childYear && parentRevenueType === childRevenueType) {

                    // Child ko duplicate array mein daal do (parent ko rakhenge, child ko delete karenge)
                    duplicateIds.push(childInvoice._id)

                    // Child ko processed mark kar do taake dobara check na ho
                    processedIds.add(childInvoice._id.toString())
                }
            }

            // Parent ko bhi processed mark kar do
            processedIds.add(parentInvoice._id.toString())
        }

        // Agar duplicate invoices mile hain to unhe database se delete karo
        if (duplicateIds.length > 0) {
            await TeacherInvoice.deleteMany({ _id: { $in: duplicateIds } })

            // Success response bhejo
            return {
                success: true,
                message: `${duplicateIds.length} duplicate(s) removed`,
                deletedCount: duplicateIds.length,
                deletedIds: duplicateIds
            }
        }

        // Koi duplicate nahi mila
        return { success: false, message: "No duplicates found" }

    } catch (error) {
        console.error(error)
        return {
            success: false,
            message: "Error removing duplicates",
            error: error.message
        }
    }
}







































