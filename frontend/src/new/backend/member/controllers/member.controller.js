import fs from 'fs';
import path from 'path';

// ─── crud services ───────────────────────────────────────────────────────────
import { createMember, findMembers, findOneMember, updateMember, deleteMember }
    from '../services/crud/member.crud.service.js';
import { createSalaryPayment, findSalaryPayments, findOneSalaryPayment, updateSalaryPayment, deleteSalaryPayment }
    from '../services/crud/memberSalaryPayment.crud.service.js';
import { createAttendance, findOneAttendance }
    from '../services/crud/memberAttendance.crud.service.js';
import { createInvestment, findInvestments, findOneInvestment, updateInvestment, deleteInvestment }
    from '../services/crud/partnerInvestment.crud.service.js';
import { createPartnership, findPartnerships, findOnePartnership, deletePartnership }
    from '../services/crud/classPartnership.crud.service.js';

// ─── shared / general services ───────────────────────────────────────────────
import { getLocalClassModel } from '../../../shared/db/localDbConnection.js';
import { ApiError } from '../../../shared/utils/apiResponses.js';
import { changeTrackDocsCreationFunc } from '../../../shared/utils/onlineSync/changeTrackModelCreation.js';
import { imageChangeTrackDocsCreation } from '../../../shared/utils/onlineSync/imageChangeTrackModelCreation.js';
import { memberAttendenceCalcFunc } from '../services/general/memberAttendanceCalculation.js';
import { memberReminderHandler } from '../../../shared/services/memberReminderHandler.js';
import { syncMemberInAttendance } from '../services/general/member.service.js';
import { classPartnershipCalculationAndDataPreparationFunction, partnerInvestmentCreationFuntion }
    from '../services/general/partnership.service.js';
import { calculateMemberAttendanceSummary }
    from '../../../shared/services/OrganizedServices/member/member.attendance.service.js';
import { getCustomStartEndMonthRanges } from '../../../shared/utils/date.utility.js';
import { checkDateVacation } from '../../vacationLeave/vacationLeave.service.js';
import { memberFinalAccountCalculation }
    from '../../../shared/services/OrganizedServices/member/member.finance.service.js';
import { addPaymentService, deletePaymentService, updatePaymentService }
    from '../../../shared/services/OrganizedServices/member/member.crud.service.js';
import { getSalaryForMonthDetectionByDateService }
    from '../../../shared/services/OrganizedServices/member/member.salary.service.js';

// ─── helpers ─────────────────────────────────────────────────────────────────
const toBool = (val) => val === true || val === 'true';
const parseArr = (val) => JSON.parse(val || '[]');
const todayRange = () => {
    const s = new Date(); s.setHours(0, 0, 0, 0);
    const e = new Date(); e.setHours(23, 59, 59, 999);
    return { startOfDay: s, endOfDay: e };
};
const dayRange = (date) => {
    const d = new Date(date);
    return {
        startOfDay: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0),
        endOfDay: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999),
    };
};
const filterFutureMembers = (members) =>
    members?.filter(m => new Date(m.hiringDate) < new Date());


// ═══════════════════════════════════════════════════════════════════════════════
// MEMBER CRUD
// ═══════════════════════════════════════════════════════════════════════════════

export const memberCreation = async (req, res) => {
    try {
        const { memberId, name, isPartner, partnerType, overallPartnerShareValue, hiringDate,
            bankName, accountNumber, fatherName, phone, email, address, salary, isSalary,
            education, isAbsenceCutEnabled, perAttendenceCut, post, documents, notes, cnicNo,
            isActive } = req.body;

        const filename = req.file?.filename;
        const languages = parseArr(req.body.languages);
        const skills = parseArr(req.body.skills);
        const experiences = parseArr(req.body.experiences);
        const educationDegrees = parseArr(req.body.educationDegrees);
        const givenClasses = parseArr(req.body.givenClasses);

        const createdMember = await createMember({
            profileImage: filename ?? '',
            instituteId: memberId, name, fatherName, phoneNo: phone, email, address,
            isSalary: toBool(isSalary),
            salary, education, givenClasses,
            isAbsenceCutEnabled: toBool(isAbsenceCutEnabled),
            perAttendenceCut, post, documents, languages, skills, educationDegrees, experiences,
            isPartner: toBool(isPartner),
            partnerType: isPartner && partnerType,
            overallPartnerShareValue: (isPartner && partnerType) && overallPartnerShareValue,
            bankName,
            accountNumber: accountNumber && Number(accountNumber),
            hiringDate: hiringDate && new Date(hiringDate),
            isActive: toBool(isActive),
            notes, cnic: cnicNo,
        });

        // Add to today's attendance if hiring date is in the past
        if (createdMember && new Date(createdMember.hiringDate) < new Date()) {
            const { startOfDay, endOfDay } = todayRange();
            const attendanceDoc = await findOneAttendance({ date: { $gte: startOfDay, $lte: endOfDay } });
            if (attendanceDoc) {
                attendanceDoc.members = [...attendanceDoc.members, {
                    id: createdMember._id,
                    instituteId: createdMember.instituteId,
                    name: createdMember.name,
                    presenceStatus: 'notFilled',
                }];
                await attendanceDoc.save();
            }
        }

        await changeTrackDocsCreationFunc('create', 'member', createdMember?._id);
        if (filename) await imageChangeTrackDocsCreation('create', 'member', createdMember._id);

        return res.json({ success: true, msg: 'Member is created', createdMember });
    } catch (error) {
        return ApiError(error, res);
    }
};

