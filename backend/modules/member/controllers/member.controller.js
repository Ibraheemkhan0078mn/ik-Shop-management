import fs from 'fs';
import path from 'path';
import {
    getLocalMemberModel,
    getLocalMemberAttendanceModel,
    getLocalMemberSalaryPaymentModel,
    getLocalPartnerInvestmentModel,
    getLocalClassPartnershipModel,
    getLocalMemberSalaryChangeModel,
} from '../../../configs/connect.db.js';
import { ApiError } from '../../../common/services/apiResponses.js';
import { changeTrackDocsCreationFunc } from '../../../common/ikSync/changeTrackModelCreation.js';
import { imageChangeTrackDocsCreation } from '../../../common/ikSync/imageChangeTrackModelCreation.js';
import { getCustomStartEndMonthRanges } from '../../../common/services/date.js';
import {
    memberCreate as memberCreateService,
    memberUpdate as memberUpdateService,
    memberDelete as memberDeleteService,
    getAllMemberData as getAllMemberDataService,
    getMemberDataOnId as getMemberDataOnIdService,
    checkDuplicateMemberInstituteId as checkDuplicateMemberInstituteIdService,
} from '../services/member.service.js';

// ─── helpers ──────────────────────────────────────────────────────────────────
const toBool = (val) => val === true || val === 'true';
const parseArr = (val) => { try { return JSON.parse(val || '[]'); } catch { return []; } };
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
    members?.filter(m => new Date(m.hiringDate) < new Date()) ?? [];


// ═══════════════════════════════════════════════════════════════════════════════
// MEMBER CRUD
// ═══════════════════════════════════════════════════════════════════════════════

export const memberCreation = async (req, res) => {
    try {
        const MemberModel = getLocalMemberModel();

        const {
            memberId, name, isPartner, partnerType, overallPartnerShareValue, hiringDate,
            bankName, accountNumber, fatherName, phone, email, address, salary, isSalary,
            education, isAbsenceCutEnabled, perAttendenceCut, post, documents, notes, cnicNo, isActive,
        } = req.body;

        const filename = req.file?.filename;
        const languages = parseArr(req.body.languages);
        const skills = parseArr(req.body.skills);
        const experiences = parseArr(req.body.experiences);
        const educationDegrees = parseArr(req.body.educationDegrees);
        const givenClasses = parseArr(req.body.givenClasses);

        const memberData = {
            profileImage: filename ?? '',
            instituteId: memberId, name, fatherName, phoneNo: phone, email, address,
            isSalary: toBool(isSalary),
            salary,
            education, givenClasses,
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
        };

        const createdMember = await memberCreateService(memberData);

        await changeTrackDocsCreationFunc('create', MemberModel.modelName, createdMember?._id);
        if (filename) await imageChangeTrackDocsCreation('create', MemberModel.modelName, createdMember._id);

        return res.json({ success: true, msg: 'Member is created', createdMember });
    } catch (error) {
        return ApiError(error, res);
    }
};

