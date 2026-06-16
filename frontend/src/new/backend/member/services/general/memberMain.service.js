import { getCurrentMonthRange } from '../../../../shared/utils/date.utility.js';
import { classPartnershipCalculationAndDataPreparationFunction } from './partnership.service.js';
import { memberFinalAccountCalculation } from '../../../../shared/services/OrganizedServices/member/member.finance.service.js';
import { findOneMember } from '../crud/member.crud.service.js';
import { findInvestments } from '../crud/partnerInvestment.crud.service.js';
import { findPartnerships } from '../crud/classPartnership.crud.service.js';

export const getMemberMainDetails = async (memberId) => {
    if (!memberId) throw new Error('Member ID is required');

    const member = await findOneMember({ _id: memberId }, {
        populate: [
            { path: 'givenClasses', select: 'className name classFee' },
            { path: 'salaryPayments' },
            { path: 'investmentMoney' },
        ],
    });
    if (!member) throw new Error('Member not found');

    const personalInfo = {
        memberId: member._id,
        instituteId: member.instituteId,
        name: member.name,
        profileImage: member.profileImage,
        fatherName: member.fatherName,
        cnic: member.cnic,
        email: member.email,
        post: member.post,
        hiringDate: member.hiringDate,
        isActive: member.isActive,
        phoneNo: member.phoneNo,
        address: member.address,
        salary: member.salary,
        bankName: member.bankName,
        accountNumber: member.accountNumber,
        perAttendenceCut: member.perAttendenceCut || 0,
        advancedBalance: member.advancedBalance || 0,
        education: member.education,
        educationDegrees: member.educationDegrees || [],
        languages: member.languages || [],
        skills: member.skills || [],
        experiences: member.experiences || [],
        givenClasses: member.givenClasses || [],
        totalClassesAssigned: member.givenClasses?.length || 0,
        isPartner: member.isPartner || false,
        partnerType: member.partnerType,
        overallPartnerShareValue: member.overallPartnerShareValue || 0,
        investmentMoney: member.investmentMoney || [],
    };

    return { success: true, personalInfo };
};

export const memberFincancedataOnIdService = (memberId) =>
    memberFinalAccountCalculation(memberId);

export const getMemberAsPartnerInvestmentsRecordService = async (memberId, startDate, endDate) => {
    if (!memberId) return { success: false, msg: 'Partner ID is required' };

    const member = await findOneMember({ _id: memberId });
    if (!member)          return { success: false, msg: 'Member/Partner not found' };
    if (!member.isPartner) return { success: false, msg: 'Member is not registered as a partner' };

    const range = (startDate && endDate)
        ? getCurrentMonthRange(startDate, endDate)
        : getCurrentMonthRange(member.hiringDate, new Date());

    const investments = await findInvestments(
        { partnerId: memberId, date: { $gte: range.startOfMonth, $lte: range.endOfMonth } },
        { sort: { date: -1 } }
    );

    return {
        success: true,
        msg: 'Partner investments retrieved',
        partnerName: member.name,
        count: investments.length,
        totalInvestment: investments.reduce((sum, inv) => sum + inv.amount, 0),
        investments,
    };
};

export const getMemberAsClassPartnerRecordService = async (memberId) => {
    const member = await findOneMember({ _id: memberId });
    if (!member) return { success: false, msg: 'Partner (Member) not found' };

    const partnerships = await findPartnerships(
        { partnerId: memberId },
        { populate: [{ path: 'partnerId' }, { path: 'classId' }] }
    );
    if (!partnerships?.length) return { success: false, msg: 'No partnerships found' };

    const allPartnerShipsData = await Promise.all(
        partnerships.map(p => classPartnershipCalculationAndDataPreparationFunction(p))
    );

    return { success: true, msg: 'Partnerships found', partnerships: allPartnerShipsData };
};
