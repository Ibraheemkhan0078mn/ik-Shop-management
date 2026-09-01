import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { X, CreditCard, Wallet, Layers, ChevronRight, Plus, Check, ChevronUp, ChevronDown } from "lucide-react";
import { FormField, Input } from "../../../shared/components/FormFields.jsx";
import { useAllCustomers } from "../../customers/services/customers.service.js";
import { usePaymentMethods } from "../../settings/services/paymentMethod.service.js";
import { StaffService } from "../../staff/api/staffSearchApi.js";
import { CustomerService } from "../../customers/api/customersSearchApi.js";
import QarzaAccountModal from "../../qarza/components/QarzaAccountModal.jsx";
import PaymentMethodModal from "../../settings/components/PaymentMethodModal.jsx";
import StaffModal from "../../staff/components/StaffModal.jsx";
import CustomerModal from "../../customers/components/CustomerModal.jsx";
import { useSettings } from "../../settings/hooks/useSettings.js";
import { getPosLabels } from "../labels/posLabels.js";
import { showError } from "../../../shared/utilities/toastHelpers.js";
import ApiQarzaSelect from "../../../shared/components/ApiQarzaSelect.jsx";
import Alert from "../../../shared/components/Alert.jsx";

const PAYMENT_TABS = (labels, customerType) => [
    { key: "cash", label: labels.cash, icon: Wallet },
    ...(customerType === "regular" ? [
        { key: "credit", label: labels.qarza, icon: CreditCard },
        { key: "hybrid", label: labels.hybrid, icon: Layers },
    ] : []),
];

// ─── Design Atoms ─────────────────────────────────────────────────────────────

const OrderTypeToggle = ({ value, onChange, labels }) => (
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
                {type === "retail" ? labels.retail : labels.wholesale}
            </button>
        ))}
    </div>
);

const CustomerTypeToggle = ({ value, onChange, labels }) => (
    <div
        className="flex rounded-xl p-1 gap-1 w-full"
        style={{ background: "var(--surface-muted)", border: "1px solid var(--border)" }}
    >
        {["walkin", "regular"].map((type) => (
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
                {type === "walkin" ? labels.walkin : labels.regular}
            </button>
        ))}
    </div>
);

