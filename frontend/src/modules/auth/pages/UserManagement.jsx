import { useState } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { useSettings } from "../../settings/hooks/useSettings.js";
import { getUserLabels } from "../labels/userLabels.js";
import { useGetAllUsersQuery, useCreateUserMutation, useUpdateUserMutation, useDeleteUserMutation } from "../services/authApi.js";
import PageHeading from "../../../shared/components/PageHeading.jsx";
import ScreenTabButton from "../../../shared/components/ScreenTabButton.jsx";
import { showSuccess, showError } from "../../../shared/utilities/toastHelpers.js";
import { PERMISSION_GROUPS } from "../../../shared/utilities/permissions.js";

export default function UserManagement() {
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getUserLabels(language);
    
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
        permissions: [],
    });

    const openCreateModal = () => {
        setFormData({
            name: "",
            email: "",
            phoneNo: "",
            password: "",
            confirmPassword: "",
            role: "staff",
            permissions: [],
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
            permissions: user.permissions || [],
        });
        setModal({ mode: "edit" });
    };

    const handlePermissionChange = (permission) => {
        setFormData(prev => {
            const permissions = prev.permissions || [];
            const nextPermissions = permissions.includes(permission)
                ? permissions.filter((item) => item !== permission)
                : [...permissions, permission];

            return { ...prev, permissions: nextPermissions };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (modal.mode === "create") {
                if (formData.password !== formData.confirmPassword) {
                    showError(labels.passwordsDoNotMatch);
                    return;
                }
                const { confirmPassword: _, ...data } = formData;
                await createUser(data).unwrap();
                showSuccess(labels.userCreated);
            } else {
                await updateUser(formData).unwrap();
                showSuccess(labels.userUpdated);
            }
            setModal(null);
            refetch();
        } catch (err) {
            showError(err?.data?.message || labels.operationFailed);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(labels.deleteConfirm)) return;
        try {
            await deleteUser(id).unwrap();
            showSuccess(labels.userDeleted);
            refetch();
        } catch (err) {
            showError(err?.data?.message || labels.deleteFailed);
        }
    };

    return (
        <div style={{ color: "var(--ink)" }}>
            <PageHeading
                heading={labels.userManagement}
                subheading={labels.manageStaffUserAccounts}
                leftActions={
                    <div onClick={openCreateModal}>
                        <ScreenTabButton lucideIcon={Plus} text={labels.addUser} />
                    </div>
                }
            />
            {modal && (
                <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(0,0,0,0.5)" }}>
                    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                        <h2 className="text-xl font-bold mb-4">
                            {modal.mode === "create" ? labels.addStaff : labels.edit}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1" style={{ color: "var(--muted)" }}>{labels.name}</label>
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
                                    <label className="block text-sm font-medium mb-1" style={{ color: "var(--muted)" }}>{labels.email}</label>
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
                                    <label className="block text-sm font-medium mb-1" style={{ color: "var(--muted)" }}>{labels.phone}</label>
                                    <input
                                        type="tel"
                                        value={formData.phoneNo}
                                        onChange={(e) => setFormData({ ...formData, phoneNo: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border"
                                        style={{ background: "var(--surface-muted)", borderColor: "var(--border)", color: "var(--ink)" }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1" style={{ color: "var(--muted)" }}>{labels.role}</label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border"
                                        style={{ background: "var(--surface-muted)", borderColor: "var(--border)", color: "var(--ink)" }}
                                    >
                                        <option value="staff">{labels.staff}</option>
                                        <option value="manager">{labels.manager}</option>
                                    </select>
                                </div>
                                {modal.mode === "create" && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium mb-1" style={{ color: "var(--muted)" }}>{labels.password}</label>
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
                                            <label className="block text-sm font-medium mb-1" style={{ color: "var(--muted)" }}>{labels.confirmPassword}</label>
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
                                <label className="block text-sm font-medium mb-2" style={{ color: "var(--muted)" }}>{labels.permissions}</label>
                                <div className="grid gap-3">
                                    {PERMISSION_GROUPS.map((group) => (
                                        <div key={group.module} className="rounded-xl p-3" style={{ background: "var(--surface-muted)", border: "1px solid var(--border)" }}>
                                            <p className="font-semibold mb-2">{group.label}</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                {group.actions.map(({ key, label }) => {
                                                    const permission = `${group.module}.${key}`;
                                                    return (
                                                        <label key={permission} className="flex items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={(formData.permissions || []).includes(permission)}
                                                                onChange={() => handlePermissionChange(permission)}
                                                                className="w-4 h-4"
                                                            />
                                                            <span className="text-sm">{label}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
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
                                    {labels.cancel}
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-lg"
                                    style={{ background: "var(--accent-2)", color: "white" }}
                                >
                                    {modal.mode === "create" ? labels.create : labels.update}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">{labels.userManagement}</h1>
                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg"
                    style={{ background: "var(--accent-2)", color: "white" }}
                >
                    <Plus className="w-4 h-4" />
                    {labels.addStaff}
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
                                {user.role} • {user.phoneNo || labels.noPhone}
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
