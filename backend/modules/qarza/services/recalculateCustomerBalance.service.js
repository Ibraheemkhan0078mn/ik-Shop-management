import { findByIdQarzaAccountService as getQarzaAccountByIdService, updateQarzaAccountService } from "./qarzaAccount.crud.js";
import { getTransactions } from "../../transactions/services/transaction.service.js";

/**
 * Recalculate customer credit/debit balance
 * This service recalculates the balance for a customer account based on:
 * - Manual qarza transactions (sourceType: 'qarza')
 * - POS sale credit transactions (sourceType: 'sale')
 * Excludes purchase transactions
 */
export const recalculateCustomerBalance = async (qarzaAccountId) => {
    try {
        const account = await getQarzaAccountByIdService(qarzaAccountId);

        if (!account) {
            throw new Error("Qarza account not found");
        }

        // Get manual qarza transactions + POS sale credit transactions
        // Explicitly exclude purchase transactions
        const transactions = await getTransactions({
            $and: [
                { sourceType: { $ne: 'purchase' } },
                {
                    $or: [
                        { sourceType: 'qarza', sourceId: qarzaAccountId },
                        { sourceType: 'sale', creditAccount: qarzaAccountId }
                    ]
                }
            ]
        });

        const cashIn = transactions
            .filter(t => t.creditType === 'cashin')
            .reduce((sum, t) => sum + (t.amount || 0), 0);

        const cashOut = transactions
            .filter(t => t.creditType === 'cashout')
            .reduce((sum, t) => sum + (t.amount || 0), 0);

        const overall = cashIn - cashOut;

        // Determine status
        let status = 'balanced';
        if (overall > 0) {
            status = 'toGive';
        } else if (overall < 0) {
            status = 'toReceive';
        }

        // Update account with calculated values
        await updateQarzaAccountService(qarzaAccountId, {
            cashIn,
            cashOut,
            overall,
            status
        });

        return {
            success: true,
            data: {
                account: {
                    _id: account._id,
                    name: account.name,
                    type: account.type,
                    phoneNo: account.phoneNo,
                    address: account.address
                },
                cashIn,
                cashOut,
                overall,
                status,
                totalTransactions: transactions.length
            }
        };
    } catch (error) {
        console.error("Error recalculating customer balance:", error);
        throw error;
    }
};