export const memberUpdate = async (req, res) => {
    try {
        const { memberDocId, memberId, name, fatherName, phone, isPartner, partnerType,
            overallPartnerShareValue, bankName, accountNumber, email, address, isSalary,
            salary, education, isAbsenceCutEnabled, perAttendenceCut, post, hiringDate,
            notes, cnicNo, isActive } = req.body;

        const memberProfileImage = req.files?.memberProfileImage?.[0]?.filename ?? '';
        const languages = parseArr(req.body.languages);
        const skills = parseArr(req.body.skills);
        const experiences = parseArr(req.body.experiences);
        const educationDegrees = parseArr(req.body.educationDegrees);
        const givenClasses = parseArr(req.body.givenClasses);

        const existingMember = await findOneMember({ _id: memberDocId });
        if (!existingMember) return res.json({ success: false, msg: 'The member is not found' });

        const updatedMember = await updateMember({ _id: memberDocId }, {
            profileImage: memberProfileImage || existingMember.profileImage,
            instituteId: memberId, name, fatherName, phoneNo: phone, email, address,
            isSalary,
            salary: !toBool(isSalary) ? 0 : salary,
            education, givenClasses,
            isAbsenceCutEnabled: toBool(isAbsenceCutEnabled),
            perAttendenceCut, post, skills, languages, experiences, educationDegrees,
            isPartner,
            partnerType: isPartner && partnerType,
            overallPartnerShareValue: (isPartner && partnerType) && overallPartnerShareValue,
            bankName, accountNumber,
            hiringDate: new Date(hiringDate),
            notes, cnic: cnicNo,
            isActive: toBool(isActive),
        });

        if (!updatedMember) return res.json({ success: false, msg: 'Member is not updated' });

        await syncMemberInAttendance(updatedMember);
        await changeTrackDocsCreationFunc('update', 'member', updatedMember._id);

        if (memberProfileImage) {
            await imageChangeTrackDocsCreation('delete', 'member', updatedMember._id, existingMember.cloudinaryPublicId);
            await imageChangeTrackDocsCreation('create', 'member', updatedMember._id);
        }

        return res.json({ success: true, msg: 'Member is updated', updatedMember });
    } catch (error) {
        return ApiError(error, res);
    }
};

export const memberDelete = async (req, res) => {
    try {
        const { memberDocId } = req.body;
        if (!memberDocId) return res.json({ success: false, msg: 'Member id is not found' });

        await deleteMember({ _id: memberDocId });

        const stillExists = await findOneMember({ _id: memberDocId });
        if (stillExists) return res.json({ success: false, msg: 'The member is not deleted' });

        await changeTrackDocsCreationFunc('delete', 'member', memberDocId);
        const allMembers = await findMembers();

        return res.json({ success: true, msg: 'The member is deleted', allMembers });
    } catch (error) {
        return res.json({ success: false, msg: 'error', error: error?.message });
    }
};

export const getAllMemberData = async (req, res) => {
    try {
        const allMemberData = await findMembers({}, { sort: { createdAt: -1 }, lean: true });
        if (!allMemberData.length) return res.status(404).json({ success: false, msg: 'No Members found' });
        return res.status(200).json({ success: true, msg: 'Members retrieved successfully', allMemberData });
    } catch (error) {
        return res.status(500).json({ success: false, msg: 'Internal server error', error: error.message });
    }
};

