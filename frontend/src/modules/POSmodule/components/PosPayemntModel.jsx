import { useState, useMemo, useEffect } from "react";
import { X, CreditCard, Wallet, Smartphone, Layers, ChevronRight, Plus } from "lucide-react";
import { FormField, Input, SearchableSelect } from "../../../shared/components/FormFields.jsx";
import { useQarzaAccounts } from "../../qarza/services/qarza.service.js";
import { useGetStaffListQuery } from "../../staff/api/staff.api.js";

// ─────────────────────────────────────────────────────────────────────────────
//  Online payment platform options
// ─────────────────────────────────────────────────────────────────────────────
const ONLINE_PLATFORMS = [
    { value: "easypaisa", label: "Easypaisa" },
    { value: "jazzcash", label: "JazzCash" },
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "raast", label: "Raast" },
    { value: "sadapay", label: "SadaPay" },
    { value: "nayapay", label: "NayaPay" },
];

// ─────────────────────────────────────────────────────────────────────────────
//  Payment method tabs
// ─────────────────────────────────────────────────────────────────────────────
const PAYMENT_TABS = [
    { key: "cash", label: "Cash", icon: Wallet },
    { key: "online", label: "Online", icon: Smartphone },
    { key: "credit", label: "Qarza", icon: CreditCard },
    { key: "hybrid", label: "Hybrid", icon: Layers },
];

