import { useState, useMemo, useEffect, useCallback } from "react";
import { X, CreditCard, Wallet, Smartphone, Layers, ChevronRight, Plus, Check } from "lucide-react";
import { FormField, Input } from "../../../shared/components/FormFields.jsx";
import { useQarzaAccounts } from "../../qarza/services/qarza.service.js";
import { useGetStaffListQuery } from "../../staff/api/staff.api.js";
import QarzaAccountModal from "../../qarza/components/QarzaAccountModal.jsx";

const ONLINE_PLATFORMS = [
    { value: "easypaisa", label: "Easypaisa" },
    { value: "jazzcash", label: "JazzCash" },
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "raast", label: "Raast" },
    { value: "sadapay", label: "SadaPay" },
    { value: "nayapay", label: "NayaPay" },
];

const PAYMENT_TABS = [
    { key: "cash", label: "Cash", icon: Wallet },
    { key: "online", label: "Online", icon: Smartphone },
    { key: "credit", label: "Qarza", icon: CreditCard },
    { key: "hybrid", label: "Hybrid", icon: Layers },
];

// ─── Design Atoms ─────────────────────────────────────────────────────────────

const InfoStrip = ({ label, value, valid = true }) => (
    <div
        className="rounded-xl px-4 py-3 flex justify-between items-center"
        style={{
            background: valid ? "rgba(15,118,110,0.08)" : "var(--surface-muted)",
            border: valid ? "1px solid rgba(15,118,110,0.25)" : "1px solid var(--border)",
        }}
    >
        <span className="text-sm font-medium" style={{ color: valid ? "var(--accent-2)" : "var(--muted)" }}>
            {label}
        </span>
        <span className="text-sm font-bold" style={{ color: valid ? "var(--accent-2)" : "var(--ink)" }}>
            {value}
        </span>
    </div>
);

const FillButton = ({ onClick }) => (
    <button
        onClick={onClick}
        className="h-9 px-3 text-xs rounded-lg font-semibold transition-all whitespace-nowrap shrink-0 hover:shadow-sm"
        style={{
            background: "rgba(15,118,110,0.1)",
            color: "var(--accent-2)",
            border: "1px solid rgba(15,118,110,0.25)",
        }}
    >
        Fill rest
    </button>
);

const CreateQarzaLink = ({ onClick }) => (
    <button
        onClick={onClick}
        className="flex items-center gap-1.5 text-xs font-semibold hover:underline"
        style={{ color: "var(--accent-2)" }}
    >
        <Plus size={12} /> New Qarza account
    </button>
);

const OrderTypeToggle = ({ value, onChange }) => (
    <div
        className="flex rounded-xl p-1 gap-1 w-full"
        style={{ background: "var(--surface-muted)", border: "1px solid var(--border)" }}
    >
        {["retail", "wholesale"].map((type) => (
            <button
                key={type}
                onClick={() => onChange(type)}
                className="flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all"
                style={{
                    background: value === type
                        ? "linear-gradient(135deg, var(--accent-2), #0b5f59)"
                        : "transparent",
                    color: value === type ? "white" : "var(--muted)",
                    boxShadow: value === type ? "0 2px 8px rgba(15,118,110,0.2)" : "none",
                }}
            >
                {type}
            </button>
        ))}
    </div>
);

// ─── Tab Panels ───────────────────────────────────────────────────────────────

function CashTab({ cashReceived, setCashReceived, total, cashChange }) {
    const received = Number(cashReceived) || 0;
    const isShort = received > 0 && received < total;
    const isSufficient = received >= total && cashReceived;

    const quickAmounts = [
        total,
        Math.ceil(total / 100) * 100,
        Math.ceil(total / 500) * 500,
        Math.ceil(total / 1000) * 1000,
    ].filter((v, i, arr) => arr.indexOf(v) === i && v >= total).slice(0, 4);

    return (
        <div className="space-y-3">
            <FormField label="Cash Received">
                <Input
                    type="number" min={0} autoFocus
                    placeholder={`Min. Rs ${total.toLocaleString()}`}
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                />
            </FormField>

            {/* Quick amount chips */}
            <div className="flex gap-2 flex-wrap">
                {quickAmounts.map((amt) => (
                    <button
                        key={amt}
                        onClick={() => setCashReceived(String(amt))}
                        className="px-3 py-1.5 text-xs rounded-lg font-semibold transition-all hover:shadow-sm"
                        style={{
                            background: String(amt) === cashReceived
                                ? "rgba(15,118,110,0.12)"
                                : "var(--surface-muted)",
                            color: String(amt) === cashReceived
                                ? "var(--accent-2)"
                                : "var(--ink)",
                            border: String(amt) === cashReceived
                                ? "1px solid rgba(15,118,110,0.3)"
                                : "1px solid var(--border)",
                        }}
                    >
                        Rs {amt.toLocaleString()}
                    </button>
                ))}
            </div>

            {isSufficient && <InfoStrip label="Change to return" value={`Rs ${cashChange.toLocaleString()}`} />}
            {isShort && (
                <div
                    className="rounded-xl px-4 py-2.5"
                    style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)" }}
                >
                    <p className="text-xs font-semibold" style={{ color: "#dc2626" }}>
                        Short by Rs {(total - received).toLocaleString()}
                    </p>
                </div>
            )}
        </div>
    );
}

