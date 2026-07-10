import { useState, useEffect } from "react";
import { User, Mail, Phone } from "lucide-react";
import { useSelector } from "react-redux";

export default function ProfileSettings({ labels }) {
    const { name, email, phoneNo, role } = useSelector(s => s.auth) || {};
    const [profileName, setProfileName] = useState("");
    const [profileEmail, setProfileEmail] = useState("");
    const [profilePhone, setProfilePhone] = useState("");

    useEffect(() => {
        setProfileName(name || "");
        setProfileEmail(email || "");
        setProfilePhone(phoneNo || "");
    }, [name, email, phoneNo]);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-[var(--surface-muted)] flex items-center justify-center border border-[var(--border)]">
                    <User size={32} className="text-[var(--muted)]" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-[var(--ink)]">{labels.profileSettings}</h3>
                    <p className="text-sm text-[var(--muted)]">{labels.role}: {role}</p>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-[var(--ink)] mb-2 flex items-center gap-2">
                    <User size={16} />
                    {labels.name}
                </label>
                <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)]"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-[var(--ink)] mb-2 flex items-center gap-2">
                    <Mail size={16} />
                    {labels.email}
                </label>
                <input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)]"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-[var(--ink)] mb-2 flex items-center gap-2">
                    <Phone size={16} />
                    {labels.phone}
                </label>
                <input
                    type="text"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)]"
                />
            </div>
            <button className="btn-add">
                {labels.updateProfile}
            </button>
        </div>
    );
}
