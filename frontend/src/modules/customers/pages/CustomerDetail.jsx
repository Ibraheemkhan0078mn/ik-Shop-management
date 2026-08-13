import React, { useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Edit, Package, Plus, Eye, Trash2, RotateCcw, Copy, RefreshCw } from "lucide-react";
import { useCustomer, useCustomerOrderKPIs } from "../services/customers.service.js";
import { useOrdersByCustomer, useDeleteOrder } from "../../orders/services/orders.service.js";
import { useCreateQarzaAccount } from "../../qarza/services/qarza.service.js";
import { useUpdateCustomer } from "../services/customers.service.js";
import { useRecalculateCustomerBalance } from "../../qarza/services/qarza.service.js";
import { getCustomerLabels } from "../labels/customerLabels.js";
import { useSettings } from "../../settings/hooks/useSettings.js";
import { useCustomerPaymentsSummary, useCustomerPayments, useDeleteQarzaPayment } from "../../qarza/services/qarza.service.js";
import QarzaPaymentModal from "../../qarza/components/QarzaPaymentModal.jsx";
import OrderReturnModal from "../../orderReturn/components/OrderReturnModal.jsx";
import { showSuccess, showError } from "../../../shared/utilities/toastHelpers.js";
import PaginatedList from "../../../shared/components/PaginatedList.jsx";

const IMAGE_BASE_URL = "http://localhost:5001";

