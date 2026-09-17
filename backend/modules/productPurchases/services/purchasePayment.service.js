import { findByIdPurchaseService } from "./purchase.crud.js";
import { 
    findByIdQarzaAccountService, 
    updateQarzaAccountService 
} from "../../qarza/services/qarzaAccount.crud.js";
import { createQarzaPaymentService } from "../../qarza/services/qarzaPayment.crud.js";
import { 
    findByIdPaymentMethodService 
} from "../../settings/services/paymentMethod.crud.js";
import { 
    createPurchaseTransaction,
} from "../../transactions/services/transaction.service.js";
import { recalculatePurchasePaidAmount } from "./purchase.service.js";

export const createPurchasePayment = async (paymentData) => {
    const purchase = await findByIdPurchaseService(paymentData.purchase);
    if (!purchase) {
        throw new Error("Purchase not found");
    }

    if (purchase.status !== 'delivered') {
        throw new Error("Cannot make payment for purchase that is not delivered");
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
    const transactions = await createPurchaseTransaction({
        purchase: paymentData.purchase,
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

    // Recalculate and update purchase paidAmount from all transactions
    await recalculatePurchasePaidAmount(purchase._id);

    // Handle credit account payments (qarza account balance updates only)
    if (paymentData.paymentMethod === 'credit' || paymentData.paymentMethod === 'hybrid') {
        if (paymentData.creditAccount) {
            const creditAccount = await findByIdQarzaAccountService(paymentData.creditAccount);
            if (!creditAccount) {
                throw new Error("Credit account not found");
            }

            const creditPaymentAmount = paymentData.creditAmount || paymentData.amount;
            
            // Create qarza payment for credit portion
            const qarzaPayment = await createQarzaPaymentService({
                qarzaAccountId: paymentData.creditAccount,
                amount: creditPaymentAmount,
                type: 'cashin', // We're receiving credit, so it's cashin
                date: paymentData.paymentDate,
                notes: `Purchase payment: ${purchase.invoiceNumber}`,
                source: 'purchaseProducts',
            });

            // Update credit account balance (increase balance since we owe them)
            await updateQarzaAccountService(creditAccount._id, {
                balance: creditAccount.balance + creditPaymentAmount
            });
        }
    }

    return transactions;
};

