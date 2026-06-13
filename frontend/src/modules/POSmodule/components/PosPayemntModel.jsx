import { useState, useMemo } from "react";
import { X, CreditCard, Wallet, Smartphone, Layers, ChevronRight, Plus } from "lucide-react";
import { FormField, Input, SearchableSelect } from "../../../components/common/FormFields.jsx";
import { useGetQarzaAccountsQuery } from "../../qarza/services/qarza.service.js";

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
//  Calls onHold(payload) when the cashier wants to pause the order.
//
//  Props:
//    subtotal       — cart subtotal (number)
//    onCheckout     — function called with payment payload
//    onHold         — function called to hold/pause the order
//    onClose        — closes the modal
//    onCreateQarza  — opens the Qarza account creation popup
//    language       — "en" or "ur"
// ─────────────────────────────────────────────────────────────────────────────
export default function PosPaymentModal({ subtotal = 0, onCheckout, onHold, onClose, onCreateQarza, language = "en" }) {

    // Fetch qarza accounts (credit accounts) from the API
    const { data: qarzaAccounts = [] } = useGetQarzaAccountsQuery();

    // ── Shared form fields ─────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState("cash");
    const [orderDiscount, setOrderDiscount] = useState("");
    const [customerName, setCustomerName] = useState("");

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
        selectedWaiter: "",            // waiter field removed for simplicity — can add back
        orderDiscount: discountAmt,
        paymentMethod: activeTab,
        cashReceived: activeTab === "cash" ? cashReceived : "",
        onlinePlatform: activeTab === "online" ? onlinePlatform : "",
        onlineAmount: activeTab === "online" ? onlineAmount : "",
        selectedQarzaAccountId: activeTab === "credit" ? qarzaAccountId : "",
        hybridCash: activeTab === "hybrid" ? hybridCash : "",
        hybridQarza: activeTab === "hybrid" ? hybridQarza : "",
        hybridQarzaAccountId: activeTab === "hybrid" ? hybridQarzaAccountId : "",
    });

    const handleCheckout = () => { if (canCheckout) onCheckout(buildPayload()); };
    const handleHold = () => onHold(buildPayload());

    // ── Auto-fill remainder helpers for Hybrid tab ─────────────────────────
    const fillHybridQarza = () => { const r = total - (Number(hybridCash) || 0); if (r > 0) setHybridQarza(String(r.toFixed(0))); };
    const fillHybridCash = () => { const r = total - (Number(hybridQarza) || 0); if (r > 0) setHybridCash(String(r.toFixed(0))); };


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/60 flex flex-col max-h-[90vh] overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">Payment</h2>
                        <p className="text-xs text-gray-400">Select method and complete order</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition">
                        <X size={18} className="text-gray-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">

                    {/* Grand total strip */}
                    <div className="bg-cyan-50 border border-cyan-100 rounded-xl px-4 py-3 flex justify-between items-center">
                        <span className="text-sm text-cyan-700 font-medium">Grand Total</span>
                        <span className="text-2xl font-extrabold text-cyan-700">Rs {total.toLocaleString()}</span>
                    </div>

                    {/* Discount + customer name */}
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

                    {/* Payment method tab bar */}
                    <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                        {PAYMENT_TABS.map(({ key, label, icon: Icon }) => (
                            <button key={key} onClick={() => setActiveTab(key)}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition
                                    ${activeTab === key ? "bg-white text-cyan-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
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
                                            className="px-3 py-1 text-xs bg-gray-100 hover:bg-cyan-100 text-gray-700 hover:text-cyan-700 rounded-lg transition font-medium">
                                            Rs {amt.toLocaleString()}
                                        </button>
                                    ))}
                            </div>

                            {Number(cashReceived) >= total && cashReceived && (
                                <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-2.5 flex justify-between">
                                    <span className="text-sm text-green-700">Change</span>
                                    <span className="font-bold text-green-700">Rs {cashChange.toLocaleString()}</span>
                                </div>
                            )}
                            {Number(cashReceived) > 0 && Number(cashReceived) < total && (
                                <p className="text-xs text-red-500">
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
                                className="text-xs text-cyan-600 hover:underline">
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
                                className="flex items-center gap-1.5 text-xs text-cyan-600 hover:underline font-medium">
                                <Plus size={13} /> Create new Qarza account
                            </button>
                            {qarzaAccountId && (
                                <div className="bg-purple-50 border border-purple-100 rounded-xl px-4 py-2.5 flex justify-between">
                                    <span className="text-sm text-purple-700">Amount on credit</span>
                                    <span className="font-bold text-purple-700">Rs {total.toLocaleString()}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── HYBRID (cash + qarza) tab ──────────────────────── */}
                    {activeTab === "hybrid" && (
                        <div className="space-y-3">
                            <p className="text-xs text-gray-500">
                                Split the total between Cash and Qarza. Both must add up to{" "}
                                <strong>Rs {total.toLocaleString()}</strong>.
                            </p>

                            {/* Cash portion */}
                            <div className="bg-green-50 border border-green-100 rounded-xl p-3 space-y-2">
                                <p className="text-xs font-semibold text-green-700 flex items-center gap-1">
                                    <Wallet size={12} /> Cash Portion
                                </p>
                                <div className="flex gap-2 items-end">
                                    <FormField label="Cash Amount">
                                        <Input type="number" min={0} placeholder="0"
                                            value={hybridCash} onChange={(e) => setHybridCash(e.target.value)} />
                                    </FormField>
                                    <button onClick={fillHybridCash}
                                        className="mb-0.5 px-3 py-2 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition font-medium whitespace-nowrap">
                                        Fill rest
                                    </button>
                                </div>
                            </div>

                            {/* Qarza portion */}
                            <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 space-y-2">
                                <p className="text-xs font-semibold text-purple-700 flex items-center gap-1">
                                    <CreditCard size={12} /> Qarza Portion
                                </p>
                                <FormField label="Qarza Amount">
                                    <div className="flex gap-2 items-end">
                                        <Input type="number" min={0} placeholder="0"
                                            value={hybridQarza} onChange={(e) => setHybridQarza(e.target.value)} />
                                        <button onClick={fillHybridQarza}
                                            className="mb-0.5 px-3 py-2 text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition font-medium whitespace-nowrap">
                                            Fill rest
                                        </button>
                                    </div>
                                </FormField>
                                <FormField label="Account">
                                    <SearchableSelect options={qarzaOptions} value={hybridQarzaAccountId}
                                        onChange={setHybridQarzaAccountId} placeholder="Search account..." />
                                </FormField>
                                <button onClick={onCreateQarza}
                                    className="flex items-center gap-1.5 text-xs text-purple-600 hover:underline font-medium">
                                    <Plus size={13} /> Create new account
                                </button>
                            </div>

                            {/* Balance indicator */}
                            <div className={`rounded-xl px-4 py-2.5 flex justify-between items-center
                                ${hybridValid ? "bg-green-50 border border-green-100" : "bg-gray-50 border border-gray-100"}`}>
                                <span className={`text-sm font-medium ${hybridValid ? "text-green-700" : "text-gray-500"}`}>
                                    {hybridValid ? "✓ Amounts match" : `Remaining: Rs ${hybridShortage > 0 ? hybridShortage.toLocaleString() : "—"}`}
                                </span>
                                <span className={`font-bold ${hybridValid ? "text-green-700" : "text-gray-600"}`}>
                                    {hybridSum.toLocaleString()} / {total.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Action buttons */}
                <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
                    <button onClick={handleHold}
                        className="flex-1 py-3 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-semibold rounded-xl transition text-sm">
                        Hold Order
                    </button>
                    <button onClick={handleCheckout} disabled={!canCheckout}
                        className="flex-2 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-200 disabled:text-gray-400
                                   text-white font-bold rounded-xl transition-all active:scale-95 text-sm flex items-center justify-center gap-2 shadow-sm">
                        Complete Payment <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