// ─── API-based searchable select for staff ─────────────────────────────────────
const ApiStaffSelect = ({ value, onChange, placeholder = "Search staff..." }) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [options, setOptions] = useState([]);
    const ref = useRef();

    const selected = useMemo(() => options.find(o => o.value === value), [options, value]);

    const searchStaff = async (query) => {
        if (!query || query.length < 1) {
            setOptions([]);
            return;
        }
        setLoading(true);
        try {
            const results = await StaffService.search(query, 20);
            setOptions(results.map(s => ({ label: s.fullName, value: s._id, data: s })));
        } catch (error) {
            console.error("Error searching staff:", error);
            setOptions([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            if (open && search) {
                searchStaff(search);
            }
        }, 300);
        return () => clearTimeout(debounceTimer);
    }, [search, open]);

    return (
        <div ref={ref} className="relative w-full">
            <button type="button" onClick={() => setOpen(p => !p)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-xl transition text-left"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", color: selected ? "var(--ink)" : "var(--muted)" }} >
                <span className="truncate">{selected?.label || placeholder}</span>
                <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} style={{ color: "var(--muted)" }} />
            </button>
            {open && (
                <div className="absolute z-50 w-full mt-1 rounded-xl shadow-xl overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }} >
                    <div className="p-2" style={{ borderBottom: "1px solid var(--border)" }} >
                        <input
                            autoFocus
                            type="text"
                            placeholder="Search staff..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full px-3 py-1.5 text-sm rounded-lg outline-none"
                            style={{ background: "var(--surface-muted)", border: "1px solid var(--border)", color: "var(--ink)" }}
                        />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        {loading ? (
                            <div className="px-3 py-2 text-sm text-gray-500">Loading...</div>
                        ) : search.length < 1 ? (
                            <div className="px-3 py-2 text-sm text-gray-500">Type at least 1 character to search</div>
                        ) : options.length > 0 ? (
                            options.map(o => (
                                <div key={o.value} onClick={() => { onChange(o.value, o.data); setOpen(false); setSearch(""); }}
                                    className="px-3 py-2 text-sm cursor-pointer transition"
                                    style={{ background: value === o.value ? "rgba(15,118,110,0.08)" : "transparent", color: value === o.value ? "var(--accent-2)" : "var(--ink)", fontWeight: value === o.value ? 600 : 400 }}
                                    onMouseEnter={e => e.currentTarget.style.background = "rgba(15,118,110,0.06)"}
                                    onMouseLeave={e => e.currentTarget.style.background = value === o.value ? "rgba(15,118,110,0.08)" : "transparent"} >
                                    {o.label}
                                </div>
                            ))
                        ) : (
                            <div className="px-3 py-4 text-sm text-center" style={{ color: "var(--muted)" }}>No results</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── API-based searchable select for customers ─────────────────────────────────
const ApiCustomerSelect = ({ value, onChange, placeholder = "Search customers..." }) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [options, setOptions] = useState([]);
    const ref = useRef();

    const selected = useMemo(() => options.find(o => o.value === value), [options, value]);

    const searchCustomers = async (query) => {
        if (!query || query.length < 1) {
            setOptions([]);
            return;
        }
        setLoading(true);
        try {
            const results = await CustomerService.search(query, 20);
            setOptions(results.map(c => ({ label: c.name + (c.phoneNo ? ` · ${c.phoneNo}` : ""), value: c._id, data: c })));
        } catch (error) {
            console.error("Error searching customers:", error);
            setOptions([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            if (open && search) {
                searchCustomers(search);
            }
        }, 300);
        return () => clearTimeout(debounceTimer);
    }, [search, open]);

    return (
        <div ref={ref} className="relative w-full">
            <button type="button" onClick={() => setOpen(p => !p)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-xl transition text-left"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", color: selected ? "var(--ink)" : "var(--muted)" }} >
                <span className="truncate">{selected?.label || placeholder}</span>
                <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} style={{ color: "var(--muted)" }} />
            </button>
            {open && (
                <div className="absolute z-50 w-full mt-1 rounded-xl shadow-xl overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }} >
                    <div className="p-2" style={{ borderBottom: "1px solid var(--border)" }} >
                        <input
                            autoFocus
                            type="text"
                            placeholder="Search customers..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full px-3 py-1.5 text-sm rounded-lg outline-none"
                            style={{ background: "var(--surface-muted)", border: "1px solid var(--border)", color: "var(--ink)" }}
                        />
                    </div>
                    <div className="max-h-84 overflow-y-auto">
                        {loading ? (
                            <div className="px-3 py-2 text-sm text-gray-500">Loading...</div>
                        ) : search.length < 1 ? (
                            <div className="px-3 py-2 text-sm text-gray-500">Type at least 1 character to search</div>
                        ) : options.length > 0 ? (
                            options.map(o => (
                                <div key={o.value} onClick={() => { onChange(o.value, o.data); setOpen(false); setSearch(""); }}
                                    className="px-3 py-2 text-sm cursor-pointer transition"
                                    style={{ background: value === o.value ? "rgba(15,118,110,0.08)" : "transparent", color: value === o.value ? "var(--accent-2)" : "var(--ink)", fontWeight: value === o.value ? 600 : 400 }}
                                    onMouseEnter={e => e.currentTarget.style.background = "rgba(15,118,110,0.06)"}
                                    onMouseLeave={e => e.currentTarget.style.background = value === o.value ? "rgba(15,118,110,0.08)" : "transparent"} >
                                    {o.label}
                                </div>
                            ))
                        ) : (
                            <div className="px-3 py-2 text-sm text-gray-500">No customers found</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function PosPaymentModal({
    onCheckout,
    onClose,
    initialCustomerName = "",
    initialWaiter = "",
    initialDiscount = 0,
    initialStaffId = "",
    cartItems = [],
}) {
    const { settings } = useSettings();
    const currentLanguage = settings?.language || "en";
    const labels = getPosLabels(currentLanguage);

    const { data: customersData = [], refetch: refetchCustomers } = useAllCustomers();
    const { data: paymentMethodsData = [] } = usePaymentMethods();

    const [activeTab, setActiveTab] = useState("cash");
    const [orderDiscount, setOrderDiscount] = useState(initialDiscount > 0 ? String(initialDiscount) : "");
    const [orderDiscountType, setOrderDiscountType] = useState("percentage");
    const [customerName, setCustomerName] = useState(initialCustomerName);
    const [customerType, setCustomerType] = useState("walkin");

    const paymentTabs = PAYMENT_TABS(labels, customerType);
    const [selectedCustomerId, setSelectedCustomerId] = useState("");
    const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState("");
    const [orderType, setOrderType] = useState("retail");
    const [selectedStaffId, setSelectedStaffId] = useState(initialStaffId);
    const [qarzaAccountId, setQarzaAccountId] = useState("");
    const [hybridCash, setHybridCash] = useState("");
    const [hybridQarzaAccountId, setHybridQarzaAccountId] = useState("");
    const [showQarzaModal, setShowQarzaModal] = useState(false);
    const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
    const [showStaffModal, setShowStaffModal] = useState(false);
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [itemDiscounts, setItemDiscounts] = useState({});
    const [itemDiscountTypes, setItemDiscountTypes] = useState({});
    const [expandedCalculation, setExpandedCalculation] = useState({});
    const [alertConfig, setAlertConfig] = useState({ show: false, message: '', type: 'warning' });

    const discountAmt = Math.max(0, Number(orderDiscount) || 0);
    
    // Calculate discounted cart items with per-item discounts applied
    const discountedCartItems = cartItems.map((item, index) => {
        const itemDiscountValue = Number(itemDiscounts[index]) || 0;
        const discountType = itemDiscountTypes[index] || 'percentage';
        
        // Use originalBatchPrice if available (when custom price was set), otherwise use unitPrice
        const baseUnitPrice = item.originalBatchPrice || item.unitPrice;
        const currentUnitPrice = item.unitPrice; // This might be custom or original
        
        // Calculate lineTotal (base amount before discount)
        const lineTotal = currentUnitPrice * (item.qty || 0);
        let discountAmount = 0;
        let discountPercent = 0;
        
        if (itemDiscountValue > 0) {
            if (discountType === 'percentage') {
                discountPercent = itemDiscountValue;
                discountAmount = (lineTotal * itemDiscountValue) / 100;
            } else {
                // Fixed amount discount
                discountAmount = Math.min(itemDiscountValue, lineTotal);
                discountPercent = (discountAmount / lineTotal) * 100;
            }
        }
        
        // Price after item discount (before tax)
        const priceAfterDiscount = lineTotal - discountAmount;
        
        // Calculate tax on price after discount
        let itemTaxAmount = 0;
        if (item.taxType === 'fixed') {
            itemTaxAmount = (item.taxPercent || 0) * (item.qty || 0);
        } else {
            itemTaxAmount = (priceAfterDiscount * (item.taxPercent || 0)) / 100;
        }
        
        // Final item total (discounted price + tax)
        const itemTotal = priceAfterDiscount + itemTaxAmount;
        
        return {
            ...item,
            itemDiscountValue,
            discountType,
            discountPercent,
            discountAmount,
            baseUnitPrice, // Original batch price for display
            currentUnitPrice, // Current price (might be custom)
            lineTotal,
            priceAfterDiscount,
            itemTaxAmount,
            itemTotal,
        };
    });
    
    // Calculate bill subtotal as sum of priceAfterDiscount (after item discounts, before tax and order discount)
    const billSubtotal = discountedCartItems.reduce((sum, item) => sum + (item.priceAfterDiscount || 0), 0);
    
    // Calculate total tax from all items
    const totalTax = discountedCartItems.reduce((sum, item) => sum + (item.itemTaxAmount || 0), 0);
    
    // Calculate total discount from per-item discounts
    const itemDiscountTotal = discountedCartItems.reduce((sum, item) => sum + (item.discountAmount || 0), 0);
    
    // Calculate order-level discount based on type
    let orderDiscountAmount = 0;
    if (discountAmt > 0) {
        if (orderDiscountType === 'percentage') {
            orderDiscountAmount = (billSubtotal * discountAmt) / 100;
        } else {
            // Fixed amount
            orderDiscountAmount = Math.min(discountAmt, billSubtotal);
        }
    }
    
    const totalDiscount = orderDiscountAmount + itemDiscountTotal;
    const total = Math.max(0, billSubtotal - orderDiscountAmount + totalTax);
    const hybridQarza = total - (Number(hybridCash) || 0);
    const hybridValid = Math.abs((Number(hybridCash) || 0) + hybridQarza - total) < 0.01 && !!hybridQarzaAccountId;

    const handleQarzaAccountCreated = () => {
        setShowQarzaModal(false);
    };

    const handlePaymentMethodCreated = () => {
        setShowPaymentMethodModal(false);
    };

    const handleStaffCreated = () => {
        setShowStaffModal(false);
    };

    const handleCustomerCreated = () => {
        setShowCustomerModal(false);
        refetchCustomers();
    };

    const paymentMethodOptions = useMemo(() => paymentMethodsData?.filter(pm => pm.isActive !== false).map((pm) => ({
        value: pm._id,
        label: pm.name,
    })) || [], [paymentMethodsData]);

    // Auto select qarza account when customer is selected
    useEffect(() => {
        if (selectedCustomerId && customerType === "regular") {
            const selectedCustomer = customersData?.find(c => c._id === selectedCustomerId);
            if (selectedCustomer?.qarzaAccountId) {
                setQarzaAccountId(selectedCustomer.qarzaAccountId);
                setHybridQarzaAccountId(selectedCustomer.qarzaAccountId);
            } else {
                // Clear qarza accounts if customer doesn't have one
                setQarzaAccountId("");
                setHybridQarzaAccountId("");
            }
        } else {
            // Clear qarza accounts when switching to walkin or no customer selected
            setQarzaAccountId("");
            setHybridQarzaAccountId("");
        }
    }, [selectedCustomerId, customerType, customersData]);

    // Reset to cash tab when customer type changes to walkin
    useEffect(() => {
        if (customerType === "walkin" && (activeTab === "credit" || activeTab === "hybrid")) {
            setActiveTab("cash");
        }
    }, [customerType, activeTab]);

    // Auto select first payment method when available
    useEffect(() => {
        if (!selectedPaymentMethodId && paymentMethodsData?.length > 0) {
            const firstActiveMethod = paymentMethodsData.find(pm => pm.isActive !== false);
            if (firstActiveMethod) {
                setSelectedPaymentMethodId(firstActiveMethod._id);
            }
        }
    }, [paymentMethodsData, selectedPaymentMethodId]);

    const canCheckout = useMemo(() => {
        if (total === 0) return true;
        // Require customerId when customerType is regular
        if (customerType === "regular" && !selectedCustomerId) return false;
        switch (activeTab) {
            case "cash": return !!selectedPaymentMethodId;
            case "credit": return !!qarzaAccountId;
            case "hybrid": return hybridValid && !!selectedPaymentMethodId && !!hybridQarzaAccountId;
            default: return false;
        }
    }, [activeTab, total, qarzaAccountId, hybridValid, selectedPaymentMethodId, customerType, selectedCustomerId, hybridQarzaAccountId]);

    const buildPayload = useCallback(() => {
        const selectedCustomer = customersData?.find(c => c._id === selectedCustomerId);
        return {
            customerName: customerType === "walkin" ? customerName : (selectedCustomer?.name || ""),
            customerType,
            selectedCustomerId: customerType === "regular" ? (selectedCustomerId || null) : null,
            selectedWaiter: initialWaiter,
            selectedStaffId,
            orderDiscount: discountAmt,
            orderDiscountType: orderDiscountType,
            orderDiscountAmount: orderDiscountAmount,
            paymentMethod: activeTab,
            paymentMethodId: selectedPaymentMethodId,
            paymentMethodName: selectedPaymentMethodId ? paymentMethodsData?.find(pm => pm._id === selectedPaymentMethodId)?.name || "" : "",
            orderType,
            cashAmount: activeTab === "cash" ? String(total) : (activeTab === "hybrid" ? hybridCash : 0),
            creditAccount: activeTab === "credit" ? qarzaAccountId : (activeTab === "hybrid" ? hybridQarzaAccountId : null),
            itemDiscounts: itemDiscounts,
            itemDiscountTypes: itemDiscountTypes,
        };
    }, [customerName, customerType, selectedCustomerId, initialWaiter, selectedStaffId, discountAmt, orderDiscountType, orderDiscountAmount, activeTab, selectedPaymentMethodId, paymentMethodsData, orderType, total, hybridCash, qarzaAccountId, hybridQarzaAccountId, itemDiscounts, itemDiscountTypes, customersData]);

    const handleCheckout = useCallback(() => { if (canCheckout) onCheckout(buildPayload()); }, [canCheckout, buildPayload, onCheckout]);

    const getValidationError = useCallback(() => {
        if (total === 0) return null;
        if (customerType === "regular" && !selectedCustomerId) return labels.selectCustomer;
        switch (activeTab) {
            case "cash":
                if (!selectedPaymentMethodId) return labels.selectPaymentMethod;
                return null;
            case "credit":
                if (!qarzaAccountId) return labels.selectQarzaAccount;
                return null;
            case "hybrid":
                if (!selectedPaymentMethodId) return labels.selectPaymentMethod;
                if (!hybridQarzaAccountId) return labels.selectQarzaAccount;
                if (!hybridValid) return labels.amountsNotBalanced;
                return null;
            default: return null;
        }
    }, [total, customerType, selectedCustomerId, labels, activeTab, selectedPaymentMethodId, qarzaAccountId, hybridQarzaAccountId, hybridValid]);

    // Submit on Enter
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "Enter") {
                if (canCheckout) {
                    handleCheckout();
                } else {
                    const error = getValidationError();
                    if (error) showError(error);
                }
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [canCheckout, handleCheckout, getValidationError]);

    // Shared field-row classes: label + control, stacked on mobile, aligned on larger screens
    const rowClass = "flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4 py-3 px-4 sm:px-5 first:pt-4 last:pb-4";
    const labelClass = "text-xs font-semibold uppercase tracking-wide shrink-0 sm:w-36";
    const controlWrapClass = "flex-1 min-w-0";
    const fieldFocus = {
        onFocus: (e) => { e.target.style.borderColor = 'var(--accent-2)'; e.target.style.boxShadow = '0 0 0 3px rgba(15, 118, 110, 0.12)'; },
        onBlur: (e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; },
    };
    const inputStyle = { backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--ink)' };

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
            style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}
        >
            <div
                className="w-full sm:w-[80%] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
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
                            <h2 className="text-sm font-bold" style={{ color: "var(--ink)" }}>{labels.completePayment}</h2>
                            <p className="text-xs" style={{ color: "var(--muted)" }}>{labels.confirmOrderDetails}</p>
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
                    {/* First Container: Left (Payment Options) and Right (Items) */}
                    <div className="flex flex-col lg:flex-row h-full">
                        {/* Left Panel - Payment Options */}
                        <div className="flex-1 lg:w-1/2 p-4 border-b lg:border-b-0 lg:border-r border-[var(--border)] overflow-y-auto">
                            <h3 className="text-sm font-bold mb-3" style={{ color: "var(--ink)" }}>{labels.paymentOptions || "Payment Options"}</h3>
                            
                            {/* Total banner */}
                            <div
                                className="px-4 py-3 rounded-xl mb-4"
                                style={{ background: "linear-gradient(135deg, rgba(15,118,110,0.08), rgba(15,118,110,0.04))", border: "1px solid rgba(15,118,110,0.15)" }}
                            >
                                <div className="flex items-end justify-between">
                                    <div>
                                        <p className="text-xs font-medium mb-0.5" style={{ color: "var(--accent-2)" }}>{labels.grandTotal}</p>
                                        <p className="text-2xl font-extrabold" style={{ color: "var(--accent-2)" }}>
                                            Rs {total.toLocaleString()}
                                        </p>
                                        {totalDiscount > 0 && (
                                            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                                                Rs {billSubtotal.toLocaleString()} − Rs {totalDiscount.toLocaleString()} {labels.discount}
                                            </p>
                                        )}
                                        {totalTax > 0 && totalDiscount === 0 && (
                                            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                                                Rs {billSubtotal.toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Row 1: Discount & Staff */}
                            <div className="grid grid-cols-2 gap-3">
                                <FormField label={labels.discount}>
                                    <div className="flex gap-2">
                                        <select
                                            value={orderDiscountType}
                                            onChange={(e) => setOrderDiscountType(e.target.value)}
                                            className="px-3 py-2 border rounded-lg text-sm"
                                            style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--ink)", minWidth: "90px" }}
                                        >
                                            <option value="percentage">%</option>
                                            <option value="fixed">Rs</option>
                                        </select>
                                        <Input
                                            type="number" min={0} placeholder={orderDiscountType === 'percentage' ? '0%' : 'Rs 0'}
                                            value={orderDiscount}
                                            onChange={(e) => setOrderDiscount(e.target.value)}
                                            onWheel={e => e.target.blur()}
                                        />
                                    </div>
                                </FormField>

                                <FormField label={labels.staffMember}>
                                    <div className="flex gap-2">
                                        <ApiStaffSelect
                                            value={selectedStaffId}
                                            onChange={(value) => setSelectedStaffId(value)}
                                            placeholder={labels.selectStaff}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowStaffModal(true)}
                                            className="px-3 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition flex items-center gap-1"
                                            title="Create new staff"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </FormField>
                            </div>

                            {/* Row 2: Order type toggle */}
                            <div>
                                <p className="text-xs font-medium mb-1.5" style={{ color: "var(--muted)" }}>{labels.orderType}</p>
                                <OrderTypeToggle value={orderType} onChange={setOrderType} labels={labels} />
                            </div>

                            {/* Row 3: Customer Type Toggle & Customer Selection */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-xs font-medium mb-1.5" style={{ color: "var(--muted)" }}>{labels.customerType}</p>
                                    <CustomerTypeToggle value={customerType} onChange={setCustomerType} labels={labels} />
                                </div>

                                <FormField label={labels.customerName}>
                                    {customerType === "walkin" ? (
                                        <Input placeholder={labels.optional}
                                            value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                                    ) : (
                                        <div className="flex gap-2">
                                            <ApiCustomerSelect
                                                value={selectedCustomerId}
                                                onChange={(value, data) => {
                                                    setSelectedCustomerId(value);
                                                    if (data?.qarzaAccountId) {
                                                        setQarzaAccountId(data.qarzaAccountId);
                                                        setHybridQarzaAccountId(data.qarzaAccountId);
                                                    }
                                                }}
                                                placeholder={labels.selectCustomer}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowCustomerModal(true)}
                                                className="px-3 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition flex items-center gap-1"
                                                title="Create new customer"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                    )}
                                </FormField>
                            </div>

                            {/* Divider */}
                            <div style={{ borderTop: "1px solid var(--border)", margin: "16px 0" }} />

                            {/* Payment method row */}
                            <div className={rowClass}>
                                <label className={labelClass} style={{ color: "var(--muted)" }}>{labels.paymentMethod}</label>
                                <div className={controlWrapClass}>
                                    <div className="grid grid-cols-4 gap-2">
                                        {paymentTabs.map(({ key, label, icon: Icon }) => {
                                            const isActive = activeTab === key;
                                            return (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() => setActiveTab(key)}
                                                    className="flex flex-row sm:flex-col items-center justify-center gap-1.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium border transition-all duration-200"
                                                    style={isActive ? {
                                                        background: 'linear-gradient(135deg, var(--accent-2), #0b5f59)',
                                                        borderColor: 'var(--accent-2)',
                                                        color: '#ffffff',
                                                        boxShadow: '0 8px 20px rgba(15, 118, 110, 0.25)',
                                                    } : {
                                                        backgroundColor: 'var(--surface-muted)',
                                                        borderColor: 'var(--border)',
                                                        color: 'var(--muted)',
                                                    }}
                                                >
                                                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={2} />
                                                    {label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Payment method specific fields */}
                            {activeTab === "cash" && (
                                <>
                                    {/* Payment method dropdown for cash */}
                                    <div className={rowClass}>
                                        <label className={labelClass} style={{ color: "var(--muted)" }}>{labels.paymentMethod}</label>
                                        <div className={controlWrapClass}>
                                            <div className="flex gap-2">
                                                <select
                                                    value={selectedPaymentMethodId}
                                                    onChange={(e) => setSelectedPaymentMethodId(e.target.value)}
                                                    className="flex-1 px-3.5 py-2.5 rounded-lg text-sm border outline-none transition-all duration-200 cursor-pointer"
                                                    style={inputStyle}
                                                    {...fieldFocus}
                                                    required
                                                >
                                                    <option value="">{labels.selectPaymentMethod}</option>
                                                    {paymentMethodOptions.map((pm) => (
                                                        <option key={pm.value} value={pm.value}>{pm.label}</option>
                                                    ))}
                                                </select>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPaymentMethodModal(true)}
                                                    className="px-3 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition flex items-center gap-1"
                                                    title="Create new payment method"
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Auto cash received info */}
                                    <div className={rowClass}>
                                        <label className={labelClass} style={{ color: "var(--muted)" }}>{labels.cashReceived}</label>
                                        <div className={controlWrapClass}>
                                            <div
                                                className="rounded-xl px-4 py-3 border text-xs sm:text-sm"
                                                style={{ backgroundColor: 'rgba(15, 118, 110, 0.08)', borderColor: 'rgba(15, 118, 110, 0.3)', color: 'var(--accent-2)' }}
                                            >
                                                {labels.autoFullAmount}: <span className="font-semibold">Rs {total.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {activeTab === "credit" && (
                                <>
                                    {/* Qarza account */}
                                    <div className={rowClass}>
                                        <label className={labelClass} style={{ color: "var(--muted)" }}>{labels.ledgerAccount}</label>
                                        <div className={controlWrapClass}>
                                            <div className="flex gap-2">
                                                <ApiQarzaSelect
                                                    value={qarzaAccountId}
                                                    onChange={(value) => setQarzaAccountId(value)}
                                                    placeholder={labels.searchAccount}
                                                    type="customer"
                                                    disabled={customerType === "regular" && !!selectedCustomerId}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowQarzaModal(true)}
                                                    className="flex items-center justify-center w-11 h-11 rounded-lg border transition-all duration-200 shrink-0"
                                                    style={{ backgroundColor: 'var(--surface-muted)', borderColor: 'var(--border)', color: 'var(--accent-2)', opacity: customerType === "regular" && selectedCustomerId ? 0.5 : 1, cursor: customerType === "regular" && selectedCustomerId ? 'not-allowed' : 'pointer' }}
                                                    title="Create new account"
                                                    disabled={customerType === "regular" && !!selectedCustomerId}
                                                >
                                                    <Plus size={17} strokeWidth={2.25} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Info */}
                                    {qarzaAccountId && (
                                        <div className={rowClass}>
                                            <span className={labelClass} style={{ color: "var(--muted)" }} />
                                            <div className={controlWrapClass}>
                                                <div
                                                    className="rounded-xl px-4 py-3 border text-xs sm:text-sm"
                                                    style={{ backgroundColor: 'rgba(15, 118, 110, 0.08)', borderColor: 'rgba(15, 118, 110, 0.3)', color: 'var(--accent-2)' }}
                                                >
                                                    {customerType === "regular" && selectedCustomerId 
                                                        ? <>Full payment of <span className="font-semibold">Rs {total.toLocaleString()}</span> will be charged to customer's qarza account (auto-selected).</>
                                                        : <>Full payment of <span className="font-semibold">Rs {total.toLocaleString()}</span> will be charged to this qarza account.</>
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {activeTab === "hybrid" && (
                                <>
                                    {/* Payment method dropdown */}
                                    <div className={rowClass}>
                                        <label className={labelClass} style={{ color: "var(--muted)" }}>{labels.paymentMethod}</label>
                                        <div className={controlWrapClass}>
                                            <div className="flex gap-2">
                                                <select
                                                    value={selectedPaymentMethodId}
                                                    onChange={(e) => setSelectedPaymentMethodId(e.target.value)}
                                                    className="flex-1 px-3.5 py-2.5 rounded-lg text-sm border outline-none transition-all duration-200 cursor-pointer"
                                                    style={inputStyle}
                                                    {...fieldFocus}
                                                    required
                                                >
                                                    <option value="">{labels.selectPaymentMethod}</option>
                                                    {paymentMethodOptions.map((pm) => (
                                                        <option key={pm.value} value={pm.value}>{pm.label}</option>
                                                    ))}
                                                </select>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPaymentMethodModal(true)}
                                                    className="px-3 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition flex items-center gap-1"
                                                    title="Create new payment method"
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Cash amount */}
                                    <div className={rowClass}>
                                        <label className={labelClass} style={{ color: "var(--muted)" }}>{labels.cashPortion}</label>
                                        <div className={controlWrapClass}>
                                            <div className="relative">
                                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium" style={{ color: "var(--muted)" }}>Rs</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={hybridCash}
                                                    onChange={(e) => setHybridCash(e.target.value)}
                                                    placeholder="0"
                                                    onWheel={e => e.target.blur()}
                                                    className="w-full pl-9 pr-3.5 py-2.5 rounded-lg text-sm border outline-none transition-all duration-200"
                                                    style={inputStyle}
                                                    {...fieldFocus}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Qarza account */}
                                    <div className={rowClass}>
                                        <label className={labelClass} style={{ color: "var(--muted)" }}>{labels.qarzaPortion}</label>
                                        <div className={controlWrapClass}>
                                            <div className="flex gap-2">
                                                <ApiQarzaSelect
                                                    value={hybridQarzaAccountId}
                                                    onChange={(value) => setHybridQarzaAccountId(value)}
                                                    placeholder={labels.selectQarzaAccount}
                                                    type="customer"
                                                    disabled={customerType === "regular" && !!selectedCustomerId}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowQarzaModal(true)}
                                                    className="flex items-center justify-center w-11 h-11 rounded-lg border transition-all duration-200 shrink-0"
                                                    style={{ backgroundColor: 'var(--surface-muted)', borderColor: 'var(--border)', color: 'var(--accent-2)', opacity: customerType === "regular" && selectedCustomerId ? 0.5 : 1, cursor: customerType === "regular" && selectedCustomerId ? 'not-allowed' : 'pointer' }}
                                                    title="Create new account"
                                                    disabled={customerType === "regular" && !!selectedCustomerId}
                                                >
                                                    <Plus size={17} strokeWidth={2.25} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Info showing calculated qarza amount */}
                                    <div className={rowClass}>
                                        <span className={labelClass} style={{ color: "var(--muted)" }} />
                                        <div className={controlWrapClass}>
                                            <div
                                                className="rounded-xl px-4 py-3 border text-xs sm:text-sm"
                                                style={hybridCash > 0 && hybridCash < total ? {
                                                    backgroundColor: 'rgba(15, 118, 110, 0.08)',
                                                    borderColor: 'rgba(15, 118, 110, 0.3)',
                                                    color: 'var(--accent-2)'
                                                } : {
                                                    backgroundColor: 'var(--surface-muted)',
                                                    borderColor: 'var(--border)',
                                                    color: 'var(--muted)'
                                                }}
                                            >
                                                {hybridCash > 0 && hybridCash < total
                                                    ? `Credit: Rs ${hybridQarza.toLocaleString()}`
                                                    : hybridCash >= total
                                                    ? "Cash amount must be less than total"
                                                    : "Enter cash amount"
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Right Panel - Items */}
                        <div className="flex-1 lg:w-1/2 p-4 overflow-y-auto">
                            <h3 className="text-sm font-bold mb-3" style={{ color: "var(--ink)" }}>{labels.orderItems || "Order Items"}</h3>
                            
                            {cartItems.length === 0 ? (
                                <p className="text-sm text-[var(--muted)] text-center py-8">{labels.noItems || "No items in cart"}</p>
                            ) : (
                                <div className="space-y-3">
                                    {discountedCartItems.map((item, index) => (
                                        <div key={index} className="border rounded-xl overflow-hidden" style={{ borderColor: "var(--border)" }}>
                                            {/* Item header - always visible */}
                                            <div
                                                className="flex items-center justify-between px-4 py-3 cursor-pointer transition"
                                                style={{ background: "var(--surface-muted)" }}
                                                onClick={() => {
                                                    setExpandedCalculation(prev => ({
                                                        ...prev,
                                                        [index]: !prev[index]
                                                    }));
                                                }}
                                            >
                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
                                                        {item.name}
                                                        {item.customInput && (
                                                            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(180,83,9,0.1)", color: "var(--accent)" }}>
                                                                Custom Price
                                                            </span>
                                                        )}
                                                    </p>
                                                    <p className="text-xs text-[var(--muted)]">
                                                        Qty: {item.qty} × Rs {item.currentUnitPrice.toLocaleString()}
                                                        {item.discountAmount > 0 && (
                                                            <span style={{ color: "var(--accent)" }}> (After discount: Rs {(item.priceAfterDiscount || 0).toFixed(2)})</span>
                                                        )}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <p className="text-sm font-bold" style={{ color: "var(--accent-2)" }}>
                                                        Rs {(item.itemTotal || 0).toFixed(2)}
                                                    </p>
                                                    {expandedCalculation[index] ? <ChevronUp size={16} style={{ color: "var(--muted)" }} /> : <ChevronDown size={16} style={{ color: "var(--muted)" }} />}
                                                </div>
                                            </div>

                                            {/* Expanded details */}
                                            {expandedCalculation[index] && (
                                                <div className="px-4 py-3 border-t" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        {/* Price Card */}
                                                        <div className="p-3 rounded-lg" style={{ background: "var(--surface-muted)", border: "1px solid var(--border)" }}>
                                                            <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>Price</p>
                                                            <div className="text-xs space-y-1">
                                                                {item.customInput && (
                                                                    <>
                                                                        <div className="flex justify-between">
                                                                            <span style={{ color: "var(--muted)" }}>Batch Price:</span>
                                                                            <span className="font-mono" style={{ color: "var(--muted)" }}>Rs {item.baseUnitPrice.toFixed(2)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span style={{ color: "var(--accent-2)" }}>Custom Price:</span>
                                                                            <span className="font-mono" style={{ color: "var(--accent-2)" }}>Rs {item.currentUnitPrice.toFixed(2)}</span>
                                                                        </div>
                                                                    </>
                                                                )}
                                                                {!item.customInput && (
                                                                    <div className="flex justify-between">
                                                                        <span style={{ color: "var(--ink)" }}>Unit Price:</span>
                                                                        <span className="font-mono" style={{ color: "var(--ink)" }}>Rs {item.currentUnitPrice.toFixed(2)}</span>
                                                                    </div>
                                                                )}
                                                                <div className="flex justify-between">
                                                                    <span style={{ color: "var(--ink)" }}>Quantity:</span>
                                                                    <span className="font-mono" style={{ color: "var(--ink)" }}>{item.qty} {item.unit || ''}</span>
                                                                </div>
                                                                <div className="flex justify-between font-semibold pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                                                                    <span style={{ color: "var(--accent-2)" }}>Total Price:</span>
                                                                    <span className="font-mono" style={{ color: "var(--accent-2)" }}>Rs {(item.lineTotal || 0).toFixed(2)}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Discount Card */}
                                                        <div className="p-3 rounded-lg" style={{ background: "var(--surface-muted)", border: "1px solid var(--border)" }}>
                                                            <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>Discount</p>
                                                            <div className="text-xs space-y-1">
                                                                {item.isDiscountAllowed !== false ? (
                                                                    <>
                                                                        <div className="flex justify-between">
                                                                            <span style={{ color: "var(--ink)" }}>Discount:</span>
                                                                            <span className="font-mono" style={{ color: "var(--ink)" }}>{item.itemDiscountValue || 0} {item.discountType === 'fixed' ? 'Rs' : '%'}</span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span style={{ color: "var(--ink)" }}>Discount Amount:</span>
                                                                            <span className="font-mono" style={{ color: "#dc2626" }}>-Rs {item.discountAmount.toFixed(2)}</span>
                                                                        </div>
                                                                    </>
                                                                ) : (
                                                                    <div className="flex justify-between">
                                                                        <span style={{ color: "var(--muted)" }}>Discount:</span>
                                                                        <span className="font-mono" style={{ color: "var(--muted)" }}>Not allowed</span>
                                                                    </div>
                                                                )}
                                                                <div className="flex justify-between font-semibold pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                                                                    <span style={{ color: "var(--accent-2)" }}>After Discount:</span>
                                                                    <span className="font-mono" style={{ color: "var(--accent-2)" }}>Rs {(item.priceAfterDiscount || 0).toFixed(2)}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Tax Card */}
                                                        <div className="p-3 rounded-lg" style={{ background: "var(--surface-muted)", border: "1px solid var(--border)" }}>
                                                            <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>Tax</p>
                                                            <div className="text-xs space-y-1">
                                                                <div className="flex justify-between">
                                                                    <span style={{ color: "var(--ink)" }}>After Discount Value:</span>
                                                                    <span className="font-mono" style={{ color: "var(--ink)" }}>Rs {(item.priceAfterDiscount || 0).toFixed(2)}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span style={{ color: "var(--ink)" }}>Tax Rate:</span>
                                                                    <span className="font-mono" style={{ color: "var(--ink)" }}>
                                                                        {item.taxType === 'fixed' 
                                                                            ? `Rs ${item.taxPercent || 0} (fixed)` 
                                                                            : `${item.taxPercent || 0}% (percentage)`
                                                                        }
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span style={{ color: "var(--ink)" }}>Tax Amount:</span>
                                                                    <span className="font-mono" style={{ color: "#16a34a" }}>+Rs {(item.itemTaxAmount * item.qty).toFixed(2)}</span>
                                                                </div>
                                                                <div className="flex justify-between font-semibold pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                                                                    <span style={{ color: "var(--accent-2)" }}>After Tax:</span>
                                                                    <span className="font-mono" style={{ color: "var(--accent-2)" }}>Rs {(item.itemTotal || 0).toFixed(2)}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Final Item Total Card */}
                                                        <div className="p-3 rounded-lg" style={{ background: "rgba(15,118,110,0.08)", border: "1px solid rgba(15,118,110,0.25)" }}>
                                                            <p className="text-xs font-semibold mb-2" style={{ color: "var(--accent-2)" }}>Item Total</p>
                                                            <div className="text-xs space-y-1">
                                                                <div className="flex justify-between">
                                                                    <span style={{ color: "var(--ink)" }}>After Discount:</span>
                                                                    <span className="font-mono" style={{ color: "var(--ink)" }}>Rs {(item.priceAfterDiscount || 0).toFixed(2)}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span style={{ color: "var(--ink)" }}>Tax Amount:</span>
                                                                    <span className="font-mono" style={{ color: "var(--ink)" }}>Rs {(item.itemTaxAmount * item.qty).toFixed(2)}</span>
                                                                </div>
                                                                <div className="flex justify-between font-bold text-sm pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                                                                    <span style={{ color: "var(--accent-2)" }}>Final Total:</span>
                                                                    <span className="font-mono text-base" style={{ color: "var(--accent-2)" }}>Rs {(item.itemTotal || 0).toFixed(2)}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Discount Input Section */}
                                                    {item.isDiscountAllowed !== false && (
                                                        <div className="mt-3 p-3 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                                            <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>Apply Discount</p>
                                                            <div className="grid grid-cols-2 gap-3 mb-2">
                                                                <div>
                                                                    <label className="text-xs" style={{ color: "var(--muted)" }}>Max Discount:</label>
                                                                    <div className="px-2 py-1 text-xs rounded font-mono" style={{ background: "var(--surface-muted)", color: "var(--ink)" }}>
                                                                        {item.discountLimitType === 'fixed' 
                                                                            ? `Rs ${item.maxDiscountPercent || 0}` 
                                                                            : `${item.maxDiscountPercent || 0}%`
                                                                        }
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <label className="text-xs" style={{ color: "var(--muted)" }}>Max Amount:</label>
                                                                    <div className="px-2 py-1 text-xs rounded font-mono" style={{ background: "var(--surface-muted)", color: "var(--ink)" }}>
                                                                        Rs {item.discountLimitType === 'fixed' 
                                                                            ? ((item.maxDiscountPercent || 0) * item.qty).toFixed(2)
                                                                            : ((item.unitPrice * item.qty * (item.maxDiscountPercent || 0)) / 100).toFixed(2)
                                                                        }
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <select
                                                                    value={itemDiscountTypes[index] || 'percentage'}
                                                                    onChange={(e) => {
                                                                        const value = e.target.value;
                                                                        setItemDiscountTypes(prev => ({
                                                                            ...prev,
                                                                            [index]: value
                                                                        }));
                                                                    }}
                                                                    className="px-2 py-1.5 text-xs rounded-lg border"
                                                                    style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--ink)" }}
                                                                >
                                                                    <option value="percentage">%</option>
                                                                    <option value="fixed">Rs</option>
                                                                </select>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    placeholder="0"
                                                                    value={itemDiscounts[index] || ""}
                                                                    onWheel={e => e.target.blur()}
                                                                    onChange={(e) => {
                                                                        const value = e.target.value;
                                                                        const numValue = Number(value);
                                                                        
                                                                        // Validate max discount based on type
                                                                        if (item.maxDiscountPercent > 0) {
                                                                            if (itemDiscountTypes[index] === 'percentage') {
                                                                                if (numValue > item.maxDiscountPercent) {
                                                                                    setAlertConfig({
                                                                                        show: true,
                                                                                        message: `Maximum discount allowed is ${item.maxDiscountPercent}%`,
                                                                                        type: 'warning'
                                                                                    });
                                                                                    return;
                                                                                }
                                                                            } else {
                                                                                // Fixed amount validation
                                                                                const maxFixed = item.discountLimitType === 'fixed' 
                                                                                    ? (item.maxDiscountPercent || 0) * item.qty 
                                                                                    : (item.unitPrice * item.qty * (item.maxDiscountPercent || 0)) / 100;
                                                                                if (numValue > maxFixed) {
                                                                                    setAlertConfig({
                                                                                        show: true,
                                                                                        message: `Maximum discount allowed is Rs ${maxFixed.toFixed(2)}`,
                                                                                        type: 'warning'
                                                                                    });
                                                                                    return;
                                                                                }
                                                                            }
                                                                        }
                                                                        
                                                                        setItemDiscounts(prev => ({
                                                                            ...prev,
                                                                            [index]: value
                                                                        }));
                                                                    }}
                                                                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border"
                                                                    style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--ink)" }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Second Container: Summary */}
                    <div className="p-4 border-t" style={{ borderColor: "var(--border)", background: "var(--surface-muted)" }}>
                        <h4 className="text-xs font-bold mb-2" style={{ color: "var(--muted)" }}>{labels.billSummary || "Bill Summary"}</h4>
                        <div className="flex justify-between items-center text-sm">
                            <div className="space-y-1">
                                <div className="flex justify-between gap-4">
                                    <span style={{ color: "var(--muted)" }}>{labels.subtotal || "Subtotal"}:</span>
                                    <span className="font-medium" style={{ color: "var(--ink)" }}>Rs {billSubtotal.toLocaleString()}</span>
                                </div>
                                {itemDiscountTotal > 0 && (
                                    <div className="flex justify-between gap-4">
                                        <span style={{ color: "var(--muted)" }}>{labels.itemDiscount || "Item Discount"}:</span>
                                        <span className="font-medium" style={{ color: "var(--ink)" }}>-Rs {itemDiscountTotal.toLocaleString()}</span>
                                    </div>
                                )}
                                {discountAmt > 0 && (
                                    <div className="flex justify-between gap-4">
                                        <span style={{ color: "var(--muted)" }}>{labels.orderDiscount || "Order Discount"}:</span>
                                        <span className="font-medium" style={{ color: "var(--ink)" }}>-Rs {discountAmt.toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                            <div className="text-right">
                                <span className="font-bold text-lg" style={{ color: "var(--accent-2)" }}>Rs {total.toLocaleString()}</span>
                            </div>
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
                        {canCheckout ? labels.completePayment : labels.fillRequiredFields}
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
            {showPaymentMethodModal && (
                <PaymentMethodModal
                    mode="create"
                    onClose={() => setShowPaymentMethodModal(false)}
                    onSuccess={handlePaymentMethodCreated}
                    labels={{ addPaymentMethod: "Add Payment Method", paymentMethodName: "Payment Method Name", paymentMethodNameRequired: "Payment method name is required", paymentMethodPlaceholder: "e.g., Cash, Bank Transfer", active: "Active", cancel: "Cancel", add: "Add", saving: "Saving..." }}
                />
            )}
            {showStaffModal && (
                <StaffModal
                    mode="create"
                    open={showStaffModal}
                    onClose={() => setShowStaffModal(false)}
                    onSuccess={handleStaffCreated}
                />
            )}
            {showCustomerModal && (
                <CustomerModal
                    mode="create"
                    onClose={() => setShowCustomerModal(false)}
                    onSuccess={handleCustomerCreated}
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
//                         }}
//                     >
//                         Complete Payment <ChevronRight size={16} />
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// }

//             {/* Alert Modal */}
//             <Alert
//                 msg={alertConfig.message}
//                 type={alertConfig.type}
//                 isVisible={alertConfig.show}
//                 onConfirm={() => setAlertConfig({ ...alertConfig, show: false })}
//                 confirmText="OK"
//                 showCancel={false}
//             />
//         </div>
//     );
// }