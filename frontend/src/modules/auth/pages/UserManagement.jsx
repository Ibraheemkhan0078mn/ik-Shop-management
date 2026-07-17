import { useState } from "react";
import { Plus, Edit2, Trash2, Eye, User as UserIcon, Shield, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useSettings } from "../../settings/hooks/useSettings.js";
import { getUserLabels } from "../labels/userLabels.js";
import { useGetAllUsersQuery, useCreateUserMutation, useUpdateUserMutation, useDeleteUserMutation } from "../services/authApi.js";
import PageHeading from "../../../shared/components/PageHeading.jsx";
import ScreenTabButton from "../../../shared/components/ScreenTabButton.jsx";
import { showSuccess, showError } from "../../../shared/utilities/toastHelpers.js";
import { PERMISSION_GROUPS } from "../../../shared/utilities/permissions.js";
import PermissionGuard from "../../../shared/components/PermissionGuard.jsx";

export default function UserManagement() {
    const navigate = useNavigate();
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getUserLabels(language);
    const currentUserId = useSelector((state) => state.auth.id);
    
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

    const handleViewDetails = (userId) => {
        navigate(`/users/${userId}`);
    };

    const handleDelete = async (id) => {
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
                    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl relative" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                        <button
                            onClick={() => setModal(null)}
                            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-(--surface-muted) transition-colors"
                            style={{ color: "var(--muted)" }}
                        >
                            <X size={20} />
                        </button>
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
                                        placeholder={labels.enterName || "Enter name"}
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
                                        placeholder={labels.enterEmail || "Enter email"}
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
                                        placeholder={labels.enterPhone || "Enter phone number"}
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
                                                placeholder={labels.enterPassword || "Enter password"}
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
                                                placeholder={labels.confirmPasswordPlaceholder || "Confirm password"}
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

            <div className="flex-1 overflow-hidden">
                {/* Desktop Table */}
                <div className="hidden md:block h-full overflow-auto">
                    <table className="w-full">
                        <thead className="sticky top-0 z-10" style={{ background: "var(--surface-muted)" }}>
                            <tr className="text-xs font-semibold uppercase tracking-wider text-(--muted)">
                                <th className="px-4 py-3 text-left">{labels.name}</th>
                                <th className="px-4 py-3 text-left">{labels.email}</th>
                                <th className="px-4 py-3 text-left">{labels.phone}</th>
                                <th className="px-4 py-3 text-left">{labels.role}</th>
                                <th className="px-4 py-3 text-right">{labels.actions}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => {
                                const isCurrentUser = user._id === currentUserId;
                                return (
                                    <tr
                                        key={user._id}
                                        className={`border-b transition-all ${isCurrentUser ? 'bg-(--accent-2)/5' : 'hover:bg-(--surface-muted)'}`}
                                        style={{ borderColor: "var(--border)" }}
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCurrentUser ? 'bg-(--accent-2) text-white' : 'bg-(--surface-muted) text-(--muted)'}`}>
                                                    {isCurrentUser ? <Shield size={16} /> : <UserIcon size={16} />}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-(--ink)">{user.name}</p>
                                                    {isCurrentUser && (
                                                        <p className="text-xs text-(--accent-2) font-medium">{labels.you}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-(--muted)">{user.email}</td>
                                        <td className="px-4 py-3 text-sm text-(--muted)">{user.phoneNo || labels.noPhone}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                                                user.role === 'admin' ? 'bg-purple-500/10 text-purple-600' :
                                                user.role === 'manager' ? 'bg-blue-500/10 text-blue-600' :
                                                'bg-gray-500/10 text-gray-600'
                                            }`}>
                                                {labels[user.role] || user.role}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-2">
                                                <PermissionGuard 
                                                    execute={() => handleViewDetails(user._id)} 
                                                    permission="users.view" 
                                                    isConfirmation={false}
                                                >
                                                    <button className="p-2 rounded-lg bg-(--surface-muted) border border-(--border) hover:border-(--accent-2) hover:text-(--accent-2) transition-all">
                                                        <Eye size={16} />
                                                    </button>
                                                </PermissionGuard>
                                                <PermissionGuard 
                                                    execute={() => openEditModal(user)} 
                                                    permission="users.update" 
                                                    isConfirmation={true}
                                                >
                                                    <button className="p-2 rounded-lg bg-(--surface-muted) border border-(--border) hover:border-(--accent-2) hover:text-(--accent-2) transition-all">
                                                        <Edit2 size={16} />
                                                    </button>
                                                </PermissionGuard>
                                                <PermissionGuard 
                                                    execute={() => handleDelete(user._id)} 
                                                    permission="users.delete" 
                                                    isConfirmation={true}
                                                >
                                                    <button className="p-2 rounded-lg bg-(--surface-muted) border border-(--border) hover:border-red-500 hover:text-red-500 transition-all">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </PermissionGuard>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                    {users.map((user) => {
                        const isCurrentUser = user._id === currentUserId;
                        return (
                            <div
                                key={user._id}
                                className={`p-4 rounded-2xl border ${isCurrentUser ? 'bg-(--accent-2)/5 border-(--accent-2)' : 'bg-(--surface)'}`}
                                style={{ borderColor: isCurrentUser ? 'var(--accent-2)' : 'var(--border)' }}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isCurrentUser ? 'bg-(--accent-2) text-white' : 'bg-(--surface-muted) text-(--muted)'}`}>
                                        {isCurrentUser ? <Shield size={20} /> : <UserIcon size={20} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold text-(--ink) truncate">{user.name}</p>
                                            {isCurrentUser && (
                                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-(--accent-2) text-white">
                                                    {labels.you}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-(--muted) truncate">{user.email}</p>
                                        <p className="text-xs text-(--muted)">{user.phoneNo || labels.noPhone}</p>
                                        <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium mt-1 ${
                                            user.role === 'admin' ? 'bg-purple-500/10 text-purple-600' :
                                            user.role === 'manager' ? 'bg-blue-500/10 text-blue-600' :
                                            'bg-gray-500/10 text-gray-600'
                                        }`}>
                                            {labels[user.role] || user.role}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-4 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                                    <PermissionGuard 
                                        execute={() => handleViewDetails(user._id)} 
                                        permission="users.view" 
                                        isConfirmation={false}
                                    >
                                        <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-(--surface-muted) border border-(--border) hover:border-(--accent-2) hover:text-(--accent-2) transition-all text-sm">
                                            <Eye size={16} /> {labels.view}
                                        </button>
                                    </PermissionGuard>
                                    <PermissionGuard 
                                        execute={() => openEditModal(user)} 
                                        permission="users.update" 
                                        isConfirmation={true}
                                    >
                                        <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-(--surface-muted) border border-(--border) hover:border-(--accent-2) hover:text-(--accent-2) transition-all text-sm">
                                            <Edit2 size={16} /> {labels.edit}
                                        </button>
                                    </PermissionGuard>
                                    <PermissionGuard 
                                        execute={() => handleDelete(user._id)} 
                                        permission="users.delete" 
                                        isConfirmation={true}
                                    >
                                        <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-(--surface-muted) border border-(--border) hover:border-red-500 hover:text-red-500 transition-all text-sm">
                                            <Trash2 size={16} /> {labels.delete}
                                        </button>
                                    </PermissionGuard>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