export const getMemberDataOnId = async (req, res) => {
    try {
        const { memberId } = req.body;
        const classModel = getLocalClassModel();
        const memberdata = await findOneMember({ _id: memberId }, { lean: true });

        if (!memberdata) return res.json({ success: false, msg: 'No Members are found' });

        let associatedClasses = await classModel.find({ classMainMemberId: memberdata._id }).lean();
        memberdata.associatedClasses = associatedClasses.map(cls => ({
            className: cls.className, id: cls._id,
            startSession: cls.startSession, endSession: cls.endSession,
        }));

        const result = await memberFinalAccountCalculation(memberId);
        return res.json({ result, success: true, msg: 'Member data found', memberdata });
    } catch (error) {
        return res.json({ success: false, msg: 'error', error: error?.message });
    }
};

export const checkDublicateMemberInstituteId = async (req, res) => {
    try {
        const { memberId } = req.params;
        const existing = await findOneMember({ instituteId: memberId });
        return res.json({
            success: true,
            duplicate: !!existing,
            msg: existing ? 'Member with this Institute ID already exists' : 'Institute ID is available',
        });
    } catch (error) {
        return ApiError(error, res);
    }
};


// ═══════════════════════════════════════════════════════════════════════════════
// MEMBER FINANCE
// ═══════════════════════════════════════════════════════════════════════════════

export const getInvesterPayments = async (req, res) => {
    try {
        const { memberId } = req.body;
        if (!memberId) return res.json({ success: false, msg: 'No member id is provided' });

        const member = await findOneMember({ _id: memberId }, { populate: 'salaryPayments' });
        if (!member) return res.json({ success: false, msg: 'No member is found.' });
        if (!member.salaryPayments?.length) return res.json({ success: false, msg: 'No salary payments are found.' });

        const totalPayments = member.salaryPayments
            .filter(p => p.paymentType === 'investerPayment')
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .reduce((acc, p) => acc + p.salaryAmount, 0);

        return res.json({ success: true, msg: 'Member salary payments found.', salaryPayments: member.salaryPayments, totalPayments });
    } catch (error) {
        return res.json({ success: false, msg: 'error', error: error?.message });
    }
};

export const getMemberFinanceData = async (req, res) => {
    try {
        const { memberId } = req.body;
        const result = await memberFinalAccountCalculation(memberId);
        const currentSalary = await getSalaryForMonthDetectionByDateService(memberId, new Date());
        return res.status(200).json({ ...result, currentSalary });
    } catch (error) {
        return res.status(500).json({ success: false, msg: 'Error fetching member finance data', reason: error?.message });
    }
};

export const getMemberPayslip = async (req, res) => {
    try {
        const { memberId, startDate, endDate } = req.body;
        if (!memberId || !startDate || !endDate)
            return res.json({ success: false, msg: 'memberId, startDate and endDate are required' });

        const { startDateFormat: start, endDateFormat: end } = getCustomStartEndMonthRanges(startDate, endDate);
        const member = await findOneMember({ _id: memberId });
        if (!member) return res.json({ success: false, msg: 'Member not found' });

        const financeResult = await memberFinalAccountCalculation(memberId);
        if (!financeResult?.success)
            return res.json({ success: false, msg: financeResult?.msg || 'Finance calculation failed' });

        const inRange = (d) => { const dt = new Date(d); return dt >= start && dt <= end; };
        const salaryMap = (financeResult.data?.salary?.salaryMap || []).filter(e => inRange(e.date));
        const transactions = (financeResult.data?.transactions || []).filter(p => inRange(p.date));

        const totalGrossSalary = salaryMap.reduce((a, e) => a + Number(e.fullSalary || 0), 0);
        const totalAbsenceCut = salaryMap.reduce((a, e) => a + Number(e.totalAbsenceCut || 0), 0);
        const totalNetEarned = salaryMap.reduce((a, e) => a + Number(e.netSalary || 0), 0);
        const totalPaidAmount = transactions.reduce((a, p) => a + Number(p.salaryAmount || 0), 0);
        const totalRemainingAmount = Math.max(0, totalNetEarned - totalPaidAmount);

        const { data: { summary: attendance = {} } = {} } = await calculateMemberAttendanceSummary(memberId, member, start, end) ?? {};
        const perDayCut = salaryMap.length
            ? Number(salaryMap.at(-1).perAbsenceCut || 0)
            : Number(member.perAttendenceCut || 0);

        return res.json({
            success: true,
            payslip: {
                member: {
                    id: member._id, name: member.name, fatherName: member.fatherName,
                    instituteId: member.instituteId, post: member.post, phoneNo: member.phoneNo,
                    email: member.email, bankName: member.bankName, accountNumber: member.accountNumber,
                    profileImage: member.profileImage,
                },
                period: { startDate: start, endDate: end },
                salarySummary: {
                    totalMonths: salaryMap.length, totalGrossSalary, totalAbsenceCut,
                    totalNetEarned, totalPaidAmount, totalRemainingAmount,
                    netPayable: totalNetEarned, salaryBreakdown: salaryMap,
                },
                attendanceSummary: {
                    totalDays: attendance.total || 0, present: attendance.present || 0,
                    absent: attendance.absent || 0, leave: attendance.leave || 0,
                    notFilled: attendance.allAttendencesMissed || 0,
                },
                deductions: {
                    perDayCut, totalAbsenceDays: attendance.absent || 0,
                    calculatedAbsenceCut: totalAbsenceCut,
                },
                advancedBalance: member.advancedBalance || 0,
            },
        });
    } catch (error) {
        return res.json({ success: false, msg: 'Error generating payslip', reason: error?.message });
    }
};


