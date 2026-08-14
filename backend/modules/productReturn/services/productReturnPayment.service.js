import { 
    findByIdProductReturnService, 
    updateProductReturnService 
} from "./productReturn.crud.js";
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
    createOrderReturnTransaction,
    getTransactions,
    deleteTransaction
} from "../../transactions/services/transaction.service.js";
import { recalculateProductReturnRefundAmount } from "./productReturn.service.js";

export const createProductReturnPayment = async (paymentData) => {
    const productReturn = await findByIdProductReturnService(paymentData.productReturn);
    if (!productReturn) {
        throw new Error("Product return not found");
    }

    if (productReturn.returnStatus !== 'approved') {
        throw new Error("Cannot make refund for product return that is not approved");
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
    const transactions = await createOrderReturnTransaction({
        productReturn: paymentData.productReturn,
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

    // Recalculate and update product return refundedAmount from all transactions
    await recalculateProductReturnRefundAmount(productReturn._id);

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
                type: 'cashin', // We're receiving credit back from customer, so it's cashin
                date: paymentData.paymentDate,
                notes: `Product return refund: ${productReturn.returnNumber}`,
                source: 'productReturn',
            });

            // Update credit account balance (increase balance since we're receiving credit back)
            await updateQarzaAccountService(creditAccount._id, {
                balance: creditAccount.balance + creditRefundAmount
            });
        }
    }

    return transactions;
};

export const getProductReturnPayments = async (productReturnId) => {
    return await getTransactions({ sourceType: 'orderReturn', sourceId: productReturnId });
};

export const deleteProductReturnPayment = async (paymentId) => {
    // Get the transaction to delete
    const transactions = await getTransactions({ _id: paymentId });
    if (!transactions || transactions.length === 0) {
        throw new Error("Payment not found");
    }

    const transaction = transactions[0];
    const productReturnId = transaction.sourceId;

    // Check if product return exists before proceeding
    const productReturn = await findByIdProductReturnService(productReturnId);
    if (!productReturn) {
        // If product return doesn't exist, just delete the transaction without recalculation
        await deleteTransaction(paymentId);
        return { message: "Refund deleted successfully (product return no longer exists)" };
    }

    // Reverse the credit account balance change if this was a credit refund
    if (transaction.creditAccount && (transaction.method === 'credit' || transaction.method === 'hybrid')) {
        const creditAccount = await findByIdQarzaAccountService(transaction.creditAccount);
        if (creditAccount) {
            const creditAmount = transaction.creditAmount || transaction.amount;
            // Reverse the balance change (decrease since we're reversing a cashin)
            await updateQarzaAccountService(creditAccount._id, {
                balance: creditAccount.balance - creditAmount
            });
        }
    }

    // Delete the transaction
    await deleteTransaction(paymentId);

    // Recalculate and update product return refundedAmount from all transactions
    try {
        const paymentStatus = await recalculateProductReturnRefundAmount(productReturnId);
        return { message: "Refund deleted successfully", recalculatedStatus: paymentStatus.refundStatus };
    } catch (error) {
        // If recalculation fails (e.g., product return was deleted during the process), return success anyway
        return { message: "Refund deleted successfully (recalculation skipped)" };
    }
};
