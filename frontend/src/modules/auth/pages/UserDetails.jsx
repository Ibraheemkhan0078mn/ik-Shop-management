import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, User as UserIcon, Mail, Phone, Shield, Calendar, Edit2 } from "lucide-react";
import { useSettings } from "../../settings/hooks/useSettings.js";
import { getUserLabels } from "../labels/userLabels.js";
import { useGetUserByIdQuery } from "../services/authApi.js";
import PageHeading from "../../../shared/components/PageHeading.jsx";
import ScreenTabButton from "../../../shared/components/ScreenTabButton.jsx";
import PermissionGuard from "../../../shared/components/PermissionGuard.jsx";

export default function UserDetails() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getUserLabels(language);

    const { data: response, isLoading, error } = useGetUserByIdQuery(userId);
    const user = response?.data;

    const handleEdit = () => {
        navigate(`/users/${userId}/edit`);
    };

    const handleBack = () => {
        navigate("/users");
    };

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <p className="text-(--muted)">{labels.loading}</p>
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="h-screen flex flex-col items-center justify-center">
                <p className="text-(--muted) mb-4">{labels.userNotFound || "User not found"}</p>
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

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case "admin":
                return "bg-purple-500/10 text-purple-600 border-purple-200";
            case "manager":
                return "bg-blue-500/10 text-blue-600 border-blue-200";
            default:
                return "bg-gray-500/10 text-gray-600 border-gray-200";
        }
    };

    return (
        <div className="h-screen flex flex-col overflow-hidden" style={{ color: "var(--ink)" }}>
            <div className="flex-none">
                <PageHeading
                    heading={labels.userDetails || "User Details"}
                    subheading={labels.viewUserInformation || "View user information"}
                    leftActions={
                        <div onClick={handleBack}>
                            <ScreenTabButton lucideIcon={ArrowLeft} text={labels.back || "Back"} />
                        </div>
                    }

                />
            </div>

            <div className="flex-1 overflow-auto p-6">
                <div className="max-w-4xl mx-auto">
                    {/* Profile Header Card */}
                    <div className="rounded-2xl p-6 mb-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                            <div className="w-20 h-20 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--surface-muted)", border: "2px solid var(--accent-2)" }}>
                                <UserIcon size={40} style={{ color: "var(--accent-2)" }} />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="text-2xl font-bold">{user.name}</h1>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeColor(user.role)}`}>
                                        {labels[user.role] || user.role}
                                    </span>
                                </div>
                                <p className="text-(--muted)">{user.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Contact Information */}
                        <div className="rounded-2xl p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Mail size={20} style={{ color: "var(--accent-2)" }} />
                                {labels.contactInformation || "Contact Information"}
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-(--muted) mb-1">{labels.email}</label>
                                    <p className="font-medium">{user.email}</p>
                                </div>
                                <div>
                                    <label className="block text-sm text-(--muted) mb-1">{labels.phone}</label>
                                    <p className="font-medium">{user.phoneNo || labels.noPhone}</p>
                                </div>
                            </div>
                        </div>

                        {/* Account Information */}
                        <div className="rounded-2xl p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Shield size={20} style={{ color: "var(--accent-2)" }} />
                                {labels.accountInformation || "Account Information"}
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-(--muted) mb-1">{labels.role}</label>
                                    <p className="font-medium">{labels[user.role] || user.role}</p>
                                </div>
                                <div>
                                    <label className="block text-sm text-(--muted) mb-1">{labels.status || "Status"}</label>
                                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${user.isActive ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                                        {user.isActive ? (labels.active || "Active") : (labels.inactive || "Inactive")}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Permissions */}
                        <div className="rounded-2xl p-6 md:col-span-2" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Shield size={20} style={{ color: "var(--accent-2)" }} />
                                {labels.permissions}
                            </h2>
                            {user.permissions && user.permissions.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {user.permissions.map((permission) => (
                                        <span
                                            key={permission}
                                            className="px-3 py-1 rounded-lg text-sm"
                                            style={{ background: "var(--surface-muted)", border: "1px solid var(--border)", color: "var(--muted)" }}
                                        >
                                            {permission}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-(--muted)">{labels.noPermissions || "No permissions assigned"}</p>
                            )}
                        </div>

                        {/* Timestamps */}
                        <div className="rounded-2xl p-6 md:col-span-2" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Calendar size={20} style={{ color: "var(--accent-2)" }} />
                                {labels.timestamps || "Timestamps"}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-(--muted) mb-1">{labels.createdAt || "Created At"}</label>
                                    <p className="font-medium">{formatDate(user.createdAt)}</p>
                                </div>
                                <div>
                                    <label className="block text-sm text-(--muted) mb-1">{labels.updatedAt || "Updated At"}</label>
                                    <p className="font-medium">{formatDate(user.updatedAt)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
