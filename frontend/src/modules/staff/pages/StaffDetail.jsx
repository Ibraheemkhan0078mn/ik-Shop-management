import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Edit, Upload, Trash2, Plus, DollarSign, FileText, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useGetStaffByIdQuery, useAddDocumentMutation, useRemoveDocumentMutation, useGetSalaryPaymentsQuery, useCreateSalaryPaymentMutation } from "../api/staff.api.js";
import api from "../../../shared/services/api.js";

export default function StaffDetail() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [activeTab, setActiveTab] = useState("profile");
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [ordersPagination, setOrdersPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

    const { data: staffData, isLoading, refetch } = useGetStaffByIdQuery(id);
    const { data: paymentsData } = useGetSalaryPaymentsQuery(id);

    const [addDocument] = useAddDocumentMutation();
    const [removeDocument] = useRemoveDocumentMutation();
    const [createSalaryPayment] = useCreateSalaryPaymentMutation();

    const [paymentForm, setPaymentForm] = useState({ amount: "", month: "", notes: "" });

    const staff = staffData?.data;
    const payments = paymentsData?.data || [];

    // Fetch POS orders for this staff
    const fetchStaffOrders = async (page = 1) => {
        setOrdersLoading(true);
        try {
            const response = await api.get(`/staff/sale-bill/${id}?page=${page}&limit=20`);
            setOrders(response.data.data || []);
            setOrdersPagination({
                page: response.data.page || 1,
                limit: response.data.limit || 20,
                total: response.data.total || 0,
                totalPages: response.data.totalPages || 0,
            });
        } catch (error) {
            console.error("Failed to fetch staff orders:", error);
        } finally {
            setOrdersLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === "bills" && staff?.salaryType === "percentage") {
            fetchStaffOrders(1);
        }
    }, [activeTab, staff]);

    const handleAddDocument = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const documentData = {
            documentType: formData.get("documentType"),
            filePath: formData.get("filePath"),
        };
        try {
            await addDocument({ id, data: documentData }).unwrap();
            toast.success("Document added successfully");
            refetch();
            e.target.reset();
        } catch (error) {
            toast.error("Failed to add document");
        }
    };

    const handleRemoveDocument = async (docId) => {
        try {
            await removeDocument({ id, docId }).unwrap();
            toast.success("Document removed successfully");
            refetch();
        } catch (error) {
            toast.error("Failed to remove document");
        }
    };

    const handleCreatePayment = async (e) => {
        e.preventDefault();
        try {
            await createSalaryPayment({ ...paymentForm, staffId: id }).unwrap();
            toast.success("Payment recorded successfully");
            setShowPaymentForm(false);
            setPaymentForm({ amount: "", month: "", notes: "" });
            refetch();
        } catch (error) {
            toast.error("Failed to record payment");
        }
    };

    if (isLoading) {
        return <div className="p-6 text-center">Loading...</div>;
    }

    if (!staff) {
        return <div className="p-6 text-center">Staff not found</div>;
    }

    return (
        <div className="p-6 bg-[var(--app-bg)] min-h-screen">
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate("/staff")}
                    className="p-2 hover:bg-[var(--hover)] rounded-md"
                >
                    <ArrowLeft size={20} className="text-[var(--ink)]" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-[var(--ink)] font-display">{staff.fullName}</h1>
                    <p className="text-sm text-[var(--muted)]">{staff.role} - {staff.salaryType} salary</p>
                </div>
                <button
                    onClick={() => navigate(`/staff/edit/${id}`)}
                    className="btn-add"
                >
                    <Edit size={16} /> Edit
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-[var(--border)]">
                {["profile", "documents", "payments", "bills"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 capitalize ${
                            activeTab === tab
                                ? "border-b-2 border-[var(--accent-2)] text-[var(--accent-2)]"
                                : "text-[var(--muted)] hover:text-[var(--ink)]"
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Profile Tab */}
            {activeTab === "profile" && (
                <div className="card p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-sm text-[var(--muted)]">Full Name</label>
                            <p className="font-medium text-[var(--ink)]">{staff.fullName}</p>
                        </div>
                        <div>
                            <label className="text-sm text-[var(--muted)]">CNIC</label>
                            <p className="font-medium text-[var(--ink)]">{staff.cnic}</p>
                        </div>
                        <div>
                            <label className="text-sm text-[var(--muted)]">Phone</label>
                            <p className="font-medium text-[var(--ink)]">{staff.phone}</p>
                        </div>
                        <div>
                            <label className="text-sm text-[var(--muted)]">Role</label>
                            <p className="font-medium text-[var(--ink)] capitalize">{staff.role}</p>
                        </div>
                        <div>
                            <label className="text-sm text-[var(--muted)]">Salary Type</label>
                            <p className="font-medium text-[var(--ink)] capitalize">{staff.salaryType}</p>
                        </div>
                        <div>
                            <label className="text-sm text-[var(--muted)]">Status</label>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                                staff.status === 'active' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                            }`}>
                                {staff.status}
                            </span>
                        </div>
                        <div>
                            <label className="text-sm text-[var(--muted)]">Join Date</label>
                            <p className="font-medium text-[var(--ink)]">{new Date(staff.joinDate).toLocaleDateString()}</p>
                        </div>
                        {staff.salaryType === "fixed" && (
                            <div>
                                <label className="text-sm text-[var(--muted)]">Monthly Salary</label>
                                <p className="font-medium text-[var(--ink)]">Rs {staff.monthlySalary || 0}</p>
                            </div>
                        )}
                        {staff.salaryType === "percentage" && (
                            <div>
                                <label className="text-sm text-[var(--muted)]">Percentage</label>
                                <p className="font-medium text-[var(--ink)]">{staff.percentage || 0}%</p>
                            </div>
                        )}
                        {staff.address && (
                            <div className="md:col-span-2">
                                <label className="text-sm text-[var(--muted)]">Address</label>
                                <p className="font-medium text-[var(--ink)]">{staff.address}</p>
                            </div>
                        )}
                        {staff.emergencyContact && (
                            <div>
                                <label className="text-sm text-[var(--muted)]">Emergency Contact</label>
                                <p className="font-medium text-[var(--ink)]">{staff.emergencyContact}</p>
                            </div>
                        )}
                        {staff.notes && (
                            <div className="md:col-span-2">
                                <label className="text-sm text-[var(--muted)]">Notes</label>
                                <p className="font-medium text-[var(--ink)]">{staff.notes}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Documents Tab */}
            {activeTab === "documents" && (
                <div className="space-y-6">
                    <div className="card p-6">
                        <h3 className="text-lg font-semibold text-[var(--ink)] mb-4">Upload Document</h3>
                        <form onSubmit={handleAddDocument} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input
                                name="documentType"
                                placeholder="Document Type (e.g., CNIC Copy)"
                                required
                                className="px-3 py-2 border border-[var(--border)] rounded-md"
                            />
                            <input
                                name="filePath"
                                placeholder="File Path"
                                required
                                className="px-3 py-2 border border-[var(--border)] rounded-md"
                            />
                            <button type="submit" className="btn-add">
                                <Upload size={16} /> Upload
                            </button>
                        </form>
                    </div>

                    <div className="card p-6">
                        <h3 className="text-lg font-semibold text-[var(--ink)] mb-4">Documents</h3>
                        {staff.documents?.length ? (
                            <div className="space-y-2">
                                {staff.documents.map((doc) => (
                                    <div key={doc._id} className="flex items-center justify-between p-3 border border-[var(--border)] rounded-md">
                                        <div>
                                            <p className="font-medium text-[var(--ink)]">{doc.documentType}</p>
                                            <p className="text-sm text-[var(--muted)]">{new Date(doc.uploadedAt).toLocaleDateString()}</p>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveDocument(doc._id)}
                                            className="p-2 hover:bg-red-50 rounded-md"
                                        >
                                            <Trash2 size={16} className="text-red-500" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-[var(--muted)]">No documents uploaded</p>
                        )}
                    </div>
                </div>
            )}

            {/* Payments Tab */}
            {activeTab === "payments" && staff.salaryType === "fixed" && (
                <div className="space-y-6">
                    <div className="card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-[var(--ink)]">Record Salary Payment</h3>
                            <button
                                onClick={() => setShowPaymentForm(!showPaymentForm)}
                                className="btn-add"
                            >
                                <Plus size={16} /> {showPaymentForm ? "Cancel" : "Add Payment"}
                            </button>
                        </div>
                        {showPaymentForm && (
                            <form onSubmit={handleCreatePayment} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <input
                                    type="number"
                                    placeholder="Amount"
                                    value={paymentForm.amount}
                                    onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                                    required
                                    className="px-3 py-2 border border-[var(--border)] rounded-md"
                                />
                                <input
                                    type="text"
                                    placeholder="Month (e.g., June 2025)"
                                    value={paymentForm.month}
                                    onChange={(e) => setPaymentForm(prev => ({ ...prev, month: e.target.value }))}
                                    required
                                    className="px-3 py-2 border border-[var(--border)] rounded-md"
                                />
                                <input
                                    type="text"
                                    placeholder="Notes"
                                    value={paymentForm.notes}
                                    onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                                    className="px-3 py-2 border border-[var(--border)] rounded-md"
                                />
                                <button type="submit" className="btn-add md:col-span-3">
                                    <DollarSign size={16} /> Record Payment
                                </button>
                            </form>
                        )}
                    </div>

                    <div className="card p-6">
                        <h3 className="text-lg font-semibold text-[var(--ink)] mb-4">Payment History</h3>
                        {payments.length ? (
                            <div className="space-y-2">
                                {payments.map((payment) => (
                                    <div key={payment._id} className="flex items-center justify-between p-3 border border-[var(--border)] rounded-md">
                                        <div>
                                            <p className="font-medium text-[var(--ink)]">Rs {payment.amount}</p>
                                            <p className="text-sm text-[var(--muted)]">{payment.month} - {new Date(payment.paidAt).toLocaleDateString()}</p>
                                        </div>
                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                            payment.status === 'paid' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'
                                        }`}>
                                            {payment.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-[var(--muted)]">No payments recorded</p>
                        )}
                    </div>
                </div>
            )}

            {/* Bills Tab - POS Orders */}
            {activeTab === "bills" && staff.salaryType === "percentage" && (
                <div className="space-y-6">
                    <div className="card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-[var(--ink)]">POS Orders</h3>
                            <ShoppingCart size={20} className="text-[var(--accent-2)]" />
                        </div>
                        {ordersLoading ? (
                            <p className="text-[var(--muted)]">Loading orders...</p>
                        ) : orders.length ? (
                            <div className="space-y-3">
                                {orders.map((order) => (
                                    <div key={order._id} className="p-4 border border-[var(--border)] rounded-md">
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p className="font-medium text-[var(--ink)]">Order #{order.orderNumber}</p>
                                                <p className="text-sm text-[var(--muted)]">{new Date(order.createdAt).toLocaleString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-[var(--accent-2)]">Rs {order.totalAmount?.toLocaleString() || 0}</p>
                                                <p className="text-xs text-[var(--muted)]">
                                                    Earned: Rs {((order.totalAmount || 0) * (staff.percentage || 0) / 100).toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-sm text-[var(--muted)]">
                                            <p>Items: {order.items?.length || 0}</p>
                                            <p>Payment: {order.paymentMethod}</p>
                                        </div>
                                    </div>
                                ))}
                                {ordersPagination.totalPages > 1 && (
                                    <div className="flex justify-center gap-2 mt-4">
                                        <button
                                            onClick={() => fetchStaffOrders(ordersPagination.page - 1)}
                                            disabled={ordersPagination.page === 1}
                                            className="px-3 py-1 border border-[var(--border)] rounded disabled:opacity-50"
                                        >
                                            Previous
                                        </button>
                                        <span className="px-3 py-1">
                                            Page {ordersPagination.page} of {ordersPagination.totalPages}
                                        </span>
                                        <button
                                            onClick={() => fetchStaffOrders(ordersPagination.page + 1)}
                                            disabled={ordersPagination.page === ordersPagination.totalPages}
                                            className="px-3 py-1 border border-[var(--border)] rounded disabled:opacity-50"
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-[var(--muted)]">No POS orders found for this staff member</p>
                        )}
                    </div>
                </div>
            )}

            {activeTab === "payments" && staff.salaryType !== "fixed" && (
                <div className="card p-6 text-center text-[var(--muted)]">
                    Salary payments are only applicable for fixed salary staff
                </div>
            )}

            {activeTab === "bills" && staff.salaryType !== "percentage" && (
                <div className="card p-6 text-center text-[var(--muted)]">
                    Sale bills are only applicable for percentage-based salary staff
                </div>
            )}
        </div>
    );
}
