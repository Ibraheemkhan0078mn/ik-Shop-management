import { useState } from "react";
import { useSelector } from "react-redux";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { useGetAllUsersQuery, useCreateUserMutation, useUpdateUserMutation, useDeleteUserMutation } from "../services/user.service.js";
import { showSuccess, showError } from "../../../shared/utilities/toastHelpers.js";

const PERMISSIONS = [
    { key: "dashboard", label: "Dashboard" },
    { key: "pos", label: "POS" },
    { key: "products", label: "Products" },
    { key: "purchases", label: "Purchases" },
    { key: "expenses", label: "Expenses" },
    { key: "reports", label: "Reports" },
    { key: "accounts", label: "Accounts" },
    { key: "staff", label: "Staff" },
    { key: "manageUsers", label: "Manage Users" },
    { key: "settings", label: "Settings" },
];

export default function UserManagement() {
    const language = useSelector(s => s.auth?.user?.language ?? "en");
    const { data: response, refetch } = useGetAllUsersQuery();
    const users = response?.data || [];
    const [createUser] = useCreateUserMutation();
    const [updateUser] = useUpdateUserMutation();
    const [deleteUser] = useDeleteUserMutation();

    const [modal, setModal] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phoneNo: "",
        password: "",
        confirmPassword: "",
        role: "staff",
        permissions: {},
    });

    const openCreateModal = () => {
        setFormData({
            name: "",
            email: "",
            phoneNo: "",
            password: "",
            confirmPassword: "",
            role: "staff",
            permissions: {},
        });
        setModal({ mode: "create" });
    };

    const openEditModal = (user) => {
        setFormData({
            _id: user._id,
            name: user.name,
            email: user.email,
            phoneNo: user.phoneNo,
            role: user.role,
            permissions: user.permissions || {},
        });
        setModal({ mode: "edit" });
    };

    const handlePermissionChange = (key) => {
        setFormData(prev => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [key]: !prev.permissions[key],
            },
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (modal.mode === "create") {
                if (formData.password !== formData.confirmPassword) {
                    showError("Passwords do not match");
                    return;
                }
                const { confirmPassword: _, ...data } = formData;
                await createUser(data).unwrap();
                showSuccess("User created successfully");
            } else {
                await updateUser(formData).unwrap();
                showSuccess("User updated successfully");
            }
            setModal(null);
            refetch();
        } catch (err) {
            showError(err?.data?.message || "Operation failed");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this user?")) return;
        try {
            await deleteUser(id).unwrap();
            showSuccess("User deleted successfully");
            refetch();
        } catch (err) {
            showError(err?.data?.message || "Delete failed");
        }
    };

    return (
        <div style={{ color: "var(--ink)" }}>
            {modal && (
                <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(0,0,0,0.5)" }}>
                    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                        <h2 className="text-xl font-bold mb-4">
                            {modal.mode === "create" ? "Create Staff" : "Edit User"}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1" style={{ color: "var(--muted)" }}>Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border"
                                        style={{ background: "var(--surface-muted)", borderColor: "var(--border)", color: "var(--ink)" }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1" style={{ color: "var(--muted)" }}>Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border"
                                        style={{ background: "var(--surface-muted)", borderColor: "var(--border)", color: "var(--ink)" }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1" style={{ color: "var(--muted)" }}>Phone</label>
                                    <input
                                        type="tel"
                                        value={formData.phoneNo}
                                        onChange={(e) => setFormData({ ...formData, phoneNo: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border"
                                        style={{ background: "var(--surface-muted)", borderColor: "var(--border)", color: "var(--ink)" }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1" style={{ color: "var(--muted)" }}>Role</label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border"
                                        style={{ background: "var(--surface-muted)", borderColor: "var(--border)", color: "var(--ink)" }}
                                    >
                                        <option value="staff">Staff</option>
                                        <option value="manager">Manager</option>
                                    </select>
                                </div>
                                {modal.mode === "create" && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium mb-1" style={{ color: "var(--muted)" }}>Password</label>
                                            <input
                                                type="password"
                                                required
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                className="w-full px-4 py-2 rounded-lg border"
                                                style={{ background: "var(--surface-muted)", borderColor: "var(--border)", color: "var(--ink)" }}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1" style={{ color: "var(--muted)" }}>Confirm Password</label>
                                            <input
                                                type="password"
                                                required
                                                value={formData.confirmPassword}
                                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                                className="w-full px-4 py-2 rounded-lg border"
                                                style={{ background: "var(--surface-muted)", borderColor: "var(--border)", color: "var(--ink)" }}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: "var(--muted)" }}>Permissions</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {PERMISSIONS.map(({ key, label }) => (
                                        <label key={key} className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={formData.permissions[key] || false}
                                                onChange={() => handlePermissionChange(key)}
                                                className="w-4 h-4"
                                            />
                                            <span className="text-sm">{label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-2 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setModal(null)}
                                    className="px-4 py-2 rounded-lg"
                                    style={{ background: "var(--surface-muted)", color: "var(--ink)" }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-lg"
                                    style={{ background: "var(--accent-2)", color: "white" }}
                                >
                                    {modal.mode === "create" ? "Create" : "Update"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">User Management</h1>
                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg"
                    style={{ background: "var(--accent-2)", color: "white" }}
                >
                    <Plus className="w-4 h-4" />
                    Add Staff
                </button>
            </div>

            <div className="space-y-2">
                {users.map((user) => (
                    <div
                        key={user._id}
                        className="flex items-center gap-4 px-4 py-3 rounded-2xl"
                        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                    >
                        <div className="flex-1">
                            <p className="font-bold">{user.name}</p>
                            <p className="text-sm" style={{ color: "var(--muted)" }}>{user.email}</p>
                            <p className="text-xs" style={{ color: "var(--muted)" }}>
                                {user.role} • {user.phoneNo || "No phone"}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => openEditModal(user)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg"
                                style={{ color: "var(--muted)" }}
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                            {user.role !== "admin" && (
                                <button
                                    onClick={() => handleDelete(user._id)}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg"
                                    style={{ color: "var(--muted)" }}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
