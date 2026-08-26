import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Upload, Trash2, Plus, ShoppingCart, X, Calendar, Filter, TrendingUp, PieChart, Edit } from "lucide-react";
import { toast } from "sonner";
import { useGetStaffByIdQuery, useAddDocumentMutation, useRemoveDocumentMutation, useGetSalaryPaymentsQuery, useCreateSalaryPaymentMutation, useDeleteSalaryPaymentMutation, useAddImagesMutation, useRemoveImageMutation, useGetSaleBillsQuery, useGetSalaryBreakdownQuery, useGetPaymentSummaryQuery, useGetSalaryChangesQuery, useCreateSalaryChangeMutation, useUpdateSalaryChangeMutation, useDeleteSalaryChangeMutation, useGetPercentageChangesQuery, useCreatePercentageChangeMutation, useUpdatePercentageChangeMutation, useDeletePercentageChangeMutation } from "../api/staff.api.js";
import { getStaffLabels } from "../labels/staffLabels.js";
import { useSettings } from "../../settings/hooks/useSettings.js";
import PaginatedList from "../../../shared/components/PaginatedList.jsx";
import PermissionGuard from "../../../shared/components/PermissionGuard.jsx";
import PercentageShare from "../components/PercentageShare.jsx";
import ConfirmDialog from "../../../shared/components/ConfirmationDialog.jsx";

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
    const [salaryBreakdownFilter] = useState({ 
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const [staffPaymentForm, setStaffPaymentForm] = useState({ amount: "", notes: "" });
    const [selectedImages, setSelectedImages] = useState([]);
    const [showImageModal, setShowImageModal] = useState(false);
    const [selectedImageForModal, setSelectedImageForModal] = useState(null);
    const [showSalaryChangeForm, setShowSalaryChangeForm] = useState(false);
    const [salaryChangeForm, setSalaryChangeForm] = useState({ 
        amount: "", 
        salaryChangeFromDate: "",
        absenceCut: 0,
        isAbsenceCut: false,
        absenceCutType: "full", // "full" or "amount"
        notes: "" 
    });
    const [editingSalaryChange, setEditingSalaryChange] = useState(null);
    const [showPercentageChangeForm, setShowPercentageChangeForm] = useState(false);
    const [percentageChangeForm, setPercentageChangeForm] = useState({ 
        percentage: "", 
        percentageChangeFromDate: "",
        changeType: "set",
        notes: "" 
    });
    const [editingPercentageChange, setEditingPercentageChange] = useState(null);

    const handleCreateSalaryChange = async (e) => {
        e.preventDefault();
        try {
            if (editingSalaryChange) {
                // Update existing salary change
                await updateSalaryChange({ 
                    id: editingSalaryChange._id,
                    data: {
                        ...salaryChangeForm, 
                        changeType: 'set'
                    }
                }).unwrap();
                toast.success("Salary change updated successfully");
            } else {
                // Create new salary change
                await createSalaryChange({ 
                    ...salaryChangeForm, 
                    staffId: id,
                    changeType: 'set' // Use 'set' to indicate absolute salary value
                }).unwrap();
                toast.success("Salary change created successfully");
            }
            setShowSalaryChangeForm(false);
            setSalaryChangeForm({ 
                amount: "", 
                salaryChangeFromDate: "",
                absenceCut: 0,
                isAbsenceCut: false,
                absenceCutType: "full",
                notes: "" 
            });
            setEditingSalaryChange(null);
            refetch();
        } catch (error) {
            toast.error(editingSalaryChange ? "Failed to update salary change" : "Failed to create salary change");
        }
    };

    const handleEditSalaryChange = (change) => {
        setEditingSalaryChange(change);
        setSalaryChangeForm({
            amount: change.amount,
            salaryChangeFromDate: new Date(change.salaryChangeFromDate).toISOString().split('T')[0],
            absenceCut: change.absenceCut || 0,
            isAbsenceCut: change.isAbsenceCut || false,
            absenceCutType: change.absenceCutType || "full",
            notes: change.notes || ""
        });
        setShowSalaryChangeForm(true);
    };
    const [showCalculationDetailModal, setShowCalculationDetailModal] = useState(false);
    const [selectedCalculationDetails, setSelectedCalculationDetails] = useState(null);

    const { data: staffData, isLoading, refetch } = useGetStaffByIdQuery(id);
    const { data: paymentsData } = useGetSalaryPaymentsQuery(id);
    const { data: salaryBreakdownData } = useGetSalaryBreakdownQuery({ 
        staffId: id, 
        startDate: salaryBreakdownFilter.startDate, 
        endDate: salaryBreakdownFilter.endDate 
    });
    
    const { data: paymentSummaryData } = useGetPaymentSummaryQuery({ 
        staffId: id, 
        startDate: undefined, 
        endDate: undefined 
    });
    const { data: salaryChangesData } = useGetSalaryChangesQuery(id);
    const { data: percentageChangesData } = useGetPercentageChangesQuery(id);

    const [addDocument] = useAddDocumentMutation();
    const [removeDocument] = useRemoveDocumentMutation();
    const [createSalaryPayment] = useCreateSalaryPaymentMutation();
    const [deleteSalaryPayment] = useDeleteSalaryPaymentMutation();
    const [addImages] = useAddImagesMutation();
    const [removeImage] = useRemoveImageMutation();
    const [createSalaryChange] = useCreateSalaryChangeMutation();
    const [updateSalaryChange] = useUpdateSalaryChangeMutation();
    const [deleteSalaryChange] = useDeleteSalaryChangeMutation();
    const [createPercentageChange] = useCreatePercentageChangeMutation();
    const [updatePercentageChange] = useUpdatePercentageChangeMutation();
    const [deletePercentageChange] = useDeletePercentageChangeMutation();

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
        try {
            await deleteSalaryPayment(paymentId).unwrap();
            toast.success(labels.paymentRecorded);
            refetch();
        } catch (error) {
            toast.error(labels.failedToRecordPayment);
        }
    };

    const handleImageUpload = async (e) => {
        e.preventDefault();
        const fileInput = document.getElementById('imageInput');
        const files = Array.from(fileInput.files);
        
        if (files.length === 0) {
            toast.error("Please select images first");
            return;
        }

        const formData = new FormData();
        files.forEach(file => {
            formData.append("images", file);
        });

        try {
            await addImages({ id, formData }).unwrap();
            toast.success(labels.imagesUploaded);
            setSelectedImages([]);
            fileInput.value = ''; // Clear the file input
            refetch();
        } catch (error) {
            toast.error(labels.failedToUploadImages);
        }
    };

    const handleRemoveImage = async (imageId) => {
        try {
            await removeImage({ id, imageId }).unwrap();
            toast.success(labels.imageRemoved);
            refetch();
        } catch (error) {
            toast.error(labels.failedToRemoveImage);
        }
    };

    const handleDeleteSalaryChange = async (changeId) => {
        try {
            await deleteSalaryChange(changeId).unwrap();
            toast.success("Salary change deleted successfully");
            refetch();
        } catch (error) {
            toast.error("Failed to delete salary change");
        }
    };

    const handleCreatePercentageChange = async (e) => {
        e.preventDefault();
        try {
            if (editingPercentageChange) {
                await updatePercentageChange({ 
                    id: editingPercentageChange._id,
                    data: percentageChangeForm
                }).unwrap();
                toast.success("Percentage change updated successfully");
            } else {
                await createPercentageChange({ 
                    ...percentageChangeForm, 
                    staffId: id
                }).unwrap();
                toast.success("Percentage change created successfully");
            }
            setShowPercentageChangeForm(false);
            setPercentageChangeForm({ 
                percentage: "", 
                percentageChangeFromDate: "",
                changeType: "set",
                notes: "" 
            });
            setEditingPercentageChange(null);
            refetch();
        } catch (error) {
            toast.error(editingPercentageChange ? "Failed to update percentage change" : "Failed to create percentage change");
        }
    };

    const handleEditPercentageChange = (change) => {
        setEditingPercentageChange(change);
        setPercentageChangeForm({
            percentage: change.percentage,
            percentageChangeFromDate: new Date(change.percentageChangeFromDate).toISOString().split('T')[0],
            changeType: change.changeType || "set",
            notes: change.notes || ""
        });
        setShowPercentageChangeForm(true);
    };

    const handleDeletePercentageChange = async (changeId) => {
        try {
            await deletePercentageChange(changeId).unwrap();
            toast.success("Percentage change deleted successfully");
            refetch();
        } catch (error) {
            toast.error("Failed to delete percentage change");
        }
    };

    const handleViewCalculationDetails = (calculationDetails) => {
        setSelectedCalculationDetails(calculationDetails);
        setShowCalculationDetailModal(true);
    };

    const handleImageClick = (imageSrc) => {
        setSelectedImageForModal(imageSrc);
        setShowImageModal(true);
    };

    const closeImageModal = () => {
        setShowImageModal(false);
        setSelectedImageForModal(null);
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
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-[var(--border)]">
                {["profile", "documents", "percentageChanges", "percentageShare", "saleOrders", "salaryChanges", "salaryBreakdown", "staffPayments", "paymentSummary"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 capitalize ${
                            activeTab === tab
                                ? "border-b-2 border-[var(--accent-2)] text-[var(--accent-2)]"
                                : "text-[var(--muted)] hover:text-[var(--ink)]"
                        }`}
                    >
                        {tab === "saleOrders" ? labels.saleOrders : tab === "staffPayments" ? labels.staffPayments : tab === "salaryBreakdown" ? labels.salaryBreakdown : tab === "paymentSummary" ? labels.paymentSummary : tab === "percentageShare" ? "Percentage Share" : labels[tab] || tab}
                    </button>
                ))}
            </div>

            {/* Profile Tab */}
            {activeTab === "profile" && (
                <div className="space-y-6">
                    {/* Profile Photo Section */}
                    {staff.photo && (
                        <div className="card p-6">
                            <h3 className="text-lg font-semibold text-[var(--ink)] mb-4">Profile Photo</h3>
                            <div className="flex items-center gap-6">
                                <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-[var(--border)] bg-[var(--surface-muted)]">
                                    <img 
                                        src={`http://localhost:5001/uploads/${staff.photo}`}
                                        alt={staff.fullName}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-2xl">' + (staff.fullName?.charAt(0) || 'S') + '</div>';
                                        }}
                                    />
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-[var(--ink)]">{staff.fullName}</h4>
                                    <p className="text-sm text-[var(--muted)]">{staff.role} - {staff.salaryType} {labels.salary}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Staff Information */}
                    <div className="card p-6">
                        <h3 className="text-lg font-semibold text-[var(--ink)] mb-4">Staff Information</h3>
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
                                id="imageInput"
                                multiple
                                accept="image/*"
                                onChange={(e) => {
                                    const files = Array.from(e.target.files);
                                    const previews = files.map(file => URL.createObjectURL(file));
                                    setSelectedImages(previews);
                                }}
                                className="w-full px-3 py-2 border border-[var(--border)] rounded-md"
                            />
                            <p className="text-sm text-[var(--muted)]">{labels.selectMultipleImages}</p>
                            
                            {/* Local Preview */}
                            {selectedImages.length > 0 && (
                                <div className="mt-4">
                                    <p className="text-sm font-medium text-[var(--ink)] mb-2">{labels.preview}:</p>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                                        {selectedImages.map((preview, index) => (
                                            <div key={index} className="relative">
                                                <img
                                                    src={preview}
                                                    alt={`Preview ${index + 1}`}
                                                    className="w-full h-32 object-cover rounded-md border border-[var(--border)]"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        onClick={handleImageUpload}
                                        className="btn-add"
                                    >
                                        <Upload size={16} /> {labels.upload}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="card p-6">
                        <h3 className="text-lg font-semibold text-[var(--ink)] mb-4">{labels.images}</h3>
                        {staff.documents?.length ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {staff.documents.map((doc) => (
                                    doc.filePath && (
                                        <div key={doc._id} className="relative group">
                                            <img
                                                src={`http://localhost:5001/uploads/${doc.filePath}`}
                                                alt="Document"
                                                className="w-full h-32 object-cover rounded-md border border-[var(--border)] cursor-pointer hover:opacity-90 transition-opacity"
                                                onClick={() => handleImageClick(`http://localhost:5001/uploads/${doc.filePath}`)}
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.parentElement.innerHTML = '<div class="w-full h-32 flex items-center justify-center bg-[var(--surface-muted)] text-[var(--muted)] text-sm">Image not found</div>';
                                                }}
                                            />
                                            <ConfirmDialog message={labels.deletePaymentConfirm} onConfirm={() => handleRemoveImage(doc._id)}>
                                                <PermissionGuard permission="staff.documents.delete">
                                                    <button
                                                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </PermissionGuard>
                                            </ConfirmDialog>
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

            {/* Percentage Share Tab */}
            {activeTab === "percentageShare" && (
                <PercentageShare staffId={id} staffData={staff} />
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
                                rtkQuery={useGetSaleBillsQuery}
                                limit={20}
                                dataKey="data"
                                queryArgs={{ staffId: id, ...dateFilter }}
                                renderItems={(orders) => (
                                    <div className="overflow-x-auto rounded-2xl overflow-hidden border-edge">
                                        <table className="w-full text-sm text-left">
                                            <thead>
                                                <tr className="text-xs uppercase tracking-wider bg-surface-muted border-b border-edge text-ink-muted">
                                                    <th className="px-4 py-3 font-semibold">{labels.orderNumber || "Order #"}</th>
                                                    <th className="px-4 py-3 font-semibold">{labels.date || "Date"}</th>
                                                    <th className="px-4 py-3 font-semibold text-right">{labels.total || "Total"}</th>
                                                    {staff.salaryType === "percentage" && (
                                                        <th className="px-4 py-3 font-semibold text-right">{labels.earned || "Earned"}</th>
                                                    )}
                                                    <th className="px-4 py-3 font-semibold">{labels.items || "Items"}</th>
                                                    <th className="px-4 py-3 font-semibold">{labels.paymentMethod || "Payment"}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {orders.map((order) => (
                                                    <tr key={order._id} className="transition border-b border-edge hover:bg-surface-muted">
                                                        <td className="px-4 py-3 font-mono text-xs text-ink-muted">{order.orderNumber || "—"}</td>
                                                        <td className="px-4 py-3 text-ink-muted">{new Date(order.createdAt).toLocaleString()}</td>
                                                        <td className="px-4 py-3 text-right font-semibold text-primary">Rs {order.totalAmount?.toLocaleString() || 0}</td>
                                                        {staff.salaryType === "percentage" && (
                                                            <td className="px-4 py-3 text-right font-semibold text-green-600">
                                                                Rs {((order.totalAmount || 0) * (staff.percentage || 0) / 100).toFixed(2)}
                                                            </td>
                                                        )}
                                                        <td className="px-4 py-3 text-ink-muted">{order.items?.length || 0}</td>
                                                        <td className="px-4 py-3 text-ink-muted capitalize">{order.paymentMethod || "—"}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
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

            {/* Salary Breakdown Tab */}
            {activeTab === "salaryBreakdown" && (
                <div className="space-y-6">
                    <div className="card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-[var(--ink)]">{labels.salaryBreakdown}</h3>
                            <TrendingUp size={20} className="text-[var(--accent-2)]" />
                        </div>

                        {salaryBreakdownData?.data && salaryBreakdownData.data.breakdown && salaryBreakdownData.data.breakdown.length > 0 ? (
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
                                            
                                            {/* Attendance Breakdown */}
                                            <div className="grid grid-cols-4 gap-2 text-xs mb-3 p-2 bg-[var(--surface-muted)] rounded">
                                                <div className="text-center">
                                                    <p className="text-green-600 font-semibold">{month.presentDays || 0}</p>
                                                    <p className="text-[var(--muted)]">Present</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-red-600 font-semibold">{month.absentDays || 0}</p>
                                                    <p className="text-[var(--muted)]">Absent</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-yellow-600 font-semibold">{month.leaveDays || 0}</p>
                                                    <p className="text-[var(--muted)]">Leave</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-orange-600 font-semibold">{month.lateDays || 0}</p>
                                                    <p className="text-[var(--muted)]">Late</p>
                                                </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-3 gap-4 text-sm">
                                                <div>
                                                    <p className="text-[var(--muted)]">{labels.expected}</p>
                                                    <p className="font-medium text-[var(--ink)]">Rs {month.salaryForMonth.toLocaleString()}</p>
                                                </div>
                                            </div>
                                            
                                            {/* Detail Button */}
                                            {month.calculationDetails && month.calculationDetails.length > 0 && (
                                                <button
                                                    onClick={() => handleViewCalculationDetails(month.calculationDetails)}
                                                    className="mt-3 text-xs text-[var(--accent-2)] hover:underline"
                                                >
                                                    View Calculation Details
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p className="text-[var(--muted)]">No salary breakdown data available</p>
                        )}
                    </div>
                </div>
            )}

            {/* Salary Changes Tab */}
            {activeTab === "salaryChanges" && (
                <div className="space-y-6">
                    <div className="card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-[var(--ink)]">Salary Changes</h3>
                            <button
                                onClick={() => setShowSalaryChangeForm(true)}
                                className="btn-add"
                            >
                                <Plus size={16} /> Add Salary Change
                            </button>
                        </div>

                        {salaryChangesData?.data && salaryChangesData.data.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead>
                                        <tr className="text-xs uppercase tracking-wider bg-[var(--surface-muted)] border-b border-[var(--border)] text-[var(--muted)]">
                                            <th className="px-3 py-2 font-semibold">Effective From</th>
                                            <th className="px-3 py-2 font-semibold">Amount</th>
                                            <th className="px-3 py-2 font-semibold">Type</th>
                                            <th className="px-3 py-2 font-semibold">Absence Cut</th>
                                            <th className="px-3 py-2 font-semibold">Notes</th>
                                            <th className="px-3 py-2 font-semibold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {salaryChangesData.data.map((change) => (
                                            <tr key={change._id} className="border-b border-[var(--border)] hover:bg-[var(--surface-muted)]">
                                                <td className="px-3 py-2 text-[var(--ink)]">{new Date(change.salaryChangeFromDate).toLocaleDateString()}</td>
                                                <td className="px-3 py-2 font-medium text-[var(--accent-2)]">Rs {change.amount}</td>
                                                <td className="px-3 py-2">
                                                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                                                        Salary Set
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 text-[var(--muted)]">
                                                    {change.isAbsenceCut ? `Rs ${change.absenceCut}` : '-'}
                                                </td>
                                                <td className="px-3 py-2 text-[var(--muted)]">{change.notes || '-'}</td>
                                                <td className="px-3 py-2 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button 
                                                            onClick={() => handleEditSalaryChange(change)}
                                                            className="p-1 hover:bg-blue-100 rounded"
                                                        >
                                                            <Edit size={14} className="text-blue-500" />
                                                        </button>
                                                        <ConfirmDialog message="Are you sure you want to delete this salary change?" onConfirm={() => handleDeleteSalaryChange(change._id)}>
                                                            <button className="p-1 hover:bg-red-100 rounded">
                                                                <Trash2 size={14} className="text-red-500" />
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
                            <p className="text-[var(--muted)]">No salary changes recorded</p>
                        )}
                    </div>

                    {/* Salary Change Form Modal */}
                    {showSalaryChangeForm && (
                        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold">{editingSalaryChange ? 'Edit Salary Change' : 'Add Salary Change'}</h3>
                                    <button onClick={() => {
                                        setShowSalaryChangeForm(false);
                                        setEditingSalaryChange(null);
                                        setSalaryChangeForm({ 
                                            amount: "", 
                                            salaryChangeFromDate: "",
                                            absenceCut: 0,
                                            isAbsenceCut: false,
                                            notes: "" 
                                        });
                                    }}>
                                        <X size={20} />
                                    </button>
                                </div>
                                <form onSubmit={handleCreateSalaryChange}>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Amount (absolute salary value)</label>
                                            <input
                                                type="number"
                                                value={salaryChangeForm.amount}
                                                onChange={(e) => setSalaryChangeForm(prev => ({ ...prev, amount: e.target.value }))}
                                                className="w-full px-3 py-2 border border-[var(--border)] rounded-md"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Effective From</label>
                                            <input
                                                type="date"
                                                value={salaryChangeForm.salaryChangeFromDate}
                                                onChange={(e) => setSalaryChangeForm(prev => ({ ...prev, salaryChangeFromDate: e.target.value }))}
                                                className="w-full px-3 py-2 border border-[var(--border)] rounded-md"
                                                required
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={salaryChangeForm.isAbsenceCut}
                                                onChange={(e) => setSalaryChangeForm(prev => ({ 
                                                    ...prev, 
                                                    isAbsenceCut: e.target.checked,
                                                    absenceCut: e.target.checked ? prev.absenceCut : 0
                                                }))}
                                            />
                                            <label className="text-sm">Enable Absence Cut</label>
                                        </div>
                                        {salaryChangeForm.isAbsenceCut && (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-4">
                                                    <label className="flex items-center gap-2">
                                                        <input
                                                            type="radio"
                                                            name="absenceCutType"
                                                            value="full"
                                                            checked={salaryChangeForm.absenceCutType === "full"}
                                                            onChange={(e) => setSalaryChangeForm(prev => ({ 
                                                                ...prev, 
                                                                absenceCutType: e.target.value,
                                                                absenceCut: 0
                                                            }))}
                                                        />
                                                        <span className="text-sm">Full Cut</span>
                                                    </label>
                                                    <label className="flex items-center gap-2">
                                                        <input
                                                            type="radio"
                                                            name="absenceCutType"
                                                            value="amount"
                                                            checked={salaryChangeForm.absenceCutType === "amount"}
                                                            onChange={(e) => setSalaryChangeForm(prev => ({ 
                                                                ...prev, 
                                                                absenceCutType: e.target.value,
                                                                absenceCut: 0
                                                            }))}
                                                        />
                                                        <span className="text-sm">Amount Cut</span>
                                                    </label>
                                                </div>
                                                {salaryChangeForm.absenceCutType === "amount" && (
                                                    <div>
                                                        <label className="block text-sm font-medium mb-1">Absence Cut Amount</label>
                                                        <input
                                                            type="number"
                                                            value={salaryChangeForm.absenceCut}
                                                            onChange={(e) => setSalaryChangeForm(prev => ({ ...prev, absenceCut: e.target.value }))}
                                                            className="w-full px-3 py-2 border border-[var(--border)] rounded-md"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Notes</label>
                                            <textarea
                                                value={salaryChangeForm.notes}
                                                onChange={(e) => setSalaryChangeForm(prev => ({ ...prev, notes: e.target.value }))}
                                                className="w-full px-3 py-2 border border-[var(--border)] rounded-md"
                                                rows="2"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-4">
                                        <button type="button" onClick={() => setShowSalaryChangeForm(false)} className="flex-1 px-4 py-2 border border-[var(--border)] rounded-md">
                                            Cancel
                                        </button>
                                        <button type="submit" className="flex-1 px-4 py-2 bg-[var(--accent-2)] text-white rounded-md">
                                            Save
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Percentage Changes Tab */}
            {activeTab === "percentageChanges" && (
                <div className="space-y-6">
                    <div className="card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-[var(--ink)]">Percentage Changes</h3>
                            <button
                                onClick={() => setShowPercentageChangeForm(true)}
                                className="btn-add"
                            >
                                <Plus size={16} /> Add Percentage Change
                            </button>
                        </div>

                        {percentageChangesData?.data && percentageChangesData.data.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead>
                                        <tr className="text-xs uppercase tracking-wider bg-[var(--surface-muted)] border-b border-[var(--border)] text-[var(--muted)]">
                                            <th className="px-3 py-2 font-semibold">Effective From</th>
                                            <th className="px-3 py-2 font-semibold">Percentage</th>
                                            <th className="px-3 py-2 font-semibold">Type</th>
                                            <th className="px-3 py-2 font-semibold">Notes</th>
                                            <th className="px-3 py-2 font-semibold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {percentageChangesData.data.map((change) => (
                                            <tr key={change._id} className="border-b border-[var(--border)] hover:bg-[var(--surface-muted)]">
                                                <td className="px-3 py-2 text-[var(--ink)]">{new Date(change.percentageChangeFromDate).toLocaleDateString()}</td>
                                                <td className="px-3 py-2 font-medium text-[var(--accent-2)]">{change.percentage}%</td>
                                                <td className="px-3 py-2">
                                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                                        change.changeType === 'inc' ? 'bg-green-100 text-green-700' :
                                                        change.changeType === 'decr' ? 'bg-red-100 text-red-700' :
                                                        'bg-blue-100 text-blue-700'
                                                    }`}>
                                                        {change.changeType === 'inc' ? 'Increase' :
                                                         change.changeType === 'decr' ? 'Decrease' :
                                                         'Set'}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 text-[var(--muted)]">{change.notes || '-'}</td>
                                                <td className="px-3 py-2 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button 
                                                            onClick={() => handleEditPercentageChange(change)}
                                                            className="p-1 hover:bg-blue-100 rounded"
                                                        >
                                                            <Edit size={14} className="text-blue-500" />
                                                        </button>
                                                        <ConfirmDialog message="Are you sure you want to delete this percentage change?" onConfirm={() => handleDeletePercentageChange(change._id)}>
                                                            <button className="p-1 hover:bg-red-100 rounded">
                                                                <Trash2 size={14} className="text-red-500" />
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
                            <p className="text-[var(--muted)]">No percentage changes recorded</p>
                        )}
                    </div>

                    {/* Percentage Change Form Modal */}
                    {showPercentageChangeForm && (
                        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold">{editingPercentageChange ? 'Edit Percentage Change' : 'Add Percentage Change'}</h3>
                                    <button onClick={() => {
                                        setShowPercentageChangeForm(false);
                                        setEditingPercentageChange(null);
                                        setPercentageChangeForm({ 
                                            percentage: "", 
                                            percentageChangeFromDate: "",
                                            changeType: "set",
                                            notes: "" 
                                        });
                                    }}>
                                        <X size={20} />
                                    </button>
                                </div>
                                <form onSubmit={handleCreatePercentageChange}>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Percentage (%)</label>
                                            <input
                                                type="number"
                                                value={percentageChangeForm.percentage}
                                                onChange={(e) => setPercentageChangeForm(prev => ({ ...prev, percentage: e.target.value }))}
                                                className="w-full px-3 py-2 border border-[var(--border)] rounded-md"
                                                required
                                                min="0"
                                                max="100"
                                                step="0.1"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Effective From</label>
                                            <input
                                                type="date"
                                                value={percentageChangeForm.percentageChangeFromDate}
                                                onChange={(e) => setPercentageChangeForm(prev => ({ ...prev, percentageChangeFromDate: e.target.value }))}
                                                className="w-full px-3 py-2 border border-[var(--border)] rounded-md"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Notes</label>
                                            <textarea
                                                value={percentageChangeForm.notes}
                                                onChange={(e) => setPercentageChangeForm(prev => ({ ...prev, notes: e.target.value }))}
                                                className="w-full px-3 py-2 border border-[var(--border)] rounded-md"
                                                rows="2"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-4">
                                        <button type="button" onClick={() => setShowPercentageChangeForm(false)} className="flex-1 px-4 py-2 border border-[var(--border)] rounded-md">
                                            Cancel
                                        </button>
                                        <button type="submit" className="flex-1 px-4 py-2 bg-[var(--accent-2)] text-white rounded-md">
                                            Save
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
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
                                            <p className="text-sm text-[var(--muted)]">Period</p>
                                            <p className="font-medium text-[var(--ink)]">
                                                {paymentSummaryData.data.startDate ? `${new Date(paymentSummaryData.data.startDate).toLocaleDateString()} - ${new Date(paymentSummaryData.data.endDate).toLocaleDateString()}` : 'All Time'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* 5 KPIs */}
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                    <div className="p-4 border border-[var(--border)] rounded-md text-center">
                                        <p className="text-sm text-[var(--muted)] mb-1">Commission</p>
                                        <p className="text-2xl font-bold text-purple-600">Rs {paymentSummaryData.data.totalCommissionEarnings.toLocaleString()}</p>
                                    </div>
                                    <div className="p-4 border border-[var(--border)] rounded-md text-center">
                                        <p className="text-sm text-[var(--muted)] mb-1">Salary</p>
                                        <p className="text-2xl font-bold text-blue-600">Rs {paymentSummaryData.data.totalSalaryEarnings.toLocaleString()}</p>
                                    </div>
                                    <div className="p-4 border border-[var(--border)] rounded-md text-center">
                                        <p className="text-sm text-[var(--muted)] mb-1">Paid</p>
                                        <p className="text-2xl font-bold text-green-600">Rs {paymentSummaryData.data.totalPaid.toLocaleString()}</p>
                                    </div>
                                    <div className="p-4 border border-[var(--border)] rounded-md text-center">
                                        <p className="text-sm text-[var(--muted)] mb-1">Remaining</p>
                                        <p className="text-2xl font-bold text-red-500">Rs {paymentSummaryData.data.totalRemaining.toLocaleString()}</p>
                                    </div>
                                    <div className="p-4 border border-[var(--border)] rounded-md text-center">
                                        <p className="text-sm text-[var(--muted)] mb-1">Advance</p>
                                        <p className="text-2xl font-bold text-orange-600">Rs {paymentSummaryData.data.totalAdvance.toLocaleString()}</p>
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
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead>
                                        <tr className="text-xs uppercase tracking-wider bg-[var(--surface-muted)] border-b border-[var(--border)] text-[var(--muted)]">
                                            <th className="px-3 py-2 font-semibold">Date</th>
                                            <th className="px-3 py-2 font-semibold">Amount</th>
                                            <th className="px-3 py-2 font-semibold">Month</th>
                                            <th className="px-3 py-2 font-semibold">Notes</th>
                                            <th className="px-3 py-2 font-semibold">Status</th>
                                            <th className="px-3 py-2 font-semibold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payments.map((payment) => (
                                            <tr key={payment._id} className="border-b border-[var(--border)] hover:bg-[var(--surface-muted)]">
                                                <td className="px-3 py-2 text-[var(--ink)]">{new Date(payment.paidAt).toLocaleDateString()}</td>
                                                <td className="px-3 py-2 font-medium text-[var(--accent-2)]">Rs {payment.amount}</td>
                                                <td className="px-3 py-2 text-[var(--ink)]">{payment.month || '-'}</td>
                                                <td className="px-3 py-2 text-[var(--muted)]">{payment.notes || '-'}</td>
                                                <td className="px-3 py-2">
                                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                                        payment.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                        {payment.status === 'paid' ? labels.paid : labels.partial}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 text-right">
                                                    <ConfirmDialog message={labels.deletePaymentConfirm} onConfirm={() => handleDeletePayment(payment._id)}>
                                                        <PermissionGuard permission="staff.payments.delete">
                                                            <button
                                                                className="p-2 hover:bg-red-50 rounded-md"
                                                            >
                                                                <Trash2 size={16} className="text-red-500" />
                                                            </button>
                                                        </PermissionGuard>
                                                    </ConfirmDialog>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
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
                    <div className="bg-[var(--surface)] rounded-lg p-6 w-full max-w-md border border-[var(--border)]">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-[var(--ink)]">Create Staff Payment</h3>
                            <button
                                onClick={() => setShowStaffPaymentModal(false)}
                                className="p-2 hover:bg-[var(--app-bg)] rounded"
                            >
                                <X size={20} className="text-[var(--ink)]" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateStaffPayment} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-[var(--ink)]">Amount (Rs)</label>
                                <input
                                    type="number"
                                    value={staffPaymentForm.amount}
                                    onChange={(e) => setStaffPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                                    required
                                    min="0"
                                    className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--app-bg)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent-2)]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-[var(--ink)]">Notes</label>
                                <textarea
                                    value={staffPaymentForm.notes}
                                    onChange={(e) => setStaffPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                                    className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--app-bg)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent-2)]"
                                    rows="3"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowStaffPaymentModal(false)}
                                    className="flex-1 px-4 py-2 border border-[var(--border)] rounded-md hover:bg-[var(--app-bg)] text-[var(--ink)]"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-[var(--accent-2)] text-white rounded-md hover:opacity-90"
                                >
                                    Create Payment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Image Preview Modal */}
            {showImageModal && selectedImageForModal && (
                <div 
                    className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
                    onClick={closeImageModal}
                >
                    <div className="relative max-w-5xl max-h-[90vh]">
                        <button
                            onClick={closeImageModal}
                            className="absolute -top-10 right-0 p-2 text-white hover:text-gray-300 transition-colors"
                        >
                            <X size={32} />
                        </button>
                        <img
                            src={selectedImageForModal}
                            alt="Enlarged view"
                            className="max-w-full max-h-[90vh] object-contain rounded-lg"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}

            {activeTab === "payments" && staff.salaryType !== "fixed" && (
                <div className="card p-6 text-center text-[var(--muted)]">
                    Salary payments are only applicable for fixed salary staff
                </div>
            )}

            {/* Calculation Detail Modal */}
            {showCalculationDetailModal && selectedCalculationDetails && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Salary Calculation Details</h3>
                            <button onClick={() => setShowCalculationDetailModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead>
                                    <tr className="text-xs uppercase tracking-wider bg-[var(--surface-muted)] border-b border-[var(--border)] text-[var(--muted)]">
                                        <th className="px-3 py-2 font-semibold">Date</th>
                                        <th className="px-3 py-2 font-semibold">Status</th>
                                        <th className="px-3 py-2 font-semibold">Effective Salary</th>
                                        <th className="px-3 py-2 font-semibold text-right">Daily Salary</th>
                                        <th className="px-3 py-2 font-semibold text-right">Absence Cut</th>
                                        <th className="px-3 py-2 font-semibold text-right">Cut Type</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedCalculationDetails.map((detail, index) => (
                                        <tr key={index} className="border-b border-[var(--border)] hover:bg-[var(--surface-muted)]">
                                            <td className="px-3 py-2 text-[var(--ink)]">{new Date(detail.date).toLocaleDateString()}</td>
                                            <td className="px-3 py-2 capitalize text-[var(--muted)]">{detail.status}</td>
                                            <td className="px-3 py-2 text-[var(--accent-2)]">
                                                Rs {detail.effectiveSalary?.toFixed(2) || 0}
                                            </td>
                                            <td className="px-3 py-2 text-right font-medium text-[var(--ink)]">Rs {detail.dailySalary?.toFixed(2) || 0}</td>
                                            <td className="px-3 py-2 text-right text-red-500">
                                                {detail.absenceCutAmount > 0 ? `-Rs ${detail.absenceCutAmount.toFixed(2)}` : '-'}
                                            </td>
                                            <td className="px-3 py-2 text-right text-[var(--muted)]">
                                                {detail.isAbsenceCutEnabled ? (detail.absenceCutType === 'full' ? 'Full' : 'Amount') : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
