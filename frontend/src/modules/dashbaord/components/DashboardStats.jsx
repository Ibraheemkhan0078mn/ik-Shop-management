import React, { useEffect, useState } from "react";
import {
    Users,
    CheckCircle2,
    PauseCircle,
    Receipt,
    Wallet,
    TrendingUp,
    Coffee,
    AlertTriangle,
    PackageMinus,
    Wrench,
    ChevronDown,
    Eye,
    Gift,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import api from "../../../shared/services/api.js";
import { sidebarData } from "../../../shared/data/sidebar.js";
import { getDashboardLabels } from '../labels/dashboardLabels.js';
import { useSettings } from '../../settings/hooks/useSettings.js';

export default function DashboardStats({
    stats,
    filters,
    onCustomDateSelect,
    onFilterChange,
}) {
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getDashboardLabels(language);

    const [selected, setSelected] = useState("Today");
    const [open, setOpen] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [customRange, setCustomRange] = useState({ from: "", to: "" });

    // Map filter text to stats keys
    const keyMap = {
        Today: "today",
        "3 Days": "threeDays",
        "7 Days": "sevenDays",
        "30 Days": "thirtyDays",
        Custom: "custom",
    };

    // Localized filter options
    const filterOptions = [
        { key: "Today", label: labels.today },
        { key: "3 Days", label: labels.days3 },
        { key: "7 Days", label: labels.days7 },
        { key: "30 Days", label: labels.days30 },
        { key: "Custom", label: labels.customRange },
    ];

    const rangeKey = keyMap[selected];

    // Handle custom date selection
    const handleCustomDateSubmit = () => {
        if (customRange.from && customRange.to) {
            onCustomDateSelect(customRange.from, customRange.to);
            setSelected("Custom");
            setShowDatePicker(false);
        }
    };

    // Add handleFilterSelect for filter changes
    const handleFilterSelect = (f) => {
        if (f === "Custom") {
            setShowDatePicker(true);
        } else {
            setSelected(f);
            setShowDatePicker(false);
            setCustomRange({ from: "", to: "" });
            if (typeof onFilterChange === "function") {
                onFilterChange(f);
            }
        }
        setOpen(false);
    };

    const cards = [
        // === SALES & PAYMENTS ===
        {
            id: "totalSalesForOther",
            title: language === "en" ? "Total Sales" : "کل فروخت",
            time: selected,
            value: `Rs. ${Number(stats?.totalSalesForOther?.[rangeKey] ?? 0).toLocaleString()}`,
            icon: TrendingUp,
            url: "/sales",
        },
        // {
        //     id: "gymtotal_sales",
        //     title: language === "en" ? "GYM Sales" : "جم کی فروخت", // "جم کی فروخت" = GYM Sales
        //     time: selected,
        //     value: `Rs. ${Number(stats?.totalSalesForGym?.[rangeKey] ?? 0).toLocaleString()}`,
        //     icon: TrendingUp,
        //     url: "/gym/orders",
        // },
        // {
        //     id: "hosteltotal_sales",
        //     title: language === "en" ? "Hostel Sales" : "ہاسٹل کی فروخت", // "ہاسٹل کی فروخت" = Hostel Sales
        //     time: selected,
        //     value: `Rs. ${Number(stats?.totalSalesForHostel?.[rangeKey] ?? 0).toLocaleString()}`,
        //     icon: TrendingUp,
        //     url: "/hostel/orders",
        // },
        {
            id: "totalSalesForStaff",
            title: language === "en" ? "Staff Sales" : "عملے کی فروخت", // "عملے کی فروخت" = Staff Sales
            time: selected,
            value: `Rs. ${Number(stats?.totalSalesForStaff?.[rangeKey] ?? 0).toLocaleString()}`,
            icon: TrendingUp,
            url: "/staff/orders",
        },

        // === ORDERS STATUS ===
        {
            id: "on_hold",
            title: language === "en" ? "Orders On Hold" : "رکھی ہوئی آرڈرز",
            value: stats?.pendingOrders ?? 0,
            icon: PauseCircle,
            url: "/pos",
        },
        {
            id: "orders_done",
            title: language === "en" ? "Completed Orders" : "مکمل شدہ آرڈرز",
            time: selected,
            value: stats?.completedOrders?.[rangeKey] ?? 0,
            icon: CheckCircle2,
            url: "/sales",
        },
        {
            id: "cash",
            title: language === "en" ? "Cash Received" : "موصول نقد",
            time: selected,
            value: `Rs. ${Number(stats?.cashReceived?.[rangeKey] ?? 0).toLocaleString()}`,
            icon: Wallet,
            color: "#8B5CF6",
            url: "/sales",
        },

        // === SUPPLIER & PAYMENTS ===
        {
            id: "freeOrdersCount",
            title:
                language === "en"
                    ? "Free Food Code Used"
                    : "مفت فوڈ کوڈ استعمال ہوا",
            value: ` ${(stats?.freeOrdersCount || 0).toLocaleString()}`,
            icon: Gift,
            url: "/sales",
        },

        // === INVENTORY STATUS ===
        {
            id: "inventoryAlerts",
            title: language === "en" ? "Items Alerts" : "کم مقدار کی چیزیں",
            value: stats?.inventoryLowStockItems || 0,
            icon: AlertTriangle,
            url: "/products/alerts",
        },
        {
            id: "inventory",
            title: language === "en" ? "Food Expenses" : "خوراک کے اخراجات",
            time: selected,
            value: `Rs ${stats?.inventoryPurchases?.[rangeKey]?.totalCost ?? 0}`,
            icon: Receipt,
            url: "/purchases",
        },

        // === OTHER ===
        {
            id: "otherInventoryPurchase",
            title: language === "en" ? "Other Expenses" : "دیگر اخراجات",
            time: selected,
            value: `Rs. ${(stats?.otherInventory?.[rangeKey]?.totalAmount || 0).toLocaleString()}`,
            icon: Receipt,
            url: "/other-inventory",
        },

        // === STAFF & MENU ===
        {
            id: "staff",
            title: language === "en" ? "Total Staff" : "کل عملہ",
            value: stats?.staff ?? 0,
            icon: Users,
            url: "/staff",
        },
        {
            id: "items",
            title: language === "en" ? "Menu Products" : "مینو کی اشیاء",
            value: stats?.menuItems ?? 0,
            icon: Coffee,
            url: "/products/items",
        },

        // // === QARZA ACCOUNTS ===
        // {
        //     id: "qarzaAccounts",
        //     title:
        //         language === "en" ? "All Qarza Accounts" : "تمام قرضہ اکاؤنٹس",
        //     time: selected,
        //     value: stats?.totalQarzaAccounts ?? 0,
        //     icon: Users,
        // },

        // {
        //     id: "totalQarza",
        //     title: language === "en" ? "Qarza (Give)" : "قرضہ دینا",
        //     value: `Rs. ${Number(stats?.totalQarza?.totalToGive ?? 0).toLocaleString()}`,
        //     icon: Wallet,
        // },
        // {
        //     id: "totalQarza",
        //     title: language === "en" ? "Qarza (Receive)" : "قرضہ حاصل کرنا",
        //     value: `Rs. ${Number(stats?.totalQarza?.totalToReceive ?? 0).toLocaleString()}`,
        //     icon: Wallet,
        // },
        // === INVENTORY STATUS ===
        {
            id: "inventoryAlerts",
            title: language === "en" ? "Items Alerts" : "کم مقدار کی چیزیں",
            value: stats?.inventoryLowStockItems || 0,
            icon: AlertTriangle,
            url: "/products/alerts",
            color: "#FB7185",
        },

        // {
        //     id: "totalQarzaOfHostel",
        //     title:
        //         language === "en" ? "Hostel Qarza (Give)" : "ہوسٹل قرضہ دینا",
        //     value: `Rs. ${Number(stats?.totalQarzaOfHostel?.totalToGive ?? 0).toLocaleString()}`,
        //     icon: Wallet,
        //     // color: "#f97316",
        //     url: "/hostel/records",
        // },
        // {
        //     id: "totalQarzaOfHostel",
        //     title:
        //         language === "en"
        //             ? "Hostel Qarza (Receive)"
        //             : "ہوسٹل قرضہ حاصل کرنا",
        //     value: `Rs. ${Number(stats?.totalQarzaOfHostel?.totalToReceive ?? 0).toLocaleString()}`,
        //     icon: Wallet,
        //     // color: "#f97316",
        //     url: "/hostel/records",
        // },

        // {
        //     id: "totalQarzaOfGym",
        //     title: language === "en" ? "Gym Qarza (Give)" : "جم قرضہ دینا",
        //     value: `Rs. ${Number(stats?.totalQarzaOfGym?.totalToGive ?? 0).toLocaleString()}`,
        //     icon: Wallet,
        //     // color: "#22c55e",
        //     url: "/gym/records",
        // },
        // {
        //     id: "totalQarzaOfGym",
        //     title:
        //         language === "en" ? "Gym Qarza (Receive)" : "جم قرضہ حاصل کرنا",
        //     value: `Rs. ${Number(stats?.totalQarzaOfGym?.totalToReceive ?? 0).toLocaleString()}`,
        //     icon: Wallet,
        //     // color: "#22c55e",
        //     url: "/gym/records",
        // },
    ];

    const CardComponent = ({ card, Icon }) => {
        return (
            <div
                className="
        relative p-4 rounded-2xl
        bg-(--surface) dark:bg-(--surface)
        shadow-sm hover:shadow-md
        transition-all duration-300
        w-full max-w-md border border-(--border)
      "
                // style={{ border: `1px solid gray`,  }}
            >
                {/* Header */}
                <div className="flex flex-col  pb-0  dark:border-(--border)">
                    <div className="flex justify-between">
                        <span
                            className={`2xl:text-lg font-semibold text-(--muted) dark:text-(--muted) `}
                            style={{ color: card.color }}
                        >
                            {card?.title}
                        </span>
                        <div className=" flex items-center justify-center rounded-full w-8 h-8 z-10">
                            <Icon className="w-4 h-4 text-(--muted)" />
                        </div>
                    </div>

                    {/* Value + Link */}
                    <div className="flex items-center justify-between pt-4 border-t mt-5">
                        <span className="text-xl font-bold text-(--muted) dark:text-white">
                            {card.value}
                        </span>

                        {card.url && (
                            <Link
                                className="text-xs text-(--muted) underline transition-all duration-300 hover:scale-105"
                                // style={{ color: theme.base }}
                                to={card.url}
                            >
                                {language === "en"
                                    ? "View Details"
                                    : "تفصیل دیکھیں"}
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 w-full">
            {/* === Filter Dropdown === */}
            <div className="relative w-44 ml-auto">
                <button
                    onClick={() => setOpen(!open)}
                    className="w-full flex justify-between items-center px-4 py-2 bg-(--surface) dark:bg-(--surface) border border-(--border) dark:border-(--border) rounded-full shadow-sm hover:shadow-md transition focus:outline-none focus:ring-2 focus:ring-(--accent-2)/20 dark:focus:ring-(--accent-2)/20"
                >
                    <span className="text-sm font-medium text-(--ink) dark:text-(--ink)">
                        {filterOptions.find(opt => opt.key === selected)?.label || selected}
                    </span>
                    <ChevronDown
                        className={`w-5 h-5 ml-2 transition-transform ${open ? "rotate-180" : ""}`}
                    />
                </button>

                {open && (
                    <ul className="absolute right-0 mt-2 w-full bg-(--surface) dark:bg-(--surface) rounded-xl shadow-lg border border-(--border) dark:border-(--border) z-20 overflow-hidden">
                        {filterOptions.map((opt) => (
                            <li
                                key={opt.key}
                                onClick={() => handleFilterSelect(opt.key)}
                                className={`px-4 py-2 text-sm cursor-pointer transition-colors ${
                                    opt.key === selected
                                        ? "bg-(--surface-muted) dark:bg-(--surface) font-semibold text-(--ink) dark:text-white"
                                        : "hover:bg-(--surface-muted) dark:hover:bg-(--surface-muted) text-(--ink) dark:text-(--muted)"
                                }`}
                            >
                                {opt.label}
                            </li>
                        ))}
                    </ul>
                )}

                {/* Custom Date Range Picker */}
                {showDatePicker && (
                    <div className="absolute right-0 mt-2 p-4 w-64 bg-(--surface) dark:bg-(--surface) rounded-xl shadow-lg border border-(--border) dark:border-(--border) z-20">
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-(--ink) dark:text-(--muted) mb-1">
                                    From
                                </label>
                                <input
                                    type="date"
                                    value={customRange.from}
                                    onChange={(e) =>
                                        setCustomRange((prev) => ({
                                            ...prev,
                                            from: e.target.value,
                                        }))
                                    }
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-(--accent-2)"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-(--ink) dark:text-(--muted) mb-1">
                                    To
                                </label>
                                <input
                                    type="date"
                                    value={customRange.to}
                                    onChange={(e) =>
                                        setCustomRange((prev) => ({
                                            ...prev,
                                            to: e.target.value,
                                        }))
                                    }
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-(--accent-2)"
                                />
                            </div>
                            <div className="flex justify-end gap-2 mt-2">
                                <button
                                    onClick={() => setShowDatePicker(false)}
                                    className="px-3 py-1 text-sm border rounded-lg hover:bg-(--surface-muted)"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCustomDateSubmit}
                                    className="px-3 py-1 text-sm bg-(--accent-2) text-white rounded-lg hover:bg-[#0b5f59]"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* === General Stats Cards === */}
            <div className="grid grid-cols-1  lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 sm:gap-10 lg:gap-5  w-full justify-items-center">
                {cards.map((card, idx) => {
                    const Icon = card?.icon;
                    return <CardComponent key={idx} card={card} Icon={Icon} />;
                })}
            </div>
        </div>
    );
}