function OnlineTab({ onlinePlatform, setOnlinePlatform, onlineAmount, setOnlineAmount, total }) {
    return (
        <div className="space-y-3">
            <FormField label="Platform">
                <select
                    value={onlinePlatform}
                    onChange={(e) => setOnlinePlatform(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl outline-none transition"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--ink)" }}
                >
                    <option value="">Select platform...</option>
                    {ONLINE_PLATFORMS.map((platform) => (
                        <option key={platform.value} value={platform.value}>
                            {platform.label}
                        </option>
                    ))}
                </select>
            </FormField>
            <FormField label="Amount Received">
                <div className="flex gap-2">
                    <Input type="number" min={0} placeholder={`Rs ${total.toLocaleString()}`}
                        value={onlineAmount} onChange={(e) => setOnlineAmount(e.target.value)} />
                    <FillButton onClick={() => setOnlineAmount(String(total))} />
                </div>
            </FormField>
        </div>
    );
}

function CreditTabWithModal({ qarzaOptions, qarzaAccountId, setQarzaAccountId, total, onOpenQarzaModal }) {
    return (
        <div className="space-y-3">
            <FormField label="Ledger Account">
                <div className="flex gap-2">
                    <select
                        className="flex-1 px-3 py-2 text-sm rounded-xl outline-none transition"
                        style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--ink)" }}
                        value={qarzaAccountId}
                        onChange={(e) => setQarzaAccountId(e.target.value)}
                    >
                        <option value="">Search account...</option>
                        {qarzaOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <button
                        type="button"
                        onClick={onOpenQarzaModal}
                        className="px-3 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition flex items-center gap-1"
                        title="Create new account"
                    >
                        <Plus size={16} />
                    </button>
                </div>
            </FormField>
            {qarzaAccountId && <InfoStrip label="Amount on credit" value={`Rs ${total.toLocaleString()}`} />}
        </div>
    );
}

