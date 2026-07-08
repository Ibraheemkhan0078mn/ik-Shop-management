import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Upload } from "lucide-react";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import { useGetStaffByIdQuery, useCreateStaffMutation, useUpdateStaffMutation } from "../api/staff.api.js";
import { getStaffLabels } from "../labels/staffLabels.js";
import { useSettings } from "../../settings/hooks/useSettings.js";

export default function StaffForm({ isEdit = false }) {
    const navigate = useNavigate();
    const { id } = useParams();
    
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
        photo: "",
        notes: "",
        monthlySalary: 0,
        percentage: 0,
        status: "active",
    });

    const { data: staffData, isLoading } = useGetStaffByIdQuery(id, {
        skip: !isEdit || !id,
    });

    const [createStaff] = useCreateStaffMutation();
    const [updateStaff] = useUpdateStaffMutation();

    useEffect(() => {
        if (isEdit && staffData?.data) {
            const staff = staffData.data;
            setFormData({
                fullName: staff.fullName || "",
                cnic: staff.cnic || "",
                phone: staff.phone || "",
                role: staff.role || "other",
                salaryType: staff.salaryType || "fixed",
                joinDate: staff.joinDate ? new Date(staff.joinDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                address: staff.address || "",
                emergencyContact: staff.emergencyContact || "",
                photo: staff.photo || "",
                notes: staff.notes || "",
                monthlySalary: staff.monthlySalary || 0,
                percentage: staff.percentage || 0,
                status: staff.status || "active",
            });
        }
    }, [isEdit, staffData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEdit) {
                await updateStaff({ id, data: formData }).unwrap();
                toast.success(labels.staffUpdated);
            } else {
                await createStaff(formData).unwrap();
                toast.success(labels.staffCreated);
            }
            navigate("/staff");
        } catch (error) {
            toast.error(isEdit ? labels.failedToUpdate : labels.failedToCreate);
        }
    };

    if (isEdit && isLoading) {
        return <div className="p-6 text-center">{labels.loading}</div>;
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
                <div>
                    <h1 className="text-2xl font-bold text-[var(--ink)] font-display">
                        {isEdit ? labels.editStaff : labels.createStaff}
                    </h1>
                    <p className="text-sm text-[var(--muted)]">
                        {isEdit ? labels.manageStaff : labels.fullName}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="card p-6 max-w-4xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Personal Information */}
                    <div className="md:col-span-2">
                        <h3 className="text-lg font-semibold text-[var(--ink)] mb-4">{labels.personalInfo || "Personal Information"}</h3>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--ink)] mb-2">{labels.fullName} *</label>
                        <input
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--ink)] mb-2">{labels.cnic} *</label>
                        <input
                            type="text"
                            name="cnic"
                            value={formData.cnic}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--ink)] mb-2">{labels.phone} *</label>
                        <input
                            type="text"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--ink)] mb-2">{labels.role} *</label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]"
                        >
                            <option value="cashier">{labels.cashier}</option>
                            <option value="tailor">{labels.tailor}</option>
                            <option value="stockKeeper">{labels.stockKeeper}</option>
                            <option value="other">{labels.other}</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--ink)] mb-2">{labels.joinDate} *</label>
                        <input
                            type="date"
                            name="joinDate"
                            value={formData.joinDate}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--ink)] mb-2">{labels.status}</label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]"
                        >
                            <option value="active">{labels.active}</option>
                            <option value="inactive">{labels.inactive}</option>
                        </select>
                    </div>

                    {/* Salary Information */}
                    <div className="md:col-span-2 mt-4">
                        <h3 className="text-lg font-semibold text-[var(--ink)] mb-4">{labels.salaryInfo || "Salary Information"}</h3>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--ink)] mb-2">{labels.salaryType} *</label>
                        <select
                            name="salaryType"
                            value={formData.salaryType}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]"
                        >
                            <option value="fixed">{labels.fixed} {labels.salary}</option>
                            <option value="percentage">{labels.percentage} {labels.salaryInfo || "Based"}</option>
                        </select>
                    </div>

                    {formData.salaryType === "fixed" ? (
                        <div>
                            <label className="block text-sm font-medium text-[var(--ink)] mb-2">{labels.monthlySalary || "Monthly Salary"}</label>
                            <input
                                type="number"
                                name="monthlySalary"
                                value={formData.monthlySalary}
                                onChange={handleChange}
                                min="0"
                                className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]"
                            />
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium text-[var(--ink)] mb-2">{labels.commissionRate} (%)</label>
                            <input
                                type="number"
                                name="percentage"
                                value={formData.percentage}
                                onChange={handleChange}
                                min="0"
                                max="100"
                                className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]"
                            />
                        </div>
                    )}

                    {/* Additional Information */}
                    <div className="md:col-span-2 mt-4">
                        <h3 className="text-lg font-semibold text-[var(--ink)] mb-4">{labels.additionalInfo || "Additional Information"}</h3>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-[var(--ink)] mb-2">{labels.address}</label>
                        <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--ink)] mb-2">{labels.emergencyContact || "Emergency Contact"}</label>
                        <input
                            type="text"
                            name="emergencyContact"
                            value={formData.emergencyContact}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--ink)] mb-2">{labels.photo || "Photo URL"}</label>
                        <input
                            type="text"
                            name="photo"
                            value={formData.photo}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-[var(--ink)] mb-2">{labels.notes || "Notes"}</label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-4 mt-6">
                    <button
                        type="button"
                        onClick={() => navigate("/staff")}
                        className="px-4 py-2 border border-[var(--border)] rounded-md hover:bg-[var(--hover)]"
                    >
                        {labels.cancel}
                    </button>
                    <button
                        type="submit"
                        className="btn-add"
                    >
                        <Save size={16} /> {isEdit ? labels.edit : labels.create} {labels.staffManagement?.split(" ")[0] || "Staff"}
                    </button>
                </div>
            </form>
        </div>
    );
}
