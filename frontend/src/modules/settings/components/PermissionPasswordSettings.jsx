import { useState, useEffect } from "react";
import { Edit, Save, X, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const API_BASE = "http://localhost:5001/api";

export default function PermissionPasswordSettings({ settingsData, userId, labels }) {
    const [permissionPassword, setPermissionPassword] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (settingsData?.permissionPassword) {
            setPermissionPassword(settingsData.permissionPassword);
        }
    }, [settingsData]);

    const handleFetchPermissionPassword = async () => {
        try {
            const response = await axios.get(`${API_BASE}/settings`, {
                params: { userId }
            });
            if (response.data?.data?.permissionPassword) {
                setPermissionPassword(response.data.data.permissionPassword);
            }
        } catch (error) {
            console.error("Failed to fetch permission password:", error);
            toast.error("Failed to fetch current password");
        }
    };

    const handleSave = async () => {
        if (!permissionPassword.trim()) {
            toast.error("Permission password is required");
            return;
        }

        setLoading(true);
        try {
            console.log("Saving permission password:", { userId, passwordLength: permissionPassword.length });
            const response = await axios.put(`${API_BASE}/settings/permission-password`, {
                userId,
                permissionPassword
            });
            console.log("Save response:", response.data);
            toast.success("Permission password saved successfully");
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to save permission password:", error.response?.data || error.message);
            toast.error(error.response?.data?.message || "Failed to save permission password");
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        if (settingsData?.permissionPassword) {
            setPermissionPassword(settingsData.permissionPassword);
        } else {
            setPermissionPassword("");
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-[var(--ink)] mb-2">Permission Password</label>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <input
                            type={showPassword ? "text" : "password"}
                            value={permissionPassword}
                            onChange={(e) => setPermissionPassword(e.target.value)}
                            disabled={!isEditing}
                            className={`w-full px-4 py-2 pr-10 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)] ${
                                !isEditing ? "bg-[var(--surface-muted)] cursor-not-allowed" : ""
                            }`}
                            placeholder="Enter permission password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    {!isEditing ? (
                        <button
                            onClick={() => {
                                setIsEditing(true);
                                handleFetchPermissionPassword();
                            }}
                            className="p-2 rounded-lg bg-[var(--surface-muted)] border border-[var(--border)] hover:border-[var(--accent-2)] hover:text-[var(--accent-2)] transition-all"
                            title="Edit"
                        >
                            <Edit size={18} />
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="p-2 rounded-lg bg-[var(--accent-2)] text-white hover:bg-[var(--accent-2)]/80 transition-all disabled:opacity-50"
                                title="Save"
                            >
                                <Save size={18} />
                            </button>
                            <button
                                onClick={handleCancel}
                                className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                                title="Cancel"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    )}
                </div>
                <p className="text-xs text-[var(--muted)] mt-2">
                    This password is used to authorize sensitive operations. Only visible to admin users.
                </p>
            </div>
        </div>
    );
}
