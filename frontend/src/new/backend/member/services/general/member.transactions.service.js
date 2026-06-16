import { throwAppError } from '../../../../shared/services/OrganizedServices/error/error.service.js';
import { findOneMember } from '../crud/member.crud.service.js';
import { findSalaryPayments } from '../crud/memberSalaryPayment.crud.service.js';

export const getAllMemberTransactions = async (memberId, memberData = {}) => {
    try {
        if (!memberData?._id) memberData = await findOneMember({ _id: memberId });

        const transactions = await findSalaryPayments({ member: memberId }, { sort: { date: 1 } });
        const total = transactions.reduce((sum, t) => sum + (t.salaryAmount || 0), 0);

        return { transactions, total };
    } catch (error) {
        throwAppError('Error Getting All Member Transactions', 400, error);
    }
};
