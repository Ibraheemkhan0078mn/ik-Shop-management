import { 
    createPurchasePaymentService, 
    findPurchasePaymentService, 
    findByIdPurchasePaymentService, 
    deleteOnePurchasePaymentService 
} from "./purchasePayment.crud.js";
import { 
    findByIdPurchaseService, 
    updatePurchaseService 
} from "./purchase.crud.js";
import { 
    findByIdQarzaAccountService, 
    updateQarzaAccountService 
} from "../../qarza/services/qarzaAccount.crud.js";
import { 
    createQarzaPaymentService 
} from "../../qarza/services/qarzaPayment.crud.js";

export const createPurchasePayment = async (paymentData) => {
    const purchase = await findByIdPurchaseService(paymentData.purchase);
    if (!purchase) {
        throw new Error("Purchase not found");
    }

    if (purchase.status !== 'delivered') {
        throw new Error("Cannot make payment for purchase that is not delivered");
    }

    const totalPaid = purchase.paidAmount + paymentData.amount;
    const remainingAmount = purchase.totalAmount - totalPaid;

    // Update payment status
    let paymentStatus = purchase.paymentStatus;
    if (remainingAmount <= 0) {
        paymentStatus = 'full';
    } else if (totalPaid > 0) {
        paymentStatus = 'partial';
    }

    // Create purchase payment using CRUD service
    const purchasePayment = await createPurchasePaymentService({
        purchase: paymentData.purchase,
        amount: paymentData.amount,
        paymentDate: paymentData.paymentDate,
        paymentMethod: paymentData.paymentMethod,
        creditAccount: paymentData.creditAccount,
        cashAmount: paymentData.cashAmount || 0,
        creditAmount: paymentData.creditAmount || 0,
        notes: paymentData.notes,
        createdBy: paymentData.createdBy,
    });

    // Update purchase
    await updatePurchaseService(purchase._id, {
        paidAmount: totalPaid,
        paymentStatus: paymentStatus
    });

    // Handle credit account payments
    if (paymentData.paymentMethod === 'credit' || paymentData.paymentMethod === 'hybrid') {
        if (paymentData.creditAccount) {
            const creditAccount = await findByIdQarzaAccountService(paymentData.creditAccount);
            if (!creditAccount) {
                throw new Error("Credit account not found");
            }

            const creditPaymentAmount = paymentData.creditAmount || paymentData.amount;
            
            // Create qarza payment for credit portion
            await createQarzaPaymentService({
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

    // If payment is full and there's excess payment (only for cash payments), adjust to credit account
    if (paymentStatus === 'full' && remainingAmount < 0 && paymentData.paymentMethod === 'cash') {
        if (paymentData.creditAccount) {
            const creditAccount = await findByIdQarzaAccountService(paymentData.creditAccount);
            if (!creditAccount) {
                throw new Error("Credit account not found");
            }

            const excessAmount = Math.abs(remainingAmount);
            
            // Create qarza payment for excess
            await createQarzaPaymentService({
                qarzaAccountId: paymentData.creditAccount,
                amount: excessAmount,
                type: 'debit', // They owe us, so it's debit
                date: paymentData.paymentDate,
                notes: `Excess payment from purchase: ${purchase.invoiceNumber}`,
                source: 'purchaseProducts',
            });

            // Update credit account balance (decrease since they owe us)
            await updateQarzaAccountService(creditAccount._id, {
                balance: creditAccount.balance - excessAmount
            });
        }
    }

    return purchasePayment;
};

export const getPurchasePayments = async (purchaseId) => {
    return await findPurchasePaymentService({ purchase: purchaseId })
        .populate('creditAccount', 'name accountType')
        .sort({ paymentDate: -1 });
};

export const getPurchasePaymentById = async (id) => {
    return await findByIdPurchasePaymentService(id)
        .populate('purchase')
        .populate('creditAccount', 'name accountType');
};

export const deletePurchasePayment = async (paymentId) => {
    const payment = await findByIdPurchasePaymentService(paymentId);
    if (!payment) {
        throw new Error("Payment not found");
    }

    const purchase = await findByIdPurchaseService(payment.purchase);
    if (!purchase) {
        throw new Error("Purchase not found");
    }

    // Reverse the credit account balance change if this was a credit payment
    if (payment.creditAccount && (payment.paymentMethod === 'credit' || payment.paymentMethod === 'hybrid')) {
        const creditAccount = await findByIdQarzaAccountService(payment.creditAccount);
        if (creditAccount) {
            const creditAmount = payment.creditAmount || payment.amount;
            // Reverse the balance change (decrease since we're reversing a cashin)
            await updateQarzaAccountService(creditAccount._id, {
                balance: creditAccount.balance - creditAmount
            });
        }
    }

    // Delete the payment using CRUD service
    await deleteOnePurchasePaymentService(paymentId);

    // Recalculate purchase paid amount and payment status
    const allPayments = await findPurchasePaymentService({ purchase: purchase._id });
    const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);
    const remainingAmount = purchase.totalAmount - totalPaid;

    let paymentStatus = 'pending';
    if (remainingAmount <= 0) {
        paymentStatus = 'full';
    } else if (totalPaid > 0) {
        paymentStatus = 'partial';
    }

    await updatePurchaseService(purchase._id, {
        paidAmount: totalPaid,
        paymentStatus: paymentStatus
    });

    return { message: "Payment deleted successfully", recalculatedStatus: paymentStatus };
};
