import { 
    findByIdPurchaseReturnService, 
    updatePurchaseReturnService 
} from "./purchaseReturn.crud.js";
import { 
    findByIdQarzaAccountService, 
    updateQarzaAccountService 
} from "../../qarza/services/qarzaAccount.crud.js";
import { 
    createQarzaPaymentService 
} from "../../qarza/services/qarzaPayment.crud.js";
import { 
    findByIdPaymentMethodService 
} from "../../settings/services/paymentMethod.crud.js";
import { 
    createPurchaseReturnTransaction,
    getTransactions,
    deleteTransaction
} from "../../transactions/services/transaction.service.js";
import { recalculatePurchaseReturnRefundAmount } from "./purchaseReturn.service.js";

export const createPurchaseReturnPayment = async (paymentData) => {
    const purchaseReturn = await findByIdPurchaseReturnService(paymentData.purchaseReturn);
    if (!purchaseReturn) {
        throw new Error("Purchase return not found");
    }

    if (purchaseReturn.status !== 'approved') {
        throw new Error("Cannot make refund for purchase return that is not approved");
    }

    // Get payment method name if paymentMethodId is provided
    let paymentMethodName = paymentData.paymentMethodName || "";
    if (paymentData.paymentMethodId) {
        const paymentMethod = await findByIdPaymentMethodService(paymentData.paymentMethodId);
        if (paymentMethod) {
            paymentMethodName = paymentMethod.name;
        }
    }
    
    // Create transactions using the new transaction system
    const transactions = await createPurchaseReturnTransaction({
        purchaseReturn: paymentData.purchaseReturn,
        paymentMethod: paymentData.paymentMethod,
        amount: paymentData.amount,
        cashAmount: paymentData.cashAmount || 0,
        creditAmount: paymentData.creditAmount || 0,
        creditAccount: paymentData.creditAccount,
        paymentMethodId: paymentData.paymentMethodId,
        paymentMethodName: paymentMethodName,
        paymentDate: paymentData.paymentDate,
        notes: paymentData.notes,
        createdBy: paymentData.createdBy,
    });

    // Recalculate and update purchase return refundedAmount from all transactions
    await recalculatePurchaseReturnRefundAmount(purchaseReturn._id);

    // Handle credit account refunds (qarza account balance updates only)
    if (paymentData.paymentMethod === 'credit' || paymentData.paymentMethod === 'hybrid') {
        if (paymentData.creditAccount) {
            const creditAccount = await findByIdQarzaAccountService(paymentData.creditAccount);
            if (!creditAccount) {
                throw new Error("Credit account not found");
            }

            const creditRefundAmount = paymentData.creditAmount || paymentData.amount;
            
            // Create qarza payment for credit portion
            const qarzaPayment = await createQarzaPaymentService({
                qarzaAccountId: paymentData.creditAccount,
                amount: creditRefundAmount,
                type: 'cashout', // We're reducing credit owed to us, so it's cashout
                date: paymentData.paymentDate,
                notes: `Purchase return refund: ${purchaseReturn.purchaseReturnNumber}`,
                source: 'purchaseReturn',
            });

            // Update credit account balance (decrease balance since we owe them less)
            await updateQarzaAccountService(creditAccount._id, {
                balance: creditAccount.balance - creditRefundAmount
            });
        }
    }

    return transactions;
};

export const getPurchaseReturnPayments = async (purchaseReturnId) => {
    return await getTransactions({ sourceType: 'purchaseReturn', sourceId: purchaseReturnId });
};

export const deletePurchaseReturnPayment = async (paymentId) => {
    // Get the transaction to delete
    const transactions = await getTransactions({ _id: paymentId });
    if (!transactions || transactions.length === 0) {
        throw new Error("Payment not found");
    }

    const transaction = transactions[0];
    const purchaseReturnId = transaction.sourceId;

    // Check if purchase return exists before proceeding
    const purchaseReturn = await findByIdPurchaseReturnService(purchaseReturnId);
    if (!purchaseReturn) {
        // If purchase return doesn't exist, just delete the transaction without recalculation
        await deleteTransaction(paymentId);
        return { message: "Refund deleted successfully (purchase return no longer exists)" };
    }

    // Reverse the credit account balance change if this was a credit refund
    if (transaction.creditAccount && (transaction.method === 'credit' || transaction.method === 'hybrid')) {
        const creditAccount = await findByIdQarzaAccountService(transaction.creditAccount);
        if (creditAccount) {
            const creditAmount = transaction.creditAmount || transaction.amount;
            // Reverse the balance change (increase since we're reversing a cashout)
            await updateQarzaAccountService(creditAccount._id, {
                balance: creditAccount.balance + creditAmount
            });
        }
    }

    // Delete the transaction
    await deleteTransaction(paymentId);

    // Recalculate and update purchase return refundedAmount from all transactions
    try {
        const paymentStatus = await recalculatePurchaseReturnRefundAmount(purchaseReturnId);
        return { message: "Refund deleted successfully", recalculatedStatus: paymentStatus.paymentStatus };
    } catch (error) {
        // If recalculation fails (e.g., purchase return was deleted during the process), return success anyway
        return { message: "Refund deleted successfully (recalculation skipped)" };
    }
};
