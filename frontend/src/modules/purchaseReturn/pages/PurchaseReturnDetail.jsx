import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Package, DollarSign, FileText, Plus, Edit2, Trash2, Receipt, X } from "lucide-react";
import { getPurchaseReturnLabels } from "../labels/purchaseReturnLabels.js";
import { useSettings } from "../../settings/hooks/useSettings.js";
import { getPurchaseReturnByIdApi } from "../api/purchaseReturnApi.js";
import { useGetPurchaseReturnPaymentsQuery } from "../services/purchaseReturn.service.js";
import { useEffect, useState } from "react";
import PurchaseReturnPaymentModal from "../components/PurchaseReturnPaymentModal.jsx";
import { showSuccess, showError } from "../../../shared/utilities/toastHelpers.js";
import ReceiptTemplate from "../../../shared/components/ReceiptTemplate.jsx";

const STATUS_STYLE = {
    draft: { background: "rgba(107,114,128,0.1)", color: "#6b7280", text: "Draft" },
    pending: { background: "rgba(180,83,9,0.1)", color: "#d97706", text: "Pending" },
    approved: { background: "rgba(15,118,110,0.1)", color: "var(--accent-2)", text: "Approved" },
    rejected: { background: "rgba(220,38,38,0.1)", color: "#dc2626", text: "Rejected" },
};

