import { findByIdQarzaAccountService as getQarzaAccountByIdService, updateQarzaAccountService } from "./qarzaAccount.crud.js";
import { getTransactions } from "../../transactions/services/transaction.service.js";

/**
 * Recalculate supplier credit/debit balance
 * This service recalculates the balance for a supplier account based on:
 * - Manual qarza transactions (sourceType: 'qarza')
 * - Purchase credit transactions (sourceType: 'purchase')
 * Excludes sale transactions
 */
export const recalculateSupplierBalance = async (qarzaAccountId) => {
    try {
        const account = await getQarzaAccountByIdService(qarzaAccountId);

        if (!account) {
            throw new Error("Qarza account not found");
        }

        // Get manual qarza transactions + purchase credit transactions
        // Explicitly exclude sale transactions
        const transactions = await getTransactions({
            $and: [
                { sourceType: { $ne: 'sale' } },
                {
                    $or: [
                        { sourceType: 'qarza', sourceId: qarzaAccountId },
                        { sourceType: 'purchase', creditAccount: qarzaAccountId }
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
            status = 'toReceive';
        } else if (overall < 0) {
            status = 'toGive';
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
        console.error("Error recalculating supplier balance:", error);
        throw error;
    }
};