// ─────────────────────────────────────────────────────────────────────────────
//  PosPaymentModal
//
//  Opens after the cashier clicks "Proceed to Payment".
//  Shows: Grand Total, optional discount, customer name, payment method tabs.
//
//  Calls onCheckout(payload) when payment is complete.
//
//  Props:
//    subtotal       — cart subtotal (number)
//    onCheckout     — function called with payment payload
//    onClose        — closes the modal
//    onCreateQarza  — opens the Qarza account creation popup
//    language       — "en" or "ur"
// ─────────────────────────────────────────────────────────────────────────────
export default function PosPaymentModal({ subtotal = 0, onCheckout, onClose, onCreateQarza, language = "en",
    initialCustomerName = "", initialWaiter = "", initialDiscount = 0, initialStaffId = "" }) {

    // Fetch qarza accounts (credit accounts) from the API
    const { data: qarzaAccounts = [] } = useQarzaAccounts();

    // Fetch staff list
    const { data: staffList = [] } = useGetStaffListQuery({ limit: 100 });

    // ── Shared form fields ─────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState("cash");
    const [orderDiscount, setOrderDiscount] = useState(initialDiscount > 0 ? String(initialDiscount) : "");
    const [customerName, setCustomerName] = useState(initialCustomerName);
    const [orderType, setOrderType] = useState("retail");
    const [selectedStaffId, setSelectedStaffId] = useState(initialStaffId);

    // ── Auto-fill cash received with total when modal opens or discount changes
    useEffect(() => {
        const discountAmt = Math.max(0, Number(orderDiscount) || 0);
        const total = Math.max(0, subtotal - discountAmt);
        if (total > 0) {
            setCashReceived(String(total.toFixed(0)));
        }
    }, [subtotal, orderDiscount]);

    // ── Cash ───────────────────────────────────────────────────────────────
    const [cashReceived, setCashReceived] = useState("");

    // ── Online ─────────────────────────────────────────────────────────────
    const [onlinePlatform, setOnlinePlatform] = useState("");
    const [onlineAmount, setOnlineAmount] = useState("");

    // ── Qarza (credit — single account) ───────────────────────────────────
    const [qarzaAccountId, setQarzaAccountId] = useState("");

    // ── Hybrid (part cash + part qarza) ───────────────────────────────────
    const [hybridCash, setHybridCash] = useState("");
    const [hybridQarza, setHybridQarza] = useState("");
    const [hybridQarzaAccountId, setHybridQarzaAccountId] = useState("");

    // ── Calculated values ──────────────────────────────────────────────────
    const discountAmt = Math.max(0, Number(orderDiscount) || 0);
    const total = Math.max(0, subtotal - discountAmt);
    const cashChange = Math.max(0, (Number(cashReceived) || 0) - total);

    const hybridSum = (Number(hybridCash) || 0) + (Number(hybridQarza) || 0);
    const hybridValid = Math.abs(hybridSum - total) < 0.01 && !!hybridQarzaAccountId;
    const hybridShortage = total - hybridSum;

    // ── Qarza account dropdown options ────────────────────────────────────
    const qarzaOptions = qarzaAccounts.map((a) => ({
        value: a._id,
        label: a.name + (a.phoneNo ? ` · ${a.phoneNo}` : ""),
    }));

    // ── Staff dropdown options ────────────────────────────────────────────
    const staffOptions = Array.isArray(staffList) ? staffList.map((s) => ({
        value: s._id,
        label: s.name + (s.phone ? ` · ${s.phone}` : ""),
    })) : [];

    // ── Checkout button enabled/disabled logic per tab ─────────────────────
    const canCheckout = useMemo(() => {
        if (total === 0) return true;  // 100% discount — always allow
        switch (activeTab) {
            case "cash": return Number(cashReceived) >= total;
            case "online": return !!onlinePlatform && Number(onlineAmount) >= total;
            case "credit": return !!qarzaAccountId;
            case "hybrid": return hybridValid;
            default: return false;
        }
    }, [activeTab, cashReceived, total, onlinePlatform, onlineAmount, qarzaAccountId, hybridValid]);

    // ── Build payload sent to PosPage ──────────────────────────────────────
    const buildPayload = () => ({
        customerName,
        selectedWaiter: initialWaiter,     // Issue 2: waiter restored from held order
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

    const handleCheckout = () => { if (canCheckout) onCheckout(buildPayload()); };

    // ── Auto-fill remainder helpers for Hybrid tab ─────────────────────────
    const fillHybridQarza = () => { const r = total - (Number(hybridCash) || 0); if (r > 0) setHybridQarza(String(r.toFixed(0))); };
    const fillHybridCash = () => { const r = total - (Number(hybridQarza) || 0); if (r > 0) setHybridCash(String(r.toFixed(0))); };


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}>
            <div className="w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
                    <div>
                        <h2 className="text-lg font-bold" style={{ color: "var(--ink)" }}>Payment</h2>
                        <p className="text-xs" style={{ color: "var(--muted)" }}>Select method and complete order</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl transition" style={{ background: "var(--surface-muted)" }}>
                        <X size={18} style={{ color: "var(--muted)" }} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">

                    {/* Grand total strip */}
                    <div className="rounded-xl px-4 py-3 flex justify-between items-center"
                        style={{ background: "rgba(15,118,110,0.1)", border: "1px solid rgba(15,118,110,0.2)" }}>
                        <span className="text-sm font-medium" style={{ color: "var(--accent-2)" }}>Grand Total</span>
                        <span className="text-2xl font-extrabold" style={{ color: "var(--accent-2)" }}>Rs {total.toLocaleString()}</span>
                    </div>

                    {/* Discount + customer name + order type + staff */}
                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="Discount (Rs)">
                            <Input type="number" min={0} placeholder="0"
                                value={orderDiscount} onChange={(e) => setOrderDiscount(e.target.value)} />
                        </FormField>
                        <FormField label="Customer Name">
                            <Input placeholder="Optional"
                                value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                        </FormField>
                    </div>
                    <FormField label="Attending Staff">
                        <SearchableSelect options={staffOptions} value={selectedStaffId}
                            onChange={setSelectedStaffId} placeholder="Select staff member..." />
                    </FormField>
                    <FormField label="Order Type">
                        <div className="flex gap-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="orderType"
                                    value="retail"
                                    checked={orderType === "retail"}
                                    onChange={(e) => setOrderType(e.target.value)}
                                    className="w-4 h-4 accent-[var(--accent-2)]"
                                />
                                <span className="text-sm font-medium" style={{ color: "var(--ink)" }}>Retail</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="orderType"
                                    value="wholesale"
                                    checked={orderType === "wholesale"}
                                    onChange={(e) => setOrderType(e.target.value)}
                                    className="w-4 h-4 accent-[var(--accent-2)]"
                                />
                                <span className="text-sm font-medium" style={{ color: "var(--ink)" }}>Wholesale</span>
                            </label>
                        </div>
                    </FormField>

                    {/* Payment method tab bar */}
                    <div className="flex rounded-xl p-1 gap-1" style={{ background: "var(--surface-muted)" }}>
                        {PAYMENT_TABS.map(({ key, label, icon: Icon }) => (
                            <button key={key} onClick={() => setActiveTab(key)}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition
                                    ${activeTab === key ? "shadow-sm" : ""}`}
                                style={{
                                    background: activeTab === key ? "var(--surface)" : "transparent",
                                    color: activeTab === key ? "var(--accent-2)" : "var(--muted)"
                                }}
                            >
                                <Icon size={13} /> {label}
                            </button>
                        ))}
                    </div>

                    {/* ── CASH tab ───────────────────────────────────────── */}
                    {activeTab === "cash" && (
                        <div className="space-y-3">
                            <FormField label="Cash Received">
                                <Input type="number" min={0} placeholder={`Min. Rs ${total.toLocaleString()}`}
                                    value={cashReceived} onChange={(e) => setCashReceived(e.target.value)}
                                    className={Number(cashReceived) < total && cashReceived ? "border-red-300" : ""} />
                            </FormField>

                            {/* Quick-fill buttons for common amounts */}
                            <div className="flex gap-2 flex-wrap">
                                {[total, Math.ceil(total / 100) * 100, Math.ceil(total / 500) * 500, Math.ceil(total / 1000) * 1000]
                                    .filter((v, i, arr) => arr.indexOf(v) === i && v >= total)
                                    .slice(0, 4)
                                    .map((amt) => (
                                        <button key={amt} onClick={() => setCashReceived(String(amt))}
                                            className="px-3 py-1 text-xs rounded-lg transition font-medium"
                                            style={{
                                                background: "var(--surface-muted)",
                                                color: "var(--ink)",
                                                border: "1px solid var(--border)"
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = "rgba(15,118,110,0.1)"}
                                            onMouseLeave={e => e.currentTarget.style.background = "var(--surface-muted)"}
                                        >
                                            Rs {amt.toLocaleString()}
                                        </button>
                                    ))}
                            </div>

                            {Number(cashReceived) >= total && cashReceived && (
                                <div className="rounded-xl px-4 py-2.5 flex justify-between"
                                    style={{ background: "rgba(15,118,110,0.1)", border: "1px solid rgba(15,118,110,0.2)" }}>
                                    <span className="text-sm font-medium" style={{ color: "var(--accent-2)" }}>Change</span>
                                    <span className="font-bold" style={{ color: "var(--accent-2)" }}>Rs {cashChange.toLocaleString()}</span>
                                </div>
                            )}
                            {Number(cashReceived) > 0 && Number(cashReceived) < total && (
                                <p className="text-xs" style={{ color: "#dc2626" }}>
                                    Short by Rs {(total - Number(cashReceived)).toLocaleString()}
                                </p>
                            )}
                        </div>
                    )}

                    {/* ── ONLINE tab ─────────────────────────────────────── */}
                    {activeTab === "online" && (
                        <div className="space-y-3">
                            <FormField label="Platform">
                                <SearchableSelect options={ONLINE_PLATFORMS} value={onlinePlatform}
                                    onChange={setOnlinePlatform} placeholder="Select platform..." />
                            </FormField>
                            <FormField label="Amount Received">
                                <Input type="number" min={0} placeholder={`Rs ${total.toLocaleString()}`}
                                    value={onlineAmount} onChange={(e) => setOnlineAmount(e.target.value)} />
                            </FormField>
                            <button onClick={() => setOnlineAmount(String(total))}
                                className="text-xs hover:underline"
                                style={{ color: "var(--accent-2)" }}>
                                Fill exact amount
                            </button>
                        </div>
                    )}

                    {/* ── QARZA (credit) tab ─────────────────────────────── */}
                    {activeTab === "credit" && (
                        <div className="space-y-3">
                            <FormField label="Ledger Account">
                                <SearchableSelect options={qarzaOptions} value={qarzaAccountId}
                                    onChange={setQarzaAccountId} placeholder="Search account..." />
                            </FormField>
                            <button onClick={onCreateQarza}
                                className="flex items-center gap-1.5 text-xs hover:underline font-medium"
                                style={{ color: "var(--accent-2)" }}>
                                <Plus size={13} /> Create new Qarza account
                            </button>
                            {qarzaAccountId && (
                                <div className="rounded-xl px-4 py-2.5 flex justify-between"
                                    style={{ background: "rgba(15,118,110,0.1)", border: "1px solid rgba(15,118,110,0.2)" }}>
                                    <span className="text-sm font-medium" style={{ color: "var(--accent-2)" }}>Amount on credit</span>
                                    <span className="font-bold" style={{ color: "var(--accent-2)" }}>Rs {total.toLocaleString()}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── HYBRID (cash + qarza) tab ──────────────────────── */}
                    {activeTab === "hybrid" && (
                        <div className="space-y-3">
                            <p className="text-xs" style={{ color: "var(--muted)" }}>
                                Split the total between Cash and Qarza. Both must add up to{" "}
                                <strong>Rs {total.toLocaleString()}</strong>.
                            </p>

                            {/* Cash portion */}
                            <div className="rounded-xl p-3 space-y-2"
                                style={{ background: "rgba(15,118,110,0.1)", border: "1px solid rgba(15,118,110,0.2)" }}>
                                <p className="text-xs font-semibold flex items-center gap-1" style={{ color: "var(--accent-2)" }}>
                                    <Wallet size={12} /> Cash Portion
                                </p>
                                <div className="flex gap-2 items-end">
                                    <FormField label="Cash Amount">
                                        <Input type="number" min={0} placeholder="0"
                                            value={hybridCash} onChange={(e) => setHybridCash(e.target.value)} />
                                    </FormField>
                                    <button onClick={fillHybridCash}
                                        className="mb-0.5 px-3 py-2 text-xs rounded-lg transition font-medium whitespace-nowrap"
                                        style={{ background: "rgba(15,118,110,0.2)", color: "var(--accent-2)", border: "1px solid rgba(15,118,110,0.3)" }}
                                        onMouseEnter={e => e.currentTarget.style.background = "rgba(15,118,110,0.3)"}
                                        onMouseLeave={e => e.currentTarget.style.background = "rgba(15,118,110,0.2)"}>
                                        Fill rest
                                    </button>
                                </div>
                            </div>

                            {/* Qarza portion */}
                            <div className="rounded-xl p-3 space-y-2"
                                style={{ background: "rgba(15,118,110,0.1)", border: "1px solid rgba(15,118,110,0.2)" }}>
                                <p className="text-xs font-semibold flex items-center gap-1" style={{ color: "var(--accent-2)" }}>
                                    <CreditCard size={12} /> Qarza Portion
                                </p>
                                <FormField label="Qarza Amount">
                                    <div className="flex gap-2 items-end">
                                        <Input type="number" min={0} placeholder="0"
                                            value={hybridQarza} onChange={(e) => setHybridQarza(e.target.value)} />
                                        <button onClick={fillHybridQarza}
                                            className="mb-0.5 px-3 py-2 text-xs rounded-lg transition font-medium whitespace-nowrap"
                                            style={{ background: "rgba(15,118,110,0.2)", color: "var(--accent-2)", border: "1px solid rgba(15,118,110,0.3)" }}
                                            onMouseEnter={e => e.currentTarget.style.background = "rgba(15,118,110,0.3)"}
                                            onMouseLeave={e => e.currentTarget.style.background = "rgba(15,118,110,0.2)"}>
                                            Fill rest
                                        </button>
                                    </div>
                                </FormField>
                                <FormField label="Account">
                                    <SearchableSelect options={qarzaOptions} value={hybridQarzaAccountId}
                                        onChange={setHybridQarzaAccountId} placeholder="Search account..." />
                                </FormField>
                                <button onClick={onCreateQarza}
                                    className="flex items-center gap-1.5 text-xs hover:underline font-medium"
                                    style={{ color: "var(--accent-2)" }}>
                                    <Plus size={13} /> Create new account
                                </button>
                            </div>

                            {/* Balance indicator */}
                            <div className="rounded-xl px-4 py-2.5 flex justify-between items-center"
                                style={{
                                    background: hybridValid ? "rgba(15,118,110,0.1)" : "var(--surface-muted)",
                                    border: hybridValid ? "1px solid rgba(15,118,110,0.2)" : "1px solid var(--border)"
                                }}>
                                <span className="text-sm font-medium"
                                    style={{ color: hybridValid ? "var(--accent-2)" : "var(--muted)" }}>
                                    {hybridValid ? "✓ Amounts match" : `Remaining: Rs ${hybridShortage > 0 ? hybridShortage.toLocaleString() : "—"}`}
                                </span>
                                <span className="font-bold"
                                    style={{ color: hybridValid ? "var(--accent-2)" : "var(--ink)" }}>
                                    {hybridSum.toLocaleString()} / {total.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Action buttons */}
                <div className="px-6 py-4" style={{ borderTop: "1px solid var(--border)" }}>
                    <button onClick={handleCheckout} disabled={!canCheckout}
                        className="w-full py-3 font-bold rounded-xl transition-all active:scale-95 text-sm flex items-center justify-center gap-2 shadow-sm"
                        style={{
                            background: canCheckout ? "var(--accent-2)" : "var(--surface-muted)",
                            color: canCheckout ? "white" : "var(--muted)"
                        }}
                        onMouseEnter={e => {
                            if (canCheckout) e.currentTarget.style.background = "rgba(15,118,110,0.8)";
                        }}
                        onMouseLeave={e => {
                            if (canCheckout) e.currentTarget.style.background = "var(--accent-2)";
                        }}>
                        Complete Payment <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}

