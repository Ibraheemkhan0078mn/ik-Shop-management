import React, { useState, useEffect, useRef } from "react";
import { X, Save, Upload, User, Phone, IdCard, Briefcase, MapPin, Calendar, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { useCreateStaffMutation, useUpdateStaffMutation } from "../api/staff.api.js";
import { getStaffLabels } from "../labels/staffLabels.js";
import { useSettings } from "../../settings/hooks/useSettings.js";
import { toImageUrl } from "../../../shared/utilities/image.utility.js";
import ImageCropper from "../../../shared/components/ImageCropper.jsx";

export default function StaffModal({ isOpen, onClose, editData = null, isEditMode = false, onSuccess }) {
    const fileInputRef = useRef(null);
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getStaffLabels(language);

    const [formData, setFormData] = useState({
        fullName: "",
        cnic: "",
        phone: "",
        role: "other",
        salaryType: "fixed",
        joinDate: new Date().toISOString().split('T')[0],
        address: "",
        emergencyContact: "",
        notes: "",
        monthlySalary: 0,
        percentage: 0,
        status: "active",
    });

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    const [createStaff, { isLoading: isCreating }] = useCreateStaffMutation();
    const [updateStaff, { isLoading: isUpdating }] = useUpdateStaffMutation();

    useEffect(() => {
        if (isEditMode && editData) {
            setFormData({
                fullName: editData.fullName || "",
                cnic: editData.cnic || "",
                phone: editData.phone || "",
                role: editData.role || "other",
                salaryType: editData.salaryType || "fixed",
                joinDate: editData.joinDate ? new Date(editData.joinDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                address: editData.address || "",
                emergencyContact: editData.emergencyContact || "",
                notes: editData.notes || "",
                monthlySalary: editData.monthlySalary || 0,
                percentage: editData.percentage || 0,
                status: editData.status || "active",
            });
            if (editData.photo) {
                setImagePreview(toImageUrl(editData.photo));
            }
        }
    }, [isEditMode, editData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (files) => {
        const file = files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast.error("Please select an image file");
                return;
            }
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Image size should be less than 5MB");
                return;
            }
            
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const submitData = new FormData();
            
            // Append all text fields
            Object.keys(formData).forEach(key => {
                submitData.append(key, formData[key]);
            });
            
            // Append image if selected
            if (imageFile) {
                submitData.append('photo', imageFile);
            }
            
            if (isEditMode) {
                await updateStaff({ id: editData._id, data: submitData }).unwrap();
                toast.success(labels.staffUpdated || "Staff updated successfully");
            } else {
                await createStaff(submitData).unwrap();
                toast.success(labels.staffCreated || "Staff created successfully");
            }
            
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error('Error:', error);
            
            // Handle duplicate field error
            const errorMessage = error?.data?.error || error?.data?.message || '';
            
            if (errorMessage.toLowerCase().includes('already exists') || 
                errorMessage.toLowerCase().includes('duplicate') ||
                error?.status === 400 && errorMessage.includes('cnic')) {
                // Show the backend's detailed error message
                toast.error(errorMessage);
            } else if (error?.data?.message) {
                toast.error(error.data.message);
            } else if (error?.data?.error) {
                toast.error(error.data.error);
            } else {
                toast.error(isEditMode ? labels.failedToUpdate : labels.failedToCreate);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 lg:p-8">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Main Modal Container */}
            <div className="relative w-full max-w-5xl bg-(--surface) rounded-3xl shadow-2xl border-2 border-edge overflow-hidden flex flex-col lg:flex-row animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 max-h-[90vh]">

                {/* Left Branding Panel */}
                <div className="hidden lg:flex w-[35%] bg-gradient-to-b from-primary to-[#0d8a7e] p-12 flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full -ml-32 -mb-32 blur-3xl" />

                    <div className="relative z-10">
                        <div className="flex flex-col items-center mb-8">
                            {/* Image Upload with Cropper */}
                            <div className="relative mb-8 flex-shrink-0">
                                <ImageCropper
                                    accept="image/*"
                                    aspectRatio={1}
                                    cropShape="round"
                                    showPreview={false}
                                    onChange={handleImageChange}
                                >
                                    <div className="w-40 h-40 rounded-full bg-white/20 backdrop-blur-xl border-4 border-white/30 overflow-hidden cursor-pointer hover:scale-105 transition-all flex items-center justify-center">
                                        {imagePreview ? (
                                            <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                                                <User className="w-12 h-12 text-white/70" />
                                                <span className="text-[9px] font-black text-white/70 uppercase tracking-widest">Upload Photo</span>
                                            </div>
                                        )}
                                    </div>
                                </ImageCropper>
                            </div>

                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={(e) => handleImageChange(e.target.files)}
                                className="hidden"
                                accept="image/*"
                            />
                        </div>

                        <h2 className="text-4xl font-black text-white leading-tight tracking-tighter">
                            {isEditMode ? 'Edit' : 'Create'}<br />Staff<br />Member
                        </h2>
                        <div className="h-1 w-12 bg-white/40 mt-6 rounded-full" />
                    </div>

                    <div className="relative z-10">
                        <p className="text-white/90 text-sm font-medium leading-relaxed">
                            {isEditMode 
                                ? "Update staff member information and manage their profile details."
                                : "Add a new team member with complete details and profile information."
                            }
                        </p>
                    </div>
                </div>

                {/* Form Content Side */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Header Controls */}
                    <div className="px-8 pt-8 pb-4 flex justify-between items-center shrink-0">
                        <div className="lg:hidden">
                            <h2 className="text-xl font-black text-ink">
                                {isEditMode ? 'Edit Staff Member' : 'New Staff Member'}
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="ml-auto w-10 h-10 bg-(--surface-muted) hover:bg-red-500 hover:text-white rounded-full flex items-center justify-center transition-all duration-300 active:scale-90"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Scrollable Form */}
                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar px-8 lg:px-12 pb-12 space-y-8">

                        {/* Personal Information */}
                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black text-ink-subtle uppercase tracking-[0.2em]">Personal Information</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex flex-col gap-2 group">
                                    <label className="text-[10px] font-black text-ink-subtle uppercase tracking-[0.2em] ml-1">
                                        Full Name <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            name="fullName"
                                            value={formData.fullName}
                                            onChange={handleChange}
                                            required
                                            placeholder="Enter full name"
                                            className="w-full bg-(--surface-muted) border-2 border-edge rounded-2xl pl-12 pr-5 py-4 outline-none focus:border-primary focus:bg-(--surface) transition-all font-bold text-ink placeholder:text-ink-subtle/50 shadow-inner"
                                        />
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-subtle group-focus-within:text-primary text-xl transition-colors" size={20} />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 group">
                                    <label className="text-[10px] font-black text-ink-subtle uppercase tracking-[0.2em] ml-1">
                                        CNIC <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            name="cnic"
                                            value={formData.cnic}
                                            onChange={handleChange}
                                            required
                                            placeholder="XXXXX-XXXXXXX-X"
                                            className="w-full bg-(--surface-muted) border-2 border-edge rounded-2xl pl-12 pr-5 py-4 outline-none focus:border-primary focus:bg-(--surface) transition-all font-bold text-ink shadow-inner"
                                        />
                                        <IdCard className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-subtle group-focus-within:text-primary transition-colors" size={20} />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 group">
                                    <label className="text-[10px] font-black text-ink-subtle uppercase tracking-[0.2em] ml-1">
                                        Phone <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            required
                                            placeholder="+92 XXX XXXXXXX"
                                            className="w-full bg-(--surface-muted) border-2 border-edge rounded-2xl pl-12 pr-5 py-4 outline-none focus:border-primary focus:bg-(--surface) transition-all font-bold text-ink shadow-inner"
                                        />
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-subtle group-focus-within:text-primary transition-colors" size={20} />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 group">
                                    <label className="text-[10px] font-black text-ink-subtle uppercase tracking-[0.2em] ml-1">
                                        Emergency Contact
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="tel"
                                            name="emergencyContact"
                                            value={formData.emergencyContact}
                                            onChange={handleChange}
                                            placeholder="+92 XXX XXXXXXX"
                                            className="w-full bg-(--surface-muted) border-2 border-edge rounded-2xl pl-12 pr-5 py-4 outline-none focus:border-primary focus:bg-(--surface) transition-all font-bold text-ink shadow-inner"
                                        />
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-subtle group-focus-within:text-primary transition-colors" size={20} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 group">
                                <label className="text-[10px] font-black text-ink-subtle uppercase tracking-[0.2em] ml-1">Address</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="Enter complete address"
                                        className="w-full bg-(--surface-muted) border-2 border-edge rounded-2xl pl-12 pr-5 py-4 outline-none focus:border-primary focus:bg-(--surface) transition-all font-bold text-ink shadow-inner"
                                    />
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-subtle group-focus-within:text-primary transition-colors" size={20} />
                                </div>
                            </div>
                        </div>

                        {/* Employment Information */}
                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black text-ink-subtle uppercase tracking-[0.2em]">Employment Details</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-black text-ink-subtle uppercase tracking-[0.2em] ml-1">
                                        Role <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            name="role"
                                            value={formData.role}
                                            onChange={handleChange}
                                            required
                                            className="w-full bg-(--surface-muted) border-2 border-edge rounded-2xl px-5 py-4 outline-none focus:border-primary focus:bg-(--surface) transition-all font-bold text-ink appearance-none cursor-pointer shadow-inner"
                                        >
                                            <option value="cashier">{labels.cashier}</option>
                                            <option value="tailor">{labels.tailor}</option>
                                            <option value="stockKeeper">{labels.stockKeeper}</option>
                                            <option value="other">{labels.other}</option>
                                        </select>
                                        <Briefcase className="absolute right-4 top-1/2 -translate-y-1/2 text-primary pointer-events-none" size={20} />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 group">
                                    <label className="text-[10px] font-black text-ink-subtle uppercase tracking-[0.2em] ml-1">
                                        Join Date <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            name="joinDate"
                                            value={formData.joinDate}
                                            onChange={handleChange}
                                            required
                                            className="w-full bg-(--surface-muted) border-2 border-edge rounded-2xl pl-12 pr-5 py-4 outline-none focus:border-primary focus:bg-(--surface) transition-all font-bold text-ink shadow-inner"
                                        />
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-subtle group-focus-within:text-primary transition-colors" size={20} />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-black text-ink-subtle uppercase tracking-[0.2em] ml-1">Status</label>
                                    <div className="relative">
                                        <select
                                            name="status"
                                            value={formData.status}
                                            onChange={handleChange}
                                            className="w-full bg-(--surface-muted) border-2 border-edge rounded-2xl px-5 py-4 outline-none focus:border-primary focus:bg-(--surface) transition-all font-bold text-ink appearance-none cursor-pointer shadow-inner"
                                        >
                                            <option value="active">{labels.active}</option>
                                            <option value="inactive">{labels.inactive}</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Salary Information */}
                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black text-ink-subtle uppercase tracking-[0.2em]">Salary Information</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-black text-ink-subtle uppercase tracking-[0.2em] ml-1">
                                        Salary Type <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            name="salaryType"
                                            value={formData.salaryType}
                                            onChange={handleChange}
                                            required
                                            className="w-full bg-(--surface-muted) border-2 border-edge rounded-2xl px-5 py-4 outline-none focus:border-primary focus:bg-(--surface) transition-all font-bold text-ink appearance-none cursor-pointer shadow-inner"
                                        >
                                            <option value="fixed">Fixed Monthly Salary</option>
                                            <option value="percentage">Percentage Based</option>
                                        </select>
                                        <DollarSign className="absolute right-4 top-1/2 -translate-y-1/2 text-primary pointer-events-none" size={20} />
                                    </div>
                                </div>

                                {formData.salaryType === "fixed" ? (
                                    <div className="flex flex-col gap-2 group">
                                        <label className="text-[10px] font-black text-ink-subtle uppercase tracking-[0.2em] ml-1">
                                            Monthly Salary (Rs)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                name="monthlySalary"
                                                value={formData.monthlySalary}
                                                onChange={handleChange}
                                                min="0"
                                                placeholder="Enter amount"
                                                className="w-full bg-(--surface-muted) border-2 border-edge rounded-2xl pl-12 pr-5 py-4 outline-none focus:border-primary focus:bg-(--surface) transition-all font-bold text-ink shadow-inner"
                                            />
                                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-subtle group-focus-within:text-primary transition-colors" size={20} />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2 group">
                                        <label className="text-[10px] font-black text-ink-subtle uppercase tracking-[0.2em] ml-1">
                                            Commission (%)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                name="percentage"
                                                value={formData.percentage}
                                                onChange={handleChange}
                                                min="0"
                                                max="100"
                                                step="0.1"
                                                placeholder="Enter percentage"
                                                className="w-full bg-(--surface-muted) border-2 border-edge rounded-2xl pl-12 pr-5 py-4 outline-none focus:border-primary focus:bg-(--surface) transition-all font-bold text-ink shadow-inner"
                                            />
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-subtle group-focus-within:text-primary font-black transition-colors">%</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="relative group">
                            <label className="text-[10px] font-black text-ink-subtle uppercase tracking-[0.2em] ml-1">Additional Notes</label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                className="w-full mt-2 bg-(--surface-muted) border-2 border-edge rounded-2xl p-4 outline-none focus:border-primary focus:bg-(--surface) transition-all font-semibold text-ink resize-none h-24 shadow-inner"
                                placeholder="Add any specific details or notes..."
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isCreating || isUpdating}
                                className="w-full py-5 bg-gradient-to-r from-primary to-[#0d8a7e] hover:shadow-2xl hover:shadow-primary/30 text-white rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all duration-500 active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isCreating || isUpdating ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} />
                                        <span>{isEditMode ? 'Update Staff' : 'Add Staff Member'}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