// ═══════════════════════════════════════════════════════════════════════════════
// MEMBER ATTENDANCE
// ═══════════════════════════════════════════════════════════════════════════════

export const getSelectedDayMembersAttendenceData = async (req, res) => {
    try {
        const { date } = req.body;
        if (!date) return res.json({ success: false, msg: 'No date provided' });

        const { startOfDay, endOfDay } = dayRange(date);
        const attendance = await findOneAttendance({ date: { $gte: startOfDay, $lte: endOfDay } });
        if (!attendance) return res.json({ success: false, msg: 'No member attendance found.' });

        // Remove investors from the attendance doc
        const investors = await findMembers({ post: 'investor' });
        const investorIds = investors.map(i => i._id.toString());
        if (investorIds.length && attendance.members?.length) {
            attendance.members = attendance.members.filter(m => !investorIds.includes(m?.id?.toString()));
            await attendance.save();
        }

        return res.json({ success: true, msg: 'Member attendance found.', memberAttendence: attendance });
    } catch (error) {
        return res.json({ success: false, msg: 'error', error: error?.message });
    }
};

export const createdSeletedDayMemberAttendence = async (req, res) => {
    try {
        const { date } = req.body;
        if (!date) return res.json({ success: false, msg: 'No date found' });

        const vacation = await checkDateVacation(date, 'member');
        if (vacation.isVacation) return res.json({ success: false, msg: 'This date is vacation', vacationStatus: vacation });

        let allMembers = await findMembers({ post: { $ne: 'investor' } });
        if (!allMembers?.length) return res.json({ success: false, msg: 'No Members found, attendance not created.' });

        allMembers = filterFutureMembers(allMembers);
        allMembers = allMembers.filter(m => m.isActive == true)
        const createdAttendance = await createAttendance({
            date,
            members: allMembers.map(m => ({ id: m._id, instituteId: m.instituteId, name: m.name, presenceStatus: 'notFilled' })),
        });

        if (!createdAttendance) return res.json({ success: false, msg: 'Attendance not created.' });

        await changeTrackDocsCreationFunc('create', 'memberAttendence', createdAttendance._id);
        return res.json({ success: true, msg: 'Member attendance created', memberAttendence: createdAttendance });
    } catch (error) {
        return res.json({ success: false, msg: 'Error', error: error?.message });
    }
};

export const setMemberAttendence = async (req, res) => {
    try {
        const { memberDocId, presenceStatus, currentAttendenceDocumentId } = req.body;
        const attendanceDoc = await findOneAttendance({ _id: currentAttendenceDocumentId });
        if (!attendanceDoc) return res.json({ success: false, msg: 'No attendance found on this id.' });

        for (const m of attendanceDoc.members) {
            if (m?.id == memberDocId) m.presenceStatus = presenceStatus;
        }
        await attendanceDoc.save();

        await changeTrackDocsCreationFunc('update', 'memberAttendence', attendanceDoc._id);
        return res.json({ success: true, msg: 'Attendance changed', attendenceData: attendanceDoc });
    } catch (error) {
        return res.json({ success: false, msg: 'Error', error: error?.message });
    }
};