export const memberUpdate = async (req, res) => {
    try {
        const MemberModel = getLocalMemberModel();

        const {
            memberDocId, memberId, name, fatherName, phone, isPartner, partnerType,
            overallPartnerShareValue, bankName, accountNumber, email, address, isSalary,
            salary, education, isAbsenceCutEnabled, perAttendenceCut, post, hiringDate,
            notes, cnicNo, isActive,
        } = req.body;

        const memberProfileImage = req.files?.memberProfileImage?.[0]?.filename ?? '';
        const languages = parseArr(req.body.languages);
        const skills = parseArr(req.body.skills);
        const experiences = parseArr(req.body.experiences);
        const educationDegrees = parseArr(req.body.educationDegrees);
        const givenClasses = parseArr(req.body.givenClasses);

        const existingMember = await MemberModel.findOne({ _id: memberDocId });
        if (!existingMember) return res.json({ success: false, msg: 'The member is not found' });

        const memberData = {
            profileImage: memberProfileImage || existingMember.profileImage,
            instituteId: memberId, name, fatherName, phoneNo: phone, email, address,
            isSalary: toBool(isSalary),
            salary: !toBool(isSalary) ? 0 : salary,
            education, givenClasses,
            isAbsenceCutEnabled: toBool(isAbsenceCutEnabled),
            perAttendenceCut, post, skills, languages, experiences, educationDegrees,
            isPartner: toBool(isPartner),
            partnerType: isPartner && partnerType,
            overallPartnerShareValue: (isPartner && partnerType) && overallPartnerShareValue,
            bankName, accountNumber,
            hiringDate: new Date(hiringDate),
            notes, cnic: cnicNo,
            isActive: toBool(isActive),
        };

        const updatedMember = await memberUpdateService(memberDocId, memberData);

        if (!updatedMember) return res.json({ success: false, msg: 'Member is not updated' });

        await changeTrackDocsCreationFunc('update', MemberModel.modelName, updatedMember._id);

        if (memberProfileImage) {
            await imageChangeTrackDocsCreation('delete', MemberModel.modelName, updatedMember._id, existingMember.cloudinaryPublicId);
            await imageChangeTrackDocsCreation('create', MemberModel.modelName, updatedMember._id);
        }

        return res.json({ success: true, msg: 'Member is updated', updatedMember });
    } catch (error) {
        return ApiError(error, res);
    }
};

export const memberDelete = async (req, res) => {
    try {
        const MemberModel = getLocalMemberModel();
        const { memberDocId } = req.body;
        if (!memberDocId) return res.json({ success: false, msg: 'Member id is not found' });

        await memberDeleteService(memberDocId);
        const stillExists = await MemberModel.findOne({ _id: memberDocId });
        if (stillExists) return res.json({ success: false, msg: 'The member is not deleted' });

        await changeTrackDocsCreationFunc('delete', MemberModel.modelName, memberDocId);
        const allMembers = await MemberModel.find();

        return res.json({ success: true, msg: 'The member is deleted', allMembers });
    } catch (error) {
        return res.json({ success: false, msg: 'error', error: error?.message });
    }
};

export const getAllMemberData = async (req, res) => {
    try {
        const allMemberData = await getAllMemberDataService();
        return res.status(200).json({ success: true, msg: 'Members retrieved successfully', allMemberData });
    } catch (error) {
        return res.status(500).json({ success: false, msg: 'Internal server error', error: error.message });
    }
};

export const getMemberDataOnId = async (req, res) => {
    try {
        const { memberId } = req.body;
        const memberdata = await getMemberDataOnIdService(memberId);
        if (!memberdata) return res.json({ success: false, msg: 'No Members are found' });
        return res.json({ success: true, msg: 'Member data found', memberdata });
    } catch (error) {
        return res.json({ success: false, msg: 'error', error: error?.message });
    }
};