function HybridTab({
    hybridCash, setHybridCash,
    hybridQarza, setHybridQarza,
    hybridQarzaAccountId, setHybridQarzaAccountId,
    qarzaOptions, onOpenQarzaModal,
    total, hybridSum, hybridValid, hybridShortage,
    fillHybridCash, fillHybridQarza,
}) {
    return (
        <div className="space-y-3">
            <p className="text-xs" style={{ color: "var(--muted)" }}>
                Cash + Qarza must total <strong style={{ color: "var(--ink)" }}>Rs {total.toLocaleString()}</strong>.
            </p>

            <div
                className="rounded-xl p-4 space-y-3"
                style={{ background: "var(--surface-muted)", border: "1px solid var(--border)" }}
            >
                {/* Cash row */}
                <div>
                    <p className="text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: "var(--muted)" }}>
                        <Wallet size={11} /> Cash portion
                    </p>
                    <div className="flex gap-2">
                        <Input type="number" min={0} placeholder="0"
                            value={hybridCash} onChange={(e) => setHybridCash(e.target.value)} />
                        <FillButton onClick={fillHybridCash} />
                    </div>
                </div>

                <div style={{ borderTop: "1px solid var(--border)" }} />

                {/* Qarza row */}
                <div>
                    <p className="text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: "var(--muted)" }}>
                        <CreditCard size={11} /> Qarza portion
                    </p>
                    <div className="flex gap-2 mb-2">
                        <Input type="number" min={0} placeholder="0"
                            value={hybridQarza} onChange={(e) => setHybridQarza(e.target.value)} />
                        <FillButton onClick={fillHybridQarza} />
                    </div>
                    <div className="flex gap-2">
                        <select
                            className="flex-1 px-3 py-2 text-sm rounded-xl outline-none transition"
                            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--ink)" }}
                            value={hybridQarzaAccountId}
                            onChange={(e) => setHybridQarzaAccountId(e.target.value)}
                        >
                            <option value="">Select Qarza account...</option>
                            {qarzaOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            onClick={onOpenQarzaModal}
                            className="px-3 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition flex items-center gap-1"
                            title="Create new account"
                        >
                            <Plus size={16} />
                        </button>
                    </div>
                </div>
            </div>

            <InfoStrip
                valid={hybridValid}
                label={hybridValid
                    ? "✓ Amounts balanced"
                    : `Remaining: Rs ${hybridShortage > 0 ? hybridShortage.toLocaleString() : "—"}`}
                value={`${hybridSum.toLocaleString()} / ${total.toLocaleString()}`}
            />
        </div>
    );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function PosPaymentModal({
    subtotal = 0,
    onCheckout,
    onClose,
    onCreateQarza,
    language = "en",
    initialCustomerName = "",
    initialWaiter = "",
    initialDiscount = 0,
    initialStaffId = "",
}) {
    const { data: qarzaAccounts = [], refetch: refetchQarzaAccounts } = useQarzaAccounts();
    const { data: staffList = [] } = useGetStaffListQuery({ limit: 100 });

    const [activeTab, setActiveTab] = useState("cash");
    const [orderDiscount, setOrderDiscount] = useState(initialDiscount > 0 ? String(initialDiscount) : "");
    const [customerName, setCustomerName] = useState(initialCustomerName);
    const [orderType, setOrderType] = useState("retail");
    const [selectedStaffId, setSelectedStaffId] = useState(initialStaffId);
    const [cashReceived, setCashReceived] = useState("");
    const [onlinePlatform, setOnlinePlatform] = useState("");
    const [onlineAmount, setOnlineAmount] = useState("");
    const [qarzaAccountId, setQarzaAccountId] = useState("");
    const [hybridCash, setHybridCash] = useState("");
    const [hybridQarza, setHybridQarza] = useState("");
    const [hybridQarzaAccountId, setHybridQarzaAccountId] = useState("");
    const [showQarzaModal, setShowQarzaModal] = useState(false);

    const discountAmt = Math.max(0, Number(orderDiscount) || 0);
    const total = Math.max(0, subtotal - discountAmt);
    const cashChange = Math.max(0, (Number(cashReceived) || 0) - total);
    const hybridSum = (Number(hybridCash) || 0) + (Number(hybridQarza) || 0);
    const hybridValid = Math.abs(hybridSum - total) < 0.01 && !!hybridQarzaAccountId;
    const hybridShortage = total - hybridSum;

    useEffect(() => {
        if (total > 0) setCashReceived(String(total.toFixed(0)));
    }, [total]);

    const handleQarzaAccountCreated = () => {
        setShowQarzaModal(false);
        refetchQarzaAccounts();
    };

    const qarzaOptions = qarzaAccounts?.accounts?.map((a) => ({
        value: a._id,
        label: a.name + (a.phoneNo ? ` · ${a.phoneNo}` : ""),
    }));

    const staffList_ = Array.isArray(staffList?.data) ? staffList.data : [];

    const canCheckout = useMemo(() => {
        if (total === 0) return true;
        switch (activeTab) {
            case "cash": return Number(cashReceived) >= total;
            case "online": return !!onlinePlatform && Number(onlineAmount) >= total;
            case "credit": return !!qarzaAccountId;
            case "hybrid": return hybridValid;
            default: return false;
        }
    }, [activeTab, cashReceived, total, onlinePlatform, onlineAmount, qarzaAccountId, hybridValid]);

    const buildPayload = () => ({
        customerName,
        selectedWaiter: initialWaiter,
        selectedStaffId,
        orderDiscount: discountAmt,
        paymentMethod: activeTab,
        orderType,
        cashReceived: activeTab === "cash" ? cashReceived : "",
        onlinePlatform: activeTab === "online" ? onlinePlatform : "",
        onlineAmount: activeTab === "online" ? onlineAmount : "",
        selectedQarzaAccountId: activeTab === "credit" ? qarzaAccountId : "",
        hybridCash: activeTab === "hybrid" ? hybridCash : "",
        hybridQarza: activeTab === "hybrid" ? hybridQarza : "",
        hybridQarzaAccountId: activeTab === "hybrid" ? hybridQarzaAccountId : "",
    });

    const handleCheckout = useCallback(() => { if (canCheckout) onCheckout(buildPayload()); }, [canCheckout, buildPayload]);
    const fillHybridQarza = () => { const r = total - (Number(hybridCash) || 0); if (r > 0) setHybridQarza(String(r.toFixed(0))); };
    const fillHybridCash = () => { const r = total - (Number(hybridQarza) || 0); if (r > 0) setHybridCash(String(r.toFixed(0))); };

    // Submit on Enter
    useEffect(() => {
        const onKey = (e) => { if (e.key === "Enter" && canCheckout) handleCheckout(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [canCheckout, handleCheckout]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
            style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}
        >
            <div
                className="w-full sm:max-w-3xl rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    maxHeight: "92vh",
                }}
            >

                {/* ── Header ───────────────────────────────────────────────────── */}
                <div
                    className="flex items-center justify-between px-5 py-4 shrink-0"
                    style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-muted)" }}
                >
                    <div className="flex items-center gap-3">
                        <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: "rgba(15,118,110,0.12)", border: "1px solid rgba(15,118,110,0.2)" }}
                        >
                            <CreditCard size={17} style={{ color: "var(--accent-2)" }} />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold" style={{ color: "var(--ink)" }}>Complete Payment</h2>
                            <p className="text-xs" style={{ color: "var(--muted)" }}>Confirm order details below</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:shadow-sm"
                        style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--muted)" }}
                    >
                        <X size={15} />
                    </button>
                </div>

                {/* ── Scrollable Body ───────────────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto">

                    {/* Total banner */}
                    <div
                        className="px-5 py-4"
                        style={{ background: "linear-gradient(135deg, rgba(15,118,110,0.08), rgba(15,118,110,0.04))", borderBottom: "1px solid rgba(15,118,110,0.15)" }}
                    >
                        <div className="flex items-end justify-between">
                            <div>
                                <p className="text-xs font-medium mb-0.5" style={{ color: "var(--accent-2)" }}>Grand Total</p>
                                <p className="text-3xl font-extrabold" style={{ color: "var(--accent-2)" }}>
                                    Rs {total.toLocaleString()}
                                </p>
                                {discountAmt > 0 && (
                                    <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                                        Rs {subtotal.toLocaleString()} − Rs {discountAmt.toLocaleString()} discount
                                    </p>
                                )}
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>Discount</p>
                                <div className="w-28">
                                    <Input
                                        type="number" min={0} placeholder="Rs 0"
                                        value={orderDiscount}
                                        onChange={(e) => setOrderDiscount(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="px-5 py-4 space-y-4">

                        {/* Customer + Staff */}
                        <div className="grid grid-cols-2 gap-3">
                            <FormField label="Customer Name">
                                <Input placeholder="Optional"
                                    value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                            </FormField>

                            <FormField label="Staff Member">
                                <select
                                    value={selectedStaffId}
                                    onChange={(e) => setSelectedStaffId(e.target.value)}
                                    className="w-full h-9 px-3 text-sm rounded-lg outline-none transition-all"
                                    style={{
                                        background: "var(--surface)",
                                        color: selectedStaffId ? "var(--ink)" : "var(--muted)",
                                        border: "1px solid var(--border)",
                                    }}
                                >
                                    <option value="">Select staff...</option>
                                    {staffList_.map((s) => (
                                        <option key={s._id} value={s._id}>{s.fullName}</option>
                                    ))}
                                </select>
                            </FormField>
                        </div>

                        {/* Order type toggle */}
                        <div>
                            <p className="text-xs font-medium mb-1.5" style={{ color: "var(--muted)" }}>Order Type</p>
                            <OrderTypeToggle value={orderType} onChange={setOrderType} />
                        </div>

                        {/* Divider */}
                        <div style={{ borderTop: "1px solid var(--border)" }} />

                        {/* Payment method tabs */}
                        <div>
                            <p className="text-xs font-medium mb-2" style={{ color: "var(--muted)" }}>Payment Method</p>
                            <div
                                className="grid grid-cols-4 rounded-xl p-1 gap-1"
                                style={{ background: "var(--surface-muted)", border: "1px solid var(--border)" }}
                            >
                                {PAYMENT_TABS.map(({ key, label, icon: Icon }) => {
                                    const isActive = activeTab === key;
                                    return (
                                        <button
                                            key={key}
                                            onClick={() => setActiveTab(key)}
                                            className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-lg text-xs font-semibold transition-all"
                                            style={{
                                                background: isActive ? "var(--accent-2)" : "transparent",
                                                color: isActive ? "white" : "var(--muted)",
                                                boxShadow: isActive ? "0 2px 8px rgba(15,118,110,0.25)" : "none",
                                            }}
                                        >
                                            <Icon size={15} />
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Tab panel */}
                        <div
                            className="rounded-xl p-4"
                            style={{ background: "var(--surface-muted)", border: "1px solid var(--border)" }}
                        >
                            {activeTab === "cash" && (
                                <CashTab cashReceived={cashReceived} setCashReceived={setCashReceived}
                                    total={total} cashChange={cashChange} />
                            )}
                            {activeTab === "online" && (
                                <OnlineTab onlinePlatform={onlinePlatform} setOnlinePlatform={setOnlinePlatform}
                                    onlineAmount={onlineAmount} setOnlineAmount={setOnlineAmount} total={total} />
                            )}
                            {activeTab === "credit" && (
                                <CreditTabWithModal qarzaOptions={qarzaOptions} qarzaAccountId={qarzaAccountId}
                                    setQarzaAccountId={setQarzaAccountId} total={total} onOpenQarzaModal={() => setShowQarzaModal(true)} />
                            )}
                            {activeTab === "hybrid" && (
                                <HybridTab
                                    hybridCash={hybridCash} setHybridCash={setHybridCash}
                                    hybridQarza={hybridQarza} setHybridQarza={setHybridQarza}
                                    hybridQarzaAccountId={hybridQarzaAccountId} setHybridQarzaAccountId={setHybridQarzaAccountId}
                                    qarzaOptions={qarzaOptions} onOpenQarzaModal={() => setShowQarzaModal(true)}
                                    total={total} hybridSum={hybridSum}
                                    hybridValid={hybridValid} hybridShortage={hybridShortage}
                                    fillHybridCash={fillHybridCash} fillHybridQarza={fillHybridQarza}
                                />
                            )}
                        </div>

                    </div>
                </div>

                {/* ── Footer ───────────────────────────────────────────────────── */}
                <div
                    className="px-5 py-4 shrink-0"
                    style={{ borderTop: "1px solid var(--border)", background: "var(--surface-muted)" }}
                >
                    <button
                        onClick={handleCheckout}
                        disabled={!canCheckout}
                        className="w-full py-3.5 font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                        style={{
                            background: canCheckout
                                ? "linear-gradient(135deg, var(--accent-2), #0b5f59)"
                                : "var(--surface)",
                            color: canCheckout ? "white" : "var(--muted)",
                            border: canCheckout ? "none" : "1px solid var(--border)",
                            cursor: canCheckout ? "pointer" : "not-allowed",
                            boxShadow: canCheckout ? "0 4px 16px rgba(15,118,110,0.3)" : "none",
                        }}
                    >
                        {canCheckout ? <Check size={16} /> : <ChevronRight size={16} />}
                        {canCheckout ? "Complete Payment" : "Fill required fields"}
                        <span className="ml-auto text-xs opacity-60 font-normal">↵ Enter</span>
                    </button>
                </div>

            </div>
            {showQarzaModal && (
                <QarzaAccountModal
                    mode="create"
                    onClose={() => setShowQarzaModal(false)}
                    onSuccess={handleQarzaAccountCreated}
                />
            )}
        </div>
    );
}
















































// import { useState, useMemo, useEffect } from "react";
// import { X, CreditCard, Wallet, Smartphone, Layers, ChevronRight, Plus } from "lucide-react";
// import { FormField, Input, SearchableSelect } from "../../../shared/components/FormFields.jsx";
// import { useQarzaAccounts } from "../../qarza/services/qarza.service.js";
// import { useGetStaffListQuery } from "../../staff/api/staff.api.js";

// // ─────────────────────────────────────────────────────────────────────────────
// //  Online payment platform options
// // ─────────────────────────────────────────────────────────────────────────────
// const ONLINE_PLATFORMS = [
//     { value: "easypaisa", label: "Easypaisa" },
//     { value: "jazzcash", label: "JazzCash" },
//     { value: "bank_transfer", label: "Bank Transfer" },
//     { value: "raast", label: "Raast" },
//     { value: "sadapay", label: "SadaPay" },
//     { value: "nayapay", label: "NayaPay" },
// ];

// // ─────────────────────────────────────────────────────────────────────────────
// //  Payment method tabs
// // ─────────────────────────────────────────────────────────────────────────────
// const PAYMENT_TABS = [
//     { key: "cash", label: "Cash", icon: Wallet },
//     { key: "online", label: "Online", icon: Smartphone },
//     { key: "credit", label: "Qarza", icon: CreditCard },
//     { key: "hybrid", label: "Hybrid", icon: Layers },
// ];

// // ─────────────────────────────────────────────────────────────────────────────
// //  PosPaymentModal
// //
// //  Opens after the cashier clicks "Proceed to Payment".
// //  Shows: Grand Total, optional discount, customer name, payment method tabs.
// //
// //  Calls onCheckout(payload) when payment is complete.
// //
// //  Props:
// //    subtotal       — cart subtotal (number)
// //    onCheckout     — function called with payment payload
// //    onClose        — closes the modal
// //    onCreateQarza  — opens the Qarza account creation popup
// //    language       — "en" or "ur"
// // ─────────────────────────────────────────────────────────────────────────────
// export default function PosPaymentModal({ subtotal = 0, onCheckout, onClose, onCreateQarza, language = "en",
//     initialCustomerName = "", initialWaiter = "", initialDiscount = 0, initialStaffId = "" }) {

//     // Fetch qarza accounts (credit accounts) from the API
//     const { data: qarzaAccounts = [] } = useQarzaAccounts();

//     // Fetch staff list
//     const { data: staffList = [] } = useGetStaffListQuery({ limit: 100 });

//     // ── Shared form fields ─────────────────────────────────────────────────
//     const [activeTab, setActiveTab] = useState("cash");
//     const [orderDiscount, setOrderDiscount] = useState(initialDiscount > 0 ? String(initialDiscount) : "");
//     const [customerName, setCustomerName] = useState(initialCustomerName);
//     const [orderType, setOrderType] = useState("retail");
//     const [selectedStaffId, setSelectedStaffId] = useState(initialStaffId);

//     // ── Auto-fill cash received with total when modal opens or discount changes
//     useEffect(() => {
//         const discountAmt = Math.max(0, Number(orderDiscount) || 0);
//         const total = Math.max(0, subtotal - discountAmt);
//         if (total > 0) {
//             setCashReceived(String(total.toFixed(0)));
//         }
//     }, [subtotal, orderDiscount]);

//     // ── Cash ───────────────────────────────────────────────────────────────
//     const [cashReceived, setCashReceived] = useState("");

//     // ── Online ─────────────────────────────────────────────────────────────
//     const [onlinePlatform, setOnlinePlatform] = useState("");
//     const [onlineAmount, setOnlineAmount] = useState("");

//     // ── Qarza (credit — single account) ───────────────────────────────────
//     const [qarzaAccountId, setQarzaAccountId] = useState("");

//     // ── Hybrid (part cash + part qarza) ───────────────────────────────────
//     const [hybridCash, setHybridCash] = useState("");
//     const [hybridQarza, setHybridQarza] = useState("");
//     const [hybridQarzaAccountId, setHybridQarzaAccountId] = useState("");

//     // ── Calculated values ──────────────────────────────────────────────────
//     const discountAmt = Math.max(0, Number(orderDiscount) || 0);
//     const total = Math.max(0, subtotal - discountAmt);
//     const cashChange = Math.max(0, (Number(cashReceived) || 0) - total);

//     const hybridSum = (Number(hybridCash) || 0) + (Number(hybridQarza) || 0);
//     const hybridValid = Math.abs(hybridSum - total) < 0.01 && !!hybridQarzaAccountId;
//     const hybridShortage = total - hybridSum;

//     // ── Qarza account dropdown options ────────────────────────────────────
//     const qarzaOptions = qarzaAccounts.map((a) => ({
//         value: a._id,
//         label: a.name + (a.phoneNo ? ` · ${a.phoneNo}` : ""),
//     }));

//     // ── Staff dropdown options ────────────────────────────────────────────
//     const staffOptions = Array.isArray(staffList?.data) ? staffList?.data?.map((s) => ({
//         value: s._id,
//         label: s.fullName + (s.phone ? ` · ${s.phone}` : ""),
//     })) : [];

//     // ── Checkout button enabled/disabled logic per tab ─────────────────────
//     const canCheckout = useMemo(() => {
//         if (total === 0) return true;  // 100% discount — always allow
//         switch (activeTab) {
//             case "cash": return Number(cashReceived) >= total;
//             case "online": return !!onlinePlatform && Number(onlineAmount) >= total;
//             case "credit": return !!qarzaAccountId;
//             case "hybrid": return hybridValid;
//             default: return false;
//         }
//     }, [activeTab, cashReceived, total, onlinePlatform, onlineAmount, qarzaAccountId, hybridValid]);

//     // ── Build payload sent to PosPage ──────────────────────────────────────
//     const buildPayload = () => ({
//         customerName,
//         selectedWaiter: initialWaiter,     // Issue 2: waiter restored from held order
//         selectedStaffId,
//         orderDiscount: discountAmt,
//         paymentMethod: activeTab,
//         orderType,
//         cashReceived: activeTab === "cash" ? cashReceived : "",
//         onlinePlatform: activeTab === "online" ? onlinePlatform : "",
//         onlineAmount: activeTab === "online" ? onlineAmount : "",
//         selectedQarzaAccountId: activeTab === "credit" ? qarzaAccountId : "",
//         hybridCash: activeTab === "hybrid" ? hybridCash : "",
//         hybridQarza: activeTab === "hybrid" ? hybridQarza : "",
//         hybridQarzaAccountId: activeTab === "hybrid" ? hybridQarzaAccountId : "",
//     });

//     const handleCheckout = () => { if (canCheckout) onCheckout(buildPayload()); };

//     // ── Auto-fill remainder helpers for Hybrid tab ─────────────────────────
//     const fillHybridQarza = () => { const r = total - (Number(hybridCash) || 0); if (r > 0) setHybridQarza(String(r.toFixed(0))); };
//     const fillHybridCash = () => { const r = total - (Number(hybridQarza) || 0); if (r > 0) setHybridCash(String(r.toFixed(0))); };


//     return (
//         <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}>
//             <div className="w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
//                 style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>

//                 {/* Header */}
//                 <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
//                     <div>
//                         <h2 className="text-lg font-bold" style={{ color: "var(--ink)" }}>Payment</h2>
//                         <p className="text-xs" style={{ color: "var(--muted)" }}>Select method and complete order</p>
//                     </div>
//                     <button onClick={onClose} className="p-2 rounded-xl transition" style={{ background: "var(--surface-muted)" }}>
//                         <X size={18} style={{ color: "var(--muted)" }} />
//                     </button>
//                 </div>

//                 <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">

//                     {/* Grand total strip */}
//                     <div className="rounded-xl px-4 py-3 flex justify-between items-center"
//                         style={{ background: "rgba(15,118,110,0.1)", border: "1px solid rgba(15,118,110,0.2)" }}>
//                         <span className="text-sm font-medium" style={{ color: "var(--accent-2)" }}>Grand Total</span>
//                         <span className="text-2xl font-extrabold" style={{ color: "var(--accent-2)" }}>Rs {total.toLocaleString()}</span>
//                     </div>

//                     {/* Discount + customer name + order type + staff */}
//                     <div className="grid grid-cols-2 gap-3">
//                         <FormField label="Discount (Rs)">
//                             <Input type="number" min={0} placeholder="0"
//                                 value={orderDiscount} onChange={(e) => setOrderDiscount(e.target.value)} />
//                         </FormField>
//                         <FormField label="Customer Name">
//                             <Input placeholder="Optional"
//                                 value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
//                         </FormField>
//                     </div>
//                     <FormField label="Staff">
//                         <SearchableSelect options={staffOptions} value={selectedStaffId}
//                             onChange={setSelectedStaffId} placeholder="Select staff..." />
//                     </FormField>
//                     <FormField label="Order Type">
//                         <div className="flex gap-3">
//                             <label className="flex items-center gap-2 cursor-pointer">
//                                 <input
//                                     type="radio"
//                                     name="orderType"
//                                     value="retail"
//                                     checked={orderType === "retail"}
//                                     onChange={(e) => setOrderType(e.target.value)}
//                                     className="w-4 h-4 accent-[var(--accent-2)]"
//                                 />
//                                 <span className="text-sm font-medium" style={{ color: "var(--ink)" }}>Retail</span>
//                             </label>
//                             <label className="flex items-center gap-2 cursor-pointer">
//                                 <input
//                                     type="radio"
//                                     name="orderType"
//                                     value="wholesale"
//                                     checked={orderType === "wholesale"}
//                                     onChange={(e) => setOrderType(e.target.value)}
//                                     className="w-4 h-4 accent-[var(--accent-2)]"
//                                 />
//                                 <span className="text-sm font-medium" style={{ color: "var(--ink)" }}>Wholesale</span>
//                             </label>
//                         </div>
//                     </FormField>

//                     {/* Payment method tab bar */}
//                     <div className="flex rounded-xl p-1 gap-1" style={{ background: "var(--surface-muted)" }}>
//                         {PAYMENT_TABS.map(({ key, label, icon: Icon }) => (
//                             <button key={key} onClick={() => setActiveTab(key)}
//                                 className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition
//                                     ${activeTab === key ? "shadow-sm" : ""}`}
//                                 style={{
//                                     background: activeTab === key ? "var(--surface)" : "transparent",
//                                     color: activeTab === key ? "var(--accent-2)" : "var(--muted)"
//                                 }}
//                             >
//                                 <Icon size={13} /> {label}
//                             </button>
//                         ))}
//                     </div>

//                     {/* ── CASH tab ───────────────────────────────────────── */}
//                     {activeTab === "cash" && (
//                         <div className="space-y-3">
//                             <FormField label="Cash Received">
//                                 <Input type="number" min={0} placeholder={`Min. Rs ${total.toLocaleString()}`}
//                                     value={cashReceived} onChange={(e) => setCashReceived(e.target.value)}
//                                     className={Number(cashReceived) < total && cashReceived ? "border-red-300" : ""} />
//                             </FormField>

//                             {/* Quick-fill buttons for common amounts */}
//                             <div className="flex gap-2 flex-wrap">
//                                 {[total, Math.ceil(total / 100) * 100, Math.ceil(total / 500) * 500, Math.ceil(total / 1000) * 1000]
//                                     .filter((v, i, arr) => arr.indexOf(v) === i && v >= total)
//                                     .slice(0, 4)
//                                     .map((amt) => (
//                                         <button key={amt} onClick={() => setCashReceived(String(amt))}
//                                             className="px-3 py-1 text-xs rounded-lg transition font-medium"
//                                             style={{
//                                                 background: "var(--surface-muted)",
//                                                 color: "var(--ink)",
//                                                 border: "1px solid var(--border)"
//                                             }}
//                                             onMouseEnter={e => e.currentTarget.style.background = "rgba(15,118,110,0.1)"}
//                                             onMouseLeave={e => e.currentTarget.style.background = "var(--surface-muted)"}
//                                         >
//                                             Rs {amt.toLocaleString()}
//                                         </button>
//                                     ))}
//                             </div>

//                             {Number(cashReceived) >= total && cashReceived && (
//                                 <div className="rounded-xl px-4 py-2.5 flex justify-between"
//                                     style={{ background: "rgba(15,118,110,0.1)", border: "1px solid rgba(15,118,110,0.2)" }}>
//                                     <span className="text-sm font-medium" style={{ color: "var(--accent-2)" }}>Change</span>
//                                     <span className="font-bold" style={{ color: "var(--accent-2)" }}>Rs {cashChange.toLocaleString()}</span>
//                                 </div>
//                             )}
//                             {Number(cashReceived) > 0 && Number(cashReceived) < total && (
//                                 <p className="text-xs" style={{ color: "#dc2626" }}>
//                                     Short by Rs {(total - Number(cashReceived)).toLocaleString()}
//                                 </p>
//                             )}
//                         </div>
//                     )}

//                     {/* ── ONLINE tab ─────────────────────────────────────── */}
//                     {activeTab === "online" && (
//                         <div className="space-y-3">
//                             <FormField label="Platform">
//                                 <SearchableSelect options={ONLINE_PLATFORMS} value={onlinePlatform}
//                                     onChange={setOnlinePlatform} placeholder="Select platform..." />
//                             </FormField>
//                             <FormField label="Amount Received">
//                                 <Input type="number" min={0} placeholder={`Rs ${total.toLocaleString()}`}
//                                     value={onlineAmount} onChange={(e) => setOnlineAmount(e.target.value)} />
//                             </FormField>
//                             <button onClick={() => setOnlineAmount(String(total))}
//                                 className="text-xs hover:underline"
//                                 style={{ color: "var(--accent-2)" }}>
//                                 Fill exact amount
//                             </button>
//                         </div>
//                     )}

//                     {/* ── QARZA (credit) tab ─────────────────────────────── */}
//                     {activeTab === "credit" && (
//                         <div className="space-y-3">
//                             <FormField label="Ledger Account">
//                                 <SearchableSelect options={qarzaOptions} value={qarzaAccountId}
//                                     onChange={setQarzaAccountId} placeholder="Search account..." />
//                             </FormField>
//                             <button onClick={onCreateQarza}
//                                 className="flex items-center gap-1.5 text-xs hover:underline font-medium"
//                                 style={{ color: "var(--accent-2)" }}>
//                                 <Plus size={13} /> Create new Qarza account
//                             </button>
//                             {qarzaAccountId && (
//                                 <div className="rounded-xl px-4 py-2.5 flex justify-between"
//                                     style={{ background: "rgba(15,118,110,0.1)", border: "1px solid rgba(15,118,110,0.2)" }}>
//                                     <span className="text-sm font-medium" style={{ color: "var(--accent-2)" }}>Amount on credit</span>
//                                     <span className="font-bold" style={{ color: "var(--accent-2)" }}>Rs {total.toLocaleString()}</span>
//                                 </div>
//                             )}
//                         </div>
//                     )}

//                     {/* ── HYBRID (cash + qarza) tab ──────────────────────── */}
//                     {activeTab === "hybrid" && (
//                         <div className="space-y-3">
//                             <p className="text-xs" style={{ color: "var(--muted)" }}>
//                                 Split the total between Cash and Qarza. Both must add up to{" "}
//                                 <strong>Rs {total.toLocaleString()}</strong>.
//                             </p>

//                             {/* Cash portion */}
//                             <div className="rounded-xl p-3 space-y-2"
//                                 style={{ background: "rgba(15,118,110,0.1)", border: "1px solid rgba(15,118,110,0.2)" }}>
//                                 <p className="text-xs font-semibold flex items-center gap-1" style={{ color: "var(--accent-2)" }}>
//                                     <Wallet size={12} /> Cash Portion
//                                 </p>
//                                 <div className="flex gap-2 items-end">
//                                     <FormField label="Cash Amount">
//                                         <Input type="number" min={0} placeholder="0"
//                                             value={hybridCash} onChange={(e) => setHybridCash(e.target.value)} />
//                                     </FormField>
//                                     <button onClick={fillHybridCash}
//                                         className="mb-0.5 px-3 py-2 text-xs rounded-lg transition font-medium whitespace-nowrap"
//                                         style={{ background: "rgba(15,118,110,0.2)", color: "var(--accent-2)", border: "1px solid rgba(15,118,110,0.3)" }}
//                                         onMouseEnter={e => e.currentTarget.style.background = "rgba(15,118,110,0.3)"}
//                                         onMouseLeave={e => e.currentTarget.style.background = "rgba(15,118,110,0.2)"}>
//                                         Fill rest
//                                     </button>
//                                 </div>
//                             </div>

//                             {/* Qarza portion */}
//                             <div className="rounded-xl p-3 space-y-2"
//                                 style={{ background: "rgba(15,118,110,0.1)", border: "1px solid rgba(15,118,110,0.2)" }}>
//                                 <p className="text-xs font-semibold flex items-center gap-1" style={{ color: "var(--accent-2)" }}>
//                                     <CreditCard size={12} /> Qarza Portion
//                                 </p>
//                                 <FormField label="Qarza Amount">
//                                     <div className="flex gap-2 items-end">
//                                         <Input type="number" min={0} placeholder="0"
//                                             value={hybridQarza} onChange={(e) => setHybridQarza(e.target.value)} />
//                                         <button onClick={fillHybridQarza}
//                                             className="mb-0.5 px-3 py-2 text-xs rounded-lg transition font-medium whitespace-nowrap"
//                                             style={{ background: "rgba(15,118,110,0.2)", color: "var(--accent-2)", border: "1px solid rgba(15,118,110,0.3)" }}
//                                             onMouseEnter={e => e.currentTarget.style.background = "rgba(15,118,110,0.3)"}
//                                             onMouseLeave={e => e.currentTarget.style.background = "rgba(15,118,110,0.2)"}>
//                                             Fill rest
//                                         </button>
//                                     </div>
//                                 </FormField>
//                                 <FormField label="Account">
//                                     <SearchableSelect options={qarzaOptions} value={hybridQarzaAccountId}
//                                         onChange={setHybridQarzaAccountId} placeholder="Search account..." />
//                                 </FormField>
//                                 <button onClick={onCreateQarza}
//                                     className="flex items-center gap-1.5 text-xs hover:underline font-medium"
//                                     style={{ color: "var(--accent-2)" }}>
//                                     <Plus size={13} /> Create new account
//                                 </button>
//                             </div>

//                             {/* Balance indicator */}
//                             <div className="rounded-xl px-4 py-2.5 flex justify-between items-center"
//                                 style={{
//                                     background: hybridValid ? "rgba(15,118,110,0.1)" : "var(--surface-muted)",
//                                     border: hybridValid ? "1px solid rgba(15,118,110,0.2)" : "1px solid var(--border)"
//                                 }}>
//                                 <span className="text-sm font-medium"
//                                     style={{ color: hybridValid ? "var(--accent-2)" : "var(--muted)" }}>
//                                     {hybridValid ? "✓ Amounts match" : `Remaining: Rs ${hybridShortage > 0 ? hybridShortage.toLocaleString() : "—"}`}
//                                 </span>
//                                 <span className="font-bold"
//                                     style={{ color: hybridValid ? "var(--accent-2)" : "var(--ink)" }}>
//                                     {hybridSum.toLocaleString()} / {total.toLocaleString()}
//                                 </span>
//                             </div>
//                         </div>
//                     )}
//                 </div>

//                 {/* Action buttons */}
//                 <div className="px-6 py-4" style={{ borderTop: "1px solid var(--border)" }}>
//                     <button onClick={handleCheckout} disabled={!canCheckout}
//                         className="w-full py-3 font-bold rounded-xl transition-all active:scale-95 text-sm flex items-center justify-center gap-2 shadow-sm"
//                         style={{
//                             background: canCheckout ? "var(--accent-2)" : "var(--surface-muted)",
//                             color: canCheckout ? "white" : "var(--muted)"
//                         }}
//                         onMouseEnter={e => {
//                             if (canCheckout) e.currentTarget.style.background = "rgba(15,118,110,0.8)";
//                         }}
//                         onMouseLeave={e => {
//                             if (canCheckout) e.currentTarget.style.background = "var(--accent-2)";
//                         }}>
//                         Complete Payment <ChevronRight size={16} />
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// }