export const setAttendanceByInstituteIdScanning = async (req, res) => {
    try {
        const { instituteId, date } = req.body;
        if (!instituteId) return res.json({ success: false, reason: 'Institute ID is required' });

        const member = await findOneMember({ instituteId });
        if (!member) return res.json({ success: false, reason: 'No member found with this Institute ID' });

        const { startOfDay, endOfDay } = dayRange(date ?? new Date());
        let attendanceDoc = await findOneAttendance({ date: { $gte: startOfDay, $lte: endOfDay } });

        if (!attendanceDoc) {
            const allMembers = filterFutureMembers(await findMembers({}));
            attendanceDoc = await createAttendance({
                date: startOfDay,
                members: allMembers.map(m => ({ id: m._id, name: m.name || '—', presenceStatus: 'notFilled' })),
            });
            await changeTrackDocsCreationFunc('create', 'memberAttendence', attendanceDoc._id);
        }

        const entry = attendanceDoc.members.find(m => m.id?.toString() === member._id?.toString());
        if (!entry) return res.json({ success: false, reason: 'Member not found in attendance document' });

        entry.presenceStatus = 'present';
        await attendanceDoc.save();
        await changeTrackDocsCreationFunc('update', 'memberAttendence', attendanceDoc._id);

        return res.json({ success: true, msg: 'Attendance marked as present', attendenceData: attendanceDoc });
    } catch (error) {
        return res.json({ success: false, reason: 'Internal server error', error: error?.message });
    }
};

export const fromTillTimeAttendenceCalculation = async (req, res) => {
    try {
        const { fromDate, tillDate, memberDocId } = req.body;
        const result = await memberAttendenceCalcFunc(fromDate, tillDate, memberDocId);
        return res.json({ success: true, msg: 'Data found', ...result });
    } catch (error) {
        return res.json({ success: false, msg: 'Error', error: error?.message });
    }
};


// ═══════════════════════════════════════════════════════════════════════════════
// SALARY PAYMENTS
// ═══════════════════════════════════════════════════════════════════════════════

export const createMemberSalaryPayment = async (req, res) => {
    try {
        const { memberId, paymentType, salaryAmount, paymentMethod, date, notes } = req.body;

        const member = await findOneMember({ _id: memberId });
        if (!member) return res.json({ success: false, msg: 'The member is not found' });

        const newSalary = await createSalaryPayment({ member: memberId, salaryAmount, paymentType, paymentMethod, date, notes });
        if (!newSalary) return res.json({ success: false, msg: 'Salary payment is not created' });

        await updateMember({ _id: memberId }, { $push: { salaryPayments: newSalary._id } });
        await changeTrackDocsCreationFunc('create', 'memberSalaryPayment', newSalary._id);
        await changeTrackDocsCreationFunc('update', 'member', member._id);
        await memberReminderHandler();

        const allMemberPayments = await findSalaryPayments({ member: memberId });
        return res.json({ success: true, msg: 'Salary payment created', newSalary, allMemberPayments });
    } catch (error) {
        return res.json({ success: false, msg: 'error', error: error?.message });
    }
};

export const getMemberSalaryPayments = async (req, res) => {
    try {
        const { memberId } = req.body;
        const salaryList = await findSalaryPayments({ member: memberId }, { sort: { date: -1, createdAt: -1 } });
        return res.json({ success: true, salaryList });
    } catch (error) {
        return res.json({ success: false, msg: 'error', error: error?.message });
    }
};

export const getCurrentMonthSalaryPayments = async (req, res) => {
    try {
        const { memberId } = req.body;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        const payments = await findSalaryPayments({ member: memberId, date: { $gte: startOfMonth, $lte: endOfMonth } });
        if (!payments?.length) return res.json({ success: false, msg: 'No payments found' });

        return res.json({ success: true, msg: 'Payments found', payments });
    } catch (error) {
        return res.json({ success: false, msg: error?.message });
    }
};

export const updateSalaryPaymentController = async (req, res) => {
    try {
        const { salaryPaymentId, salaryAmount, paymentMethod, date, notes } = req.body;
        const updated = await updateSalaryPayment({ _id: salaryPaymentId }, { salaryAmount, paymentMethod, date, notes });
        if (!updated) return res.json({ success: false, msg: 'Salary payment not updated' });

        await changeTrackDocsCreationFunc('update', 'memberSalaryPayment', updated._id);
        return res.json({ success: true, msg: 'Salary payment updated', updatedSalary: updated });
    } catch (error) {
        return res.json({ success: false, msg: 'error', error: error?.message });
    }
};