export const checkDublicateMemberInstituteId = async (req, res) => {
    try {
        const { memberId } = req.params;
        const existing = await checkDuplicateMemberInstituteIdService(memberId);
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
// ATTENDANCE
// ═══════════════════════════════════════════════════════════════════════════════

export const getSelectedDayMembersAttendenceData = async (req, res) => {
    try {
        const { date } = req.body;
        if (!date) return res.json({ success: false, msg: 'No date provided' });

        const AttendanceModel = getLocalMemberAttendanceModel();
        const { startOfDay, endOfDay } = dayRange(date);
        const attendance = await AttendanceModel.findOne({ date: { $gte: startOfDay, $lte: endOfDay } });
        if (!attendance) return res.json({ success: false, msg: 'No member attendance found.' });

        const investors = await getLocalMemberModel().find({ post: 'investor' }).select('_id');
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

        const AttendanceModel = getLocalMemberAttendanceModel();
        const MemberModel = getLocalMemberModel();

        let allMembers = await MemberModel.find({ post: { $ne: 'investor' } });
        if (!allMembers?.length) return res.json({ success: false, msg: 'No Members found, attendance not created.' });

        allMembers = filterFutureMembers(allMembers).filter(m => m.isActive == true);

        const createdAttendance = await AttendanceModel.create({
            date,
            members: allMembers.map(m => ({ id: m._id, instituteId: m.instituteId, name: m.name, presenceStatus: 'notFilled' })),
        });

        if (!createdAttendance) return res.json({ success: false, msg: 'Attendance not created.' });

        await changeTrackDocsCreationFunc('create', AttendanceModel.modelName, createdAttendance._id);
        return res.json({ success: true, msg: 'Member attendance created', memberAttendence: createdAttendance });
    } catch (error) {
        return res.json({ success: false, msg: 'Error', error: error?.message });
    }
};

export const setMemberAttendence = async (req, res) => {
    try {
        const { memberDocId, presenceStatus, currentAttendenceDocumentId } = req.body;
        const AttendanceModel = getLocalMemberAttendanceModel();
        const attendanceDoc = await AttendanceModel.findOne({ _id: currentAttendenceDocumentId });
        if (!attendanceDoc) return res.json({ success: false, msg: 'No attendance found on this id.' });

        for (const m of attendanceDoc.members) {
            if (m?.id?.toString() == memberDocId) m.presenceStatus = presenceStatus;
        }
        await attendanceDoc.save();

        await changeTrackDocsCreationFunc('update', AttendanceModel.modelName, attendanceDoc._id);
        return res.json({ success: true, msg: 'Attendance changed', attendenceData: attendanceDoc });
    } catch (error) {
        return res.json({ success: false, msg: 'Error', error: error?.message });
    }
};

export const setAttendanceByInstituteIdScanning = async (req, res) => {
    try {
        const { instituteId, date } = req.body;
        if (!instituteId) return res.json({ success: false, reason: 'Institute ID is required' });

        const MemberModel = getLocalMemberModel();
        const AttendanceModel = getLocalMemberAttendanceModel();

        const member = await MemberModel.findOne({ instituteId });
        if (!member) return res.json({ success: false, reason: 'No member found with this Institute ID' });

        const { startOfDay, endOfDay } = dayRange(date ?? new Date());
        let attendanceDoc = await AttendanceModel.findOne({ date: { $gte: startOfDay, $lte: endOfDay } });

        if (!attendanceDoc) {
            const allMembers = filterFutureMembers(await MemberModel.find({}));
            attendanceDoc = await AttendanceModel.create({
                date: startOfDay,
                members: allMembers.map(m => ({ id: m._id, name: m.name || '—', presenceStatus: 'notFilled' })),
            });
            await changeTrackDocsCreationFunc('create', AttendanceModel.modelName, attendanceDoc._id);
        }

        const entry = attendanceDoc.members.find(m => m.id?.toString() === member._id?.toString());
        if (!entry) return res.json({ success: false, reason: 'Member not found in attendance document' });

        entry.presenceStatus = 'present';
        await attendanceDoc.save();
        await changeTrackDocsCreationFunc('update', AttendanceModel.modelName, attendanceDoc._id);

        return res.json({ success: true, msg: 'Attendance marked as present', attendenceData: attendanceDoc });
    } catch (error) {
        return res.json({ success: false, reason: 'Internal server error', error: error?.message });
    }
};

export const fromTillTimeAttendenceCalculation = async (req, res) => {
    try {
        const { fromDate, tillDate, memberDocId } = req.body;
        if (!fromDate || !tillDate) return res.json({ success: false, msg: 'date is not found' });

        const AttendanceModel = getLocalMemberAttendanceModel();
        const startOfMonth = new Date(fromDate); startOfMonth.setHours(0, 0, 0, 0);
        const endOfMonth = new Date(tillDate); endOfMonth.setHours(23, 59, 59, 999);

        const attendenceDocs = await AttendanceModel.find({
            date: { $gte: startOfMonth, $lte: endOfMonth },
            'members.id': memberDocId,
        });

        let totalClasses = attendenceDocs.length;
        let presence = 0, absence = 0, leave = 0;

        for (const doc of attendenceDocs) {
            for (const m of doc.members) {
                if (m?.id?.toString() === memberDocId?.toString()) {
                    if (m.presenceStatus === 'present') presence++;
                    else if (m.presenceStatus === 'absent') absence++;
                    else if (m.presenceStatus === 'leave') leave++;
                    else absence++; // notFilled
                }
            }
        }

        const presencePercentage = totalClasses ? (presence / totalClasses) * 100 : 0;
        return res.json({ success: true, msg: 'Data found', totalClasses, presence, absence, leave, presencePercentage, attendenceDocs });
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
        const MemberModel = getLocalMemberModel();
        const SalaryPaymentModel = getLocalMemberSalaryPaymentModel();

        const member = await MemberModel.findOne({ _id: memberId });
        if (!member) return res.json({ success: false, msg: 'The member is not found' });

        const newSalary = await SalaryPaymentModel.create({ member: memberId, salaryAmount, paymentType, paymentMethod, date, notes });
        if (!newSalary) return res.json({ success: false, msg: 'Salary payment is not created' });

        await MemberModel.findOneAndUpdate({ _id: memberId }, { $push: { salaryPayments: newSalary._id } });
        await changeTrackDocsCreationFunc('create', SalaryPaymentModel.modelName, newSalary._id);
        await changeTrackDocsCreationFunc('update', MemberModel.modelName, member._id);

        const allMemberPayments = await SalaryPaymentModel.find({ member: memberId }).sort({ date: -1 });
        return res.json({ success: true, msg: 'Salary payment created', newSalary, allMemberPayments });
    } catch (error) {
        return res.json({ success: false, msg: 'error', error: error?.message });
    }
};

export const getMemberSalaryPayments = async (req, res) => {
    try {
        const { memberId } = req.body;
        const salaryList = await getLocalMemberSalaryPaymentModel().find({ member: memberId }).sort({ date: -1, createdAt: -1 });
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
        const payments = await getLocalMemberSalaryPaymentModel().find({ member: memberId, date: { $gte: startOfMonth, $lte: endOfMonth } });
        if (!payments?.length) return res.json({ success: false, msg: 'No payments found' });
        return res.json({ success: true, msg: 'Payments found', payments });
    } catch (error) {
        return res.json({ success: false, msg: error?.message });
    }
};

export const updateSalaryPaymentController = async (req, res) => {
    try {
        const { salaryPaymentId, salaryAmount, paymentMethod, date, notes } = req.body;
        const SalaryPaymentModel = getLocalMemberSalaryPaymentModel();
        const updated = await SalaryPaymentModel.findOneAndUpdate(
            { _id: salaryPaymentId },
            { salaryAmount, paymentMethod, date, notes },
            { new: true }
        );
        if (!updated) return res.json({ success: false, msg: 'Salary payment not updated' });
        await changeTrackDocsCreationFunc('update', SalaryPaymentModel.modelName, updated._id);
        return res.json({ success: true, msg: 'Salary payment updated', updatedSalary: updated });
    } catch (error) {
        return res.json({ success: false, msg: 'error', error: error?.message });
    }
};

export const deleteSalaryPaymentController = async (req, res) => {
    try {
        const { salaryId, memberId } = req.body;
        const MemberModel = getLocalMemberModel();
        const SalaryPaymentModel = getLocalMemberSalaryPaymentModel();

        const member = await MemberModel.findOne({ _id: memberId });
        if (!member) return res.json({ success: false, msg: 'The member is not found' });

        const deleted = await SalaryPaymentModel.findOneAndDelete({ _id: salaryId });
        if (!deleted) return res.json({ success: false, msg: 'Salary payment not deleted' });

        await MemberModel.findOneAndUpdate({ _id: memberId }, { $pull: { salaryPayments: salaryId } });
        await changeTrackDocsCreationFunc('delete', SalaryPaymentModel.modelName, deleted._id);
        await changeTrackDocsCreationFunc('update', MemberModel.modelName, member._id);

        const salaryList = await SalaryPaymentModel.find({ member: memberId }).sort({ date: -1 });
        return res.json({ success: true, msg: 'Salary payment deleted', salaryPayments: salaryList });
    } catch (error) {
        return res.json({ success: false, msg: 'error', error: error?.message });
    }
};

export const getMemberFinanceData = async (req, res) => {
    try {
        const { memberId } = req.body;
        const MemberModel = getLocalMemberModel();
        const SalaryPaymentModel = getLocalMemberSalaryPaymentModel();
        const AttendanceModel = getLocalMemberAttendanceModel();

        const member = await MemberModel.findOne({ _id: memberId });
        if (!member) return res.status(404).json({ success: false, msg: 'Member not found' });

        const payments = await SalaryPaymentModel.find({ member: memberId }).sort({ date: 1 });
        const totalPayments = payments.reduce((s, p) => s + (Number(p.salaryAmount) || 0), 0);
        const salary = Number(member.salary) || 0;
        const perAttendenceCut = Number(member.perAttendenceCut) || 0;

        const attendanceDocs = await AttendanceModel.find({ 'members.id': memberId });
        let absences = 0;
        for (const doc of attendanceDocs) {
            const entry = doc.members?.find(m => m?.id?.toString() === memberId?.toString());
            if (entry?.presenceStatus === 'absent' || entry?.presenceStatus === 'notFilled') absences++;
        }
        const totalAbsenceCut = absences * perAttendenceCut;

        return res.status(200).json({
            success: true,
            data: {
                member: { id: member._id, name: member.name, salary, perAttendenceCut, hiringDate: member.hiringDate },
                transactions: payments,
                calculations: { totalPayments, totalAbsences: absences, totalAbsenceCut, remainingBalance: salary - totalPayments }
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, msg: 'Error fetching member finance data', reason: error?.message });
    }
};

export const getInvesterPayments = async (req, res) => {
    try {
        const { memberId } = req.body;
        if (!memberId) return res.json({ success: false, msg: 'No member id is provided' });

        const member = await getLocalMemberModel().findById(memberId).populate('salaryPayments');
        if (!member) return res.json({ success: false, msg: 'No member is found.' });
        if (!member.salaryPayments?.length) return res.json({ success: false, msg: 'No salary payments are found.' });

        const totalPayments = member.salaryPayments
            .filter(p => p.paymentType === 'investerPayment')
            .reduce((acc, p) => acc + p.salaryAmount, 0);

        return res.json({ success: true, msg: 'Member salary payments found.', salaryPayments: member.salaryPayments, totalPayments });
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

        const MemberModel = getLocalMemberModel();
        const member = await MemberModel.findOne({ _id: memberDocId });
        if (!member) return res.json({ success: false, msg: 'Member not found in database.' });

        const newFileNames = req.files.map(f => f.filename);
        const updated = await MemberModel.findOneAndUpdate(
            { _id: memberDocId },
            { $push: { documents: { $each: newFileNames } } },
            { new: true }
        );
        await changeTrackDocsCreationFunc('update', MemberModel.modelName, memberDocId);
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

        const MemberModel = getLocalMemberModel();
        const member = await MemberModel.findOne({ _id: memberDocId });
        if (!member) return res.json({ success: false, msg: 'Member not found' });

        await MemberModel.findOneAndUpdate({ _id: memberDocId }, { $pull: { documents: fileName } });

        try {
            const localAppData = process.env.LOCALAPPDATA;
            if (localAppData) {
                const filePath = path.join(localAppData, 'SSIB', 'uploads', fileName);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            }
        } catch (fileError) {
            console.error('Physical file deletion error:', fileError.message);
        }

        await changeTrackDocsCreationFunc('update', MemberModel.modelName, memberDocId);
        const refreshed = await MemberModel.findOne({ _id: memberDocId });
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
        const MemberModel = getLocalMemberModel();
        const InvestmentModel = getLocalPartnerInvestmentModel();

        const member = await MemberModel.findOne({ _id: partnerId });
        if (!member) return res.json({ success: false, msg: 'The partner is not found' });
        if (!member.isPartner) return res.json({ success: false, msg: 'Member is not registered as a partner' });

        const createdInvestment = await InvestmentModel.create({
            name: member.name, partnerId,
            amount: Number(amount),
            date: date ? new Date(date) : new Date(),
            notes, paymentMethod,
        });

        await MemberModel.findOneAndUpdate({ _id: partnerId }, { $push: { investmentMoney: createdInvestment._id } });
        await changeTrackDocsCreationFunc('create', InvestmentModel.modelName, createdInvestment._id);

        return res.json({ success: true, msg: 'Partner investment created successfully', createdInvestment });
    } catch (error) {
        return ApiError(error, res);
    }
};

export const getAllPartnerInvestments = async (req, res) => {
    try {
        const investments = await getLocalPartnerInvestmentModel()
            .find({})
            .populate({ path: 'partnerId', select: 'name email phoneNo isPartner partnerType' })
            .sort({ createdAt: -1 });
        return res.json({ success: true, msg: 'Investments retrieved', count: investments.length, investments });
    } catch (error) {
        return ApiError(error, res);
    }
};

export const getPartnerInvestmentById = async (req, res) => {
    try {
        const investment = await getLocalPartnerInvestmentModel().findById(req.params.id).populate('partnerId', 'name');
        if (!investment) return res.json({ success: false, msg: 'Investment not found' });
        return res.json({ success: true, investment });
    } catch (error) {
        return ApiError(error, res);
    }
};

export const getInvestmentsByPartnerId = async (req, res) => {
    try {
        const { partnerId } = req.params;
        const InvestmentModel = getLocalPartnerInvestmentModel();
        const investments = await InvestmentModel.find({ partnerId }).sort({ date: -1 });
        const totalInvestment = investments.reduce((s, i) => s + (Number(i.amount) || 0), 0);
        const member = await getLocalMemberModel().findOne({ _id: partnerId }).select('name');
        return res.json({ success: true, investments, totalInvestment, partnerName: member?.name || '', count: investments.length });
    } catch (error) {
        return ApiError(error, res);
    }
};

export const updatePartnerInvestment = async (req, res) => {
    try {
        const InvestmentModel = getLocalPartnerInvestmentModel();
        const updated = await InvestmentModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.json({ success: false, msg: 'Investment not found' });
        await changeTrackDocsCreationFunc('update', InvestmentModel.modelName, updated._id);
        return res.json({ success: true, msg: 'Investment updated', updated });
    } catch (error) {
        return ApiError(error, res);
    }
};

export const deletePartnerInvestment = async (req, res) => {
    try {
        const InvestmentModel = getLocalPartnerInvestmentModel();
        const deleted = await InvestmentModel.findByIdAndDelete(req.params.id);
        if (!deleted) return res.json({ success: false, msg: 'Investment not found' });
        await getLocalMemberModel().findOneAndUpdate({ _id: deleted.partnerId }, { $pull: { investmentMoney: deleted._id } });
        await changeTrackDocsCreationFunc('delete', InvestmentModel.modelName, deleted._id);
        return res.json({ success: true, msg: 'Investment deleted' });
    } catch (error) {
        return ApiError(error, res);
    }
};


// ═══════════════════════════════════════════════════════════════════════════════
// CLASS PARTNERSHIPS
// ═══════════════════════════════════════════════════════════════════════════════

export const createClassPartnership = async (req, res) => {
    try {
        const { partnerId, classId, type, value, timing, startDate, hasEndDate, endDate } = req.body;
        const ClassPartnerModel = getLocalClassPartnershipModel();
        const member = await getLocalMemberModel().findOne({ _id: partnerId });
        if (!member) return res.json({ success: false, msg: 'Partner not found' });

        const created = await ClassPartnerModel.create({ partnerId, classId, type, value, timing, startDate, hasEndDate, endDate, paidAmount: 0 });
        await changeTrackDocsCreationFunc('create', ClassPartnerModel.modelName, created._id);
        return res.json({ success: true, msg: 'Class partnership created', partnership: created });
    } catch (error) {
        return ApiError(error, res);
    }
};

export const getPartnershipsByPartnerId = async (req, res) => {
    try {
        const { partnerId } = req.params;
        const partnerships = await getLocalClassPartnershipModel()
            .find({ partnerId })
            .populate('classId', 'className startSession endSession')
            .sort({ createdAt: -1 });
        return res.json({ success: true, partnerships });
    } catch (error) {
        return ApiError(error, res);
    }
};

export const updateClassPartnership = async (req, res) => {
    try {
        const ClassPartnerModel = getLocalClassPartnershipModel();
        const updated = await ClassPartnerModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.json({ success: false, msg: 'Partnership not found' });
        await changeTrackDocsCreationFunc('update', ClassPartnerModel.modelName, updated._id);
        return res.json({ success: true, msg: 'Partnership updated', updated });
    } catch (error) {
        return ApiError(error, res);
    }
};

export const deleteClassPartnership = async (req, res) => {
    try {
        const ClassPartnerModel = getLocalClassPartnershipModel();
        const deleted = await ClassPartnerModel.findByIdAndDelete(req.params.id);
        if (!deleted) return res.json({ success: false, msg: 'Partnership not found' });
        await changeTrackDocsCreationFunc('delete', ClassPartnerModel.modelName, deleted._id);
        return res.json({ success: true, msg: 'Partnership deleted' });
    } catch (error) {
        return ApiError(error, res);
    }
};

export const addClassPartnershipPaymentController = async (req, res) => {
    try {
        const { classPartnershipId } = req.params;
        const { amount, paymentDate } = req.body;
        const ClassPartnerModel = getLocalClassPartnershipModel();

        const partnership = await ClassPartnerModel.findById(classPartnershipId);
        if (!partnership) return res.json({ success: false, msg: 'Partnership not found' });

        partnership.payments.push({ amount: Number(amount), paymentDate: paymentDate ? new Date(paymentDate) : new Date() });
        partnership.paidAmount = (partnership.paidAmount || 0) + Number(amount);
        await partnership.save();

        await changeTrackDocsCreationFunc('update', ClassPartnerModel.modelName, partnership._id);
        return res.json({ success: true, msg: 'Payment added', partnership });
    } catch (error) {
        return ApiError(error, res);
    }
};

export const updateClassPartnershipPaymentController = async (req, res) => {
    try {
        const { classPartnershipId, paymentId } = req.params;
        const { amount, paymentDate } = req.body;
        const ClassPartnerModel = getLocalClassPartnershipModel();

        const partnership = await ClassPartnerModel.findById(classPartnershipId);
        if (!partnership) return res.json({ success: false, msg: 'Partnership not found' });

        const payment = partnership.payments.id(paymentId);
        if (!payment) return res.json({ success: false, msg: 'Payment not found' });

        const oldAmount = payment.amount || 0;
        if (amount !== undefined) { payment.amount = Number(amount); partnership.paidAmount = (partnership.paidAmount || 0) - oldAmount + Number(amount); }
        if (paymentDate) payment.paymentDate = new Date(paymentDate);
        await partnership.save();

        await changeTrackDocsCreationFunc('update', ClassPartnerModel.modelName, partnership._id);
        return res.json({ success: true, msg: 'Payment updated', partnership });
    } catch (error) {
        return ApiError(error, res);
    }
};

export const deleteClassPartnershipPaymentController = async (req, res) => {
    try {
        const { classPartnershipId, paymentId } = req.params;
        const ClassPartnerModel = getLocalClassPartnershipModel();

        const partnership = await ClassPartnerModel.findById(classPartnershipId);
        if (!partnership) return res.json({ success: false, msg: 'Partnership not found' });

        const payment = partnership.payments.id(paymentId);
        if (!payment) return res.json({ success: false, msg: 'Payment not found' });

        partnership.paidAmount = Math.max(0, (partnership.paidAmount || 0) - (payment.amount || 0));
        payment.deleteOne();
        await partnership.save();

        await changeTrackDocsCreationFunc('update', ClassPartnerModel.modelName, partnership._id);
        return res.json({ success: true, msg: 'Payment deleted', partnership });
    } catch (error) {
        return ApiError(error, res);
    }
};
