import { 
    findByIdOrderService, 
    updateOrderService 
} from "./order.crud.js";
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
    createSaleTransaction,
    getTransactions,
    deleteTransaction
} from "../../transactions/services/transaction.service.js";

export const createOrderPayment = async (paymentData) => {
    const order = await findByIdOrderService(paymentData.order);
    if (!order) {
        throw new Error("Order not found");
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
    const transactions = await createSaleTransaction({
        order: paymentData.order,
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
                type: 'debit', // They owe us, so it's debit
                date: paymentData.paymentDate,
                notes: `POS Order payment: ${order.orderNumber}`,
                source: 'pos',
                orderId: order._id,
                orderNumber: order.orderNumber
            });

            // Update credit account balance (increase balance since they owe us)
            await updateQarzaAccountService(creditAccount._id, {
                balance: creditAccount.balance + creditPaymentAmount
            });
        }
    }

    return transactions;
};

export const getOrderPayments = async (orderId) => {
    return await getTransactions({ sourceType: 'sale', sourceId: orderId });
};

export const calculateOrderPaymentStatus = async (orderId, totalAmount) => {
    const transactions = await getTransactions({ sourceType: 'sale', sourceId: orderId });
    
    let totalPaid = 0;
    let totalCash = 0;
    let totalCredit = 0;
    let transactionCount = 0;

    transactions.forEach(transaction => {
        totalPaid += transaction.amount || 0;
        if (transaction.method === 'cash') {
            totalCash += transaction.amount || 0;
        } else if (transaction.method === 'credit') {
            totalCredit += transaction.amount || 0;
        }
        transactionCount++;
    });

    // If no transactions exist (old orders), assume order is fully paid
    if (transactionCount === 0) {
        totalPaid = totalAmount;
    }

    const remainingAmount = Math.max(0, totalAmount - totalPaid);
    const paymentStatus = remainingAmount === 0 ? 'full' : totalPaid > 0 ? 'partial' : 'pending';

    return {
        totalPaid,
        totalCash,
        totalCredit,
        remainingAmount,
        paymentStatus,
        transactionCount
    };
};

export const recalculateOrderPaidAmount = async (orderId) => {
    const order = await findByIdOrderService(orderId);
    if (!order) {
        throw new Error("Order not found");
    }

    const paymentStatus = await calculateOrderPaymentStatus(orderId, order.totalAmount);
    
    // Update order with calculated payment amounts
    await updateOrderService(orderId, {
        paid: paymentStatus.totalPaid,
        remainingAmount: paymentStatus.remainingAmount
    });
    
    return paymentStatus;
};

export const deleteOrderPayment = async (paymentId) => {
    // Get the transaction to delete
    const transactions = await getTransactions({ _id: paymentId });
    if (!transactions || transactions.length === 0) {
        throw new Error("Payment not found");
    }

    const transaction = transactions[0];
    const order = await findByIdOrderService(transaction.sourceId);
    if (!order) {
        throw new Error("Order not found");
    }

    // Reverse the credit account balance change if this was a credit payment
    if (transaction.creditAccount && (transaction.method === 'credit' || transaction.method === 'hybrid')) {
        const creditAccount = await findByIdQarzaAccountService(transaction.creditAccount);
        if (creditAccount) {
            const creditAmount = transaction.creditAmount || transaction.amount;
            // Reverse the balance change (decrease since we're reversing a debit)
            await updateQarzaAccountService(creditAccount._id, {
                balance: creditAccount.balance - creditAmount
            });
        }
    }

    // Delete the transaction
    await deleteTransaction(paymentId);

    return { message: "Payment deleted successfully" };
};