export const deleteSalaryPaymentController = async (req, res) => {
    try {
        const { salaryId, memberId } = req.body;
        const member = await findOneMember({ _id: memberId });
        if (!member) return res.json({ success: false, msg: 'The member is not found' });

        const deleted = await deleteSalaryPayment({ _id: salaryId });
        if (!deleted) return res.json({ success: false, msg: 'Salary payment not deleted' });

        if (member.salaryPayments?.length) {
            await updateMember({ _id: memberId }, { $pull: { salaryPayments: salaryId } });
            await changeTrackDocsCreationFunc('update', 'member', member._id);
        }

        await changeTrackDocsCreationFunc('delete', 'memberSalaryPayment', deleted._id);
        const salaryList = await findSalaryPayments({ member: memberId }, { sort: { date: -1 } });
        return res.json({ success: true, msg: 'Salary payment deleted', salaryPayments: salaryList });
    } catch (error) {
        return res.json({ success: false, msg: 'error', error: error?.message });
    }
};


// ═══════════════════════════════════════════════════════════════════════════════
// MEMBER DOCUMENTS
// ═══════════════════════════════════════════════════════════════════════════════

export const uploadMemberDocuments = async (req, res) => {
    try {
        const { memberDocId } = req.body;
        if (!memberDocId) return res.json({ success: false, msg: 'Member ID is required.' });
        if (!req.files?.length) return res.json({ success: false, msg: 'No files were uploaded.' });

        const member = await findOneMember({ _id: memberDocId });
        if (!member) return res.json({ success: false, msg: 'Member not found in database.' });

        const newFileNames = req.files.map(f => f.filename);
        const updated = await updateMember({ _id: memberDocId }, { $push: { documents: { $each: newFileNames } } });
        await changeTrackDocsCreationFunc('update', 'member', memberDocId);

        return res.json({ success: true, msg: 'Documents uploaded successfully', documents: updated.documents });
    } catch (error) {
        return res.json({ success: false, msg: 'Server Error', error: error?.message });
    }
};

export const deleteMemberDocument = async (req, res) => {
    try {
        const { memberDocId, fileName } = req.body;
        if (!memberDocId) return res.json({ success: false, msg: 'Member ID is missing' });
        if (!fileName) return res.json({ success: false, msg: 'File name is required' });

        const member = await findOneMember({ _id: memberDocId });
        if (!member) return res.json({ success: false, msg: 'Member not found' });

        await updateMember({ _id: memberDocId }, { $pull: { documents: fileName } });

        // Physical file deletion
        try {
            const localAppData = process.env.LOCALAPPDATA;
            if (localAppData) {
                const filePath = path.join(localAppData, 'SSIB', 'uploads', fileName);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            }
        } catch (fileError) {
            console.error('Physical file deletion error:', fileError.message);
        }

        await changeTrackDocsCreationFunc('update', 'member', memberDocId);
        const refreshed = await findOneMember({ _id: memberDocId });
        return res.json({ success: true, msg: 'Document deleted successfully', documents: refreshed.documents });
    } catch (error) {
        return res.json({ success: false, msg: 'Error deleting document', error: error?.message });
    }
};


// ═══════════════════════════════════════════════════════════════════════════════
// PARTNER INVESTMENTS
// ═══════════════════════════════════════════════════════════════════════════════

export const partnerInvestmentCreation = async (req, res) => {
    try {
        const { partnerId, amount, date, notes, paymentMethod } = req.body;
        const member = await findOneMember({ _id: partnerId });
        if (!member) return res.json({ success: false, msg: 'The partner is not found' });

        const result = await partnerInvestmentCreationFuntion({ name: member.name, partnerId, amount, date, notes, paymentMethod });
        return res.json({ ...result });
    } catch (error) {
        return ApiError(error, res);
    }
};

export const getAllPartnerInvestments = async (req, res) => {
    try {
        const investments = await findInvestments({}, { populate: { path: 'partnerId', select: 'name email phoneNo isPartner partnerType' }, sort: { createdAt: -1 } });
        return res.json({ success: true, msg: 'Investments retrieved', count: investments.length, investments });
    } catch (error) {
        return ApiError(error, res);
    }
};

