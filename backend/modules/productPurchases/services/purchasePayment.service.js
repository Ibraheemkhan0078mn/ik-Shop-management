import { getLocalPurchasePaymentModel, getLocalPurchaseModel, getLocalQarzaAccountModel, getLocalQarzaPaymentModel } from "../../../configs/connect.db.js";

export const createPurchasePayment = async (paymentData) => {
    const PurchasePaymentModel = getLocalPurchasePaymentModel();
    const PurchaseModel = getLocalPurchaseModel();
    const QarzaAccountModel = getLocalQarzaAccountModel();
    const QarzaPaymentModel = getLocalQarzaPaymentModel();

    const purchase = await PurchaseModel.findById(paymentData.purchase);
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

    // Create purchase payment
    const purchasePayment = await PurchasePaymentModel.create({
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
    purchase.paidAmount = totalPaid;
    purchase.paymentStatus = paymentStatus;
    await purchase.save();

    // Handle credit account payments
    if (paymentData.paymentMethod === 'credit' || paymentData.paymentMethod === 'hybrid') {
        if (paymentData.creditAccount) {
            const creditAccount = await QarzaAccountModel.findById(paymentData.creditAccount);
            if (!creditAccount) {
                throw new Error("Credit account not found");
            }

            const creditPaymentAmount = paymentData.creditAmount || paymentData.amount;
            
            // Create qarza payment for credit portion
            await QarzaPaymentModel.create({
                qarzaAccountId: paymentData.creditAccount,
                amount: creditPaymentAmount,
                type: 'cashin', // We're receiving credit, so it's cashin
                date: paymentData.paymentDate,
                notes: `Purchase payment: ${purchase.invoiceNumber}`,
                source: 'purchaseProducts',
            });

            // Update credit account balance (increase balance since we owe them)
            creditAccount.balance += creditPaymentAmount;
            await creditAccount.save();
        }
    }

    // If payment is full and there's excess payment (only for cash payments), adjust to credit account
    if (paymentStatus === 'full' && remainingAmount < 0 && paymentData.paymentMethod === 'cash') {
        if (paymentData.creditAccount) {
            const creditAccount = await QarzaAccountModel.findById(paymentData.creditAccount);
            if (!creditAccount) {
                throw new Error("Credit account not found");
            }

            const excessAmount = Math.abs(remainingAmount);
            
            // Create qarza payment for excess
            await QarzaPaymentModel.create({
                qarzaAccountId: paymentData.creditAccount,
                amount: excessAmount,
                type: 'debit', // They owe us, so it's debit
                date: paymentData.paymentDate,
                notes: `Excess payment from purchase: ${purchase.invoiceNumber}`,
                source: 'purchaseProducts',
            });

            // Update credit account balance (decrease since they owe us)
            creditAccount.balance -= excessAmount;
            await creditAccount.save();
        }
    }

    return purchasePayment;
};

export const getPurchasePayments = async (purchaseId) => {
    const PurchasePaymentModel = getLocalPurchasePaymentModel();
    return await PurchasePaymentModel.find({ purchase: purchaseId })
        .populate('creditAccount', 'name accountType')
        .sort({ paymentDate: -1 });
};

export const getPurchasePaymentById = async (id) => {
    const PurchasePaymentModel = getLocalPurchasePaymentModel();
    return await PurchasePaymentModel.findById(id)
        .populate('purchase')
        .populate('creditAccount', 'name accountType');
};

export const deletePurchasePayment = async (paymentId) => {
    const PurchasePaymentModel = getLocalPurchasePaymentModel();
    const PurchaseModel = getLocalPurchaseModel();
    const QarzaAccountModel = getLocalQarzaAccountModel();
    const QarzaPaymentModel = getLocalQarzaPaymentModel();

    const payment = await PurchasePaymentModel.findById(paymentId);
    if (!payment) {
        throw new Error("Payment not found");
    }

    const purchase = await PurchaseModel.findById(payment.purchase);
    if (!purchase) {
        throw new Error("Purchase not found");
    }

    // Reverse the credit account balance change if this was a credit payment
    if (payment.creditAccount && (payment.paymentMethod === 'credit' || payment.paymentMethod === 'hybrid')) {
        const creditAccount = await QarzaAccountModel.findById(payment.creditAccount);
        if (creditAccount) {
            const creditAmount = payment.creditAmount || payment.amount;
            // Reverse the balance change (decrease since we're reversing a cashin)
            creditAccount.balance -= creditAmount;
            await creditAccount.save();
        }
    }

    // Delete the payment
    await PurchasePaymentModel.findByIdAndDelete(paymentId);

    // Recalculate purchase paid amount and payment status
    const allPayments = await PurchasePaymentModel.find({ purchase: purchase._id });
    const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);
    const remainingAmount = purchase.totalAmount - totalPaid;

    let paymentStatus = 'pending';
    if (remainingAmount <= 0) {
        paymentStatus = 'full';
    } else if (totalPaid > 0) {
        paymentStatus = 'partial';
    }

    purchase.paidAmount = totalPaid;
    purchase.paymentStatus = paymentStatus;
    await purchase.save();

    return { message: "Payment deleted successfully", recalculatedStatus: paymentStatus };
};
