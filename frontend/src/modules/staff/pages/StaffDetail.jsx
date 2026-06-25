import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Edit, Upload, Trash2, Plus, DollarSign, FileText } from "lucide-react";
import { toast } from "sonner";
import { useGetStaffByIdQuery, useAddDocumentMutation, useRemoveDocumentMutation, useGetSalaryPaymentsQuery, useCreateSalaryPaymentMutation, useGetSaleBillsQuery, useCreateSaleBillMutation, useMarkSaleBillAsPaidMutation } from "../api/staff.api.js";

export default function StaffDetail() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [activeTab, setActiveTab] = useState("profile");
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [showBillForm, setShowBillForm] = useState(false);

    const { data: staffData, isLoading, refetch } = useGetStaffByIdQuery(id);
    const { data: paymentsData } = useGetSalaryPaymentsQuery(id);
    const { data: billsData } = useGetSaleBillsQuery(id);

    const [addDocument] = useAddDocumentMutation();
    const [removeDocument] = useRemoveDocumentMutation();
    const [createSalaryPayment] = useCreateSalaryPaymentMutation();
    const [createSaleBill] = useCreateSaleBillMutation();
    const [markBillAsPaid] = useMarkSaleBillAsPaidMutation();

    const [paymentForm, setPaymentForm] = useState({ amount: "", month: "", notes: "" });
    const [billForm, setBillForm] = useState({ items: [{ name: "", quantity: 1, price: 0 }], percentage: 10, notes: "" });

    const staff = staffData?.data;
    const payments = paymentsData?.data || [];
    const bills = billsData?.data || [];

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

    const handleCreateBill = async (e) => {
        e.preventDefault();
        const totalAmount = billForm.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        const earnedAmount = (totalAmount * billForm.percentage) / 100;
        try {
            await createSaleBill({
                staffId: id,
                items: billForm.items,
                totalAmount,
                percentage: billForm.percentage,
                earnedAmount,
                source: "manual",
                notes: billForm.notes,
            }).unwrap();
            toast.success("Sale bill created successfully");
            setShowBillForm(false);
            setBillForm({ items: [{ name: "", quantity: 1, price: 0 }], percentage: 10, notes: "" });
            refetch();
        } catch (error) {
            toast.error("Failed to create sale bill");
        }
    };

    const handleMarkPaid = async (billId) => {
        try {
            await markBillAsPaid(billId).unwrap();
            toast.success("Bill marked as paid");
            refetch();
        } catch (error) {
            toast.error("Failed to mark bill as paid");
        }
    };

    const addBillItem = () => {
        setBillForm(prev => ({
            ...prev,
            items: [...prev.items, { name: "", quantity: 1, price: 0 }]
        }));
    };

    const updateBillItem = (index, field, value) => {
        setBillForm(prev => ({
            ...prev,
            items: prev.items.map((item, i) => i === index ? { ...item, [field]: value } : item)
        }));
    };

    const removeBillItem = (index) => {
        setBillForm(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
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

            {/* Bills Tab */}
            {activeTab === "bills" && staff.salaryType === "percentage" && (
                <div className="space-y-6">
                    <div className="card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-[var(--ink)]">Create Sale Bill</h3>
                            <button
                                onClick={() => setShowBillForm(!showBillForm)}
                                className="btn-add"
                            >
                                <Plus size={16} /> {showBillForm ? "Cancel" : "Add Bill"}
                            </button>
                        </div>
                        {showBillForm && (
                            <form onSubmit={handleCreateBill} className="space-y-4">
                                <div className="space-y-2">
                                    {billForm.items.map((item, index) => (
                                        <div key={index} className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Item Name"
                                                value={item.name}
                                                onChange={(e) => updateBillItem(index, 'name', e.target.value)}
                                                required
                                                className="flex-1 px-3 py-2 border border-[var(--border)] rounded-md"
                                            />
                                            <input
                                                type="number"
                                                placeholder="Qty"
                                                value={item.quantity}
                                                onChange={(e) => updateBillItem(index, 'quantity', Number(e.target.value))}
                                                required
                                                min="1"
                                                className="w-20 px-3 py-2 border border-[var(--border)] rounded-md"
                                            />
                                            <input
                                                type="number"
                                                placeholder="Price"
                                                value={item.price}
                                                onChange={(e) => updateBillItem(index, 'price', Number(e.target.value))}
                                                required
                                                min="0"
                                                className="w-24 px-3 py-2 border border-[var(--border)] rounded-md"
                                            />
                                            {billForm.items.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeBillItem(index)}
                                                    className="p-2 hover:bg-red-50 rounded-md"
                                                >
                                                    <Trash2 size={16} className="text-red-500" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addBillItem}
                                        className="text-sm text-[var(--accent-2)] hover:underline"
                                    >
                                        + Add Item
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input
                                        type="number"
                                        placeholder="Percentage (%)"
                                        value={billForm.percentage}
                                        onChange={(e) => setBillForm(prev => ({ ...prev, percentage: Number(e.target.value) }))}
                                        required
                                        min="0"
                                        max="100"
                                        className="px-3 py-2 border border-[var(--border)] rounded-md"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Notes"
                                        value={billForm.notes}
                                        onChange={(e) => setBillForm(prev => ({ ...prev, notes: e.target.value }))}
                                        className="px-3 py-2 border border-[var(--border)] rounded-md"
                                    />
                                </div>
                                <button type="submit" className="btn-add">
                                    <FileText size={16} /> Create Bill
                                </button>
                            </form>
                        )}
                    </div>

                    <div className="card p-6">
                        <h3 className="text-lg font-semibold text-[var(--ink)] mb-4">Sale Bills</h3>
                        {bills.length ? (
                            <div className="space-y-2">
                                {bills.map((bill) => (
                                    <div key={bill._id} className="flex items-center justify-between p-3 border border-[var(--border)] rounded-md">
                                        <div>
                                            <p className="font-medium text-[var(--ink)]">Rs {bill.totalAmount}</p>
                                            <p className="text-sm text-[var(--muted)]">
                                                Earned: Rs {bill.earnedAmount} ({bill.percentage}%) - {bill.source}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 text-xs rounded-full ${
                                                bill.isPaid ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'
                                            }`}>
                                                {bill.isPaid ? 'Paid' : 'Pending'}
                                            </span>
                                            {!bill.isPaid && (
                                                <button
                                                    onClick={() => handleMarkPaid(bill._id)}
                                                    className="btn-add text-sm"
                                                >
                                                    Mark Paid
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-[var(--muted)]">No sale bills</p>
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
