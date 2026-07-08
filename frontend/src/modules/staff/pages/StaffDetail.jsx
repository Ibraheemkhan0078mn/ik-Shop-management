import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Edit, Upload, Trash2, Plus, DollarSign, FileText, ShoppingCart, X, Calendar, Filter, TrendingUp, PieChart } from "lucide-react";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import { useGetStaffByIdQuery, useAddDocumentMutation, useRemoveDocumentMutation, useGetSalaryPaymentsQuery, useCreateSalaryPaymentMutation, useDeleteSalaryPaymentMutation, useAddImagesMutation, useRemoveImageMutation, useGetSaleBillsQuery, useGetSalaryBreakdownQuery, useGetPaymentSummaryQuery } from "../api/staff.api.js";
import { getStaffLabels } from "../labels/staffLabels.js";
import { useSettings } from "../../settings/hooks/useSettings.js";
import api from "../../../shared/services/api.js";
import PaginatedList from "../../../shared/components/PaginatedList.jsx";

export default function StaffDetail() {
    const navigate = useNavigate();
    const { id } = useParams();
    
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getStaffLabels(language);
    
    const [activeTab, setActiveTab] = useState("profile");
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [showStaffPaymentModal, setShowStaffPaymentModal] = useState(false);
    const [dateFilter, setDateFilter] = useState({ startDate: "", endDate: "" });
    const [salaryBreakdownFilter, setSalaryBreakdownFilter] = useState({ 
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const [staffPaymentForm, setStaffPaymentForm] = useState({ amount: "", notes: "" });
    const [selectedImages, setSelectedImages] = useState([]);

    const { data: staffData, isLoading, refetch } = useGetStaffByIdQuery(id);
    const { data: paymentsData } = useGetSalaryPaymentsQuery(id);
    const { data: salaryBreakdownData } = useGetSalaryBreakdownQuery({ 
        staffId: id, 
        startDate: salaryBreakdownFilter.startDate, 
        endDate: salaryBreakdownFilter.endDate 
    }, { skip: !salaryBreakdownFilter.startDate || !salaryBreakdownFilter.endDate });
    const { data: paymentSummaryData } = useGetPaymentSummaryQuery(id);

    const [addDocument] = useAddDocumentMutation();
    const [removeDocument] = useRemoveDocumentMutation();
    const [createSalaryPayment] = useCreateSalaryPaymentMutation();
    const [deleteSalaryPayment] = useDeleteSalaryPaymentMutation();
    const [addImages] = useAddImagesMutation();
    const [removeImage] = useRemoveImageMutation();

    const [paymentForm, setPaymentForm] = useState({ amount: "", month: "", notes: "" });

    const staff = staffData?.data;
    const payments = paymentsData?.data || [];

    const handleDateFilterChange = (field, value) => {
        setDateFilter(prev => ({ ...prev, [field]: value }));
    };

    const clearDateFilter = () => {
        setDateFilter({ startDate: "", endDate: "" });
    };

    const handleAddDocument = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const documentData = {
            documentType: formData.get("documentType"),
            filePath: formData.get("filePath"),
        };
        try {
            await addDocument({ id, data: documentData }).unwrap();
            toast.success(labels.documentAdded);
            refetch();
            e.target.reset();
        } catch (error) {
            toast.error(labels.failedToAddDocument);
        }
    };

    const handleRemoveDocument = async (docId) => {
        try {
            await removeDocument({ id, docId }).unwrap();
            toast.success(labels.documentRemoved);
            refetch();
        } catch (error) {
            toast.error(labels.failedToRemoveDocument);
        }
    };

    const handleCreatePayment = async (e) => {
        e.preventDefault();
        try {
            await createSalaryPayment({ ...paymentForm, staffId: id }).unwrap();
            toast.success(labels.paymentRecorded);
            setShowPaymentForm(false);
            setPaymentForm({ amount: "", month: "", notes: "" });
            refetch();
        } catch (error) {
            toast.error(labels.failedToRecordPayment);
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
            toast.success(labels.paymentRecorded);
            setShowStaffPaymentModal(false);
            setStaffPaymentForm({ amount: "", notes: "" });
            refetch();
        } catch (error) {
            toast.error(labels.failedToRecordPayment);
        }
    };

    const handleDeletePayment = async (paymentId) => {
        if (window.confirm(labels.deletePaymentConfirm)) {
            try {
                await deleteSalaryPayment(paymentId).unwrap();
                toast.success(labels.paymentRecorded);
                refetch();
            } catch (error) {
                toast.error(labels.failedToRecordPayment);
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
            toast.success(labels.imagesUploaded);
            setSelectedImages([]);
            refetch();
        } catch (error) {
            toast.error(labels.failedToUploadImages);
        }
    };

    const handleRemoveImage = async (imageId) => {
        if (window.confirm(labels.deletePaymentConfirm)) {
            try {
                await removeImage({ id, imageId }).unwrap();
                toast.success(labels.imageRemoved);
                refetch();
            } catch (error) {
                toast.error(labels.failedToRemoveImage);
            }
        }
    };

    if (isLoading) {
        return <div className="p-6 text-center">{labels.loading}</div>;
    }

    if (!staff) {
        return <div className="p-6 text-center">{labels.staffNotFound}</div>;
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
                    <p className="text-sm text-[var(--muted)]">{staff.role} - {staff.salaryType} {labels.salary}</p>
                </div>
                <button
                    onClick={() => navigate(`/staff/edit/${id}`)}
                    className="btn-add"
                >
                    <Edit size={16} /> {labels.edit}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-[var(--border)]">
                {["profile", "documents", "saleOrders", "salaryBreakdown", "paymentSummary", "staffPayments"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 capitalize ${
                            activeTab === tab
                                ? "border-b-2 border-[var(--accent-2)] text-[var(--accent-2)]"
                                : "text-[var(--muted)] hover:text-[var(--ink)]"
                        }`}
                    >
                        {tab === "saleOrders" ? labels.saleOrders : tab === "staffPayments" ? labels.staffPayments : tab === "salaryBreakdown" ? labels.salaryBreakdown : tab === "paymentSummary" ? labels.paymentSummary : labels[tab] || tab}
                    </button>
                ))}
            </div>

            {/* Profile Tab */}
            {activeTab === "profile" && (
                <div className="card p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-sm text-[var(--muted)]">{labels.fullName}</label>
                            <p className="font-medium text-[var(--ink)]">{staff.fullName}</p>
                        </div>
                        <div>
                            <label className="text-sm text-[var(--muted)]">{labels.cnic}</label>
                            <p className="font-medium text-[var(--ink)]">{staff.cnic}</p>
                        </div>
                        <div>
                            <label className="text-sm text-[var(--muted)]">{labels.phone}</label>
                            <p className="font-medium text-[var(--ink)]">{staff.phone}</p>
                        </div>
                        <div>
                            <label className="text-sm text-[var(--muted)]">{labels.role}</label>
                            <p className="font-medium text-[var(--ink)] capitalize">{staff.role}</p>
                        </div>
                        <div>
                            <label className="text-sm text-[var(--muted)]">{labels.salaryType}</label>
                            <p className="font-medium text-[var(--ink)] capitalize">{staff.salaryType}</p>
                        </div>
                        <div>
                            <label className="text-sm text-[var(--muted)]">{labels.status}</label>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                                staff.status === 'active' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                            }`}>
                                {staff.status === 'active' ? labels.active : labels.inactive}
                            </span>
                        </div>
                        <div>
                            <label className="text-sm text-[var(--muted)]">{labels.joinDate}</label>
                            <p className="font-medium text-[var(--ink)]">{new Date(staff.joinDate).toLocaleDateString()}</p>
                        </div>
                        {staff.salaryType === "fixed" && (
                            <div>
                                <label className="text-sm text-[var(--muted)]">{labels.monthlySalary}</label>
                                <p className="font-medium text-[var(--ink)]">Rs {staff.monthlySalary || 0}</p>
                            </div>
                        )}
                        {staff.salaryType === "percentage" && (
                            <div>
                                <label className="text-sm text-[var(--muted)]">{labels.commissionRate}</label>
                                <p className="font-medium text-[var(--ink)]">{staff.percentage || 0}%</p>
                            </div>
                        )}
                        {staff.address && (
                            <div className="md:col-span-2">
                                <label className="text-sm text-[var(--muted)]">{labels.address}</label>
                                <p className="font-medium text-[var(--ink)]">{staff.address}</p>
                            </div>
                        )}
                        {staff.emergencyContact && (
                            <div>
                                <label className="text-sm text-[var(--muted)]">{labels.emergencyContact}</label>
                                <p className="font-medium text-[var(--ink)]">{staff.emergencyContact}</p>
                            </div>
                        )}
                        {staff.notes && (
                            <div className="md:col-span-2">
                                <label className="text-sm text-[var(--muted)]">{labels.notes}</label>
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
                        <h3 className="text-lg font-semibold text-[var(--ink)] mb-4">{labels.uploadImages}</h3>
                        <div className="space-y-4">
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="w-full px-3 py-2 border border-[var(--border)] rounded-md"
                            />
                            <p className="text-sm text-[var(--muted)]">{labels.selectMultipleImages}</p>
                        </div>
                    </div>

                    <div className="card p-6">
                        <h3 className="text-lg font-semibold text-[var(--ink)] mb-4">{labels.images}</h3>
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
                            <p className="text-[var(--muted)]">{labels.noImagesUploaded}</p>
                        )}
                    </div>
                </div>
            )}

            {/* Sale Orders Tab - POS Orders */}
            {activeTab === "saleOrders" && (
                <div className="h-[calc(100vh-200px)] flex flex-col">
                    <div className="card p-6 flex-1 flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between mb-4 shrink-0">
                            <h3 className="text-lg font-semibold text-[var(--ink)]">{labels.posOrders}</h3>
                            <ShoppingCart size={20} className="text-[var(--accent-2)]" />
                        </div>

                        {/* Date Filter */}
                        <div className="flex items-center gap-3 mb-4 p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] shrink-0">
                            <Filter size={16} className="text-[var(--muted)]" />
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                    <Calendar size={14} className="text-[var(--muted)]" />
                                    <input
                                        type="date"
                                        value={dateFilter.startDate}
                                        onChange={(e) => handleDateFilterChange('startDate', e.target.value)}
                                        className="px-2 py-1 text-sm border border-[var(--border)] rounded-md"
                                    />
                                </div>
                                <span className="text-[var(--muted)]">{labels.to}</span>
                                <div className="flex items-center gap-1">
                                    <Calendar size={14} className="text-[var(--muted)]" />
                                    <input
                                        type="date"
                                        value={dateFilter.endDate}
                                        onChange={(e) => handleDateFilterChange('endDate', e.target.value)}
                                        className="px-2 py-1 text-sm border border-[var(--border)] rounded-md"
                                    />
                                </div>
                                {(dateFilter.startDate || dateFilter.endDate) && (
                                    <button
                                        onClick={clearDateFilter}
                                        className="text-xs text-red-500 hover:text-red-600"
                                    >
                                        {labels.clear}
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-hidden">
                            <PaginatedList
                                rtkQuery={(params) => useGetSaleBillsQuery({ staffId: id, ...params, ...dateFilter })}
                                limit={20}
                                dataKey="data"
                                renderItems={(orders) => (
                                    <div className="space-y-3">
                                        {orders.map((order) => (
                                            <div key={order._id} className="p-4 border border-[var(--border)] rounded-md">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div>
                                                        <p className="font-medium text-[var(--ink)]">{labels.orderNumber} {order.orderNumber}</p>
                                                        <p className="text-sm text-[var(--muted)]">{new Date(order.createdAt).toLocaleString()}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-[var(--accent-2)]">Rs {order.totalAmount?.toLocaleString() || 0}</p>
                                                        {staff.salaryType === "percentage" && (
                                                            <div className="flex items-center gap-2 justify-end">
                                                                <span className="text-xs text-[var(--muted)]">
                                                                    {labels.earned}: Rs {((order.totalAmount || 0) * (staff.percentage || 0) / 100).toFixed(2)}
                                                                </span>
                                                                <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                                                                    {staff.percentage}%
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-sm text-[var(--muted)]">
                                                    <p>{labels.items}: {order.items?.length || 0}</p>
                                                    <p>{labels.paymentMethod}: {order.paymentMethod}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                renderEmpty={() => (
                                    <div className="flex flex-col items-center justify-center h-full text-center">
                                        <ShoppingCart size={48} className="text-[var(--muted)] mb-4" />
                                        <p className="text-[var(--muted)]">{labels.noPosOrdersFound}</p>
                                    </div>
                                )}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Salary Breakdown Tab - Only for Fixed Salary */}
            {activeTab === "salaryBreakdown" && staff?.salaryType === "fixed" && (
                <div className="space-y-6">
                    <div className="card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-[var(--ink)]">{labels.salaryBreakdown}</h3>
                            <TrendingUp size={20} className="text-[var(--accent-2)]" />
                        </div>

                        {/* Date Filter */}
                        <div className="flex items-center gap-3 mb-4 p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)]">
                            <Filter size={16} className="text-[var(--muted)]" />
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                    <Calendar size={14} className="text-[var(--muted)]" />
                                    <input
                                        type="date"
                                        value={salaryBreakdownFilter.startDate}
                                        onChange={(e) => setSalaryBreakdownFilter(prev => ({ ...prev, startDate: e.target.value }))}
                                        className="px-2 py-1 text-sm border border-[var(--border)] rounded-md"
                                    />
                                </div>
                                <span className="text-[var(--muted)]">{labels.to}</span>
                                <div className="flex items-center gap-1">
                                    <Calendar size={14} className="text-[var(--muted)]" />
                                    <input
                                        type="date"
                                        value={salaryBreakdownFilter.endDate}
                                        onChange={(e) => setSalaryBreakdownFilter(prev => ({ ...prev, endDate: e.target.value }))}
                                        className="px-2 py-1 text-sm border border-[var(--border)] rounded-md"
                                    />
                                </div>
                            </div>
                        </div>

                        {salaryBreakdownData?.data ? (
                            <div className="space-y-4">
                                <div className="p-4 bg-[var(--surface-muted)] rounded-lg">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <p className="text-sm text-[var(--muted)]">{labels.staffName}</p>
                                            <p className="font-medium text-[var(--ink)]">{salaryBreakdownData.data.staffName}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-[var(--muted)]">{labels.monthlySalary}</p>
                                            <p className="font-medium text-[var(--accent-2)]">Rs {salaryBreakdownData.data.monthlySalary?.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-[var(--muted)]">{labels.totalExpected}</p>
                                            <p className="font-medium text-[var(--ink)]">Rs {salaryBreakdownData.data.breakdown.reduce((sum, m) => sum + m.salaryForMonth, 0).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-[var(--muted)]">{labels.totalPaid}</p>
                                            <p className="font-medium text-[var(--accent-2)]">Rs {salaryBreakdownData.data.breakdown.reduce((sum, m) => sum + m.totalPaid, 0).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {salaryBreakdownData.data.breakdown.map((month, index) => (
                                        <div key={index} className="p-4 border border-[var(--border)] rounded-md">
                                            <div className="flex items-center justify-between mb-3">
                                                <div>
                                                    <p className="font-medium text-[var(--ink)]">{month.month}</p>
                                                    <p className="text-xs text-[var(--muted)]">{month.workingDays} / {month.totalDays} {labels.days || "days"}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                                        month.paymentStatus === 'full' ? 'bg-green-100 text-green-700' :
                                                        month.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                        {month.paymentStatus === 'full' ? labels.full : month.paymentStatus === 'partial' ? labels.partial : labels.unpaid}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-4 text-sm">
                                                <div>
                                                    <p className="text-[var(--muted)]">{labels.expected}</p>
                                                    <p className="font-medium text-[var(--ink)]">Rs {month.salaryForMonth.toLocaleString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[var(--muted)]">{labels.paid}</p>
                                                    <p className="font-medium text-[var(--accent-2)]">Rs {month.totalPaid.toLocaleString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[var(--muted)]">{labels.remaining}</p>
                                                    <p className="font-medium text-red-500">Rs {month.remaining.toLocaleString()}</p>
                                                </div>
                                            </div>
                                            {month.payments.length > 0 && (
                                                <div className="mt-3 pt-3 border-t border-[var(--border)]">
                                                    <p className="text-xs text-[var(--muted)] mb-2">{labels.allocatedPayments}:</p>
                                                    <div className="space-y-1">
                                                        {month.payments.map((payment, pIndex) => (
                                                            <div key={pIndex} className="flex justify-between text-xs items-center">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[var(--muted)]">{new Date(payment.paidAt).toLocaleDateString()}</span>
                                                                    {payment.amount !== payment.originalAmount && (
                                                                        <span className="text-[var(--muted)] text-xs">
                                                                            (of Rs {payment.originalAmount?.toLocaleString()})
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <span className="text-[var(--ink)] font-medium">Rs {payment.amount.toLocaleString()}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p className="text-[var(--muted)]">{labels.selectDateRange}</p>
                        )}
                    </div>
                </div>
            )}

            {/* Salary Breakdown Tab - Not applicable for percentage salary */}
            {activeTab === "salaryBreakdown" && staff?.salaryType !== "fixed" && (
                <div className="card p-6 text-center">
                    <p className="text-[var(--muted)]">{labels.salaryBreakdownFixedOnly}</p>
                </div>
            )}

            {/* Payment Summary Tab */}
            {activeTab === "paymentSummary" && (
                <div className="space-y-6">
                    <div className="card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-[var(--ink)]">{labels.paymentSummary}</h3>
                            <PieChart size={20} className="text-[var(--accent-2)]" />
                        </div>

                        {paymentSummaryData?.data ? (
                            <div className="space-y-4">
                                <div className="p-4 bg-[var(--surface-muted)] rounded-lg">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <p className="text-sm text-[var(--muted)]">{labels.staffName}</p>
                                            <p className="font-medium text-[var(--ink)]">{paymentSummaryData.data.staffName}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-[var(--muted)]">{labels.salaryType}</p>
                                            <p className="font-medium text-[var(--ink)] capitalize">{paymentSummaryData.data.salaryType}</p>
                                        </div>
                                        {paymentSummaryData.data.salaryType === 'percentage' && (
                                            <div>
                                                <p className="text-sm text-[var(--muted)]">{labels.percentage}</p>
                                                <p className="font-medium text-[var(--accent-2)]">{paymentSummaryData.data.percentage}%</p>
                                            </div>
                                        )}
                                        {paymentSummaryData.data.salaryType === 'fixed' && (
                                            <div>
                                                <p className="text-sm text-[var(--muted)]">{labels.monthlySalary}</p>
                                                <p className="font-medium text-[var(--accent-2)]">Rs {paymentSummaryData.data.monthlySalary?.toLocaleString()}</p>
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-sm text-[var(--muted)]">{labels.joinDate}</p>
                                            <p className="font-medium text-[var(--ink)]">{new Date(paymentSummaryData.data.joinDate).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-4 border border-[var(--border)] rounded-md text-center">
                                        <p className="text-sm text-[var(--muted)] mb-1">{labels.totalEarnings}</p>
                                        <p className="text-2xl font-bold text-[var(--accent-2)]">Rs {paymentSummaryData.data.totalEarnings.toLocaleString()}</p>
                                    </div>
                                    <div className="p-4 border border-[var(--border)] rounded-md text-center">
                                        <p className="text-sm text-[var(--muted)] mb-1">{labels.totalPaid}</p>
                                        <p className="text-2xl font-bold text-green-600">Rs {paymentSummaryData.data.totalPaid.toLocaleString()}</p>
                                    </div>
                                    <div className="p-4 border border-[var(--border)] rounded-md text-center">
                                        <p className="text-sm text-[var(--muted)] mb-1">{labels.totalRemaining}</p>
                                        <p className="text-2xl font-bold text-red-500">Rs {paymentSummaryData.data.totalRemaining.toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="p-4 border border-[var(--border)] rounded-md">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-[var(--muted)]">{labels.paymentStatus}</p>
                                            <p className="font-medium text-[var(--ink)] capitalize">{paymentSummaryData.data.paymentStatus}</p>
                                        </div>
                                        <span className={`px-3 py-1 text-sm rounded-full ${
                                            paymentSummaryData.data.paymentStatus === 'advanced' ? 'bg-green-100 text-green-700' :
                                            paymentSummaryData.data.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            {paymentSummaryData.data.paymentStatus === 'advanced' ? 'Paid in Advance' :
                                             paymentSummaryData.data.paymentStatus === 'partial' ? 'Partial Payment' :
                                             'Remaining'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-[var(--muted)]">{labels.loading}</p>
                        )}
                    </div>
                </div>
            )}

            {/* Staff Payments Tab */}
            {activeTab === "staffPayments" && (
                <div className="space-y-6">
                    <div className="card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-[var(--ink)]">{labels.staffPayments}</h3>
                            <button
                                onClick={() => setShowStaffPaymentModal(true)}
                                className="btn-add"
                            >
                                <Plus size={16} /> {labels.recordPayment}
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
                                                {payment.status === 'paid' ? labels.paid : labels.partial}
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
                            <p className="text-[var(--muted)]">{labels.noStaffFound}</p>
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
