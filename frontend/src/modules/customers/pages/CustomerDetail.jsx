import React, { useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Edit, Plus, Eye, Trash2, RotateCcw, Copy, RefreshCw, DollarSign } from "lucide-react";
import { useCustomer, useCustomerOrderKPIs, useCustomerOrderReturnKPIs } from "../services/customers.service.js";
import { useOrdersByCustomer, useDeleteOrder } from "../../orders/services/orders.service.js";
import { useCreateQarzaAccount } from "../../qarza/services/qarza.service.js";
import { useUpdateCustomer } from "../services/customers.service.js";
import { useRecalculateCustomerBalance } from "../../qarza/services/qarza.service.js";
import { getCustomerLabels } from "../labels/customerLabels.js";
import { useSettings } from "../../settings/hooks/useSettings.js";
import { useCustomerPaymentsSummary, useCustomerPayments, useDeleteQarzaPayment } from "../../qarza/services/qarza.service.js";
import { useGetPaginatedOrderReturnsQuery, useDeleteOrderReturnMutation } from "../../orderReturn/api/orderReturn.api.js";
import QarzaPaymentModal from "../../qarza/components/QarzaPaymentModal.jsx";
import OrderReturnModal from "../../orderReturn/components/OrderReturnModal.jsx";
import OrderReturnPaymentModal from "../../orderReturn/components/OrderReturnPaymentModal.jsx";
import { showSuccess, showError } from "../../../shared/utilities/toastHelpers.js";
import PaginatedList from "../../../shared/components/PaginatedList.jsx";
import ConfirmDialog from "../../../shared/components/ConfirmationDialog.jsx";
import PermissionGuard from "../../../shared/components/PermissionGuard.jsx";

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
    const [paymentModal, setPaymentModal] = useState(null);
    const [selectedReturn, setSelectedReturn] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return now.toISOString().slice(0, 7); // YYYY-MM format
    });

    // Calculate start and end dates from selected month
    const startDate = selectedMonth ? `${selectedMonth}-01` : null;
    const endDate = selectedMonth ? (() => {
        const [year, month] = selectedMonth.split('-').map(Number);
        const lastDay = new Date(year, month, 0);
        return lastDay.toISOString().split('T')[0];
    })() : null;
    
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
    const { data: orderReturnKPIs } = useCustomerOrderReturnKPIs({
        customerId: id,
        startDate,
        endDate
    });
    const { data: orderReturnsData } = useGetPaginatedOrderReturnsQuery({
        customerId: id,
        startDate,
        endDate
    });
    const orderReturns = orderReturnsData?.data || [];

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
    const [deleteOrderReturn] = useDeleteOrderReturnMutation();

    const refresh = useCallback(() => {}, []);

    const handleDelete = async (paymentId) => {
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
        try {
            await deleteOrder(orderId).unwrap();
            showSuccess("Order deleted");
        } catch (error) {
            showError(error?.data?.message || "Failed to delete order");
        }
    };

    const handleDeleteOrderReturn = async (returnId) => {
        try {
            await deleteOrderReturn(returnId).unwrap();
            showSuccess("Return deleted successfully");
            refetchCustomer();
        } catch (error) {
            showError(error?.data?.message || "Failed to delete return");
        }
    };

    const handleEditOrderReturn = (returnItem) => {
        setSelectedReturn(returnItem);
        setIsEditMode(true);
        setReturnModalOrderId(null);
    };

    const handlePaymentOrderReturn = (returnItem) => {
        setPaymentModal(returnItem);
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
                    onClose={() => {
                        setReturnModalOrderId(null);
                        setSelectedReturn(null);
                        setIsEditMode(false);
                    }}
                    onSuccess={() => {
                        setReturnModalOrderId(null);
                        setSelectedReturn(null);
                        setIsEditMode(false);
                        refresh();
                    }}
                />
            )}
            {selectedReturn && isEditMode && (
                <OrderReturnModal
                    isOpen={!!selectedReturn}
                    editData={selectedReturn}
                    isEditMode={isEditMode}
                    onClose={() => {
                        setSelectedReturn(null);
                        setIsEditMode(false);
                    }}
                    onSuccess={() => {
                        setSelectedReturn(null);
                        setIsEditMode(false);
                        refresh();
                    }}
                />
            )}
            {paymentModal && (
                <OrderReturnPaymentModal
                    orderReturn={paymentModal}
                    onClose={() => setPaymentModal(null)}
                    onSuccess={() => {
                        setPaymentModal(null);
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
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-[var(--border)]">
                {["details", "orders", "returns", "credits"].map((tab) => (
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
                         tab === "returns" ? "Order Returns" :
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
                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">Payment Method</th>
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
                                                                    {item.paymentMethodName || item.paymentMethod?.name || "-"}
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
                                                                            <ConfirmDialog message="Delete this payment?" onConfirm={() => handleDelete(item._id)}>
                                                                                <button
                                                                                    className="p-2 rounded-lg bg-[var(--surface-muted)] border border-[var(--border)] hover:border-red-400 hover:text-red-500 ml-2"
                                                                                >
                                                                                    <Trash2 size={14} />
                                                                                </button>
                                                                            </ConfirmDialog>
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
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
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
                                                    Rs {(order.paidAmount ?? 0).toLocaleString()}
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
                                                    <ConfirmDialog message="Delete this order?" onConfirm={() => handleDeleteOrder(order._id)}>
                                                        <button
                                                            className="p-2 rounded-lg bg-(--surface-muted) border border-(--border) transition-all duration-150 hover:scale-105 hover:border-red-400 hover:text-red-500"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </ConfirmDialog>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Plus size={48} className="text-[var(--muted)] mb-4 mx-auto" />
                            <p className="text-[var(--muted)]">No orders found for this customer</p>
                        </div>
                    )}
                </div>
            )}

            {/* Returns Tab */}
            {activeTab === "returns" && (
                <div className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-[var(--ink)]">Order Returns</h3>
                        <div className="flex gap-2">
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)]"
                            />
                        </div>
                    </div>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-5 gap-4 mb-6">
                        <div className="card p-4" style={{ background: "rgba(15,118,110,0.08)", border: "1px solid var(--border)" }}>
                            <p className="text-xs font-semibold uppercase tracking-wider mb-1 text-[var(--muted)]">Total Returns</p>
                            <p className="text-xl font-black tabular-nums text-[var(--accent-2)]">{orderReturnKPIs?.totalReturns || 0}</p>
                        </div>
                        <div className="card p-4" style={{ background: "rgba(15,118,110,0.08)", border: "1px solid var(--border)" }}>
                            <p className="text-xs font-semibold uppercase tracking-wider mb-1 text-[var(--muted)]">Total Refund</p>
                            <p className="text-xl font-black tabular-nums text-[var(--accent-2)]">Rs {(orderReturnKPIs?.totalRefundAmount || 0).toLocaleString()}</p>
                        </div>
                        <div className="card p-4" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid var(--border)" }}>
                            <p className="text-xs font-semibold uppercase tracking-wider mb-1 text-[var(--muted)]">Refunded</p>
                            <p className="text-xl font-black tabular-nums text-[#10b981]">Rs {(orderReturnKPIs?.totalRefundedAmount || 0).toLocaleString()}</p>
                        </div>
                        <div className="card p-4" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid var(--border)" }}>
                            <p className="text-xs font-semibold uppercase tracking-wider mb-1 text-[var(--muted)]">Remaining</p>
                            <p className="text-xl font-black tabular-nums text-[#ef4444]">Rs {(orderReturnKPIs?.totalRemainingAmount || 0).toLocaleString()}</p>
                        </div>
                        <div className="card p-4" style={{ background: "rgba(180,83,9,0.08)", border: "1px solid var(--border)" }}>
                            <p className="text-xs font-semibold uppercase tracking-wider mb-1 text-[var(--muted)]">Pending</p>
                            <p className="text-xl font-black tabular-nums text-[#d97706]">{orderReturnKPIs?.statusBreakdown?.pending || 0}</p>
                        </div>
                    </div>

                    {orderReturns.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ background: "var(--surface-muted)", borderBottom: "1px solid var(--border)" }}>
                                        <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Return #</th>
                                        <th className="px-5 py-3 text-center text-xs font-bold uppercase tracking-wider text-[var(--muted)] hidden md:table-cell">Items</th>
                                        <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Refund Amount</th>
                                        <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Refunded</th>
                                        <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Remaining</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Date</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Status</th>
                                        <th className="px-5 py-3 text-center text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orderReturns.map((returnItem) => {
                                        const status = returnItem.status || 'draft';
                                        const dateStr = returnItem.returnDate || returnItem.createdAt || "";
                                        const date = dateStr ? new Date(dateStr).toLocaleDateString() : "—";
                                        const totalRefund = returnItem.totalRefundAmount || returnItem.totalAmount || 0;
                                        const refunded = returnItem.refundedAmount || returnItem.totalRefundedAmount || 0;
                                        const remaining = totalRefund - refunded;

                                        const getStatusColor = (status) => {
                                            switch (status) {
                                                case 'draft': return 'bg-gray-100 text-gray-800 border-gray-300';
                                                case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
                                                case 'approved': return 'bg-green-100 text-green-800 border-green-300';
                                                case 'rejected': return 'bg-red-100 text-red-800 border-red-300';
                                                default: return 'bg-gray-100 text-gray-800 border-gray-300';
                                            }
                                        };

                                        return (
                                            <tr key={returnItem._id} className="hover:bg-[var(--surface-muted)]" style={{ borderBottom: "1px solid var(--border)" }}>
                                                <td className="px-5 py-3.5 font-mono text-xs text-[var(--muted)]">
                                                    {returnItem.returnNumber || returnItem.orderReturnNumber || "—"}
                                                </td>
                                                <td className="px-5 py-3.5 text-center hidden md:table-cell">
                                                    <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ background: "rgba(15,118,110,0.12)", color: "var(--accent-2)" }}>
                                                        {returnItem.items?.length || 0}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-right font-semibold tabular-nums text-[var(--accent-2)]">
                                                    Rs {totalRefund.toLocaleString()}
                                                </td>
                                                <td className="px-5 py-3.5 text-right font-semibold tabular-nums text-[#10b981]">
                                                    Rs {refunded.toLocaleString()}
                                                </td>
                                                <td className="px-5 py-3.5 text-right font-semibold tabular-nums text-[#ef4444]">
                                                    Rs {remaining.toLocaleString()}
                                                </td>
                                                <td className="px-5 py-3.5 text-sm text-[var(--muted)]">{date}</td>
                                                <td className="px-5 py-3.5">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(status)}`}>
                                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex gap-1.5 justify-center">
                                                        <button
                                                            onClick={() => navigate(`/order-returns/${returnItem._id}`)}
                                                            className="p-2 rounded-lg bg-[var(--surface-muted)] border border-[var(--border)] hover:border-[var(--accent-2)] hover:text-[var(--accent-2)]"
                                                            title="View Details"
                                                        >
                                                            <Eye size={15} />
                                                        </button>
                                                        {(returnItem.returnStatus === 'approved' || returnItem.status === 'approved') && 
                                                         (returnItem.refundStatus !== 'fully_refunded' && returnItem.refundStatus !== 'completed') && (
                                                            <button
                                                                onClick={() => handlePaymentOrderReturn(returnItem)}
                                                                className="p-2 rounded-lg bg-[var(--surface-muted)] border border-[var(--border)] hover:border-green-400 hover:text-green-600"
                                                                title="Process Payment"
                                                            >
                                                                <DollarSign size={15} />
                                                            </button>
                                                        )}
                                                        <PermissionGuard 
                                                            execute={() => handleEditOrderReturn(returnItem)} 
                                                            permission="orderReturns.update" 
                                                            isConfirmation={true}
                                                        >
                                                            <button
                                                                className="p-2 rounded-lg bg-[var(--surface-muted)] border border-[var(--border)] hover:border-[var(--accent-2)] hover:text-[var(--accent-2)]"
                                                                title="Edit"
                                                            >
                                                                <Edit size={15} />
                                                            </button>
                                                        </PermissionGuard>
                                                        <PermissionGuard 
                                                            execute={() => handleDeleteOrderReturn(returnItem._id)} 
                                                            permission="orderReturns.delete" 
                                                            isConfirmation={true}
                                                        >
                                                            <button
                                                                className="p-2 rounded-lg bg-[var(--surface-muted)] border border-[var(--border)] hover:border-red-400 hover:text-red-500"
                                                                title="Delete"
                                                            >
                                                                <Trash2 size={15} />
                                                            </button>
                                                        </PermissionGuard>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <RotateCcw size={48} className="text-[var(--muted)] mb-4 mx-auto" />
                            <p className="text-[var(--muted)]">No order returns found for this customer</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
