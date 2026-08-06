import { useState, useMemo, useRef } from "react";
import { Plus, Edit2, Trash2, Shield, X, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGetAllUserRolesQuery, useCreateUserRoleMutation, useUpdateUserRoleMutation, useDeleteUserRoleMutation } from "../services/authApi.js";
import { useSettings } from "../../settings/hooks/useSettings.js";
import { getUserLabels } from "../labels/userLabels.js";
import PageHeading from "../../../shared/components/PageHeading.jsx";
import ScreenTabButton from "../../../shared/components/ScreenTabButton.jsx";
import { showSuccess, showError } from "../../../shared/utilities/toastHelpers.js";
import { categorizePermissions } from "../../../shared/utilities/permissionUtils.js";
import { AppPermissionContext } from "../../../shared/context/Permission.context.jsx";
import { useContext } from "react";
import PaginatedList from "../../../shared/components/PaginatedList.jsx";

export default function UserRoleManagement() {
    let { appPermissions } = useContext(AppPermissionContext);
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getUserLabels(language);
    const navigate = useNavigate();
    const paginatedListRef = useRef(null);

    const [createUserRole] = useCreateUserRoleMutation();
    const [updateUserRole] = useUpdateUserRoleMutation();
    const [deleteUserRole] = useDeleteUserRoleMutation();

    // Categorize permissions from backend
    const permissionGroups = useMemo(() => {
        return categorizePermissions(appPermissions || []);
    }, [appPermissions]);

    const [modal, setModal] = useState(null);
    const [showPermissions, setShowPermissions] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        permissions: [],
    });

    const openCreateModal = () => {
        setFormData({
            name: "",
            permissions: [],
        });
        setModal({ mode: "create" });
    };

    const openEditModal = (role) => {
        setFormData({
            _id: role._id,
            name: role.name,
            permissions: role.permissions || [],
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

    const isGroupAllChecked = (group) => {
        const groupPermissions = group.actions.map(({ key }) => `${group.module}.${key}`);
        return groupPermissions.every(perm => (formData.permissions || []).includes(perm));
    };

    const handleGroupToggle = (group) => {
        const groupPermissions = group.actions.map(({ key }) => `${group.module}.${key}`);
        const allChecked = isGroupAllChecked(group);

        setFormData(prev => {
            const currentPermissions = prev.permissions || [];
            let newPermissions;

            if (allChecked) {
                // Uncheck all in group
                newPermissions = currentPermissions.filter(perm => !groupPermissions.includes(perm));
            } else {
                // Check all in group (add missing ones)
                newPermissions = [...new Set([...currentPermissions, ...groupPermissions])];
            }

            return { ...prev, permissions: newPermissions };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (modal.mode === "create") {
                await createUserRole(formData).unwrap();
                showSuccess(labels.roleCreated);
            } else {
                await updateUserRole(formData).unwrap();
                showSuccess(labels.roleUpdated);
            }
            setModal(null);
            if (paginatedListRef.current) {
                paginatedListRef.current.refetch();
            }
        } catch (err) {
            showError(err?.data?.message || labels.operationFailed);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteUserRole(id).unwrap();
            showSuccess(labels.roleDeleted);
            if (paginatedListRef.current) {
                paginatedListRef.current.refetch();
            }
        } catch (err) {
            showError(err?.data?.message || labels.deleteFailed);
        }
    };

    const handleViewDetails = (roleId) => {
        navigate(`/user-roles/${roleId}`);
    };

    return (
        <div style={{ color: "var(--ink)" }}>
            <PageHeading
                heading={labels.userRoles}
                subheading={labels.manageUserRoles}
                leftActions={
                    <div onClick={openCreateModal}>
                        <ScreenTabButton lucideIcon={Plus} text={labels.addUserRole} />
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
                            {modal.mode === "create" ? labels.addUserRole : labels.edit}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: "var(--muted)" }}>{labels.roleName}</label>
                                <input
                                    type="text"
                                    required
                                    placeholder={labels.enterRoleName}
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border"
                                    style={{ background: "var(--surface-muted)", borderColor: "var(--border)", color: "var(--ink)" }}
                                />
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm" style={{ color: "var(--muted)" }}>{labels.showPermissions || "Show"}</span>
                                        <button
                                            type="button"
                                            onClick={() => setShowPermissions(!showPermissions)}
                                            className={`w-12 h-6 rounded-full transition-all relative ${showPermissions ? 'bg-(--accent-2)' : 'bg-(--border)'}`}
                                        >
                                            <div
                                                className={`w-5 h-5 rounded-full absolute top-0.5 transition-all ${showPermissions ? 'left-6 bg-white' : 'left-0.5 bg-white'}`}
                                            />
                                        </button>
                                    </div>
                                </div>
                                {showPermissions && (
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-sm font-medium" style={{ color: "var(--muted)" }}>{labels.permissions}</label>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, permissions: [] })}
                                                className="px-3 py-1 text-sm rounded-lg"
                                                style={{ background: "var(--surface-muted)", color: "var(--ink)" }}
                                            >
                                                {labels.clearAll}
                                            </button>
                                        </div>
                                        <div className="grid gap-3">
                                            {permissionGroups.map((group) => (
                                                <div key={group.module} className="rounded-xl p-3" style={{ background: "var(--surface-muted)", border: "1px solid var(--border)" }}>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <p className="font-semibold">{group.label}</p>
                                                        <label className="flex items-center gap-2">
                                                            <span className="text-sm">{labels.all}</span>
                                                            <input
                                                                type="checkbox"
                                                                checked={isGroupAllChecked(group)}
                                                                onChange={() => handleGroupToggle(group)}
                                                                className="w-4 h-4"
                                                            />
                                                        </label>
                                                    </div>
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
                                )}
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

            <PaginatedList
                ref={paginatedListRef}
                rtkQuery={useGetAllUserRolesQuery}
                limit={20}
                dataKey="data"
                renderItems={(items) => (
                    <div className="flex flex-col gap-0">
                        {/* Desktop Table */}
                        <div className="hidden md:block">
                            <table className="w-full">
                                <thead className="sticky top-0 z-10" style={{ background: "var(--surface-muted)" }}>
                                    <tr className="text-xs font-semibold uppercase tracking-wider text-(--muted)">
                                        <th className="px-4 py-3 text-left">{labels.roleName}</th>
                                        <th className="px-4 py-3 text-left">{labels.permissions}</th>
                                        <th className="px-4 py-3 text-right">{labels.actions}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((role) => (
                                        <tr
                                            key={role._id}
                                            className="border-b transition-all hover:bg-(--surface-muted)"
                                            style={{ borderColor: "var(--border)" }}
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-(--surface-muted) text-(--muted)">
                                                        <Shield size={16} />
                                                    </div>
                                                    <p className="font-medium text-(--ink)">{role.name}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-sm text-(--muted)">
                                                    {role.permissions?.length || 0} {labels.permissions}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleViewDetails(role._id)}
                                                        className="p-2 rounded-lg bg-(--surface-muted) border border-(--border) hover:border-(--accent-2) hover:text-(--accent-2) transition-all"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => openEditModal(role)}
                                                        className="p-2 rounded-lg bg-(--surface-muted) border border-(--border) hover:border-(--accent-2) hover:text-(--accent-2) transition-all"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(role._id)}
                                                        className="p-2 rounded-lg bg-(--surface-muted) border border-(--border) hover:border-red-500 hover:text-red-500 transition-all"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="md:hidden space-y-3">
                            {items.map((role) => (
                                <div
                                    key={role._id}
                                    className="p-4 rounded-2xl border bg-(--surface)"
                                    style={{ borderColor: "var(--border)" }}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-(--surface-muted) text-(--muted)">
                                                <Shield size={20} />
                                            </div>
                                            <div>
                                                <p className="font-medium text-(--ink)">{role.name}</p>
                                                <p className="text-sm text-(--muted)">
                                                    {role.permissions?.length || 0} {labels.permissions}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleViewDetails(role._id)}
                                                className="p-2 rounded-lg bg-(--surface-muted) border border-(--border) hover:border-(--accent-2) hover:text-(--accent-2) transition-all"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button
                                                onClick={() => openEditModal(role)}
                                                className="p-2 rounded-lg bg-(--surface-muted) border border-(--border) hover:border-(--accent-2) hover:text-(--accent-2) transition-all"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(role._id)}
                                                className="p-2 rounded-lg bg-(--surface-muted) border border-(--border) hover:border-red-500 hover:text-red-500 transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                renderEmpty={() => (
                    <div className="flex h-full min-h-[220px] w-full items-center justify-center px-6 py-10 text-center text-(--muted)">
                        <div className="rounded-2xl border border-dashed border-(--border) bg-(--surface-muted)/70 px-6 py-8 text-sm font-medium">
                            {labels.noRolesFound}
                        </div>
                    </div>
                )}
            />
        </div>
    );
}