export default function PurchaseReturnDetail() {
    const navigate = useNavigate();
    const { id } = useParams();
    
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getPurchaseReturnLabels(language);
    
    const [purchaseReturn, setPurchaseReturn] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [editingPayment, setEditingPayment] = useState(null);
    const [showReceipt, setShowReceipt] = useState(false);

    const { data: payments, refetch: refetchPayments, isLoading: paymentsLoading } = useGetPurchaseReturnPaymentsQuery(id);
    const paymentsList = Array.isArray(payments) ? payments : (payments?.data || []);

    const handleDeletePayment = async (paymentId) => {
        if (!window.confirm("Are you sure you want to delete this refund?")) return;
        
        try {
            const response = await fetch(`http://localhost:5001/api/purchase-returns/${id}/payments/${paymentId}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            const data = await response.json();
            if (data.success) {
                showSuccess("Refund deleted successfully");
                refetchPayments();
            } else {
                showError(data.message || "Failed to delete refund");
            }
        } catch (error) {
            showError("Failed to delete refund");
        }
    };

    const handleEditPayment = (payment) => {
        setEditingPayment(payment);
    };

    const handlePaymentSuccess = () => {
        setEditingPayment(null);
        refetchPayments();
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await getPurchaseReturnByIdApi(id);
                setPurchaseReturn(result.data);
            } catch (error) {
                console.error("Error fetching purchase return:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (isLoading) {
        return <div className="p-6 text-center">{labels.loading || "Loading..."}</div>;
    }

    if (!purchaseReturn) {
        return <div className="p-6 text-center">Purchase Return not found</div>;
    }

    const status = purchaseReturn?.status ?? "draft";
    const statusStyle = STATUS_STYLE[status] ?? STATUS_STYLE.draft;
    const date = new Date(purchaseReturn?.returnDate ?? purchaseReturn?.createdAt).toLocaleDateString();

    return (
        <>
            {editingPayment && (
                <PurchaseReturnPaymentModal
                    purchaseReturn={purchaseReturn}
                    payment={editingPayment}
                    onClose={() => setEditingPayment(null)}
                    onSuccess={handlePaymentSuccess}
                />
            )}
            {showReceipt && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[90] p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-800">Purchase Return Receipt</h2>
                            <button onClick={() => setShowReceipt(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            <ReceiptTemplate
                                invoiceNumber={purchaseReturn.returnNumber}
                                date={date}
                                customerName={purchaseReturn.supplier?.name}
                                items={purchaseReturn.items}
                                summary={{
                                    totalAmount: purchaseReturn.totalAmount
                                }}
                                payments={paymentsList}
                                type="purchase-return"
                            />
                        </div>
                    </div>
                </div>
            )}
            <div className="p-6 bg-[var(--app-bg)] min-h-screen">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate("/purchase-returns")}
                    className="p-2 hover:bg-[var(--hover)] rounded-md transition-all"
                >
                    <ArrowLeft size={20} className="text-[var(--ink)]" />
                </button>
                <div className="flex-1 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-[var(--ink)] font-display">
                        {purchaseReturn.returnNumber}
                    </h1>
                    <button
                        onClick={() => setShowReceipt(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        title="Print Receipt"
                    >
                        <Receipt size={16} />
                        Receipt
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="card p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Calendar size={20} className="text-primary" />
                            </div>
                            <div>
                                <p className="text-xs text-[var(--muted)] uppercase font-bold">{labels.date || "Date"}</p>
                                <p className="font-semibold text-[var(--ink)]">{date}</p>
                            </div>
                        </div>
                    </div>

                    <div className="card p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                                <Package size={20} className="text-orange-600" />
                            </div>
                            <div>
                                <p className="text-xs text-[var(--muted)] uppercase font-bold">{labels.totalItems || "Total Items"}</p>
                                <p className="font-semibold text-[var(--ink)]">
                                    {purchaseReturn?.items?.length || 0} items
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="card p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                                <DollarSign size={20} className="text-red-600" />
                            </div>
                            <div>
                                <p className="text-xs text-[var(--muted)] uppercase font-bold">{labels.totalAmount || "Total Amount"}</p>
                                <p className="font-semibold text-red-600">
                                    Rs {(purchaseReturn?.totalAmount ?? 0).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Return Information */}
                <div className="card p-6">
                    <h3 className="text-lg font-semibold text-[var(--ink)] mb-4 flex items-center gap-2">
                        <FileText size={20} />
                        {labels.returnInformation || "Return Information"}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-xs text-[var(--muted)] uppercase font-bold">
                                {labels.returnNumber || "Return #"}
                            </label>
                            <p className="font-semibold text-[var(--ink)] mt-1">
                                {purchaseReturn?.returnNumber || "—"}
                            </p>
                        </div>
                        <div>
                            <label className="text-xs text-[var(--muted)] uppercase font-bold">
                                {labels.supplier || "Supplier"}
                            </label>
                            <p className="font-semibold text-[var(--ink)] mt-1">
                                {purchaseReturn?.supplierName || purchaseReturn?.supplier?.name || "—"}
                            </p>
                        </div>
                        <div>
                            <label className="text-xs text-[var(--muted)] uppercase font-bold">
                                {labels.returnDate || "Return Date"}
                            </label>
                            <p className="font-semibold text-[var(--ink)] mt-1">{date}</p>
                        </div>
                        <div>
                            <label className="text-xs text-[var(--muted)] uppercase font-bold">
                                {labels.reason || "Reason"}
                            </label>
                            <p className="font-semibold text-[var(--ink)] mt-1 capitalize">
                                {purchaseReturn?.reason?.replace(/_/g, " ") || "—"}
                            </p>
                        </div>
                        <div>
                            <label className="text-xs text-[var(--muted)] uppercase font-bold">
                                {labels.status || "Status"}
                            </label>
                            <p className="font-semibold text-[var(--ink)] mt-1">
                                <span 
                                    className="px-3 py-1 rounded-lg text-xs font-semibold"
                                    style={{ background: statusStyle.background, color: statusStyle.color }}
                                >
                                    {statusStyle.text}
                                </span>
                            </p>
                        </div>
                        {purchaseReturn?.notes && (
                            <div className="md:col-span-2">
                                <label className="text-xs text-[var(--muted)] uppercase font-bold">
                                    {labels.notes || "Notes"}
                                </label>
                                <p className="text-[var(--ink)] mt-1">{purchaseReturn.notes}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Items Table */}
                <div className="card p-6">
                    <h3 className="text-lg font-semibold text-[var(--ink)] mb-4 flex items-center gap-2">
                        <Package size={20} />
                        {labels.items || "Items"}
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead style={{ background: "var(--surface-muted)" }}>
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">
                                        {labels.productName || "Product"}
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-[var(--muted)]">
                                        {labels.quantity || "Quantity"}
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">
                                        {labels.costPrice || "Cost Price"}
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">
                                        {labels.subtotal || "Subtotal"}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                                {purchaseReturn?.items?.map((item, index) => (
                                    <tr key={index} className="hover:bg-[var(--surface-muted)] transition-all">
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-[var(--ink)]">
                                                {item.productName || item.product?.name || "—"}
                                            </p>
                                            {item.variant && (
                                                <p className="text-xs text-[var(--muted)]">{item.variant}</p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center font-medium text-[var(--ink)]">
                                            {item.quantity || 0}
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium text-[var(--ink)]">
                                            Rs {(item.costPrice || 0).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold text-red-600">
                                            Rs {((item.quantity || 0) * (item.costPrice || 0)).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot style={{ background: "var(--surface-muted)", borderTop: "2px solid var(--border)" }}>
                                <tr>
                                    <td colSpan="3" className="px-4 py-3 text-right font-bold text-[var(--ink)]">
                                        {labels.totalAmount || "Total Amount"}:
                                    </td>
                                    <td className="px-4 py-3 text-right font-bold text-red-600 text-lg">
                                        Rs {(purchaseReturn?.totalAmount ?? 0).toLocaleString()}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Payment/Refund Details Section */}
                <div className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-[var(--ink)] flex items-center gap-2">
                            <DollarSign size={20} />
                            {labels.refundDetails || "Refund Details"}
                        </h3>
                        <button
                            onClick={() => setEditingPayment({})}
                            className="flex items-center gap-2 px-3 py-1.5 bg-[var(--accent-2)] text-white rounded-lg hover:bg-[var(--accent-2)]/90 text-sm font-medium"
                        >
                            <Plus size={16} />
                            Add Refund
                        </button>
                    </div>
                    {paymentsLoading ? (
                        <div className="text-center text-[var(--muted)] py-4">Loading refunds...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead style={{ background: "var(--surface-muted)" }}>
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">
                                            {labels.date || "Date"}
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">
                                            {labels.method || "Method"}
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">
                                            {labels.amount || "Amount"}
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">
                                            {labels.creditAccount || "Credit Account"}
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-[var(--muted)]">
                                            {labels.actions || "Actions"}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                                    {paymentsList?.length > 0 ? (
                                        paymentsList.map((payment) => (
                                            <tr key={payment._id} className="hover:bg-[var(--surface-muted)] transition-all">
                                                <td className="px-4 py-3">
                                                    <p className="font-medium text-[var(--ink)]">
                                                        {new Date(payment.paymentDate).toLocaleDateString()}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                                                        payment.paymentMethod === 'cash' ? 'bg-green-100 text-green-800' :
                                                        payment.paymentMethod === 'credit' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-purple-100 text-purple-800'
                                                    }`}>
                                                        {payment.paymentMethod}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right font-bold text-[var(--ink)]">
                                                    {payment.amount?.toLocaleString()} Rs
                                                    {payment.cashAmount > 0 && <span className="text-xs text-[var(--muted)] block">Cash: {payment.cashAmount?.toLocaleString()}</span>}
                                                    {payment.creditAmount > 0 && <span className="text-xs text-[var(--muted)] block">Credit: {payment.creditAmount?.toLocaleString()}</span>}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {payment.creditAccount?.name || "—"}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex justify-center gap-2">
                                                        <button
                                                            onClick={() => handleEditPayment(payment)}
                                                            className="p-2 hover:bg-blue-50 text-blue-500 rounded-lg transition-colors"
                                                            title="Edit Refund"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeletePayment(payment._id)}
                                                            className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                                                            title="Delete Refund"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="px-4 py-8 text-center text-[var(--muted)]">
                                                No refunds recorded for this return.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
        </>
    );
}
