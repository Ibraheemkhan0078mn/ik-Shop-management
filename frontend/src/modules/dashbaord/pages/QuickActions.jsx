// src/modules/dashbaord/pages/QuickActions.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
    Search,
    Pencil,
    Check,
    Plus,
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
        { id: "dashboard", title: labels.dashboard, url: "/dashboard", icon: BarChart3, important: true },
        { id: "analytics", title: labels.analytics, url: "/dashboard/analytics", icon: TrendingUp, important: false },
        { id: "products", title: labels.addProducts, url: "/products", icon: Package, important: true },
        { id: "categories", title: labels.categories, url: "/products/categories", icon: Boxes, important: false },
        { id: "sub-categories", title: labels.subCategories, url: "/products/sub-categories", icon: Boxes, important: false },
        { id: "purchases", title: labels.addPurchases, url: "/purchases", icon: CreditCard, important: true },
        { id: "suppliers", title: labels.suppliers, url: "/suppliers", icon: Truck, important: false },
        { id: "purchase-returns", title: labels.purchaseReturns, url: "/purchase-returns", icon: RotateCcw, important: false },
        { id: "product-return", title: labels.productReturns, url: "/product-return", icon: RotateCcw, important: false },
        { id: "customers", title: labels.customers, url: "/customers", icon: Users, important: true },
        { id: "wastage", title: labels.wastage, url: "/wastage", icon: Package, important: false },
        { id: "qarza", title: labels.qarzaAccounts, url: "/qarzaAccount", icon: Wallet, important: false },
        { id: "expenses", title: labels.expenses, url: "/expenses", icon: DollarSign, important: true },
        { id: "pos", title: labels.pos, url: "/pos", icon: ShoppingCart, important: true },
        { id: "order-history", title: labels.orderHistory, url: "/order-history", icon: ClipboardList, important: false },
        { id: "settings", title: labels.settings, url: "/settings/generals", icon: Settings, important: false },
        { id: "reports", title: labels.reports, url: "/reports", icon: BarChart3, important: true },
        { id: "report-inventory", title: labels.inventoryReport, url: "/reports/giant-inventory", icon: Package, important: false },
        { id: "report-staff", title: labels.staffReport, url: "/reports/staff", icon: Users, important: false },
        { id: "report-credits", title: labels.creditsDebits, url: "/reports/credits-debits", icon: Wallet, important: false },
        { id: "report-expenses", title: labels.expenseKpi, url: "/reports/expenses", icon: DollarSign, important: false },
        { id: "report-sales", title: labels.salesKpi, url: "/reports/sales", icon: TrendingUp, important: false },
        { id: "report-purchases", title: labels.purchaseKpi, url: "/reports/purchases", icon: CreditCard, important: false },
        { id: "report-suppliers", title: labels.supplierKpi, url: "/reports/suppliers", icon: Truck, important: false },
        { id: "report-customers", title: labels.customerKpi, url: "/reports/customers", icon: Users, important: false },
        { id: "staff", title: labels.staff, url: "/staff", icon: UserCog, important: true },
        { id: "staff-create", title: labels.addStaff, url: "/staff/create", icon: UserPlus, important: false },
        { id: "staff-attendance", title: labels.attendance, url: "/staff/attendance", icon: CalendarCheck, important: false },
        { id: "profile", title: labels.profile, url: "/profile", icon: Users, important: false },
        { id: "users", title: labels.appUsers, url: "/users", icon: Settings, important: true },
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
                        className={`flex items-center justify-center p-2.5 rounded-2xl border transition-all duration-300 ${
                            isEditMode
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

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                {filteredItems.map((item) => {
                    const Icon = item.icon;
                    const visible = visibility[item.id];
                    const CardWrapper = isEditMode ? "div" : Link;

                    return (
                        <CardWrapper
                            key={item.id}
                            to={!isEditMode ? item.url : undefined}
                            draggable={isEditMode}
                            onDragStart={
                                isEditMode
                                    ? () => handleDragStart(item.id)
                                    : undefined
                            }
                            onDragOver={
                                isEditMode
                                    ? (e) => handleDragOver(e, item.id)
                                    : undefined
                            }
                            onDragEnd={isEditMode ? handleDragEnd : undefined}
                            onClick={
                                isEditMode
                                    ? () => toggleVisibility(item.id)
                                    : undefined
                            }
                            className={`
                relative group flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-300 no-underline
                ${isEditMode ? "cursor-grab active:cursor-grabbing" : "cursor-pointer hover:shadow-md hover:-translate-y-1"}
                ${visible ? "bg-(--surface) shadow-[0_10px_24px_rgba(64,45,28,0.10)]" : "bg-(--surface-muted) grayscale opacity-50"}
                ${isEditMode && visible ? "ring-2 ring-(--accent-2) ring-offset-2 shadow-[0_16px_30px_rgba(15,118,110,0.22)]" : "border border-(--border)"}
              `}
                        >
                            {isEditMode && (
                                <>
                                    <div className="absolute top-1 left-1 text-(--muted) opacity-60">
                                        <GripVertical size={14} />
                                    </div>
                                    <div
                                        className={`absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all shadow-md z-20 ${
                                            visible
                                                ? "bg-(--accent-2) border-white text-white scale-110"
                                                : "bg-(--surface) border-(--border) text-(--muted)"
                                        }`}
                                    >
                                        {visible ? (
                                            <Check size={12} strokeWidth={4} />
                                        ) : (
                                            <Plus size={12} strokeWidth={4} />
                                        )}
                                    </div>
                                </>
                            )}

                            <div
                                className={`mb-2 text-(--accent) transition-all duration-300 ${!isEditMode && "group-hover:scale-110"}`}
                            >
                                <Icon size={24} />
                            </div>

                            <span
                                className={`text-[11px] font-semibold uppercase tracking-wide text-center truncate w-full transition-colors ${visible ? "text-(--ink)" : "text-(--muted)"}`}
                            >
                                {item.title}
                            </span>
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









// import React, { useState } from "react";
// import { Link } from "react-router-dom";
// import {
//     Search,
//     Pencil,
//     Check,
//     Plus,
//     BarChart3,
//     Wallet,
//     ShoppingCart,
//     Users,
//     DollarSign,
//     CreditCard,
//     Package,
//     TrendingUp,
//     Settings,
//     Link as LinkIcon,
//     X,
//     Trash2,
// } from "lucide-react";

// const sidebarData = (language = "en") => ({
//     navMain: [
//         {
//             id: "Sale",
//             title: language === "en" ? "POS" : "سیل",
//             url: "/pos",
//             icon: ShoppingCart,
//         },
//         {
//             id: "Stock & Expenses",
//             title: "Add Products",
//             url: "/products/add",
//             icon: Package,
//         },
//         {
//             id: "Purchases",
//             title: "Add Purchases",
//             url: "/purchases/add",
//             icon: CreditCard,
//         },
//         {
//             id: "StaffPos",
//             title: "Staff POS",
//             url: "/staff/pos",
//             icon: Users,
//         },
//         {
//             id: "Settings",
//             title: "App Users",
//             url: "/users",
//             icon: Settings,
//         },
//     ],
// });

// const QuickActions = () => {
//     const [searchQuery, setSearchQuery] = useState("");
//     const [isEditMode, setIsEditMode] = useState(false);
//     const [showAddModal, setShowAddModal] = useState(false);

//     const rawLinks = sidebarData("en").navMain;

//     const [items, setItems] = useState(
//         rawLinks.map((link) => ({
//             ...link,
//             visible: true,
//             type: "system",
//         })),
//     );

//     const [newLink, setNewLink] = useState({
//         title: "",
//         url: items[0].url,
//         iconKey: items[0].id,
//         color: "text-(--accent-2)",
//     });

//     const toggleVisibility = (id) => {
//         setItems(
//             items.map((item) =>
//                 item.id === id ? { ...item, visible: !item.visible } : item,
//             ),
//         );
//     };

//     const removeItem = (e, id) => {
//         e.stopPropagation();
//         e.preventDefault();
//         setItems(items.filter((item) => item.id !== id));
//     };

//     const handleAddCustomLink = (e) => {
//         e.preventDefault();
//         if (!newLink.title || !newLink.url) return;
//         setItems([
//             ...items,
//             {
//                 id: `custom-${Date.now()}`,
//                 title: newLink.title,
//                 url: newLink.url,
//                 icon: LinkIcon,
//                 color: newLink.color,
//                 visible: true,
//                 type: "custom",
//             },
//         ]);
//         setShowAddModal(false);
//     };

//     const filteredItems = items.filter((item) => {
//         const matchesSearch = item.title
//             .toLowerCase()
//             .includes(searchQuery.toLowerCase());
//         return matchesSearch && (isEditMode || item.visible);
//     });

//     return (
//         <div className="min-h-[calc(100vh-200px)] bg-(--surface) rounded-3xl p-6 border border-(--border) shadow-[0_18px_50px_rgba(64,45,28,0.12)]">
//             {/* Small Header Bar */}
//             <div className="mb-6 flex items-center justify-between gap-3">
//                 <div className="relative flex-1 group">
//                     <Search
//                         className="absolute left-3 top-1/2 -translate-y-1/2 text-(--muted) group-focus-within:text-(--accent-2) transition-colors"
//                         size={16}
//                     />
//                     <input
//                         type="text"
//                         placeholder="Search modules..."
//                         className="w-full max-w-sm pl-9 pr-4 py-2.5 text-sm rounded-2xl bg-(--surface-muted) border border-(--border) focus:ring-2 focus:ring-(--accent-2) shadow-[0_8px_20px_rgba(64,45,28,0.08)] transition-all outline-none"
//                         value={searchQuery}
//                         onChange={(e) => setSearchQuery(e.target.value)}
//                     />
//                 </div>

//                 <button
//                     onClick={() => setIsEditMode(!isEditMode)}
//                     className={`flex items-center justify-center p-2.5 rounded-2xl border transition-all duration-300 ${
//                         isEditMode
//                             ? "bg-(--accent-2) border-(--accent-2) text-white shadow-[0_10px_20px_rgba(15,118,110,0.25)]"
//                             : "bg-(--surface) border-(--border) text-(--muted) hover:text-(--accent-2) hover:border-(--accent-2) shadow-[0_8px_16px_rgba(64,45,28,0.08)]"
//                     }`}
//                 >
//                     {isEditMode ? (
//                         <Check size={18} strokeWidth={3} />
//                     ) : (
//                         <Pencil size={18} />
//                     )}
//                 </button>
//             </div>

//             {/* Small Grid */}
//             <div>
//                 <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
//                     {filteredItems.map((item) => {
//                         const Icon = item.icon;
//                         const CardWrapper = isEditMode ? "div" : Link;

//                         return (
//                             <CardWrapper
//                                 key={item.id}
//                                 to={!isEditMode ? item.url : undefined}
//                                 onClick={
//                                     isEditMode
//                                         ? () => toggleVisibility(item.id)
//                                         : undefined
//                                 }
//                                 className={`
//                   relative group flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-300 no-underline
//                   ${isEditMode ? "cursor-pointer" : "cursor-pointer hover:shadow-md hover:-translate-y-1"}
//                   ${item.visible ? "bg-(--surface) shadow-[0_10px_24px_rgba(64,45,28,0.10)]" : "bg-(--surface-muted) grayscale opacity-50"}
//                   ${isEditMode && item.visible ? "ring-2 ring-(--accent-2) ring-offset-2 shadow-[0_16px_30px_rgba(15,118,110,0.22)]" : "border border-(--border)"}
//                 `}
//                             >
//                                 {isEditMode && (
//                                     <>
//                                         <div
//                                             className={`absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all shadow-md z-20 ${
//                                                 item.visible
//                                                     ? "bg-(--accent-2) border-white text-white scale-110"
//                                                     : "bg-(--surface) border-(--border) text-(--muted)"
//                                             }`}
//                                         >
//                                             {item.visible ? (
//                                                 <Check
//                                                     size={12}
//                                                     strokeWidth={4}
//                                                 />
//                                             ) : (
//                                                 <Plus
//                                                     size={12}
//                                                     strokeWidth={4}
//                                                 />
//                                             )}
//                                         </div>
//                                         <button
//                                             onClick={(e) =>
//                                                 removeItem(e, item.id)
//                                             }
//                                             className="absolute -top-1.5 -left-1.5 w-6 h-6 bg-(--accent) text-white rounded-full flex items-center justify-center border-2 border-white shadow-md hover:bg-[#92400e] transition-colors z-30"
//                                         >
//                                             <Trash2 size={12} />
//                                         </button>
//                                     </>
//                                 )}

//                                 <div
//                                     className={`mb-2 text-(--accent) transition-all duration-300 ${!isEditMode && "group-hover:scale-110"}`}
//                                 >
//                                     <Icon size={24} />
//                                 </div>

//                                 <span
//                                     className={`text-[11px] font-semibold uppercase tracking-wide text-center truncate w-full transition-colors ${item.visible ? "text-(--ink)" : "text-(--muted)"}`}
//                                 >
//                                     {item.title}
//                                 </span>
//                             </CardWrapper>
//                         );
//                     })}

//                     {isEditMode && (
//                         <div
//                             onClick={() => setShowAddModal(true)}
//                             className="relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-(--border) hover:border-(--accent-2) hover:bg-(--surface-muted) transition-all cursor-pointer group"
//                         >
//                             <div className="mb-2 text-(--muted) group-hover:text-(--accent-2) transition-colors">
//                                 <Plus size={24} />
//                             </div>
//                             <span className="text-[10px] font-semibold uppercase tracking-wide text-(--muted) group-hover:text-(--accent-2) text-center">
//                                 New
//                             </span>
//                         </div>
//                     )}
//                 </div>
//             </div>

//             {/* Compact Persistence Bar */}
//             {isEditMode && !showAddModal && (
//                 <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1f1a17]/95 backdrop-blur-md text-white px-6 py-3 rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.35)] flex items-center gap-6 z-50 animate-in slide-in-from-bottom-5 border border-white/10">
//                     <p className="text-xs font-medium text-[#e7d7c4] whitespace-nowrap">
//                         Edit Shortcuts
//                     </p>
//                     <button
//                         onClick={() => setIsEditMode(false)}
//                         className="bg-(--accent-2) text-white hover:bg-[#0b5f59] text-[10px] font-black px-5 py-2 rounded-xl transition-all active:scale-95 uppercase tracking-wider"
//                     >
//                         Done
//                     </button>
//                 </div>
//             )}

//             {/* Compact Modal */}
//             {showAddModal && (
//                 <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
//                     <div className="bg-(--surface) w-full max-w-xs rounded-3xl shadow-[0_24px_60px_rgba(0,0,0,0.25)] overflow-hidden animate-in zoom-in-95 duration-200 border border-(--border)">
//                         <div className="p-6">
//                             <div className="flex justify-between items-center mb-4">
//                                 <h2 className="text-sm font-black uppercase tracking-tight text-(--ink)">
//                                     Add Link
//                                 </h2>
//                                 <button
//                                     onClick={() => setShowAddModal(false)}
//                                     className="text-(--muted) hover:text-(--ink) transition-colors"
//                                 >
//                                     <X size={20} />
//                                 </button>
//                             </div>
//                             <form
//                                 onSubmit={handleAddCustomLink}
//                                 className="space-y-4"
//                             >
//                                 <input
//                                     autoFocus
//                                     type="text"
//                                     placeholder="Name"
//                                     className="w-full bg-(--surface-muted) border border-(--border) rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-(--accent-2) outline-none"
//                                     value={newLink.title}
//                                     onChange={(e) =>
//                                         setNewLink({
//                                             ...newLink,
//                                             title: e.target.value,
//                                         })
//                                     }
//                                 />
//                                 <select
//                                     className="w-full bg-(--surface-muted) border border-(--border) rounded-2xl px-4 py-3 text-sm appearance-none focus:ring-2 focus:ring-(--accent-2) outline-none cursor-pointer"
//                                     value={newLink.url}
//                                     onChange={(e) => {
//                                         const selected = rawLinks.find(
//                                             (l) => l.url === e.target.value,
//                                         );
//                                         setNewLink({
//                                             ...newLink,
//                                             url: e.target.value,
//                                             title:
//                                                 newLink.title ||
//                                                 (selected
//                                                     ? selected.title
//                                                     : ""),
//                                         });
//                                     }}
//                                 >
//                                     {rawLinks.map((link) => (
//                                         <option key={link.id} value={link.url}>
//                                             {link.title}
//                                         </option>
//                                     ))}
//                                 </select>
//                                 <div className="flex justify-between bg-(--surface-muted) p-2 rounded-2xl border border-(--border)">
//                                     {[
//                                         "text-(--accent)",
//                                         "text-(--accent-2)",
//                                         "text-(--ink)",
//                                         "text-(--muted)",
//                                     ].map((c) => (
//                                         <button
//                                             key={c}
//                                             type="button"
//                                             onClick={() =>
//                                                 setNewLink({
//                                                     ...newLink,
//                                                     color: c,
//                                                 })
//                                             }
//                                             className={`w-8 h-8 rounded-full border-2 border-white ${c.replace("text-", "bg-")} ${newLink.color === c ? "ring-2 ring-[color:var(--accent)]" : ""}`}
//                                         />
//                                     ))}
//                                 </div>
//                                 <button
//                                     type="submit"
//                                     className="w-full bg-(--accent) text-white font-bold text-xs uppercase tracking-widest py-3 rounded-2xl hover:bg-[#92400e] transition-all"
//                                 >
//                                     Save
//                                 </button>
//                             </form>
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// };

// export default QuickActions;