export const getPartnerInvestmentById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ success: false, msg: 'Investment ID is required' });

        const investment = await findOneInvestment({ _id: id }, { populate: { path: 'partnerId', select: 'name email phoneNo isPartner partnerType overallPartnerShareValue' } });
        if (!investment) return res.status(404).json({ success: false, msg: 'Partner investment not found' });

        return res.json({ success: true, msg: 'Investment retrieved', investment });
    } catch (error) {
        return ApiError(error, res);
    }
};

export const updatePartnerInvestment = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, partnerId, amount, date, notes, paymentMethod, usedIn } = req.body;
        if (!id) return res.status(400).json({ success: false, msg: 'Investment ID is required' });

        const existing = await findOneInvestment({ _id: id });
        if (!existing) return res.status(404).json({ success: false, msg: 'Partner investment not found' });

        // If partner is changing — validate and reassign
        if (partnerId && partnerId !== existing.partnerId.toString()) {
            const newMember = await findOneMember({ _id: partnerId });
            if (!newMember) return res.status(404).json({ success: false, msg: 'New member/partner not found' });
            if (!newMember.isPartner) return res.status(400).json({ success: false, msg: 'Member is not registered as a partner' });

            await updateMember({ _id: existing.partnerId }, { $pull: { investments: id } });
            await updateMember({ _id: partnerId }, { $push: { investments: id } });
        }

        const updateData = {
            ...(name && { name }),
            ...(partnerId && { partnerId }),
            ...(amount && { amount: Number(amount) }),
            ...(date && { date: new Date(date) }),
            ...(notes !== undefined && { notes }),
            ...(paymentMethod !== undefined && { paymentMethod }),
            ...(usedIn !== undefined && { usedIn }),
        };

        const updated = await updateInvestment({ _id: id }, updateData, { populate: { path: 'partnerId', select: 'name email phoneNo isPartner partnerType' } });
        await changeTrackDocsCreationFunc('update', 'partnerInvestment', updated._id);

        return res.json({ success: true, msg: 'Investment updated', updatedInvestment: updated });
    } catch (error) {
        return ApiError(error, res);
    }
};

export const deletePartnerInvestment = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ success: false, msg: 'Investment ID is required' });

        const investment = await findOneInvestment({ _id: id });
        if (!investment) return res.status(404).json({ success: false, msg: 'Partner investment not found' });

        await updateMember({ _id: investment.partnerId }, { $pull: { investments: id } });
        await deleteInvestment({ _id: id });
        await changeTrackDocsCreationFunc('delete', 'partnerInvestment', id);

        return res.json({ success: true, msg: 'Partner investment deleted' });
    } catch (error) {
        return ApiError(error, res);
    }
};

export const getInvestmentsByPartnerId = async (req, res) => {
    try {
        const { partnerId } = req.params;
        if (!partnerId) return res.status(400).json({ success: false, msg: 'Partner ID is required' });

        const member = await findOneMember({ _id: partnerId });
        if (!member) return res.status(404).json({ success: false, msg: 'Member/Partner not found' });
        if (!member.isPartner) return res.status(400).json({ success: false, msg: 'Member is not a partner' });

        const investments = await findInvestments({ partnerId }, { sort: { date: -1 } });
        const totalInvestment = investments.reduce((sum, inv) => sum + inv.amount, 0);

        return res.json({ success: true, msg: 'Investments retrieved', partnerName: member.name, count: investments.length, totalInvestment, investments });
    } catch (error) {
        return ApiError(error, res);
    }
};


// ═══════════════════════════════════════════════════════════════════════════════
// CLASS PARTNERSHIPS
// ═══════════════════════════════════════════════════════════════════════════════

