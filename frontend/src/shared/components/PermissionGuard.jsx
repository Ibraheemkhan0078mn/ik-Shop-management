import React, { useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePermissionGuard } from '../hooks/usePermissionGuard.js';

const PermissionGuard = ({
    children,
    execute,
    permission,
    isConfirmation = false,
    guardType = "password"
}) => {
    const { user, settingsData, isLoading, isAdmin, hasPermission } = usePermissionGuard();
    const [popup, setPopup] = useState(null);
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [confirmOpen, setConfirmOpen] = useState(false);
    const busy = useRef(false);

    const closePopup = () => { setPopup(null); setPassword(""); setError(""); };

    const runOrConfirm = useCallback(() => {
        if (!execute) {
            console.warn("[PermissionGuard] execute() missing");
            return;
        }
        if (isConfirmation) {
            setConfirmOpen(true);
        } else {
            execute();
        }
    }, [execute, isConfirmation]);

    const handleClick = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("[PermissionGuard] click", { busy: busy.current, user, isLoading, isAdmin, permission, guardType });

        if (busy.current) { console.log("[PermissionGuard] ignored: debounced"); return; }
        if (!user) { console.warn("[PermissionGuard] ignored: no user in AppPermissionContext"); return; }
        if (isLoading) { console.log("[PermissionGuard] ignored: context still loading"); return; }

        busy.current = true;
        setTimeout(() => (busy.current = false), 300);

        if (isAdmin) return runOrConfirm();

        if (permission && !hasPermission(permission)) {
            console.log("[PermissionGuard] denied:", permission);
            setPopup("denied");
            return;
        }

        if (guardType === "password") {
            setPassword(""); setError(""); setPopup("password");
        } else {
            execute?.();
        }
    }, [user, isLoading, isAdmin, permission, hasPermission, guardType, execute, runOrConfirm]);

    const submitPassword = () => {
        if (password === settingsData?.permissionPassword) {
            closePopup();
            runOrConfirm();
        } else {
            console.warn("[PermissionGuard] wrong password entered");
            setError("Incorrect password, try again");
        }
    };

    const GuardPopup = () => {
        if (!popup) return null;
        const isDenied = popup === "denied";
        return createPortal(
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                <div onClick={closePopup} className="absolute inset-0 app-overlay backdrop-blur-md" style={{ animation: "fadeIn 0.2s ease" }} />
                <div className="relative rounded-2xl shadow-2xl border w-full max-w-sm p-8 flex flex-col items-center gap-6 overflow-hidden"
                    style={{ background: 'var(--surface)', borderColor: 'var(--border)', animation: "macPop 0.35s cubic-bezier(0.34,1.56,0.64,1)" }}>
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl" style={{ background: 'var(--ink)' }}>
                        <i className={isDenied ? "ri-lock-line" : "ri-lock-2-line"} style={{ color: isDenied ? 'var(--accent)' : 'var(--accent-2)' }} />
                    </div>
                    <div className="text-center space-y-2">
                        <h3 className="text-lg font-black tracking-tight" style={{ color: 'var(--ink)' }}>
                            {isDenied ? "Permission Denied" : "Enter Password"}
                        </h3>
                        <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--muted)' }}>
                            {isDenied ? "You don't have permission to perform this action." : "Enter permission password to continue"}
                        </p>
                    </div>

                    {!isDenied && (
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && submitPassword()}
                            placeholder="Password"
                            autoFocus
                            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                            style={{ background: 'var(--surface-muted)', color: 'var(--ink)', border: '1px solid var(--border)' }}
                        />
                    )}
                    {error && <p className="text-xs font-medium" style={{ color: 'var(--accent)' }}>{error}</p>}

                    <div className="w-full h-px" style={{ background: 'var(--border)' }} />
                    <div className="flex gap-3 w-full">
                        <button onClick={closePopup}
                            className="flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest"
                            style={{ background: 'var(--surface-muted)', color: 'var(--muted)' }}>
                            Cancel
                        </button>
                        {!isDenied && (
                            <button onClick={submitPassword}
                                className="flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg"
                                style={{ background: 'var(--ink)', color: '#fff' }}>
                                Submit
                            </button>
                        )}
                    </div>
                </div>
                <style>{`@keyframes macPop{0%{transform:scale(.7);opacity:0}100%{transform:scale(1);opacity:1}}@keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>
            </div>,
            document.body
        );
    };

    const ConfirmationPopup = () => {
        if (!confirmOpen) return null;
        return createPortal(
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                <div onClick={() => setConfirmOpen(false)} className="absolute inset-0 app-overlay backdrop-blur-md" style={{ animation: "fadeIn 0.2s ease" }} />
                <div className="relative rounded-2xl shadow-2xl border w-full max-w-sm p-8 flex flex-col items-center gap-6 overflow-hidden"
                    style={{ background: 'var(--surface)', borderColor: 'var(--border)', animation: "macPop 0.35s cubic-bezier(0.34,1.56,0.64,1)" }}>
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl" style={{ background: 'var(--ink)' }}>
                        <i className="ri-alert-line text-2xl" style={{ color: 'var(--accent-2)' }} />
                    </div>
                    <div className="text-center space-y-2">
                        <h3 className="text-lg font-black tracking-tight" style={{ color: 'var(--ink)' }}>Confirm Action</h3>
                        <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--muted)' }}>Are you sure you want to perform this action?</p>
                    </div>
                    <div className="w-full h-px" style={{ background: 'var(--border)' }} />
                    <div className="flex gap-3 w-full">
                        <button onClick={() => setConfirmOpen(false)}
                            className="flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest"
                            style={{ background: 'var(--surface-muted)', color: 'var(--muted)' }}>
                            Cancel
                        </button>
                        <button onClick={() => { setConfirmOpen(false); execute(); }}
                            className="flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg"
                            style={{ background: 'var(--ink)', color: '#fff' }}>
                            Yes, Confirm
                        </button>
                    </div>
                </div>
                <style>{`@keyframes macPop{0%{transform:scale(.7);opacity:0}100%{transform:scale(1);opacity:1}}@keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>
            </div>,
            document.body
        );
    };

    return (
        <>
            <span onClick={handleClick}>{children}</span>
            <GuardPopup />
            <ConfirmationPopup />
        </>
    );
};

export { PermissionGuard };
export default PermissionGuard;