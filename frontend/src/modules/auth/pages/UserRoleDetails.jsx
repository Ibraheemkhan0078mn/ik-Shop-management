import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Calendar, Edit2, Trash2 } from "lucide-react";
import { useSettings } from "../../settings/hooks/useSettings.js";
import { getUserLabels } from "../labels/userLabels.js";
import { useGetUserRoleByIdQuery, useDeleteUserRoleMutation } from "../services/authApi.js";
import PageHeading from "../../../shared/components/PageHeading.jsx";
import ScreenTabButton from "../../../shared/components/ScreenTabButton.jsx";
import { showSuccess, showError } from "../../../shared/utilities/toastHelpers.js";
import { categorizePermissions } from "../../../shared/utilities/permissionUtils.js";
import { AppPermissionContext } from "../../../shared/context/Permission.context.jsx";
import { useContext } from "react";

export default function UserRoleDetails() {
    const { roleId } = useParams();
    const navigate = useNavigate();
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getUserLabels(language);
    let { appPermissions } = useContext(AppPermissionContext);

    const { data: response, isLoading, error } = useGetUserRoleByIdQuery(roleId);
    const role = response?.data;
    const [deleteUserRole] = useDeleteUserRoleMutation();

    const handleBack = () => {
        navigate("/user-roles");
    };

    const handleEdit = () => {
        navigate("/user-roles");
        // Note: You might want to pass state to open edit modal directly
        // For now, this navigates back to the list
    };

    const handleDelete = async () => {
        try {
            await deleteUserRole(role._id).unwrap();
            showSuccess(labels.roleDeleted);
            navigate("/user-roles");
        } catch (err) {
            showError(err?.data?.message || labels.deleteFailed);
        }
    };

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <p className="text-(--muted)">{labels.loading}</p>
            </div>
        );
    }

    if (error || !role) {
        return (
            <div className="h-screen flex flex-col items-center justify-center">
                <p className="text-(--muted) mb-4">{labels.noRolesFound || "Role not found"}</p>
                <button
                    onClick={handleBack}
                    className="px-4 py-2 rounded-lg"
                    style={{ background: "var(--accent-2)", color: "white" }}
                >
                    {labels.back || "Back"}
                </button>
            </div>
        );
    }

    const formatDate = (date) => {
        if (!date) return labels.notAvailable || "N/A";
        return new Date(date).toLocaleDateString(language === "ur" ? "ur-PK" : "en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    };

    // Categorize permissions from backend
    const permissionGroups = categorizePermissions(appPermissions || []);

    return (
        <div className="h-screen flex flex-col overflow-hidden" style={{ color: "var(--ink)" }}>
            <div className="flex-none">
                <PageHeading
                    heading={labels.roleDetails || "Role Details"}
                    subheading={labels.viewRoleDetails || "View role details and permissions"}
                    leftActions={
                        <div onClick={handleBack}>
                            <ScreenTabButton lucideIcon={ArrowLeft} text={labels.back || "Back"} />
                        </div>
                    }
                    rightActions={
                        <div className="flex gap-2">
                            <div onClick={handleEdit}>
                                <ScreenTabButton lucideIcon={Edit2} text={labels.edit} />
                            </div>
                            <div onClick={handleDelete}>
                                <ScreenTabButton lucideIcon={Trash2} text={labels.delete} />
                            </div>
                        </div>
                    }
                />
            </div>

            <div className="flex-1 overflow-auto p-6">
                <div className="max-w-4xl mx-auto">
                    {/* Role Header Card */}
                    <div className="rounded-2xl p-6 mb-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-xl flex items-center justify-center" style={{ background: "var(--surface-muted)", border: "2px solid var(--accent-2)" }}>
                                <Shield size={32} style={{ color: "var(--accent-2)" }} />
                            </div>
                            <div className="flex-1">
                                <h1 className="text-2xl font-bold">{role.name}</h1>
                                <p className="text-(--muted)">{role.permissions?.length || 0} {labels.permissions}</p>
                            </div>
                        </div>
                    </div>

                    {/* Permissions Section */}
                    <div className="rounded-2xl p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Shield size={20} style={{ color: "var(--accent-2)" }} />
                            {labels.permissions}
                        </h2>
                        {role.permissions && role.permissions.length > 0 ? (
                            <div className="grid gap-3">
                                {permissionGroups.map((group) => {
                                    const groupPermissions = group.actions.map(({ key }) => `${group.module}.${key}`);
                                    const hasGroupPermissions = groupPermissions.some(perm => role.permissions.includes(perm));
                                    
                                    if (!hasGroupPermissions) return null;

                                    return (
                                        <div key={group.module} className="rounded-xl p-4" style={{ background: "var(--surface-muted)", border: "1px solid var(--border)" }}>
                                            <div className="flex items-center justify-between mb-3">
                                                <p className="font-semibold">{group.label}</p>
                                                <span className="text-xs text-(--muted)">
                                                    {groupPermissions.filter(perm => role.permissions.includes(perm)).length} / {groupPermissions.length}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                {group.actions.map(({ key, label }) => {
                                                    const permission = `${group.module}.${key}`;
                                                    const hasPermission = role.permissions.includes(permission);
                                                    return (
                                                        <div 
                                                            key={permission} 
                                                            className="flex items-center gap-2 px-3 py-2 rounded-lg"
                                                            style={{ 
                                                                background: hasPermission ? "var(--accent-2)/10" : "var(--surface)",
                                                                border: hasPermission ? "1px solid var(--accent-2)" : "1px solid var(--border)",
                                                                opacity: hasPermission ? 1 : 0.4
                                                            }}
                                                        >
                                                            <div className={`w-4 h-4 rounded flex items-center justify-center ${hasPermission ? 'bg-(--accent-2)' : 'bg-(--border)'}`}>
                                                                {hasPermission && <span className="text-white text-xs">✓</span>}
                                                            </div>
                                                            <span className="text-sm" style={{ color: hasPermission ? "var(--ink)" : "var(--muted)" }}>{label}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-(--muted)">{labels.noPermissions || "No permissions assigned"}</p>
                        )}
                    </div>

                    {/* Timestamps */}
                    <div className="rounded-2xl p-6 mt-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Calendar size={20} style={{ color: "var(--accent-2)" }} />
                            {labels.timestamps || "Timestamps"}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-(--muted) mb-1">{labels.createdAt || "Created At"}</label>
                                <p className="font-medium">{formatDate(role.createdAt)}</p>
                            </div>
                            <div>
                                <label className="block text-sm text-(--muted) mb-1">{labels.updatedAt || "Updated At"}</label>
                                <p className="font-medium">{formatDate(role.updatedAt)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
