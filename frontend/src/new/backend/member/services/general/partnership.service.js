import { getLocalClassPartnershipModel, getLocalStudentFeeTrasactionModel, getLocalstudentModel } from '../../../../shared/db/localDbConnection.js';
import { changeTrackDocsCreationFunc } from '../../../../shared/utils/onlineSync/changeTrackModelCreation.js';
import { findOneMember, updateMember } from '../crud/member.crud.service.js';
import { createInvestment } from '../crud/partnerInvestment.crud.service.js';

// ─── Partner Investment Creation ──────────────────────────────────────────────

export const partnerInvestmentCreationFuntion = async ({ name, partnerId, amount, date, notes, paymentMethod, usedIn }) => {
    if (!name || !partnerId || !amount)
        return { success: false, msg: 'Name, partnerId, and amount are required' };

    const member = await findOneMember({ _id: partnerId });
    if (!member)           return { success: false, msg: 'Member/Partner not found' };
    if (!member.isPartner) return { success: false, msg: 'Member is not registered as a partner' };

    const createdInvestment = await createInvestment({
        name, partnerId,
        amount: Number(amount),
        date: date ? new Date(date) : new Date(),
        notes, paymentMethod, usedIn,
    });

    // Push investment id into member's investmentMoney array
    await updateMember({ _id: partnerId }, { $push: { investmentMoney: createdInvestment._id } });

    await changeTrackDocsCreationFunc('create', 'partnerInvestment', createdInvestment._id);

    return { success: true, msg: 'Partner investment created successfully', createdInvestment };
};


// ─── Class Partnership Calculation ───────────────────────────────────────────

export const classPartnershipCalculationAndDataPreparationFunction = async (partnership) => {
    const ClassPartnershipModel = getLocalClassPartnershipModel();
    const feeTransactionModel   = getLocalStudentFeeTrasactionModel();

    const classData        = partnership.classId;
    const enrolledStudents = await getLocalstudentModel().find({ classId: classData._id }).select('name rollNo');

    // No students — zero out and return early
    if (!classData || !enrolledStudents?.length) {
        await ClassPartnershipModel.findByIdAndUpdate(partnership._id, { totalClassAmount: 0, earnedAmount: 0, earnedFrom: [] });
        return {
            _id: partnership._id, className: classData?.className, classId: classData?._id,
            totalAmount: 0, partnerAmount: 0, transactionCount: 0,
            partnerId: partnership.partnerId._id, feeTransactions: [],
            timingToStart: partnership.timing, partnershipType: partnership.type,
            partnershipValue: partnership.value, partnershipStartDate: partnership.startDate,
            partnershipEndDate: partnership.endDate, hasEndDate: partnership.hasEndDate,
            earnedFrom: [], payments: partnership.payments ?? [],
            paidAmount: partnership.paidAmount ?? 0,
            remainingAmount: 0 - (partnership.paidAmount ?? 0),
        };
    }

    const query = {
        studentId: { $in: enrolledStudents.map(s => s._id) },
        date: {
            $gte: new Date(partnership.startDate),
            ...(partnership.hasEndDate && partnership.endDate && { $lte: new Date(partnership.endDate) }),
        },
    };

    const feeTransactions = await feeTransactionModel.find(query);
    const totalAmount     = feeTransactions.reduce((sum, t) => sum + (t.amount ?? 0), 0);
    const partnerAmount   = partnership.type === 'percentage'
        ? (totalAmount / 100) * partnership.value
        : partnership.value;

    // Build earnedFrom map per student
    const studentTotalsMap = {};
    for (const t of feeTransactions) {
        const sid = t.studentId.toString();
        if (!studentTotalsMap[sid])
            studentTotalsMap[sid] = { name: t.studentName || '', rollNo: t.rollNo || '', totalFeeDeposit: 0, partnerEarned: 0 };
        studentTotalsMap[sid].totalFeeDeposit += t.amount ?? 0;
    }
    for (const sid in studentTotalsMap) {
        const s = studentTotalsMap[sid];
        s.partnerEarned = partnership.type === 'percentage'
            ? (s.totalFeeDeposit / 100) * partnership.value
            : totalAmount > 0 ? (s.totalFeeDeposit / totalAmount) * partnership.value : 0;
    }

    const earnedFrom       = Object.values(studentTotalsMap);
    const remainingAmount  = partnerAmount - (partnership.paidAmount ?? 0);

    await ClassPartnershipModel.findByIdAndUpdate(partnership._id, { totalClassAmount: totalAmount, earnedAmount: partnerAmount, earnedFrom, remainingAmount });

    return {
        _id: partnership._id, className: classData.className, classId: classData._id,
        totalAmount, partnerAmount, transactionCount: feeTransactions.length,
        partnerId: partnership.partnerId._id, feeTransactions,
        timingToStart: partnership.timing, partnershipType: partnership.type,
        partnershipValue: partnership.value, partnershipStartDate: partnership.startDate,
        partnershipEndDate: partnership.endDate, hasEndDate: partnership.hasEndDate,
        earnedFrom, payments: partnership.payments ?? [],
        paidAmount: partnership.paidAmount ?? 0, remainingAmount,
    };
};
