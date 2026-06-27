import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Edit, Trash2, Eye, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useGetStaffListQuery, useDeleteStaffMutation } from "../api/staff.api.js";

export default function StaffList() {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [salaryTypeFilter, setSalaryTypeFilter] = useState("");

    const { data: staffData, isLoading, refetch } = useGetStaffListQuery({
        search,
        role: roleFilter,
        status: statusFilter,
        salaryType: salaryTypeFilter,
    });

    const [deleteStaff] = useDeleteStaffMutation();

    const handleDelete = async (id, name) => {
        if (window.confirm(`Are you sure you want to delete ${name}?`)) {
            try {
                await deleteStaff(id).unwrap();
                toast.success("Staff deleted successfully");
                refetch();
            } catch (error) {
                toast.error("Failed to delete staff");
            }
        }
    };

    const staff = staffData?.data || [];

    return (
        <div className="p-6 bg-[var(--app-bg)] min-h-screen">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--ink)] font-display">Staff Management</h1>
                    <p className="text-sm text-[var(--muted)]">Manage your staff members</p>
                </div>
                <button
                    onClick={() => navigate("/staff/create")}
                    className="btn-add"
                >
                    <Plus size={16} /> Add Staff
                </button>
            </div>

            <div className="mb-4">
                <button
                    onClick={() => navigate("/staff/attendance")}
                    className="btn-add"
                >
                    <Calendar size={16} /> Mark Attendance
                </button>
            </div>

            {/* Filters */}
            <div className="card mb-6 p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="flex items-center gap-2">
                                <Search size={16} className="text-[var(--muted)]" />
                                <input
                                    type="text"
                                    placeholder="Search by name, CNIC, phone..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]"
                                />
                            </div>
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]"
                            >
                                <option value="">All Roles</option>
                                <option value="cashier">Cashier</option>
                                <option value="tailor">Tailor</option>
                                <option value="stockKeeper">Stock Keeper</option>
                                <option value="other">Other</option>
                            </select>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]"
                            >
                                <option value="">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                            <select
                                value={salaryTypeFilter}
                                onChange={(e) => setSalaryTypeFilter(e.target.value)}
                                className="px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]"
                            >
                                <option value="">All Salary Types</option>
                                <option value="fixed">Fixed</option>
                                <option value="percentage">Percentage</option>
                            </select>
                        </div>
                    </div>

                    {/* Staff Table */}
                    <div className="card overflow-hidden">
                        {isLoading ? (
                            <div className="p-8 text-center text-[var(--muted)]">Loading...</div>
                        ) : staff.length === 0 ? (
                            <div className="p-8 text-center text-[var(--muted)]">No staff found</div>
                        ) : (
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-[var(--border)]">
                                        <th className="text-left p-4 text-sm font-semibold text-[var(--ink)]">Name</th>
                                        <th className="text-left p-4 text-sm font-semibold text-[var(--ink)]">CNIC</th>
                                        <th className="text-left p-4 text-sm font-semibold text-[var(--ink)]">Phone</th>
                                        <th className="text-left p-4 text-sm font-semibold text-[var(--ink)]">Role</th>
                                        <th className="text-left p-4 text-sm font-semibold text-[var(--ink)]">Salary Type</th>
                                        <th className="text-left p-4 text-sm font-semibold text-[var(--ink)]">Status</th>
                                        <th className="text-left p-4 text-sm font-semibold text-[var(--ink)]">Join Date</th>
                                        <th className="text-center p-4 text-sm font-semibold text-[var(--ink)]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {staff.map((item) => (
                                        <tr key={item._id} className="border-b border-[var(--border)] hover:bg-[var(--hover)]">
                                            <td className="p-4">
                                                <div className="font-medium text-[var(--ink)]">{item.fullName}</div>
                                            </td>
                                            <td className="p-4 text-sm text-[var(--muted)]">{item.cnic}</td>
                                            <td className="p-4 text-sm text-[var(--muted)]">{item.phone}</td>
                                            <td className="p-4">
                                                <span className="px-2 py-1 text-xs rounded-full bg-[var(--accent-2)] text-white">
                                                    {item.role}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className="px-2 py-1 text-xs rounded-full bg-[var(--accent-2)] text-white">
                                                    {item.salaryType}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 text-xs rounded-full ${
                                                    item.status === 'active' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                                                }`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm text-[var(--muted)]">
                                                {new Date(item.joinDate).toLocaleDateString()}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => navigate(`/staff/${item._id}`)}
                                                        className="p-2 hover:bg-[var(--hover)] rounded-md"
                                                        title="View"
                                                    >
                                                        <Eye size={16} className="text-[var(--muted)]" />
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/staff/edit/${item._id}`)}
                                                        className="p-2 hover:bg-[var(--hover)] rounded-md"
                                                        title="Edit"
                                                    >
                                                        <Edit size={16} className="text-[var(--accent-2)]" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item._id, item.fullName)}
                                                        className="p-2 hover:bg-[var(--hover)] rounded-md"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} className="text-red-500" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
        </div>
    );
}
