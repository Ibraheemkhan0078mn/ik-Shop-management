import { useSelector } from "react-redux";
import { useGetUserQuery } from "../api/authApi.js";
import PageHeading from "../../../shared/components/PageHeading.jsx";
import { PERMISSION_GROUPS, getPermissionLabel } from "../../../shared/utilities/permissions.js";

export default function Profile() {
    const userId = useSelector(s => s.auth?.id);
    const { data: user, isLoading } = useGetUserQuery(userId, { skip: !userId });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64" style={{ color: "var(--muted)" }}>
                Loading...
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center h-64" style={{ color: "var(--muted)" }}>
                User not found
            </div>
        );
    }

    const permissions = user?.permissions || [];

    return (
        <div style={{ color: "var(--ink)" }}>
            <PageHeading heading="Profile" subheading="View and manage your profile information" />

            <div className="max-w-2xl space-y-6">
                <div className="p-6 rounded-2xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                    <h2 className="text-lg font-bold mb-4">Personal Information</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: "var(--muted)" }}>Name</label>
                            <p className="font-medium">{user.name}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: "var(--muted)" }}>Email</label>
                            <p className="font-medium">{user.email}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: "var(--muted)" }}>Phone</label>
                            <p className="font-medium">{user.phoneNo || "Not provided"}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: "var(--muted)" }}>Role</label>
                            <p className="font-medium capitalize">{user.role}</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 rounded-2xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                    <h2 className="text-lg font-bold mb-4">Permissions</h2>
                    <div className="grid grid-cols-2 gap-2">
                        {PERMISSION_GROUPS.flatMap((group) => group.actions.map(({ key }) => ({ permission: `${group.module}.${key}`, label: getPermissionLabel(`${group.module}.${key}`) }))).map(({ permission, label }) => (
                            <div key={permission} className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${permissions.includes(permission) ? "bg-green-500" : "bg-gray-300"}`} />
                                <span className="text-sm">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-6 rounded-2xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                    <h2 className="text-lg font-bold mb-4">Account Details</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: "var(--muted)" }}>Language</label>
                            <p className="font-medium capitalize">{user.language}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: "var(--muted)" }}>Status</label>
                            <p className={`font-medium ${user.isActive ? "text-green-500" : "text-red-500"}`}>
                                {user.isActive ? "Active" : "Inactive"}
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: "var(--muted)" }}>Created</label>
                            <p className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