export default function CustomerDetail() {
    const navigate = useNavigate();
    const { id } = useParams();
    
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getCustomerLabels(language);
    
    const [activeTab, setActiveTab] = useState("details");
    const [modal, setModal] = useState(null);
    const [returnModalOrderId, setReturnModalOrderId] = useState(null);
    const [startDate, setStartDate] = useState(() => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        return firstDay.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
    
    const { data: customerData, isLoading, refetch: refetchCustomer } = useCustomer(id);
    const { data: ordersData } = useOrdersByCustomer({ 
        customerId: id, 
        startDate, 
        endDate 
    });
    const { data: orderKPIs } = useCustomerOrderKPIs({ 
        customerId: id, 
        startDate, 
        endDate 
    });

    const customer = customerData;
    const orders = ordersData?.data || [];
    
    const qarzaAccountId = customer?.qarzaAccountId;
    const { data: summary } = useCustomerPaymentsSummary(qarzaAccountId);
    const accountExists = summary?.accountExists !== false;
    const [deletePayment] = useDeleteQarzaPayment();
    const [deleteOrder] = useDeleteOrder();
    const [createQarzaAccount] = useCreateQarzaAccount();
    const [recalculateCustomerBalance] = useRecalculateCustomerBalance();
    const [isRecalculating, setIsRecalculating] = useState(false);
    const [updateCustomer] = useUpdateCustomer();
    const [isCreatingAccount, setIsCreatingAccount] = useState(false);

    const refresh = useCallback(() => {}, []);

    const handleDelete = async (paymentId) => {
        if (!window.confirm("Delete this payment?")) return;
        try {
            await deletePayment({ paymentId, qarzaAccountId }).unwrap();
            showSuccess("Payment deleted");
        } catch (error) {
            showError(error?.data?.message || "Failed to delete payment");
        }
    };

    const handleRecalculateBalance = async () => {
        if (!qarzaAccountId) return;
        setIsRecalculating(true);
        try {
            await recalculateCustomerBalance(qarzaAccountId).unwrap();
            showSuccess("Balance recalculated successfully");
            refetchCustomer();
        } catch (error) {
            showError(error?.data?.message || "Failed to recalculate balance");
        } finally {
            setIsRecalculating(false);
        }
    };

    const handleDeleteOrder = async (orderId) => {
        if (window.confirm("Delete this order?")) {
            try {
                await deleteOrder(orderId).unwrap();
                showSuccess("Order deleted");
            } catch (error) {
                showError(error?.data?.message || "Failed to delete order");
            }
        }
    };

    const handleCreateQarzaAccount = async () => {
        if (!customer) return;
        setIsCreatingAccount(true);
        try {
            const formData = new FormData();
            formData.append("name", customer.name || "");
            formData.append("type", "customer");
            formData.append("phoneNo", customer.phoneNo || "");
            formData.append("address", customer.address || "");
            formData.append("notes", `Auto-created for customer: ${customer.name}`);
            formData.append("isActive", "true");

            const result = await createQarzaAccount(formData).unwrap();
            
            if (result.success && result.accounts) {
                const newAccount = result.accounts.find(acc => acc.name === customer.name && acc.type === 'customer');
                if (newAccount) {
                    await updateCustomer({ 
                        id: customer._id, 
                        qarzaAccountId: newAccount._id 
                    }).unwrap();
                    showSuccess("Qarza account created and linked successfully");
                    await refetchCustomer();
                }
            }
        } catch (error) {
            showError(error?.data?.message || "Failed to create qarza account");
        } finally {
            setIsCreatingAccount(false);
        }
    };

    if (isLoading) {
        return <div className="p-6 text-center">{labels.loading}</div>;
    }

    if (!customer) {
        return <div className="p-6 text-center">Customer not found</div>;
    }

    return (
        <div className="p-6 bg-[var(--app-bg)] min-h-screen">
            {modal && (
                <QarzaPaymentModal
                    mode={modal.mode}
                    qarzaAccountId={qarzaAccountId}
                    payment={modal.payment}
                    onClose={() => setModal(null)}
                    onSuccess={refresh}
                />
            )}
            {returnModalOrderId && (
                <OrderReturnModal
                    isOpen={!!returnModalOrderId}
                    orderId={returnModalOrderId}
                    onClose={() => setReturnModalOrderId(null)}
                    onSuccess={() => {
                        setReturnModalOrderId(null);
                        refresh();
                    }}
                />
            )}

            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate("/customers")}
                    className="p-2 hover:bg-[var(--hover)] rounded-md"
                >
                    <ArrowLeft size={20} className="text-[var(--ink)]" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-[var(--ink)] font-display">{customer.name}</h1>
                    <p className="text-sm text-[var(--muted)]">{customer.phoneNo || "No phone"}</p>
                </div>
                <button
                    onClick={() => navigate(`/customers/edit/${id}`)}
                    className="btn-add"
                >
                    <Edit size={16} /> {labels.edit}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-[var(--border)]">
                {["details", "orders", "credits"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 capitalize ${
                            activeTab === tab
                                ? "border-b-2 border-[var(--accent-2)] text-[var(--accent-2)]"
                                : "text-[var(--muted)] hover:text-[var(--ink)]"
                        }`}
                    >
                        {tab === "details" ? "Customer Details" : 
                         tab === "orders" ? "Orders" : 
                         "Credits & Debits"}
                    </button>
                ))}
            </div>

            {/* Details Tab */}
            {activeTab === "details" && (
                <div className="card p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 flex items-start gap-4">
                            {customer.image ? (
                                <img 
                                    src={`${IMAGE_BASE_URL}/uploads/${customer.image}`} 
                                    alt={customer.name} 
                                    className="w-24 h-24 rounded-xl object-cover ring-1 ring-[var(--border)]" 
                                />
                            ) : (
                                <div className="w-24 h-24 rounded-xl bg-[var(--surface-muted)] flex items-center justify-center text-3xl font-bold text-[var(--muted)]">
                                    {customer.name?.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-[var(--ink)]">{customer.name}</h3>
                                <p className="text-sm text-[var(--muted)] mt-1">{customer.address || "No address"}</p>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm text-[var(--muted)]">Phone</label>
                            <p className="font-medium text-[var(--ink)]">{customer.phoneNo || "—"}</p>
                        </div>
                        <div>
                            <label className="text-sm text-[var(--muted)]">CNIC</label>
                            <p className="font-medium text-[var(--ink)]">{customer.cnic || "—"}</p>
                        </div>
                        <div>
                            <label className="text-sm text-[var(--muted)]">Address</label>
                            <p className="font-medium text-[var(--ink)]">{customer.address || "—"}</p>
                        </div>
                        <div>
                            <label className="text-sm text-[var(--muted)]">Status</label>
                            <span className={`px-2 py-1 text-xs rounded-full ${customer.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {customer.isActive ? "Active" : "Inactive"}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Credits & Debits Tab */}
            {activeTab === "credits" && qarzaAccountId && accountExists && (
                <div className="space-y-6">
                    {/* Summary Cards */}
                    {summary && (
                        <div className="grid grid-cols-3 gap-4">
                            <div className="card p-4" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid var(--border)" }}>
                                <p className="text-xs font-semibold uppercase tracking-wider mb-1 text-[var(--muted)]">Cash In</p>
                                <p className="text-xl font-black tabular-nums text-[#10b981]">Rs {(summary.cashIn || 0).toLocaleString()}</p>
                            </div>
                            <div className="card p-4" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid var(--border)" }}>
                                <p className="text-xs font-semibold uppercase tracking-wider mb-1 text-[var(--muted)]">Cash Out</p>
                                <p className="text-xl font-black tabular-nums text-[#ef4444]">Rs {(summary.cashOut || 0).toLocaleString()}</p>
                            </div>
                            <div className="card p-4" style={{ background: (summary.overall || 0) >= 0 ? "rgba(15,118,110,0.08)" : "rgba(239,68,68,0.08)", border: "1px solid var(--border)" }}>
                                <p className="text-xs font-semibold uppercase tracking-wider mb-1 text-[var(--muted)]">Overall</p>
                                <p className="text-xl font-black tabular-nums" style={{ color: (summary.overall || 0) >= 0 ? "var(--accent-2)" : "#ef4444" }}>
                                    Rs {Math.abs(summary.overall || 0).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Payment List */}
                    <div className="card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-[var(--ink)]">Payment History</h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleRecalculateBalance}
                                    disabled={isRecalculating}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-muted)] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <RefreshCw size={16} className={isRecalculating ? "animate-spin" : ""} />
                                    {isRecalculating ? "Recalculating..." : "Recalculate Balance"}
                                </button>
                                <button
                                    onClick={() => setModal({ mode: "create" })}
                                    className="btn-add"
                                >
                                    <Plus size={16} /> Add Payment
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <PaginatedList
                                rtkQuery={useCustomerPayments}
                                limit={20}
                                dataKey="data"
                                wrapperClassName="h-full"
                                renderItems={(items) => {
                                    if (!items?.length) return null;
                                    return (
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead style={{ background: "var(--surface-muted)" }}>
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">Type</th>
                                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">Amount</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">Notes</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">Date</th>
                                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-[var(--muted)]">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                                                    {items.map((item) => {
                                                        const paymentType = item.creditType || item.type || 'cashin';
                                                        const color = paymentType === 'cashin' ? '#10b981' : '#ef4444';
                                                        return (
                                                            <tr key={item._id} className="hover:bg-[var(--surface-muted)]">
                                                                <td className="px-4 py-3">
                                                                    <span className="text-xs font-semibold uppercase" style={{ color }}>
                                                                        {paymentType}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 text-right font-semibold" style={{ color }}>
                                                                    Rs {(item.amount || 0).toLocaleString()}
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-[var(--muted)]">
                                                                    {item.notes || "-"}
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-[var(--muted)]">
                                                                    {new Date(item.transactionDate || item.date).toLocaleDateString()}
                                                                </td>
                                                                <td className="px-4 py-3 text-center">
                                                                    {item.sourceType !== 'sale' && (
                                                                        <>
                                                                            <button
                                                                                onClick={() => setModal({ mode: "update", payment: item })}
                                                                                className="p-2 rounded-lg bg-[var(--surface-muted)] border border-[var(--border)] hover:border-[var(--accent-2)] hover:text-[var(--accent-2)]"
                                                                            >
                                                                                <Edit size={14} />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleDelete(item._id)}
                                                                                className="p-2 rounded-lg bg-[var(--surface-muted)] border border-[var(--border)] hover:border-red-400 hover:text-red-500 ml-2"
                                                                            >
                                                                                <Package size={14} />
                                                                            </button>
                                                                        </>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    );
                                }}
                                queryArgs={{ qarzaAccountId }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Credits & Debits Tab - No Account */}
            {activeTab === "credits" && (!qarzaAccountId || !accountExists) && (
                <div className="card p-6">
                    <div className="text-center py-8">
                        <p className="text-[var(--muted)] mb-4">
                            {qarzaAccountId && !accountExists 
                                ? "Qarza account has been deleted. Please create a new account." 
                                : "No credits/debits account associated with this customer"}
                        </p>
                        <button
                            onClick={handleCreateQarzaAccount}
                            disabled={isCreatingAccount}
                            className="btn-add"
                        >
                            <Plus size={16} /> {isCreatingAccount ? "Creating..." : "Create Account"}
                        </button>
                    </div>
                </div>
            )}

            {/* Orders Tab */}
            {activeTab === "orders" && (
                <div className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-[var(--ink)]">Customer Orders</h3>
                        <div className="flex gap-2">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)]"
                            />
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)]"
                            />
                        </div>
                    </div>
                    
                    {/* KPI Cards */}
                    <div className="grid grid-cols-4 gap-4 mb-6">
                        <div className="card p-4" style={{ background: "rgba(15,118,110,0.08)", border: "1px solid var(--border)" }}>
                            <p className="text-xs font-semibold uppercase tracking-wider mb-1 text-[var(--muted)]">Total Orders</p>
                            <p className="text-xl font-black tabular-nums text-[var(--accent-2)]">{orderKPIs?.totalOrders || 0}</p>
                        </div>
                        <div className="card p-4" style={{ background: "rgba(15,118,110,0.08)", border: "1px solid var(--border)" }}>
                            <p className="text-xs font-semibold uppercase tracking-wider mb-1 text-[var(--muted)]">Total Amount</p>
                            <p className="text-xl font-black tabular-nums text-[var(--accent-2)]">Rs {(orderKPIs?.totalOrderAmount || 0).toLocaleString()}</p>
                        </div>
                        <div className="card p-4" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid var(--border)" }}>
                            <p className="text-xs font-semibold uppercase tracking-wider mb-1 text-[var(--muted)]">Paid Amount</p>
                            <p className="text-xl font-black tabular-nums text-[#10b981]">Rs {(orderKPIs?.totalPaidAmount || 0).toLocaleString()}</p>
                        </div>
                        <div className="card p-4" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid var(--border)" }}>
                            <p className="text-xs font-semibold uppercase tracking-wider mb-1 text-[var(--muted)]">Remaining</p>
                            <p className="text-xl font-black tabular-nums text-[#ef4444]">Rs {(orderKPIs?.totalRemainingAmount || 0).toLocaleString()}</p>
                        </div>
                    </div>

                    {orders.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ background: "var(--surface-muted)", borderBottom: "1px solid var(--border)" }}>
                                        <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Order #</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Date & Time</th>
                                        <th className="px-5 py-3 text-center text-xs font-bold uppercase tracking-wider text-[var(--muted)] hidden md:table-cell">Items</th>
                                        <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Paid</th>
                                        <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Remaining</th>
                                        <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Total</th>
                                        <th className="px-5 py-3 text-center text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((order, index) => (
                                        <tr key={order._id || order.id}
                                            className="transition-all duration-150 hover:bg-(--surface-muted)"
                                            style={{ background: index % 2 === 0 ? "var(--surface)" : "rgba(255,250,243,0.6)", borderBottom: "1px solid var(--border)" }}>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-(--ink) whitespace-nowrap">{order.orderNumber || "—"}</span>
                                                    <button
                                                        onClick={() => navigator.clipboard.writeText(order.orderNumber)}
                                                        className="p-1 rounded hover:bg-(--surface-muted) transition-all"
                                                        title="Copy order number"
                                                    >
                                                        <Copy size={12} className="text-(--muted)" />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <p className="font-medium text-(--ink) whitespace-nowrap">
                                                    {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </p>
                                                <p className="text-xs text-(--muted) whitespace-nowrap">
                                                    {new Date(order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </td>
                                            <td className="px-5 py-3.5 text-center hidden md:table-cell">
                                                <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ background: "rgba(15,118,110,0.12)", color: "var(--accent-2)" }}>
                                                    {order.items?.length || 0}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <span className="font-semibold text-green-600 whitespace-nowrap">
                                                    Rs {(order.paid ?? 0).toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <span className="font-semibold text-orange-600 whitespace-nowrap">
                                                    Rs {(order.remainingAmount ?? 0).toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <span className="font-bold text-(--accent-2) whitespace-nowrap">
                                                    Rs {(order.totalAmount || 0).toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex gap-1.5 justify-center">
                                                    <button
                                                        onClick={() => navigate(`/order-history/${order._id}`)}
                                                        className="p-2 rounded-lg bg-(--surface-muted) border border-(--border) transition-all duration-150 hover:scale-105 hover:border-(--accent-2) hover:text-(--accent-2)"
                                                    >
                                                        <Eye size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => setReturnModalOrderId(order._id)}
                                                        className="p-2 rounded-lg bg-(--surface-muted) border border-(--border) transition-all duration-150 hover:scale-105 hover:border-orange-400 hover:text-orange-500"
                                                        title="Return Order"
                                                    >
                                                        <RotateCcw size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteOrder(order._id)}
                                                        className="p-2 rounded-lg bg-(--surface-muted) border border-(--border) transition-all duration-150 hover:scale-105 hover:border-red-400 hover:text-red-500"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Package size={48} className="text-[var(--muted)] mb-4 mx-auto" />
                            <p className="text-[var(--muted)]">No orders found for this customer</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
