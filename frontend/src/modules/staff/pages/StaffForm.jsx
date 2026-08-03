import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Upload, X, Camera, User } from "lucide-react";
import { toast } from "sonner";
import { useGetStaffByIdQuery, useCreateStaffMutation, useUpdateStaffMutation } from "../api/staff.api.js";
import { getStaffLabels } from "../labels/staffLabels.js";
import { useSettings } from "../../settings/hooks/useSettings.js";
import { toImageUrl } from "../../../shared/utilities/image.utility.js";

const inputCls = "w-full px-3 py-2.5 text-sm rounded-xl border border-edge bg-surface-muted text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary transition";
const labelCls = "block text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1.5";
const sectionCls = "border border-edge rounded-2xl p-4 sm:p-5 space-y-4";

export default function StaffForm({ isEdit = false }) {
    const navigate = useNavigate();
    const { id } = useParams();
    const fileInputRef = useRef(null);

    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getStaffLabels(language);

    const [formData, setFormData] = useState({
        fullName: "", cnic: "", phone: "", role: "other", salaryType: "fixed",
        joinDate: new Date().toISOString().split("T")[0], address: "", emergencyContact: "",
        notes: "", monthlySalary: 0, percentage: 0, status: "active",
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    const { data: staffData, isLoading } = useGetStaffByIdQuery(id, { skip: !isEdit || !id });
    const [createStaff, { isLoading: isCreating }] = useCreateStaffMutation();
    const [updateStaff, { isLoading: isUpdating }] = useUpdateStaffMutation();

    useEffect(() => {
        if (isEdit && staffData?.data) {
            const s = staffData.data;
            setFormData({
                fullName: s.fullName || "", cnic: s.cnic || "", phone: s.phone || "",
                role: s.role || "other", salaryType: s.salaryType || "fixed",
                joinDate: s.joinDate ? new Date(s.joinDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
                address: s.address || "", emergencyContact: s.emergencyContact || "", notes: s.notes || "",
                monthlySalary: s.monthlySalary || 0, percentage: s.percentage || 0, status: s.status || "active",
            });
            if (s.photo) setImagePreview(toImageUrl(s.photo));
        }
    }, [isEdit, staffData]);

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) return toast.error("Please select an image file");
        if (file.size > 5 * 1024 * 1024) return toast.error("Image size should be less than 5MB");
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const submitData = new FormData();
            Object.keys(formData).forEach(key => submitData.append(key, formData[key]));
            if (imageFile) submitData.append("photo", imageFile);

            if (isEdit) {
                await updateStaff({ id, data: submitData }).unwrap();
                toast.success(labels.staffUpdated || "Staff updated successfully");
            } else {
                await createStaff(submitData).unwrap();
                toast.success(labels.staffCreated || "Staff created successfully");
            }
            navigate("/staff");
        } catch (error) {
            console.error("Error:", error);
            toast.error(isEdit ? labels.failedToUpdate : labels.failedToCreate);
        }
    };

    if (isEdit && isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex items-center gap-3 px-6 py-3 rounded-2xl border border-edge bg-surface-muted text-primary">
                    <div className="w-5 h-5 border-2 border-edge border-t-primary rounded-full animate-spin" />
                    <span className="text-xs font-semibold uppercase tracking-wide">{labels.loading}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-6 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto">

                {/* Header */}
                <div className="flex items-center gap-3 mb-5">
                    <button onClick={() => navigate("/staff")}
                        className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl border border-edge text-ink-muted hover:text-primary hover:bg-primary-hover/80 transition">
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-ink">{isEdit ? labels.editStaff : labels.createStaff}</h1>
                        <p className="text-xs text-ink-muted mt-0.5">{isEdit ? "Update staff member information" : "Add a new staff member to your team"}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Photo */}
                    <div className={sectionCls}>
                        <h3 className="text-sm font-semibold text-ink flex items-center gap-2"><Camera size={16} className="text-primary" /> Profile Photo</h3>
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <div className="relative group shrink-0">
                                <div className="w-24 h-24 rounded-2xl overflow-hidden border border-edge bg-surface-muted flex items-center justify-center">
                                    {imagePreview
                                        ? <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                        : <User size={32} className="text-ink-muted" />}
                                </div>
                                {imagePreview && (
                                    <button type="button" onClick={removeImage}
                                        className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-red-600">
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                            <div className="flex-1 space-y-2 text-center sm:text-left">
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                <button type="button" onClick={() => fileInputRef.current?.click()}
                                    className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-xl bg-primary text-white font-semibold hover:opacity-90 transition">
                                    <Upload size={16} /> Choose Photo
                                </button>
                                <p className="text-xs text-ink-muted">JPG, PNG, GIF • Max 5MB</p>
                            </div>
                        </div>
                    </div>

                    {/* Personal Info */}
                    <div className={sectionCls}>
                        <h3 className="text-sm font-semibold text-ink">Personal Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>{labels.fullName} <span className="text-red-500">*</span></label>
                                <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required className={inputCls} placeholder="Enter full name" />
                            </div>
                            <div>
                                <label className={labelCls}>{labels.cnic} <span className="text-red-500">*</span></label>
                                <input type="text" name="cnic" value={formData.cnic} onChange={handleChange} required className={inputCls} placeholder="XXXXX-XXXXXXX-X" />
                            </div>
                            <div>
                                <label className={labelCls}>{labels.phone} <span className="text-red-500">*</span></label>
                                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className={inputCls} placeholder="+92 XXX XXXXXXX" />
                            </div>
                            <div>
                                <label className={labelCls}>{labels.emergencyContact || "Emergency Contact"}</label>
                                <input type="tel" name="emergencyContact" value={formData.emergencyContact} onChange={handleChange} className={inputCls} placeholder="+92 XXX XXXXXXX" />
                            </div>
                            <div className="md:col-span-2">
                                <label className={labelCls}>{labels.address}</label>
                                <input type="text" name="address" value={formData.address} onChange={handleChange} className={inputCls} placeholder="Enter complete address" />
                            </div>
                        </div>
                    </div>

                    {/* Employment Info */}
                    <div className={sectionCls}>
                        <h3 className="text-sm font-semibold text-ink">Employment Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>{labels.role} <span className="text-red-500">*</span></label>
                                <select name="role" value={formData.role} onChange={handleChange} required className={inputCls}>
                                    <option value="cashier">{labels.cashier}</option>
                                    <option value="tailor">{labels.tailor}</option>
                                    <option value="stockKeeper">{labels.stockKeeper}</option>
                                    <option value="other">{labels.other}</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelCls}>{labels.joinDate} <span className="text-red-500">*</span></label>
                                <input type="date" name="joinDate" value={formData.joinDate} onChange={handleChange} required className={inputCls} />
                            </div>
                            <div>
                                <label className={labelCls}>{labels.status}</label>
                                <select name="status" value={formData.status} onChange={handleChange} className={inputCls}>
                                    <option value="active">{labels.active}</option>
                                    <option value="inactive">{labels.inactive}</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Salary Info */}
                    <div className={sectionCls}>
                        <h3 className="text-sm font-semibold text-ink">Salary Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>{labels.salaryType} <span className="text-red-500">*</span></label>
                                <select name="salaryType" value={formData.salaryType} onChange={handleChange} required className={inputCls}>
                                    <option value="fixed">Fixed Monthly Salary</option>
                                    <option value="percentage">Percentage Based</option>
                                </select>
                            </div>
                            {formData.salaryType === "fixed" ? (
                                <div>
                                    <label className={labelCls}>{labels.monthlySalary || "Monthly Salary (Rs)"}</label>
                                    <input type="number" name="monthlySalary" value={formData.monthlySalary} onChange={handleChange} min="0" className={inputCls} placeholder="Enter monthly salary" />
                                </div>
                            ) : (
                                <div>
                                    <label className={labelCls}>{labels.commissionRate || "Commission Percentage (%)"}</label>
                                    <input type="number" name="percentage" value={formData.percentage} onChange={handleChange} min="0" max="100" step="0.1" className={inputCls} placeholder="Enter percentage" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Notes */}
                    <div className={sectionCls}>
                        <h3 className="text-sm font-semibold text-ink">Additional Information</h3>
                        <div>
                            <label className={labelCls}>{labels.notes || "Notes"}</label>
                            <textarea name="notes" value={formData.notes} onChange={handleChange} rows={4} className={`${inputCls} resize-none`} placeholder="Add any additional notes or comments..." />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-1">
                        <button type="button" onClick={() => navigate("/staff")}
                            className="px-5 py-2.5 text-sm rounded-xl border border-edge text-ink-muted hover:text-ink hover:bg-surface-muted font-semibold transition">
                            {labels.cancel || "Cancel"}
                        </button>
                        <button type="submit" disabled={isCreating || isUpdating}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm rounded-xl bg-primary text-white font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed">
                            {isCreating || isUpdating
                                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                                : <><Save size={16} /> {isEdit ? "Update Staff" : "Create Staff"}</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}


















// import React, { useState, useEffect, useRef } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import { ArrowLeft, Save, Upload, X, Camera, User } from "lucide-react";
// import { toast } from "sonner";
// import { useGetStaffByIdQuery, useCreateStaffMutation, useUpdateStaffMutation } from "../api/staff.api.js";
// import { getStaffLabels } from "../labels/staffLabels.js";
// import { useSettings } from "../../settings/hooks/useSettings.js";
// import { toImageUrl } from "../../../shared/utilities/image.utility.js";

// export default function StaffForm({ isEdit = false }) {
//     const navigate = useNavigate();
//     const { id } = useParams();
//     const fileInputRef = useRef(null);
    
//     const { settings } = useSettings();
//     const language = settings?.language || "en";
//     const labels = getStaffLabels(language);
    
//     const [formData, setFormData] = useState({
//         fullName: "",
//         cnic: "",
//         phone: "",
//         role: "other",
//         salaryType: "fixed",
//         joinDate: new Date().toISOString().split('T')[0],
//         address: "",
//         emergencyContact: "",
//         notes: "",
//         monthlySalary: 0,
//         percentage: 0,
//         status: "active",
//     });

//     const [imageFile, setImageFile] = useState(null);
//     const [imagePreview, setImagePreview] = useState(null);

//     const { data: staffData, isLoading } = useGetStaffByIdQuery(id, {
//         skip: !isEdit || !id,
//     });

//     const [createStaff, { isLoading: isCreating }] = useCreateStaffMutation();
//     const [updateStaff, { isLoading: isUpdating }] = useUpdateStaffMutation();

//     useEffect(() => {
//         if (isEdit && staffData?.data) {
//             const staff = staffData.data;
//             setFormData({
//                 fullName: staff.fullName || "",
//                 cnic: staff.cnic || "",
//                 phone: staff.phone || "",
//                 role: staff.role || "other",
//                 salaryType: staff.salaryType || "fixed",
//                 joinDate: staff.joinDate ? new Date(staff.joinDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
//                 address: staff.address || "",
//                 emergencyContact: staff.emergencyContact || "",
//                 notes: staff.notes || "",
//                 monthlySalary: staff.monthlySalary || 0,
//                 percentage: staff.percentage || 0,
//                 status: staff.status || "active",
//             });
//             if (staff.photo) {
//                 setImagePreview(toImageUrl(staff.photo));
//             }
//         }
//     }, [isEdit, staffData]);

//     const handleChange = (e) => {
//         const { name, value } = e.target;
//         setFormData(prev => ({ ...prev, [name]: value }));
//     };

//     const handleImageChange = (e) => {
//         const file = e.target.files[0];
//         if (file) {
//             // Validate file type
//             if (!file.type.startsWith('image/')) {
//                 toast.error("Please select an image file");
//                 return;
//             }
//             // Validate file size (max 5MB)
//             if (file.size > 5 * 1024 * 1024) {
//                 toast.error("Image size should be less than 5MB");
//                 return;
//             }
            
//             setImageFile(file);
            
//             // Create preview
//             const reader = new FileReader();
//             reader.onloadend = () => {
//                 setImagePreview(reader.result);
//             };
//             reader.readAsDataURL(file);
//         }
//     };

//     const removeImage = () => {
//         setImageFile(null);
//         setImagePreview(null);
//         if (fileInputRef.current) {
//             fileInputRef.current.value = "";
//         }
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();
        
//         try {
//             const submitData = new FormData();
            
//             // Append all text fields
//             Object.keys(formData).forEach(key => {
//                 submitData.append(key, formData[key]);
//             });
            
//             // Append image if selected
//             if (imageFile) {
//                 submitData.append('photo', imageFile);
//             }
            
//             if (isEdit) {
//                 await updateStaff({ id, data: submitData }).unwrap();
//                 toast.success(labels.staffUpdated || "Staff updated successfully");
//             } else {
//                 await createStaff(submitData).unwrap();
//                 toast.success(labels.staffCreated || "Staff created successfully");
//             }
//             navigate("/staff");
//         } catch (error) {
//             console.error('Error:', error);
//             toast.error(isEdit ? labels.failedToUpdate : labels.failedToCreate);
//         }
//     };

//     if (isEdit && isLoading) {
//         return (
//             <div className="flex items-center justify-center min-h-screen">
//                 <div className="flex items-center gap-3 text-(--accent-2) bg-(--surface) border border-(--border) rounded-2xl px-6 py-3 shadow-md">
//                     <div className="w-5 h-5 border-2 border-(--border) border-t-(--accent-2) rounded-full animate-spin" />
//                     <span className="text-xs font-black uppercase tracking-widest">{labels.loading}</span>
//                 </div>
//             </div>
//         );
//     }

//     return (
//         <div className="min-h-screen bg-app-bg py-6 px-4 sm:px-6">
//             <div className="max-w-5xl mx-auto">
//                 {/* Header */}
//                 <div className="flex items-center gap-4 mb-6">
//                     <button
//                         onClick={() => navigate("/staff")}
//                         className="shrink-0 w-11 h-11 flex items-center justify-center rounded-2xl border-2 border-edge text-ink-subtle hover:text-primary hover:border-primary hover:bg-primary/10 transition-all hover:scale-105 active:scale-95"
//                     >
//                         <ArrowLeft size={20} />
//                     </button>
//                     <div>
//                         <h1 className="text-3xl font-black text-ink flex items-center gap-3">
//                             <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-[#0d8a7e] flex items-center justify-center">
//                                 <User size={20} className="text-white" />
//                             </div>
//                             {isEdit ? labels.editStaff : labels.createStaff}
//                         </h1>
//                         <p className="text-sm text-ink-subtle mt-1 font-medium">
//                             {isEdit ? "Update staff member information" : "Add a new staff member to your team"}
//                         </p>
//                     </div>
//                 </div>

//                 <form onSubmit={handleSubmit} className="space-y-6">
//                     {/* Image Upload Section */}
//                     <div className="bg-(--surface) border-2 border-edge rounded-2xl p-6">
//                         <h3 className="text-lg font-bold text-ink mb-4 flex items-center gap-2">
//                             <Camera size={20} className="text-primary" />
//                             Profile Photo
//                         </h3>
                        
//                         <div className="flex flex-col sm:flex-row items-center gap-6">
//                             {/* Image Preview */}
//                             <div className="relative group">
//                                 <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-edge bg-(--surface-muted) flex items-center justify-center">
//                                     {imagePreview ? (
//                                         <img 
//                                             src={imagePreview} 
//                                             alt="Preview" 
//                                             className="w-full h-full object-cover"
//                                         />
//                                     ) : (
//                                         <div className="flex flex-col items-center gap-2 text-ink-subtle">
//                                             <User size={40} />
//                                             <span className="text-xs font-medium">No Photo</span>
//                                         </div>
//                                     )}
//                                 </div>
//                                 {imagePreview && (
//                                     <button
//                                         type="button"
//                                         onClick={removeImage}
//                                         className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
//                                     >
//                                         <X size={16} />
//                                     </button>
//                                 )}
//                             </div>
                            
//                             {/* Upload Button */}
//                             <div className="flex-1 space-y-3">
//                                 <input
//                                     ref={fileInputRef}
//                                     type="file"
//                                     accept="image/*"
//                                     onChange={handleImageChange}
//                                     className="hidden"
//                                 />
//                                 <button
//                                     type="button"
//                                     onClick={() => fileInputRef.current?.click()}
//                                     className="w-full sm:w-auto flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-primary to-[#0d8a7e] text-white font-bold hover:shadow-lg hover:shadow-primary/30 transition-all"
//                                 >
//                                     <Upload size={18} />
//                                     <span>Choose Photo</span>
//                                 </button>
//                                 <p className="text-xs text-ink-subtle">
//                                     Supported formats: JPG, PNG, GIF • Max size: 5MB
//                                 </p>
//                             </div>
//                         </div>
//                     </div>

//                     {/* Personal Information */}
//                     <div className="bg-(--surface) border-2 border-edge rounded-2xl p-6">
//                         <h3 className="text-lg font-bold text-ink mb-4">Personal Information</h3>
                        
//                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                             <div>
//                                 <label className="block text-sm font-semibold text-ink mb-2">
//                                     {labels.fullName} <span className="text-red-500">*</span>
//                                 </label>
//                                 <input
//                                     type="text"
//                                     name="fullName"
//                                     value={formData.fullName}
//                                     onChange={handleChange}
//                                     required
//                                     className="w-full px-4 py-3 border-2 border-edge rounded-xl focus:border-primary focus:outline-none transition-all text-ink font-medium bg-(--surface-muted)"
//                                     placeholder="Enter full name"
//                                 />
//                             </div>

//                             <div>
//                                 <label className="block text-sm font-semibold text-ink mb-2">
//                                     {labels.cnic} <span className="text-red-500">*</span>
//                                 </label>
//                                 <input
//                                     type="text"
//                                     name="cnic"
//                                     value={formData.cnic}
//                                     onChange={handleChange}
//                                     required
//                                     className="w-full px-4 py-3 border-2 border-edge rounded-xl focus:border-primary focus:outline-none transition-all text-ink font-medium bg-(--surface-muted)"
//                                     placeholder="XXXXX-XXXXXXX-X"
//                                 />
//                             </div>

//                             <div>
//                                 <label className="block text-sm font-semibold text-ink mb-2">
//                                     {labels.phone} <span className="text-red-500">*</span>
//                                 </label>
//                                 <input
//                                     type="tel"
//                                     name="phone"
//                                     value={formData.phone}
//                                     onChange={handleChange}
//                                     required
//                                     className="w-full px-4 py-3 border-2 border-edge rounded-xl focus:border-primary focus:outline-none transition-all text-ink font-medium bg-(--surface-muted)"
//                                     placeholder="+92 XXX XXXXXXX"
//                                 />
//                             </div>

//                             <div>
//                                 <label className="block text-sm font-semibold text-ink mb-2">
//                                     {labels.emergencyContact || "Emergency Contact"}
//                                 </label>
//                                 <input
//                                     type="tel"
//                                     name="emergencyContact"
//                                     value={formData.emergencyContact}
//                                     onChange={handleChange}
//                                     className="w-full px-4 py-3 border-2 border-edge rounded-xl focus:border-primary focus:outline-none transition-all text-ink font-medium bg-(--surface-muted)"
//                                     placeholder="+92 XXX XXXXXXX"
//                                 />
//                             </div>

//                             <div className="md:col-span-2">
//                                 <label className="block text-sm font-semibold text-ink mb-2">{labels.address}</label>
//                                 <input
//                                     type="text"
//                                     name="address"
//                                     value={formData.address}
//                                     onChange={handleChange}
//                                     className="w-full px-4 py-3 border-2 border-edge rounded-xl focus:border-primary focus:outline-none transition-all text-ink font-medium bg-(--surface-muted)"
//                                     placeholder="Enter complete address"
//                                 />
//                             </div>
//                         </div>
//                     </div>

//                     {/* Employment Information */}
//                     <div className="bg-(--surface) border-2 border-edge rounded-2xl p-6">
//                         <h3 className="text-lg font-bold text-ink mb-4">Employment Information</h3>
                        
//                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                             <div>
//                                 <label className="block text-sm font-semibold text-ink mb-2">
//                                     {labels.role} <span className="text-red-500">*</span>
//                                 </label>
//                                 <select
//                                     name="role"
//                                     value={formData.role}
//                                     onChange={handleChange}
//                                     required
//                                     className="w-full px-4 py-3 border-2 border-edge rounded-xl focus:border-primary focus:outline-none transition-all text-ink font-medium bg-(--surface-muted)"
//                                 >
//                                     <option value="cashier">{labels.cashier}</option>
//                                     <option value="tailor">{labels.tailor}</option>
//                                     <option value="stockKeeper">{labels.stockKeeper}</option>
//                                     <option value="other">{labels.other}</option>
//                                 </select>
//                             </div>

//                             <div>
//                                 <label className="block text-sm font-semibold text-ink mb-2">
//                                     {labels.joinDate} <span className="text-red-500">*</span>
//                                 </label>
//                                 <input
//                                     type="date"
//                                     name="joinDate"
//                                     value={formData.joinDate}
//                                     onChange={handleChange}
//                                     required
//                                     className="w-full px-4 py-3 border-2 border-edge rounded-xl focus:border-primary focus:outline-none transition-all text-ink font-medium bg-(--surface-muted)"
//                                 />
//                             </div>

//                             <div>
//                                 <label className="block text-sm font-semibold text-ink mb-2">{labels.status}</label>
//                                 <select
//                                     name="status"
//                                     value={formData.status}
//                                     onChange={handleChange}
//                                     className="w-full px-4 py-3 border-2 border-edge rounded-xl focus:border-primary focus:outline-none transition-all text-ink font-medium bg-(--surface-muted)"
//                                 >
//                                     <option value="active">{labels.active}</option>
//                                     <option value="inactive">{labels.inactive}</option>
//                                 </select>
//                             </div>
//                         </div>
//                     </div>

//                     {/* Salary Information */}
//                     <div className="bg-(--surface) border-2 border-edge rounded-2xl p-6">
//                         <h3 className="text-lg font-bold text-ink mb-4">Salary Information</h3>
                        
//                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                             <div>
//                                 <label className="block text-sm font-semibold text-ink mb-2">
//                                     {labels.salaryType} <span className="text-red-500">*</span>
//                                 </label>
//                                 <select
//                                     name="salaryType"
//                                     value={formData.salaryType}
//                                     onChange={handleChange}
//                                     required
//                                     className="w-full px-4 py-3 border-2 border-edge rounded-xl focus:border-primary focus:outline-none transition-all text-ink font-medium bg-(--surface-muted)"
//                                 >
//                                     <option value="fixed">Fixed Monthly Salary</option>
//                                     <option value="percentage">Percentage Based</option>
//                                 </select>
//                             </div>

//                             {formData.salaryType === "fixed" ? (
//                                 <div>
//                                     <label className="block text-sm font-semibold text-ink mb-2">
//                                         {labels.monthlySalary || "Monthly Salary (Rs)"}
//                                     </label>
//                                     <input
//                                         type="number"
//                                         name="monthlySalary"
//                                         value={formData.monthlySalary}
//                                         onChange={handleChange}
//                                         min="0"
//                                         className="w-full px-4 py-3 border-2 border-edge rounded-xl focus:border-primary focus:outline-none transition-all text-ink font-medium bg-(--surface-muted)"
//                                         placeholder="Enter monthly salary"
//                                     />
//                                 </div>
//                             ) : (
//                                 <div>
//                                     <label className="block text-sm font-semibold text-ink mb-2">
//                                         {labels.commissionRate || "Commission Percentage (%)"}
//                                     </label>
//                                     <input
//                                         type="number"
//                                         name="percentage"
//                                         value={formData.percentage}
//                                         onChange={handleChange}
//                                         min="0"
//                                         max="100"
//                                         step="0.1"
//                                         className="w-full px-4 py-3 border-2 border-edge rounded-xl focus:border-primary focus:outline-none transition-all text-ink font-medium bg-(--surface-muted)"
//                                         placeholder="Enter percentage"
//                                     />
//                                 </div>
//                             )}
//                         </div>
//                     </div>

//                     {/* Additional Notes */}
//                     <div className="bg-(--surface) border-2 border-edge rounded-2xl p-6">
//                         <h3 className="text-lg font-bold text-ink mb-4">Additional Information</h3>
                        
//                         <div>
//                             <label className="block text-sm font-semibold text-ink mb-2">{labels.notes || "Notes"}</label>
//                             <textarea
//                                 name="notes"
//                                 value={formData.notes}
//                                 onChange={handleChange}
//                                 rows={4}
//                                 className="w-full px-4 py-3 border-2 border-edge rounded-xl focus:border-primary focus:outline-none transition-all text-ink font-medium bg-(--surface-muted) resize-none"
//                                 placeholder="Add any additional notes or comments..."
//                             />
//                         </div>
//                     </div>

//                     {/* Action Buttons */}
//                     <div className="flex flex-col sm:flex-row gap-3 justify-end">
//                         <button
//                             type="button"
//                             onClick={() => navigate("/staff")}
//                             className="px-6 py-3 rounded-xl border-2 border-edge text-ink-subtle hover:border-edge-brand hover:text-ink font-semibold transition-all"
//                         >
//                             {labels.cancel || "Cancel"}
//                         </button>
//                         <button
//                             type="submit"
//                             disabled={isCreating || isUpdating}
//                             className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-[#0d8a7e] text-white font-bold hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
//                         >
//                             {isCreating || isUpdating ? (
//                                 <>
//                                     <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
//                                     <span>Saving...</span>
//                                 </>
//                             ) : (
//                                 <>
//                                     <Save size={18} />
//                                     <span>{isEdit ? "Update Staff" : "Create Staff"}</span>
//                                 </>
//                             )}
//                         </button>
//                     </div>
//                 </form>
//             </div>
//         </div>
//     );
// }
