// src/modules/dashbaord/pages/QuickActions.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
    Search,
    Pencil,
    Check,
    Plus,
    ArrowRight,
    BarChart3,
    Wallet,
    ShoppingCart,
    Users,
    DollarSign,
    CreditCard,
    Package,
    TrendingUp,
    Settings,
    Truck,
    RotateCcw,
    ClipboardList,
    UserCog,
    UserPlus,
    CalendarCheck,
    Boxes,
    GripVertical,
} from "lucide-react";
import { getDashboardLabels } from '../labels/dashboardLabels.js';
import { useSettings } from '../../settings/hooks/useSettings.js';
import PermissionGuard from '../../../shared/components/PermissionGuard.jsx';

const STORAGE_KEY = "quickActions_visibility_v1";
const ORDER_KEY = "quickActions_order_v1";

const QuickActions = () => {
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getDashboardLabels(language);

    const [searchQuery, setSearchQuery] = useState("");
    const [isEditMode, setIsEditMode] = useState(false);
    const dragIdRef = useRef(null);

    const ALL_LINKS = [
        { id: "dashboard", title: labels.dashboard, subtitle: "Overview & stats", url: "/dashboard", icon: BarChart3, color: "#0f766e", important: true },
        { id: "analytics", title: labels.analytics, subtitle: "Trends & insights", url: "/dashboard/analytics", icon: TrendingUp, color: "#0f766e", important: false },
        { id: "products", title: labels.addProducts, subtitle: "Manage inventory", url: "/products", icon: Package, color: "#a855f7", important: true },
        { id: "categories", title: labels.categories, subtitle: "Organize products", url: "/products/categories", icon: Boxes, color: "#a855f7", important: false },
        { id: "sub-categories", title: labels.subCategories, subtitle: "Group categories", url: "/products/sub-categories", icon: Boxes, color: "#a855f7", important: false },
        { id: "purchases", title: labels.addPurchases, subtitle: "Record purchases", url: "/purchases", icon: CreditCard, color: "#2563eb", important: true },
        { id: "suppliers", title: labels.suppliers, subtitle: "Manage suppliers", url: "/suppliers", icon: Truck, color: "#2563eb", important: false },
        { id: "purchase-returns", title: labels.purchaseReturns, subtitle: "Return to supplier", url: "/purchase-returns", icon: RotateCcw, color: "#b45309", important: false },
        { id: "product-return", title: labels.productReturns, subtitle: "Customer returns", url: "/product-return", icon: RotateCcw, color: "#b45309", important: false },
        { id: "customers", title: labels.customers, subtitle: "Manage customers", url: "/customers", icon: Users, color: "#0891b2", important: true },
        { id: "wastage", title: labels.wastage, subtitle: "Track wastage", url: "/wastage", icon: Package, color: "#dc2626", important: false },
        { id: "qarza", title: labels.qarzaAccounts, subtitle: "Credit accounts", url: "/qarzaAccount", icon: Wallet, color: "#b45309", important: false },
        { id: "expenses", title: labels.expenses, subtitle: "Track spending", url: "/expenses", icon: DollarSign, important: true, color: "#dc2626" },
        { id: "pos", title: labels.pos, subtitle: "Create new sales", url: "/pos", icon: ShoppingCart, color: "#2563eb", important: true },
        { id: "order-history", title: labels.orderHistory, subtitle: "Past orders", url: "/order-history", icon: ClipboardList, color: "#0891b2", important: false },
        { id: "settings", title: labels.settings, subtitle: "App preferences", url: "/settings/generals", icon: Settings, color: "#6d5d52", important: false },
        { id: "reports", title: labels.reports, subtitle: "All reports", url: "/reports", icon: BarChart3, color: "#0f766e", important: true },
        { id: "report-inventory", title: labels.inventoryReport, subtitle: "Stock levels", url: "/reports/giant-inventory", icon: Package, color: "#a855f7", important: false },
        { id: "report-staff", title: labels.staffReport, subtitle: "Staff performance", url: "/reports/staff", icon: Users, color: "#0891b2", important: false },
        { id: "report-credits", title: labels.creditsDebits, subtitle: "Credit & debit", url: "/reports/credits-debits", icon: Wallet, color: "#b45309", important: false },
        { id: "report-expenses", title: labels.expenseKpi, subtitle: "Expense KPIs", url: "/reports/expenses", icon: DollarSign, color: "#dc2626", important: false },
        { id: "report-sales", title: labels.salesKpi, subtitle: "Sales KPIs", url: "/reports/sales", icon: TrendingUp, color: "#0f766e", important: false },
        { id: "report-purchases", title: labels.purchaseKpi, subtitle: "Purchase KPIs", url: "/reports/purchases", icon: CreditCard, color: "#2563eb", important: false },
        { id: "report-suppliers", title: labels.supplierKpi, subtitle: "Supplier KPIs", url: "/reports/suppliers", icon: Truck, color: "#2563eb", important: false },
        { id: "report-customers", title: labels.customerKpi, subtitle: "Customer KPIs", url: "/reports/customers", icon: Users, color: "#0891b2", important: false },
        { id: "staff", title: labels.staff, subtitle: "Manage staff", url: "/staff", icon: UserCog, color: "#6d5d52", important: true },
        { id: "staff-create", title: labels.addStaff, subtitle: "Add new staff", url: "/staff/create", icon: UserPlus, color: "#6d5d52", important: false },
        { id: "staff-attendance", title: labels.attendance, subtitle: "Mark attendance", url: "/staff/attendance", icon: CalendarCheck, color: "#0f766e", important: false },
        { id: "profile", title: labels.profile, subtitle: "Your account", url: "/profile", icon: Users, color: "#0891b2", important: false },
        { id: "users", title: labels.appUsers, subtitle: "App users", url: "/users", icon: Settings, color: "#6d5d52", important: true },
    ];

    const LINKS_BY_ID = ALL_LINKS.reduce((acc, l) => ({ ...acc, [l.id]: l }), {});

    const loadVisibility = () => {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (saved && typeof saved === "object") return saved;
        } catch {
            // ignore corrupt storage
        }
        return ALL_LINKS.reduce((acc, l) => ({ ...acc, [l.id]: l.important }), {});
    };

    const loadOrder = () => {
        try {
            const saved = JSON.parse(localStorage.getItem(ORDER_KEY));
            if (Array.isArray(saved)) {
                const valid = saved.filter((id) => LINKS_BY_ID[id]);
                const missing = ALL_LINKS.map((l) => l.id).filter((id) => !valid.includes(id));
                return [...valid, ...missing];
            }
        } catch {
            // ignore corrupt storage
        }
        return ALL_LINKS.map((l) => l.id);
    };

    const [visibility, setVisibility] = useState(loadVisibility);
    const [order, setOrder] = useState(loadOrder);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(visibility));
    }, [visibility]);

    useEffect(() => {
        localStorage.setItem(ORDER_KEY, JSON.stringify(order));
    }, [order]);

    const toggleVisibility = (id) => {
        setVisibility((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const handleDragStart = (id) => {
        dragIdRef.current = id;
    };

    const handleDragOver = (e, overId) => {
        e.preventDefault();
        const draggedId = dragIdRef.current;
        if (!draggedId || draggedId === overId) return;
        setOrder((prev) => {
            const next = [...prev];
            const from = next.indexOf(draggedId);
            const to = next.indexOf(overId);
            if (from === -1 || to === -1) return prev;
            next.splice(from, 1);
            next.splice(to, 0, draggedId);
            return next;
        });
    };

    const handleDragEnd = () => {
        dragIdRef.current = null;
    };

    const orderedItems = order
        .map((id) => LINKS_BY_ID[id])
        .filter(Boolean);

    const filteredItems = orderedItems.filter((item) => {
        const matchesSearch = item.title
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        return matchesSearch && (isEditMode || visibility[item.id]);
    });

    return (
        <div className="min-h-[calc(100vh-200px)] bg-(--surface) rounded-3xl p-6 border border-(--border) shadow-[0_18px_50px_rgba(64,45,28,0.12)]">
            <div className="mb-6 flex items-center justify-between gap-3">
                <div className="relative flex-1 group">
                    <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-(--muted) group-focus-within:text-(--accent-2) transition-colors"
                        size={16}
                    />
                    <input
                        type="text"
                        placeholder={labels.searchModules}
                        className="w-full max-w-sm pl-9 pr-4 py-2.5 text-sm rounded-2xl bg-(--surface-muted) border border-(--border) focus:ring-2 focus:ring-(--accent-2) shadow-[0_8px_20px_rgba(64,45,28,0.08)] transition-all outline-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <PermissionGuard execute={() => setIsEditMode(!isEditMode)} permission="quickActions.update" isConfirmation={false}>
                    <button
                        className={`flex items-center justify-center p-2.5 rounded-2xl border transition-all duration-300 ${isEditMode
                                ? "bg-(--accent-2) border-(--accent-2) text-white shadow-[0_10px_20px_rgba(15,118,110,0.25)]"
                                : "bg-(--surface) border-(--border) text-(--muted) hover:text-(--accent-2) hover:border-(--accent-2) shadow-[0_8px_16px_rgba(64,45,28,0.08)]"
                            }`}
                    >
                        {isEditMode ? (
                            <Check size={18} strokeWidth={3} />
                        ) : (
                            <Pencil size={18} />
                        )}
                    </button>
                </PermissionGuard>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredItems.map((item) => {
                    const Icon = item.icon;
                    const visible = visibility[item.id];
                    const CardWrapper = isEditMode ? "div" : Link;

                    return (
                        //             <CardWrapper
                        //                 key={item.id}
                        //                 to={!isEditMode ? item.url : undefined}
                        //                 draggable={isEditMode}
                        //                 onDragStart={isEditMode ? () => handleDragStart(item.id) : undefined}
                        //                 onDragOver={isEditMode ? (e) => handleDragOver(e, item.id) : undefined}
                        //                 onDragEnd={isEditMode ? handleDragEnd : undefined}
                        //                 onClick={isEditMode ? () => toggleVisibility(item.id) : undefined}
                        //                 className={`
                        //     relative group flex flex-col p-5 rounded-2xl transition-all duration-300 no-underline overflow-hidden border
                        //     ${isEditMode ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}
                        //     ${visible ? "shadow-[0_10px_28px_rgba(64,45,28,0.1)]" : "grayscale opacity-50"}
                        //     ${!isEditMode && visible ? "hover:shadow-[0_16px_36px_rgba(64,45,28,0.16)] hover:-translate-y-1" : ""}
                        //     ${isEditMode && visible ? "ring-2 ring-(--accent-2) ring-offset-2 ring-offset-(--app-bg)" : ""}
                        //   `}
                        //                 style={{
                        //                     background: "var(--surface)",
                        //                     borderColor: "var(--border)",
                        //                 }}
                        //             >
                        //                 {isEditMode && (
                        //                     <>
                        //                         <div className="absolute top-3 left-3 text-(--muted) opacity-60">
                        //                             <GripVertical size={14} />
                        //                         </div>
                        //                         <div
                        //                             className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all shadow-xl z-20 ${
                        //                                 visible
                        //                                     ? "bg-(--accent-2) border-white text-white scale-110"
                        //                                     : "bg-(--surface) border-(--border) text-(--muted)"
                        //                             }`}
                        //                         >
                        //                             {visible ? <Check size={14} strokeWidth={4} /> : <Plus size={14} strokeWidth={4} />}
                        //                         </div>
                        //                     </>
                        //                 )}

                        //                 {/* Top row: icon + Quick badge */}
                        //                 <div className="flex items-start justify-between mb-4 relative z-10">
                        //                     <div
                        //                         className="flex items-center justify-center w-14 h-14 rounded-2xl transition-transform duration-300 group-hover:scale-105"
                        //                         style={{
                        //                             background: `linear-gradient(135deg, ${item.color}26 0%, ${item.color}12 100%)`,
                        //                             border: `1px solid ${item.color}33`,
                        //                         }}
                        //                     >
                        //                         <Icon size={26} strokeWidth={2.2} style={{ color: item.color }} />
                        //                     </div>

                        //                     <span
                        //                         className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                        //                         style={{ background: "var(--surface-muted)", color: "var(--muted)" }}
                        //                     >
                        //                         Quick
                        //                     </span>
                        //                 </div>

                        //                 {/* Title + subtitle */}
                        //                 <div className="relative z-10 mb-5">
                        //                     <h3 className="text-base font-bold text-(--ink) truncate">{item.title}</h3>
                        //                     <p className="text-xs text-(--muted) mt-1 truncate">{item.subtitle}</p>
                        //                 </div>

                        //                 {/* Open module footer */}
                        //                 <div
                        //                     className="mt-auto relative z-10 flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-colors duration-300"
                        //                     style={{ background: "var(--surface-muted)", color: "var(--ink)" }}
                        //                 >
                        //                     <span>{labels.openModule || "Open Module"}</span>
                        //                     <ArrowRight
                        //                         size={14}
                        //                         strokeWidth={2.5}
                        //                         className="transition-transform duration-300 group-hover:translate-x-1"
                        //                         style={{ color: "var(--accent-2)" }}
                        //                     />
                        //                 </div>
                        //             </CardWrapper>

                        <CardWrapper
                            key={item.id}
                            to={!isEditMode ? item.url : undefined}
                            draggable={isEditMode}
                            onDragStart={isEditMode ? () => handleDragStart(item.id) : undefined}
                            onDragOver={isEditMode ? (e) => handleDragOver(e, item.id) : undefined}
                            onDragEnd={isEditMode ? handleDragEnd : undefined}
                            onClick={isEditMode ? () => toggleVisibility(item.id) : undefined}
                            className={`
        relative group flex flex-col justify-end h-44 rounded-2xl transition-all duration-300 no-underline overflow-hidden border
        ${isEditMode ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}
        ${visible ? "shadow-[0_10px_28px_rgba(64,45,28,0.1)]" : "grayscale opacity-50"}
        ${!isEditMode && visible ? "hover:shadow-[0_16px_36px_rgba(64,45,28,0.18)] hover:-translate-y-1" : ""}
        ${isEditMode && visible ? "ring-2 ring-(--accent-2) ring-offset-2 ring-offset-(--app-bg)" : ""}
    `}
                            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                        >
                            {/* Big background icon — vertically centered, offset from right edge */}
                            <div
                                className="absolute top-1/2 right-4 -translate-y-1/2 transition-transform duration-300 group-hover:scale-110"
                                style={{ color: item.color, opacity: 0.18 }}
                            >
                                <Icon size={88} strokeWidth={1.5} />
                            </div>

                            {/* Gradient overlay cutting across the icon, left-to-right */}
                            <div
                                className="absolute inset-0"
                                style={{
                                    background: `linear-gradient(90deg, var(--surface) 35%, transparent 55%, transparent 70%, var(--surface) 95%), linear-gradient(180deg, transparent 0%, var(--surface) 85%)`,
                                }}
                            />

                            {isEditMode && (
                                <>
                                    <div className="absolute top-3 left-3 text-(--muted) opacity-60 z-20">
                                        <GripVertical size={14} />
                                    </div>
                                    <div
                                        className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all shadow-xl z-30 ${visible
                                                ? "bg-(--accent-2) border-white text-white scale-110"
                                                : "bg-(--surface) border-(--border) text-(--muted)"
                                            }`}
                                    >
                                        {visible ? <Check size={14} strokeWidth={4} /> : <Plus size={14} strokeWidth={4} />}
                                    </div>
                                </>
                            )}

                            {/* Small icon chip + Quick badge */}
                            <div className="absolute top-4 left-5 right-5 z-10 flex items-center justify-between">
                                <div
                                    className="flex items-center justify-center w-10 h-10 rounded-xl"
                                    style={{
                                        background: `linear-gradient(135deg, ${item.color}26 0%, ${item.color}12 100%)`,
                                        border: `1px solid ${item.color}33`,
                                    }}
                                >
                                    <Icon size={20} strokeWidth={2.2} style={{ color: item.color }} />
                                </div>
                                <span
                                    className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                                    style={{ background: "var(--surface-muted)", color: "var(--muted)" }}
                                >
                                    Quick
                                </span>
                            </div>

                            {/* Title + subtitle + footer */}
                            <div className="relative z-10 px-5 pb-4 pt-2">
                                <h3 className="text-base font-bold text-(--ink) truncate">{item.title}</h3>
                                <p className="text-xs text-(--muted) mt-1 truncate mb-3">{item.subtitle}</p>

                                <div
                                    className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-bold transition-colors duration-300"
                                    style={{ background: "var(--surface-muted)", color: "var(--ink)" }}
                                >
                                    <span>{labels.openModule || "Open Module"}</span>
                                    <ArrowRight
                                        size={14}
                                        strokeWidth={2.5}
                                        className="transition-transform duration-300 group-hover:translate-x-1"
                                        style={{ color: "var(--accent-2)" }}
                                    />
                                </div>
                            </div>
                        </CardWrapper>
                    );
                })}
            </div>

            {isEditMode && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1f1a17]/95 backdrop-blur-md text-white px-6 py-3 rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.35)] flex items-center gap-6 z-50 border border-white/10">
                    <p className="text-xs font-medium text-[#e7d7c4] whitespace-nowrap">
                        {labels.dragToReorder}
                    </p>
                    <button
                        onClick={() => setIsEditMode(false)}
                        className="bg-(--accent-2) text-white hover:bg-[#0b5f59] text-[10px] font-black px-5 py-2 rounded-xl transition-all active:scale-95 uppercase tracking-wider"
                    >
                        {labels.done}
                    </button>
                </div>
            )}
        </div>
    );
};

export default QuickActions;


