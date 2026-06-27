import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Edit, Upload, Trash2, Plus, DollarSign, FileText, ShoppingCart, X } from "lucide-react";
import { toast } from "sonner";
import { useGetStaffByIdQuery, useAddDocumentMutation, useRemoveDocumentMutation, useGetSalaryPaymentsQuery, useCreateSalaryPaymentMutation, useDeleteSalaryPaymentMutation, useAddImagesMutation, useRemoveImageMutation } from "../api/staff.api.js";
import api from "../../../shared/services/api.js";

export default function StaffDetail() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [activeTab, setActiveTab] = useState("profile");
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [showStaffPaymentModal, setShowStaffPaymentModal] = useState(false);
    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [ordersPagination, setOrdersPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
    const [staffPaymentForm, setStaffPaymentForm] = useState({ amount: "", notes: "" });
    const [selectedImages, setSelectedImages] = useState([]);

    const { data: staffData, isLoading, refetch } = useGetStaffByIdQuery(id);
    const { data: paymentsData } = useGetSalaryPaymentsQuery(id);

    const [addDocument] = useAddDocumentMutation();
    const [removeDocument] = useRemoveDocumentMutation();
    const [createSalaryPayment] = useCreateSalaryPaymentMutation();
    const [deleteSalaryPayment] = useDeleteSalaryPaymentMutation();
    const [addImages] = useAddImagesMutation();
    const [removeImage] = useRemoveImageMutation();

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
        if (activeTab === "saleOrders") {
            fetchStaffOrders(1);
        }
    }, [activeTab]);

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

    const handleCreateStaffPayment = async (e) => {
        e.preventDefault();
        try {
            await createSalaryPayment({ 
                ...staffPaymentForm, 
                staffId: id,
                month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
            }).unwrap();
            toast.success("Staff payment recorded successfully");
            setShowStaffPaymentModal(false);
            setStaffPaymentForm({ amount: "", notes: "" });
            refetch();
        } catch (error) {
            toast.error("Failed to record staff payment");
        }
    };

    const handleDeletePayment = async (paymentId) => {
        if (window.confirm("Are you sure you want to delete this payment?")) {
            try {
                await deleteSalaryPayment(paymentId).unwrap();
                toast.success("Payment deleted successfully");
                refetch();
            } catch (error) {
                toast.error("Failed to delete payment");
            }
        }
    };

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const formData = new FormData();
        files.forEach(file => {
            formData.append("images", file);
        });

        try {
            await addImages({ id, formData }).unwrap();
            toast.success("Images uploaded successfully");
            setSelectedImages([]);
            refetch();
        } catch (error) {
            toast.error("Failed to upload images");
        }
    };

    const handleRemoveImage = async (imageId) => {
        if (window.confirm("Are you sure you want to delete this image?")) {
            try {
                await removeImage({ id, imageId }).unwrap();
                toast.success("Image removed successfully");
                refetch();
            } catch (error) {
                toast.error("Failed to remove image");
            }
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
                {["profile", "documents", "saleOrders", "staffPayments"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 capitalize ${
                            activeTab === tab
                                ? "border-b-2 border-[var(--accent-2)] text-[var(--accent-2)]"
                                : "text-[var(--muted)] hover:text-[var(--ink)]"
                        }`}
                    >
                        {tab === "saleOrders" ? "Sale Orders" : tab === "staffPayments" ? "Staff Payments" : tab}
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
                        <h3 className="text-lg font-semibold text-[var(--ink)] mb-4">Upload Images</h3>
                        <div className="space-y-4">
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="w-full px-3 py-2 border border-[var(--border)] rounded-md"
                            />
                            <p className="text-sm text-[var(--muted)]">You can select multiple images to upload</p>
                        </div>
                    </div>

                    <div className="card p-6">
                        <h3 className="text-lg font-semibold text-[var(--ink)] mb-4">Images</h3>
                        {staff.documents?.length ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {staff.documents.map((doc) => (
                                    doc.imageName && (
                                        <div key={doc._id} className="relative group">
                                            <img
                                                src={`http://localhost:5001/uploads/${doc.imageName}`}
                                                alt="Document"
                                                className="w-full h-32 object-cover rounded-md border border-[var(--border)]"
                                            />
                                            <button
                                                onClick={() => handleRemoveImage(doc._id)}
                                                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                            <p className="text-xs text-[var(--muted)] mt-1">
                                                {new Date(doc.uploadedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    )
                                ))}
                            </div>
                        ) : (
                            <p className="text-[var(--muted)]">No images uploaded</p>
                        )}
                    </div>
                </div>
            )}

            {/* Sale Orders Tab - POS Orders */}
            {activeTab === "saleOrders" && (
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
                                                {staff.salaryType === "percentage" && (
                                                    <p className="text-xs text-[var(--muted)]">
                                                        Earned: Rs {((order.totalAmount || 0) * (staff.percentage || 0) / 100).toFixed(2)}
                                                    </p>
                                                )}
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
                            <p className="text-[var(--muted)]">No POS orders found for this staff</p>
                        )}
                    </div>
                </div>
            )}

            {/* Staff Payments Tab */}
            {activeTab === "staffPayments" && (
                <div className="space-y-6">
                    <div className="card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-[var(--ink)]">Staff Payments</h3>
                            <button
                                onClick={() => setShowStaffPaymentModal(true)}
                                className="btn-add"
                            >
                                <Plus size={16} /> Create Payment
                            </button>
                        </div>
                        {payments.length ? (
                            <div className="space-y-2">
                                {payments.map((payment) => (
                                    <div key={payment._id} className="flex items-center justify-between p-3 border border-[var(--border)] rounded-md">
                                        <div>
                                            <p className="font-medium text-[var(--ink)]">Rs {payment.amount}</p>
                                            <p className="text-sm text-[var(--muted)]">{payment.month} - {new Date(payment.paidAt).toLocaleDateString()}</p>
                                            {payment.notes && <p className="text-xs text-[var(--muted)]">{payment.notes}</p>}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 text-xs rounded-full ${
                                                payment.status === 'paid' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'
                                            }`}>
                                                {payment.status}
                                            </span>
                                            <button
                                                onClick={() => handleDeletePayment(payment._id)}
                                                className="p-2 hover:bg-red-50 rounded-md"
                                            >
                                                <Trash2 size={16} className="text-red-500" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-[var(--muted)]">No payments recorded</p>
                        )}
                    </div>
                </div>
            )}

            {/* Staff Payment Modal */}
            {showStaffPaymentModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Create Staff Payment</h3>
                            <button
                                onClick={() => setShowStaffPaymentModal(false)}
                                className="p-2 hover:bg-gray-100 rounded"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateStaffPayment} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Amount (Rs)</label>
                                <input
                                    type="number"
                                    value={staffPaymentForm.amount}
                                    onChange={(e) => setStaffPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                                    required
                                    min="0"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Notes</label>
                                <textarea
                                    value={staffPaymentForm.notes}
                                    onChange={(e) => setStaffPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    rows="3"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowStaffPaymentModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                                >
                                    Create Payment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {activeTab === "payments" && staff.salaryType !== "fixed" && (
                <div className="card p-6 text-center text-[var(--muted)]">
                    Salary payments are only applicable for fixed salary staff
                </div>
            )}
        </div>
    );
}
