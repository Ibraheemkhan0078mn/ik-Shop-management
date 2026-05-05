import React, { useState } from "react";
import {
    Grid,
    List,
    Moon,
    Sun,
    Sidebar,
    AlignLeft,
    AlignRight,
    Package,
    Users,
    Truck,
    Wallet,
    LayoutGrid,
    ArrowLeftRight,
    ClipboardList,
    BadgeDollarSign,
    UserCircle,
    Type,
    Palette,
    Monitor,
    Image as ImageIcon,
    Eye,
} from "lucide-react";

const AppearanceSettings = () => {
    const [theme, setTheme] = useState("light");
    const [sidebarPos, setSidebarPos] = useState("left");
    const [accentColor, setAccentColor] = useState("#2563eb"); // Default Blue-600
    const [fontSize, setFontSize] = useState(14);

    // State for every individual module view
    const [moduleViews, setModuleViews] = useState({
        category: "table",
        subcategory: "table",
        businessExpenses: "table",
        purchases: "table",
        wastage: "table",
        return: "table",
        suppliers: "table",
        manufacturer: "table",
        customersAccounts: "table",
        suppliersAccounts: "table",
        staffAccounts: "table",
        staffList: "grid",
        salaries: "table",
        staffOrders: "grid",
        staffExpensesList: "table",
    });

    const updateModuleView = (key, value) => {
        setModuleViews((prev) => ({ ...prev, [key]: value }));
    };

    const accentPresets = [
        "#2563eb",
        "#10b981",
        "#f59e0b",
        "#ef4444",
        "#8b5cf6",
        "#1e293b",
    ];

    return (
        <div className="bg-(--surface) rounded-3xl p-6 border border-(--border) shadow-[0_18px_50px_rgba(64,45,28,0.12)]">
            <div className="max-h-[80vh] h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                    {/* --- Theme & Branding --- */}
                    <div className="bg-(--surface) p-6 rounded-xl border border-(--border) shadow-[0_14px_30px_rgba(64,45,28,0.10)] space-y-6">
                        <div>
                            <h2 className="text-sm font-semibold uppercase tracking-wider text-(--muted) mb-4 flex items-center gap-2">
                                <Monitor size={16} /> Visual Mode
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setTheme("light")}
                                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${theme === "light" ? "border-(--accent-2) bg-(--surface-muted) text-(--accent-2) font-bold" : "border-(--border) hover:bg-(--surface-muted) text-(--muted)"}`}
                                >
                                    <Sun size={18} /> Light
                                </button>
                                <button
                                    onClick={() => setTheme("dark")}
                                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${theme === "dark" ? "border-(--border) bg-(--ink) text-white font-bold" : "border-(--border) hover:bg-(--surface-muted) text-(--muted)"}`}
                                >
                                    <Moon size={18} /> Dark
                                </button>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-sm font-semibold uppercase tracking-wider text-(--muted) mb-4 flex items-center gap-2">
                                <Palette size={16} /> Accent Color
                            </h2>
                            <div className="flex flex-wrap gap-3">
                                {accentPresets.map((color) => (
                                    <button
                                        key={color}
                                        onClick={() => setAccentColor(color)}
                                        className={`w-8 h-8 rounded-full border-2 transition-transform active:scale-90 ${accentColor === color ? "border-(--ink) scale-110" : "border-transparent"}`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                                <input
                                    type="color"
                                    value={accentColor}
                                    onChange={(e) =>
                                        setAccentColor(e.target.value)
                                    }
                                    className="w-8 h-8 rounded-full overflow-hidden border-0 cursor-pointer p-0"
                                />
                            </div>
                        </div>
                    </div>

                    {/* --- Navigation & Typography --- */}
                    <div className="bg-(--surface) p-6 rounded-xl border border-(--border) shadow-[0_14px_30px_rgba(64,45,28,0.10)] space-y-6">
                        <div>
                            <h2 className="text-sm font-semibold uppercase tracking-wider text-(--muted) mb-4 flex items-center gap-2">
                                <Sidebar size={16} /> Navigation Layout
                            </h2>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setSidebarPos("left")}
                                    className={`flex-1 flex flex-col items-center p-4 rounded-xl border transition-all ${sidebarPos === "left" ? "border-(--accent-2) ring-1 ring-(--accent-2) bg-(--surface-muted) text-(--accent-2) font-bold" : "border-(--border) hover:bg-(--surface-muted) text-(--muted)"}`}
                                >
                                    <AlignLeft size={24} className="mb-2" />
                                    <span className="text-xs">
                                        Left Sidebar
                                    </span>
                                </button>
                                <button
                                    onClick={() => setSidebarPos("right")}
                                    className={`flex-1 flex flex-col items-center p-4 rounded-xl border transition-all ${sidebarPos === "right" ? "border-(--accent-2) ring-1 ring-(--accent-2) bg-(--surface-muted) text-(--accent-2) font-bold" : "border-(--border) hover:bg-(--surface-muted) text-(--muted)"}`}
                                >
                                    <AlignRight size={24} className="mb-2" />
                                    <span className="text-xs">
                                        Right Sidebar
                                    </span>
                                </button>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-sm font-semibold uppercase tracking-wider text-(--muted) mb-2 flex items-center gap-2">
                                <Type size={16} /> System Font Size ({fontSize}
                                px)
                            </h2>
                            <input
                                type="range"
                                min="12"
                                max="20"
                                step="1"
                                value={fontSize}
                                onChange={(e) => setFontSize(e.target.value)}
                                className="w-full h-2 bg-(--surface-muted) rounded-xl appearance-none cursor-pointer accent-(--accent-2)"
                            />
                            <div className="flex justify-between text-[10px] text-(--muted) mt-1">
                                <span>Compact</span>
                                <span>Standard</span>
                                <span>Large</span>
                            </div>
                        </div>
                    </div>

                    {/* --- Branding & Assets --- */}
                    <div className="md:col-span-2 bg-(--surface) p-6 rounded-xl border border-(--border) shadow-[0_14px_30px_rgba(64,45,28,0.10)]">
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-(--muted) mb-4 flex items-center gap-2">
                            <ImageIcon size={16} /> Brand Identity
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-4 border-2 border-dashed border-(--border) rounded-xl flex flex-col items-center justify-center text-center hover:border-(--accent-2) transition-colors cursor-pointer group">
                                <div className="w-12 h-12 bg-(--surface-muted) rounded-full flex items-center justify-center mb-2 group-hover:bg-(--surface-muted) transition-colors">
                                    <ImageIcon
                                        className="text-(--muted) group-hover:text-(--accent-2)"
                                        size={24}
                                    />
                                </div>
                                <p className="text-xs font-bold">
                                    Dashboard Logo
                                </p>
                                <p className="text-[10px] text-(--muted) mt-1">
                                    Recommended: PNG 256x256px
                                </p>
                            </div>
                            <div className="p-4 border-2 border-dashed border-(--border) rounded-xl flex flex-col items-center justify-center text-center hover:border-(--accent-2) transition-colors cursor-pointer group">
                                <div className="w-12 h-12 bg-(--surface-muted) rounded-full flex items-center justify-center mb-2 group-hover:bg-(--surface-muted) transition-colors">
                                    <ClipboardList
                                        className="text-(--muted) group-hover:text-(--accent-2)"
                                        size={24}
                                    />
                                </div>
                                <p className="text-xs font-bold">
                                    Receipt Logo (Grayscale)
                                </p>
                                <p className="text-[10px] text-(--muted) mt-1">
                                    Recommended: JPG 128x128px
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* --- Individual Module Views --- */}
                    <div className="md:col-span-2 bg-(--surface) p-6 rounded-xl border border-(--border) shadow-[0_14px_30px_rgba(64,45,28,0.10)]">
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-(--muted) mb-6 flex items-center gap-2">
                            <LayoutGrid size={16} /> Individual Page View
                            Toggles
                        </h2>

                        <div className="grid grid-cols-1 gap-1">
                            {/* Inventory Section */}
                            <SectionHeader title="Inventory & Logistics" />
                            <ModuleRow
                                title="Category"
                                icon={<Package size={18} />}
                                value={moduleViews.category}
                                onChange={(v) =>
                                    updateModuleView("category", v)
                                }
                            />
                            <ModuleRow
                                title="Subcategory"
                                icon={<Package size={18} />}
                                value={moduleViews.subcategory}
                                onChange={(v) =>
                                    updateModuleView("subcategory", v)
                                }
                            />
                            <ModuleRow
                                title="Purchases"
                                icon={<ShoppingCart size={18} />}
                                value={moduleViews.purchases}
                                onChange={(v) =>
                                    updateModuleView("purchases", v)
                                }
                            />
                            <ModuleRow
                                title="Wastage"
                                icon={<ClipboardList size={18} />}
                                value={moduleViews.wastage}
                                onChange={(v) => updateModuleView("wastage", v)}
                            />
                            <ModuleRow
                                title="Return"
                                icon={<ArrowLeftRight size={18} />}
                                value={moduleViews.return}
                                onChange={(v) => updateModuleView("return", v)}
                            />

                            {/* Accounts & Entities */}
                            <SectionHeader title="Entities & Accounts" />
                            <ModuleRow
                                title="Suppliers"
                                icon={<Truck size={18} />}
                                value={moduleViews.suppliers}
                                onChange={(v) =>
                                    updateModuleView("suppliers", v)
                                }
                            />
                            <ModuleRow
                                title="Manufacturer"
                                icon={<Truck size={18} />}
                                value={moduleViews.manufacturer}
                                onChange={(v) =>
                                    updateModuleView("manufacturer", v)
                                }
                            />
                            <ModuleRow
                                title="Customers Accounts"
                                icon={<Users size={18} />}
                                value={moduleViews.customersAccounts}
                                onChange={(v) =>
                                    updateModuleView("customersAccounts", v)
                                }
                            />
                            <ModuleRow
                                title="Suppliers Accounts"
                                icon={<Users size={18} />}
                                value={moduleViews.suppliersAccounts}
                                onChange={(v) =>
                                    updateModuleView("suppliersAccounts", v)
                                }
                            />

                            {/* Finance */}
                            <SectionHeader title="Finance & Expenses" />
                            <ModuleRow
                                title="Business Expenses"
                                icon={<Wallet size={18} />}
                                value={moduleViews.businessExpenses}
                                onChange={(v) =>
                                    updateModuleView("businessExpenses", v)
                                }
                            />
                            <ModuleRow
                                title="Staff Accounts"
                                icon={<UserCircle size={18} />}
                                value={moduleViews.staffAccounts}
                                onChange={(v) =>
                                    updateModuleView("staffAccounts", v)
                                }
                            />
                            <ModuleRow
                                title="Salaries"
                                icon={<BadgeDollarSign size={18} />}
                                value={moduleViews.salaries}
                                onChange={(v) =>
                                    updateModuleView("salaries", v)
                                }
                            />
                            <ModuleRow
                                title="Staff Expenses List"
                                icon={<Wallet size={18} />}
                                value={moduleViews.staffExpensesList}
                                onChange={(v) =>
                                    updateModuleView("staffExpensesList", v)
                                }
                            />

                            {/* Staff Specific */}
                            <SectionHeader title="Staff Management" />
                            <ModuleRow
                                title="Staff List"
                                icon={<Users size={18} />}
                                value={moduleViews.staffList}
                                onChange={(v) =>
                                    updateModuleView("staffList", v)
                                }
                            />
                            <ModuleRow
                                title="Staff Orders"
                                icon={<ShoppingCart size={18} />}
                                value={moduleViews.staffOrders}
                                onChange={(v) =>
                                    updateModuleView("staffOrders", v)
                                }
                            />
                        </div>
                    </div>

                    {/* --- Global Performance & UX --- */}
                    <div className="md:col-span-2 bg-(--surface) p-6 rounded-xl border border-(--border) shadow-[0_14px_30px_rgba(64,45,28,0.10)] flex flex-col gap-6">
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-(--muted) flex items-center gap-2">
                            <Eye size={16} /> Visibility & Experience
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="compact-mode"
                                    className="w-10 h-5 bg-(--surface-muted) rounded-full appearance-none checked:bg-(--accent-2) transition-all relative cursor-pointer after:content-[''] after:absolute after:top-1 after:left-1 after:bg-(--surface) after:w-3 after:h-3 after:rounded-full checked:after:translate-x-5"
                                />
                                <label
                                    htmlFor="compact-mode"
                                    className="text-sm font-medium cursor-pointer"
                                >
                                    Compact Mode
                                </label>
                            </div>
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="sticky-headers"
                                    defaultChecked
                                    className="w-10 h-5 bg-(--surface-muted) rounded-full appearance-none checked:bg-(--accent-2) transition-all relative cursor-pointer after:content-[''] after:absolute after:top-1 after:left-1 after:bg-(--surface) after:w-3 after:h-3 after:rounded-full checked:after:translate-x-5"
                                />
                                <label
                                    htmlFor="sticky-headers"
                                    className="text-sm font-medium cursor-pointer"
                                >
                                    Sticky Table Headers
                                </label>
                            </div>
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="quick-stats"
                                    defaultChecked
                                    className="w-10 h-5 bg-(--surface-muted) rounded-full appearance-none checked:bg-(--accent-2) transition-all relative cursor-pointer after:content-[''] after:absolute after:top-1 after:left-1 after:bg-(--surface) after:w-3 after:h-3 after:rounded-full checked:after:translate-x-5"
                                />
                                <label
                                    htmlFor="quick-stats"
                                    className="text-sm font-medium cursor-pointer"
                                >
                                    Show Module Stats
                                </label>
                            </div>
                        </div>
                        <div className="border-t border-(--border) pt-6 flex justify-end">
                            <button
                                className="w-full md:w-auto px-10 py-3 text-white rounded-xl text-sm font-bold transition-all shadow-md active:scale-95 hover:brightness-110"
                                style={{ backgroundColor: accentColor }}
                            >
                                Save All Settings
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper component for Section Headers
const SectionHeader = ({ title }) => (
    <div className="bg-(--surface-muted) py-2 px-4 mt-4 mb-2 rounded-xl border-l-4 border-(--accent-2)">
        <span className="text-[10px] font-black uppercase tracking-widest text-(--muted)">
            {title}
        </span>
    </div>
);

// Helper component for Individual Module Toggle Rows
const ModuleRow = ({ title, icon, value, onChange }) => (
    <div className="flex items-center justify-between p-3 hover:bg-(--surface-muted) rounded-xl transition-colors border-b border-(--border) last:border-0 group">
        <div className="flex items-center gap-3">
            <div className="text-(--muted) group-hover:text-(--accent-2) transition-colors">
                {icon}
            </div>
            <span className="text-sm font-semibold text-(--ink)">{title}</span>
        </div>

        <div className="flex bg-(--surface-muted) p-1 rounded-xl border border-(--border) scale-90">
            <button
                onClick={() => onChange("grid")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold transition-all ${value === "grid" ? "bg-(--surface) shadow-[0_14px_30px_rgba(64,45,28,0.10)] text-(--accent-2)" : "text-(--muted) hover:text-(--muted)"}`}
            >
                <Grid size={13} /> Grid
            </button>
            <button
                onClick={() => onChange("table")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold transition-all ${value === "table" ? "bg-(--surface) shadow-[0_14px_30px_rgba(64,45,28,0.10)] text-(--accent-2)" : "text-(--muted) hover:text-(--muted)"}`}
            >
                <List size={13} /> Table
            </button>
        </div>
    </div>
);

const ShoppingCart = ({ size, className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <circle cx="8" cy="21" r="1" />
        <circle cx="19" cy="21" r="1" />
        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
);

export default AppearanceSettings;
