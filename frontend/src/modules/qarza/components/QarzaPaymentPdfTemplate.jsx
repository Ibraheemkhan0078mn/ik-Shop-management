import React from "react";
import { DollarSign, User, ArrowDownLeft, ArrowUpRight } from "lucide-react";

export default function QarzaPaymentPdfTemplate({ payment = {}, account = {}, summary = {}, labels = {} }) {
    const date = new Date(payment.date).toLocaleDateString();
    
    const STATUS_CONFIG = {
        cashin: { 
            label: "Cash In", 
            Icon: ArrowDownLeft, 
            color: "#10b981", 
            bg: "rgba(16,185,129,0.1)" 
        },
        cashout: { 
            label: "Cash Out", 
            Icon: ArrowUpRight, 
            color: "#ef4444", 
            bg: "rgba(239,68,68,0.1)" 
        },
    };

    const config = STATUS_CONFIG[payment.type] || STATUS_CONFIG.cashin;
    const { Icon } = config;

    return (
        <div className="p-6 bg-white min-h-screen">
            {/* Header */}
            <div className="mb-6 pb-4 border-b-2 border-gray-200">
                <h1 className="text-2xl font-bold text-gray-900">{labels.paymentReceipt || "Payment Receipt"}</h1>
                <p className="text-sm text-gray-500">{labels.qarzaAccount || "Qarza Account"}</p>
            </div>

            {/* Account Information */}
            <div className="mb-6 p-4 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <User size={18} />
                    {labels.accountDetails || "Account Details"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold">{labels.accountName || "Account Name"}</label>
                        <p className="font-semibold text-gray-900 mt-1">{account.name || "—"}</p>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold">{labels.phone || "Phone"}</label>
                        <p className="font-semibold text-gray-900 mt-1">{account.phoneNo || "—"}</p>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold">{labels.accountType || "Account Type"}</label>
                        <p className="font-semibold text-gray-900 mt-1 capitalize">{account.type || "—"}</p>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold">{labels.currentBalance || "Current Balance"}</label>
                        <p className="font-semibold text-gray-900 mt-1">Rs {(summary.overall || 0).toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Payment Details */}
            <div className="mb-6 p-4 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <DollarSign size={18} />
                    {labels.paymentDetails || "Payment Details"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold">{labels.paymentType || "Payment Type"}</label>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: config.bg }}>
                                <Icon className="w-4 h-4" style={{ color: config.color }} />
                            </div>
                            <span className="font-semibold text-gray-900 capitalize">{payment.type}</span>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold">{labels.amount || "Amount"}</label>
                        <p className="font-bold text-2xl mt-1" style={{ color: config.color }}>
                            Rs {(payment.amount || 0).toLocaleString()}
                        </p>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold">{labels.date || "Date"}</label>
                        <p className="font-semibold text-gray-900 mt-1">{date}</p>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold">{labels.paymentId || "Payment ID"}</label>
                        <p className="font-semibold text-gray-900 mt-1 text-xs">{payment._id || "—"}</p>
                    </div>
                    {payment.notes && (
                        <div className="md:col-span-2">
                            <label className="text-xs text-gray-500 uppercase font-bold">{labels.notes || "Notes"}</label>
                            <p className="text-gray-900 mt-1">{payment.notes}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Summary */}
            <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{labels.accountSummary || "Account Summary"}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-2">
                        <p className="text-xs text-gray-500 uppercase font-bold">{labels.manualCashIn || "Manual Cash In"}</p>
                        <p className="font-semibold text-green-600 mt-1">Rs {(summary.manualCashIn || 0).toLocaleString()}</p>
                    </div>
                    <div className="text-center p-2">
                        <p className="text-xs text-gray-500 uppercase font-bold">{labels.manualCashOut || "Manual Cash Out"}</p>
                        <p className="font-semibold text-red-600 mt-1">Rs {(summary.manualCashOut || 0).toLocaleString()}</p>
                    </div>
                    <div className="text-center p-2">
                        <p className="text-xs text-gray-500 uppercase font-bold">{labels.posAmount || "POS"}</p>
                        <p className="font-semibold text-orange-600 mt-1">Rs {(summary.posAmount || 0).toLocaleString()}</p>
                    </div>
                    <div className="text-center p-2">
                        <p className="text-xs text-gray-500 uppercase font-bold">{labels.purchaseAmount || "Purchase"}</p>
                        <p className="font-semibold text-purple-600 mt-1">Rs {(summary.purchaseAmount || 0).toLocaleString()}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
