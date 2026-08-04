import { useContext, useState, useMemo } from "react";
import { Plus, Edit2, Trash2, Eye, User as UserIcon, Shield, X, Upload, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useSettings } from "../../settings/hooks/useSettings.js";
import { getUserLabels } from "../labels/userLabels.js";
import { useGetAllUsersQuery, useCreateUserMutation, useUpdateUserMutation, useDeleteUserMutation, useGetAllUserRolesQuery } from "../services/authApi.js";
import PageHeading from "../../../shared/components/PageHeading.jsx";
import ScreenTabButton from "../../../shared/components/ScreenTabButton.jsx";
import { showSuccess, showError } from "../../../shared/utilities/toastHelpers.js";
import { categorizePermissions } from "../../../shared/utilities/permissionUtils.js";
import PermissionGuard from "../../../shared/components/PermissionGuard.jsx";
import { AppPermissionContext } from "../../../shared/context/Permission.context.jsx";
import { toImageUrl } from "../../../shared/utilities/image.utility.js";
// import { DEFAULT_PERMISSIONS } from "../../../../backend/common/constants/permissions.constant.js";

export default function UserManagement() {
    let { appPermissions } = useContext(AppPermissionContext)
    const navigate = useNavigate();
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getUserLabels(language);
    const currentUserId = useSelector((state) => state.auth.id);

    const { data: response, refetch } = useGetAllUsersQuery();
    const users = response?.data || [];
    const { data: rolesResponse } = useGetAllUserRolesQuery();
    const userRoles = rolesResponse?.data || [];
    const [createUser] = useCreateUserMutation();
    const [updateUser] = useUpdateUserMutation();
    const [deleteUser] = useDeleteUserMutation();

    // Categorize permissions from backend
    const permissionGroups = useMemo(() => {
        return categorizePermissions(appPermissions || []);
    }, [appPermissions]);

    const [modal, setModal] = useState(null);
    const [showPermissions, setShowPermissions] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "staff",
        permissions: [],
        photo: "",
        selectedRoleId: null,
    });
    const [imagePreview, setImagePreview] = useState(null);
    const [imageFile, setImageFile] = useState(null);

    const openCreateModal = () => {
        setFormData({
            name: "",
            email: "",
            password: "",
            role: "staff",
            permissions: [],
            photo: "",
            selectedRoleId: null,
        });
        setImagePreview(null);
        setImageFile(null);
        setModal({ mode: "create" });
    };

    const openEditModal = (user) => {
        setFormData({
            _id: user._id,
            name: user.name,
            email: user.email,
            password: "",
            role: user.role,
            permissions: user.permissions || [],
            photo: user.photo || "",
            selectedRoleId: null,
        });
        // Photo is now a filename, use toImageUrl
        setImagePreview(user.photo ? toImageUrl(user.photo) : null);
        setImageFile(null);
        setModal({ mode: "edit" });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            showError("Image size must be less than 5MB");
            return;
        }

        setImageFile(file);
        
        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
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

    const handleRoleSelect = (role) => {
        let rolePermissions = [];

        if (appPermissions) {
            if (role === "admin") {
                console.log("The role is admin. ")
                rolePermissions = appPermissions;
            } else if (role === "manager") {
                // Manager permissions - most permissions except user management
                rolePermissions = appPermissions.filter(perm =>
                    !perm.startsWith("users.") || perm === "users.view"
                );
            } else {
                // Staff permissions - limited permissions
                rolePermissions = [
                    "dashboard.view",
                    "pos.view",
                    "pos.orders.create",
                    "pos.orders.view",
                    "products.view",
                    "categories.view",
                    "subcategories.view",
                    "customers.view",
                    "customers.create",
                    "customers.update",
                    "customers.details",
                    "customers.payment",
                    "suppliers.view",
                    "suppliers.details",
                ];
            }
        }

        setFormData(prev => ({
            ...prev,
            role,
            permissions: rolePermissions
        }));
    };

    const handleUserRoleSelect = (userRole) => {
        const selectedRole = userRoles.find(r => r._id === userRole);
        if (selectedRole) {
            setFormData(prev => ({
                ...prev,
                permissions: selectedRole.permissions || [],
                selectedRoleId: userRole
            }));
        }
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
                // Use FormData if image file exists
                let data;
                if (imageFile) {
                    data = new FormData();
                    data.append("name", formData.name);
                    data.append("email", formData.email);
                    data.append("password", formData.password);
                    data.append("role", formData.role);
                    formData.permissions.forEach(perm => data.append("permissions", perm));
                    data.append("photo", imageFile);
                } else {
                    data = formData;
                }
                
                await createUser(data).unwrap();
                showSuccess(labels.userCreated);
            } else {
                // Use FormData if image file exists
                let data;
                if (imageFile) {
                    data = new FormData();
                    data.append("_id", formData._id);
                    data.append("name", formData.name);
                    data.append("email", formData.email);
                    if (formData.password) {
                        data.append("password", formData.password);
                    }
                    data.append("role", formData.role);
                    formData.permissions.forEach(perm => data.append("permissions", perm));
                    data.append("photo", imageFile);
                } else {
                    data = formData;
                }
                
                await updateUser(data).unwrap();
                showSuccess(labels.userUpdated);
            }
            setModal(null);
            refetch();
        } catch (err) {
            console.error('User creation error:', err);
            const errorMessage = err?.error || err?.data?.message || err?.error?.data?.message || err?.message || labels.operationFailed;
            showError(errorMessage);
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
            console.error('User delete error:', err);
            const errorMessage = err?.error || err?.data?.message || err?.error?.data?.message || err?.message || labels.deleteFailed;
            showError(errorMessage);
        }
    };

    return (
        <div style={{ color: "var(--ink)" }}>
            <PageHeading
                heading={labels.userManagement}
                subheading={labels.manageStaffUserAccounts}
                leftActions={
                    <div className="flex gap-2">
                        <div onClick={openCreateModal}>
                            <ScreenTabButton lucideIcon={Plus} text={labels.addUser} />
                        </div>
                        <div onClick={() => navigate("/user-roles")}>
                            <ScreenTabButton lucideIcon={Shield} text={labels.userRoles} />
                        </div>
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
                            {modal.mode === "create" ? labels.addUser : labels.edit}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2" style={{ color: "var(--muted)" }}>{labels.photo || "Photo"}</label>
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-20 rounded-lg overflow-hidden border" style={{ background: "var(--surface-muted)", borderColor: "var(--border)" }}>
                                        {imagePreview ? (
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <UserIcon size={32} className="text-(--muted)" />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="hidden"
                                            id="user-photo-upload"
                                        />
                                        <label
                                            htmlFor="user-photo-upload"
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer"
                                            style={{ background: "var(--surface-muted)", color: "var(--ink)", border: "1px solid var(--border)" }}
                                        >
                                            <Upload size={16} />
                                            <span>{labels.uploadPhoto || "Upload Photo"}</span>
                                        </label>
                                        <p className="text-xs text-(--muted) mt-1">{labels.maxSize5MB || "Max size: 5MB"}</p>
                                    </div>
                                </div>
                            </div>
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
                                {modal.mode === "create" ? (
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
                                ) : (
                                    <div>
                                        <label className="block text-sm font-medium mb-1" style={{ color: "var(--muted)" }}>{labels.password} <span className="text-xs text-gray-500">({labels.optional || "Optional - leave blank to keep current"})</span></label>
                                        <input
                                            type="password"
                                            placeholder={labels.enterNewPassword || "Enter new password"}
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg border"
                                            style={{ background: "var(--surface-muted)", borderColor: "var(--border)", color: "var(--ink)" }}
                                        />
                                    </div>
                                )}
                            </div>
                            {/* <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: "var(--muted)" }}>{labels.role}</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleRoleSelect("admin")}
                                        className={`px-4 py-2 rounded-lg ${formData.role === "admin" ? "bg-purple-500 text-white" : ""}`}
                                        style={formData.role !== "admin" ? { background: "var(--surface-muted)", color: "var(--ink)" } : {}}
                                    >
                                        Admin
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleRoleSelect("manager")}
                                        className={`px-4 py-2 rounded-lg ${formData.role === "manager" ? "bg-blue-500 text-white" : ""}`}
                                        style={formData.role !== "manager" ? { background: "var(--surface-muted)", color: "var(--ink)" } : {}}
                                    >
                                        Manager
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleRoleSelect("staff")}
                                        className={`px-4 py-2 rounded-lg ${formData.role === "staff" ? "bg-gray-500 text-white" : ""}`}
                                        style={formData.role !== "staff" ? { background: "var(--surface-muted)", color: "var(--ink)" } : {}}
                                    >
                                        Staff
                                    </button>
                                </div>
                            </div> */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium" style={{ color: "var(--muted)" }}>{labels.selectRole || "Select Role"}</label>
                                </div>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {userRoles.map((role) => (
                                        <button
                                            key={role._id}
                                            type="button"
                                            onClick={() => handleUserRoleSelect(role._id)}
                                            className="px-3 py-1.5 text-sm rounded-lg border-2 transition-all"
                                            style={{
                                                background: formData.selectedRoleId === role._id ? "var(--accent-2)" : "var(--surface-muted)",
                                                borderColor: formData.selectedRoleId === role._id ? "var(--accent-2)" : "var(--border)",
                                                color: formData.selectedRoleId === role._id ? "white" : "var(--ink)"
                                            }}
                                            onMouseEnter={(e) => {
                                                if (formData.selectedRoleId !== role._id) {
                                                    e.target.style.borderColor = "var(--accent-2)";
                                                    e.target.style.color = "var(--accent-2)";
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (formData.selectedRoleId !== role._id) {
                                                    e.target.style.borderColor = "var(--border)";
                                                    e.target.style.color = "var(--ink)";
                                                }
                                            }}
                                        >
                                            {role.name}
                                        </button>
                                    ))}
                                </div>
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

            <div className="flex-1 overflow-hidden">
                {/* Desktop Table */}
                <div className="hidden md:block h-full overflow-auto">
                    <table className="w-full">
                        <thead className="sticky top-0 z-10" style={{ background: "var(--surface-muted)" }}>
                            <tr className="text-xs font-semibold uppercase tracking-wider text-(--muted)">
                                <th className="px-4 py-3 text-left">{labels.photo || "Photo"}</th>
                                <th className="px-4 py-3 text-left">{labels.name}</th>
                                <th className="px-4 py-3 text-left">{labels.email}</th>
                                {/* <th className="px-4 py-3 text-left">{labels.phone}</th> */}
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
                                            <div className="w-10 h-10 rounded-lg overflow-hidden" style={{ background: "var(--surface-muted)" }}>
                                                {user.photo ? (
                                                    <img
                                                        src={toImageUrl(user.photo)}
                                                        alt={user.name}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.target.style.display = "none";
                                                            e.target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center"><span class="text-xs font-semibold text-primary">${user.name?.charAt(0) || "U"}</span></div>`;
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <span className="text-xs font-semibold text-primary">
                                                            {user.name?.charAt(0) || "U"}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {user.photo ? (
                                                    <img
                                                        src={toImageUrl(user.photo)}
                                                        alt={user.name}
                                                        className="w-8 h-8 rounded-full object-cover"
                                                        onError={(e) => {
                                                            e.target.style.display = "none";
                                                            e.target.parentElement.innerHTML = `<div class="w-8 h-8 rounded-full flex items-center justify-center ${isCurrentUser ? 'bg-(--accent-2) text-white' : 'bg-(--surface-muted) text-(--muted)'}">${isCurrentUser ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>' : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'}</div>`;
                                                        }}
                                                    />
                                                ) : (
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCurrentUser ? 'bg-(--accent-2) text-white' : 'bg-(--surface-muted) text-(--muted)'}`}>
                                                        {isCurrentUser ? <Shield size={16} /> : <UserIcon size={16} />}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-medium text-(--ink)">{user.name}</p>
                                                    {isCurrentUser && (
                                                        <p className="text-xs text-(--accent-2) font-medium">{labels.you}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-(--muted)">{user.email}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-md text-xs font-medium ${user.role === 'admin' ? 'bg-purple-500/10 text-purple-600' :
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
                                    <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0" style={{ background: "var(--surface-muted)" }}>
                                        {user.photo ? (
                                            <img
                                                src={toImageUrl(user.photo)}
                                                alt={user.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.style.display = "none";
                                                    e.target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center"><span class="text-sm font-semibold text-primary">${user.name?.charAt(0) || "U"}</span></div>`;
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <span className="text-sm font-semibold text-primary">
                                                    {user.name?.charAt(0) || "U"}
                                                </span>
                                            </div>
                                        )}
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
                                        <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium mt-1 ${user.role === 'admin' ? 'bg-purple-500/10 text-purple-600' :
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
                                        <button className="flex-1 flex items-center justify-center px-3 py-2 rounded-lg bg-(--surface-muted) border border-(--border) hover:border-(--accent-2) hover:text-(--accent-2) transition-all text-sm" title={labels.view}>
                                            <Eye size={16} />
                                        </button>
                                    </PermissionGuard>
                                    <PermissionGuard
                                        execute={() => openEditModal(user)}
                                        permission="users.update"
                                        isConfirmation={true}
                                    >
                                        <button className="flex-1 flex items-center justify-center px-3 py-2 rounded-lg bg-(--surface-muted) border border-(--border) hover:border-(--accent-2) hover:text-(--accent-2) transition-all text-sm" title={labels.edit}>
                                            <Edit2 size={16} />
                                        </button>
                                    </PermissionGuard>
                                    <PermissionGuard
                                        execute={() => handleDelete(user._id)}
                                        permission="users.delete"
                                        isConfirmation={true}
                                    >
                                        <button className="flex-1 flex items-center justify-center px-3 py-2 rounded-lg bg-(--surface-muted) border border-(--border) hover:border-red-500 hover:text-red-500 transition-all text-sm" title={labels.delete}>
                                            <Trash2 size={16} />
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