export const createClassPartnership = async (req, res) => {
    try {
        const { classId, partnerId, type, value, timing, startDate, hasEndDate, endDate } = req.body;
        if (!classId || !partnerId || !value || !startDate)
            return res.json({ success: false, msg: 'Required fields are missing' });

        const classModel = getLocalClassModel();
        const [member, classDoc] = await Promise.all([
            findOneMember({ _id: partnerId }),
            classModel.findById(classId),
        ]);
        if (!member) return res.json({ success: false, msg: 'Partner (Member) not found' });
        if (!classDoc) return res.json({ success: false, msg: 'Class not found' });

        const created = await createPartnership({
            classId, partnerId, type, value, timing, startDate, hasEndDate,
            endDate: hasEndDate ? endDate : new Date(classDoc.endSession),
        });
        if (!created) return res.json({ success: false, msg: 'Partnership not created.' });

        await changeTrackDocsCreationFunc('create', 'classPartnership', created._id);

        const populated = await findOnePartnership({ _id: created._id }, { populate: [{ path: 'partnerId' }, { path: 'classId' }] });
        const result = await classPartnershipCalculationAndDataPreparationFunction(populated);

        return res.json({ success: true, msg: 'Partnership created', partnership: result });
    } catch (error) {
        return res.json({ success: false, msg: 'Error', error: error?.message });
    }
};

export const getPartnershipsByPartnerId = async (req, res) => {
    try {
        const { partnerId } = req.params;
        const member = await findOneMember({ _id: partnerId });
        if (!member) return res.json({ success: false, msg: 'Partner (Member) not found' });

        const partnerships = await findPartnerships({ partnerId }, { populate: [{ path: 'partnerId' }, { path: 'classId' }] });
        if (!partnerships?.length) return res.json({ success: false, msg: 'No partnerships found' });

        const allPartnerShipsData = await Promise.all(
            partnerships.map(p => classPartnershipCalculationAndDataPreparationFunction(p))
        );

        return res.json({ success: true, msg: 'Partnerships found', partnerships: allPartnerShipsData });
    } catch (error) {
        return res.json({ success: false, msg: 'Error', error: error?.message });
    }
};

export const updateClassPartnership = async (req, res) => {
    try {
        const { id } = req.params;
        const { classId, partnerId, type, value, timing, startDate, hasEndDate, endDate } = req.body;
        const classModel = getLocalClassModel();

        const existing = await findOnePartnership({ _id: id });
        if (!existing) return res.json({ success: false, msg: 'Partnership not found' });

        if (partnerId) {
            const m = await findOneMember({ _id: partnerId });
            if (!m) return res.json({ success: false, msg: 'Partner (Member) not found' });
            existing.partnerId = partnerId;
        }
        if (classId) {
            const c = await classModel.findById(classId);
            if (!c) return res.json({ success: false, msg: 'Class not found' });
            existing.classId = classId;
        }
        if (type !== undefined) existing.type = type;
        if (value !== undefined) existing.value = value;
        if (timing !== undefined) existing.timing = timing;
        if (startDate !== undefined) existing.startDate = startDate;
        if (hasEndDate !== undefined) existing.hasEndDate = hasEndDate;
        if (endDate !== undefined) existing.endDate = endDate;

        await existing.save();
        await changeTrackDocsCreationFunc('update', 'classPartnership', existing._id);

        const populated = await findOnePartnership({ _id: existing._id }, { populate: [{ path: 'partnerId' }, { path: 'classId' }] });
        const result = await classPartnershipCalculationAndDataPreparationFunction(populated);

        return res.json({ success: true, msg: 'Partnership updated', partnership: result });
    } catch (error) {
        return res.json({ success: false, msg: 'Error', error: error?.message });
    }
};

export const deleteClassPartnership = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await deletePartnership({ _id: id });
        if (!deleted) return res.json({ success: false, msg: 'Partnership not found' });

        await changeTrackDocsCreationFunc('delete', 'classPartnership', deleted._id);
        return res.json({ success: true, msg: 'Partnership deleted', partnership: deleted });
    } catch (error) {
        return res.json({ success: false, msg: 'Error', error: error?.message });
    }
};

// ─── Partnership Payments ─────────────────────────────────────────────────────

export const addClassPartnershipPaymentController = async (req, res) => {
    try {
        const { classPartnershipId } = req.params;
        const result = await addPaymentService(classPartnershipId, req.body);
        return res.status(200).json({ success: true, message: 'Payment added', data: result });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const updateClassPartnershipPaymentController = async (req, res) => {
    try {
        const { classPartnershipId, paymentId } = req.params;
        const result = await updatePaymentService(classPartnershipId, paymentId, req.body);
        return res.status(200).json({ success: true, message: 'Payment updated', data: result });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteClassPartnershipPaymentController = async (req, res) => {
    try {
        const { classPartnershipId, paymentId } = req.params;
        const result = await deletePaymentService(classPartnershipId, paymentId);
        return res.status(200).json({ success: true, message: 'Payment deleted', data: result });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
