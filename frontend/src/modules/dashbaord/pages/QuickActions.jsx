import React, { useState } from "react";
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
    Link as LinkIcon,
    X,
    Trash2,
} from "lucide-react";

const sidebarData = (language = "en") => ({
    navMain: [
        {
            id: "Sale",
            title: language === "en" ? "POS" : "سیل",
            url: "/pos",
            icon: ShoppingCart,
        },
        {
            id: "Stock & Expenses",
            title: "Add Products",
            url: "/products/add",
            icon: Package,
        },
        {
            id: "Purchases",
            title: "Add Purchases",
            url: "/purchases/add",
            icon: CreditCard,
        },
        {
            id: "StaffPos",
            title: "Staff POS",
            url: "/staff/pos",
            icon: Users,
        },
        {
            id: "Settings",
            title: "App Users",
            url: "/users",
            icon: Settings,
        },
    ],
});

const QuickActions = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [isEditMode, setIsEditMode] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    const rawLinks = sidebarData("en").navMain;

    const [items, setItems] = useState(
        rawLinks.map((link) => ({
            ...link,
            visible: true,
            type: "system",
        })),
    );

    const [newLink, setNewLink] = useState({
        title: "",
        url: items[0].url,
        iconKey: items[0].id,
        color: "text-(--accent-2)",
    });

    const toggleVisibility = (id) => {
        setItems(
            items.map((item) =>
                item.id === id ? { ...item, visible: !item.visible } : item,
            ),
        );
    };

    const removeItem = (e, id) => {
        e.stopPropagation();
        e.preventDefault();
        setItems(items.filter((item) => item.id !== id));
    };

    const handleAddCustomLink = (e) => {
        e.preventDefault();
        if (!newLink.title || !newLink.url) return;
        setItems([
            ...items,
            {
                id: `custom-${Date.now()}`,
                title: newLink.title,
                url: newLink.url,
                icon: LinkIcon,
                color: newLink.color,
                visible: true,
                type: "custom",
            },
        ]);
        setShowAddModal(false);
    };

    const filteredItems = items.filter((item) => {
        const matchesSearch = item.title
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        return matchesSearch && (isEditMode || item.visible);
    });

    return (
        <div className="min-h-[calc(100vh-200px)] bg-(--surface) rounded-3xl p-6 border border-(--border) shadow-[0_18px_50px_rgba(64,45,28,0.12)]">
            {/* Small Header Bar */}
            <div className="mb-6 flex items-center justify-between gap-3">
                <div className="relative flex-1 group">
                    <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-(--muted) group-focus-within:text-(--accent-2) transition-colors"
                        size={16}
                    />
                    <input
                        type="text"
                        placeholder="Search modules..."
                        className="w-full max-w-sm pl-9 pr-4 py-2.5 text-sm rounded-2xl bg-(--surface-muted) border border-(--border) focus:ring-2 focus:ring-(--accent-2) shadow-[0_8px_20px_rgba(64,45,28,0.08)] transition-all outline-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <button
                    onClick={() => setIsEditMode(!isEditMode)}
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
            </div>

            {/* Small Grid */}
            <div>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                    {filteredItems.map((item) => {
                        const Icon = item.icon;
                        const CardWrapper = isEditMode ? "div" : Link;

                        return (
                            <CardWrapper
                                key={item.id}
                                to={!isEditMode ? item.url : undefined}
                                onClick={
                                    isEditMode
                                        ? () => toggleVisibility(item.id)
                                        : undefined
                                }
                                className={`
                  relative group flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-300 no-underline
                  ${isEditMode ? "cursor-pointer" : "cursor-pointer hover:shadow-md hover:-translate-y-1"}
                  ${item.visible ? "bg-(--surface) shadow-[0_10px_24px_rgba(64,45,28,0.10)]" : "bg-(--surface-muted) grayscale opacity-50"}
                  ${isEditMode && item.visible ? "ring-2 ring-(--accent-2) ring-offset-2 shadow-[0_16px_30px_rgba(15,118,110,0.22)]" : "border border-(--border)"}
                `}
                            >
                                {isEditMode && (
                                    <>
                                        <div
                                            className={`absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all shadow-md z-20 ${
                                                item.visible
                                                    ? "bg-(--accent-2) border-white text-white scale-110"
                                                    : "bg-(--surface) border-(--border) text-(--muted)"
                                            }`}
                                        >
                                            {item.visible ? (
                                                <Check
                                                    size={12}
                                                    strokeWidth={4}
                                                />
                                            ) : (
                                                <Plus
                                                    size={12}
                                                    strokeWidth={4}
                                                />
                                            )}
                                        </div>
                                        <button
                                            onClick={(e) =>
                                                removeItem(e, item.id)
                                            }
                                            className="absolute -top-1.5 -left-1.5 w-6 h-6 bg-(--accent) text-white rounded-full flex items-center justify-center border-2 border-white shadow-md hover:bg-[#92400e] transition-colors z-30"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </>
                                )}

                                <div
                                    className={`mb-2 text-(--accent) transition-all duration-300 ${!isEditMode && "group-hover:scale-110"}`}
                                >
                                    <Icon size={24} />
                                </div>

                                <span
                                    className={`text-[11px] font-semibold uppercase tracking-wide text-center truncate w-full transition-colors ${item.visible ? "text-(--ink)" : "text-(--muted)"}`}
                                >
                                    {item.title}
                                </span>
                            </CardWrapper>
                        );
                    })}

                    {isEditMode && (
                        <div
                            onClick={() => setShowAddModal(true)}
                            className="relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-(--border) hover:border-(--accent-2) hover:bg-(--surface-muted) transition-all cursor-pointer group"
                        >
                            <div className="mb-2 text-(--muted) group-hover:text-(--accent-2) transition-colors">
                                <Plus size={24} />
                            </div>
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-(--muted) group-hover:text-(--accent-2) text-center">
                                New
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Compact Persistence Bar */}
            {isEditMode && !showAddModal && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1f1a17]/95 backdrop-blur-md text-white px-6 py-3 rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.35)] flex items-center gap-6 z-50 animate-in slide-in-from-bottom-5 border border-white/10">
                    <p className="text-xs font-medium text-[#e7d7c4] whitespace-nowrap">
                        Edit Shortcuts
                    </p>
                    <button
                        onClick={() => setIsEditMode(false)}
                        className="bg-(--accent-2) text-white hover:bg-[#0b5f59] text-[10px] font-black px-5 py-2 rounded-xl transition-all active:scale-95 uppercase tracking-wider"
                    >
                        Done
                    </button>
                </div>
            )}

            {/* Compact Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-(--surface) w-full max-w-xs rounded-3xl shadow-[0_24px_60px_rgba(0,0,0,0.25)] overflow-hidden animate-in zoom-in-95 duration-200 border border-(--border)">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-sm font-black uppercase tracking-tight text-(--ink)">
                                    Add Link
                                </h2>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="text-(--muted) hover:text-(--ink) transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <form
                                onSubmit={handleAddCustomLink}
                                className="space-y-4"
                            >
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Name"
                                    className="w-full bg-(--surface-muted) border border-(--border) rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-(--accent-2) outline-none"
                                    value={newLink.title}
                                    onChange={(e) =>
                                        setNewLink({
                                            ...newLink,
                                            title: e.target.value,
                                        })
                                    }
                                />
                                <select
                                    className="w-full bg-(--surface-muted) border border-(--border) rounded-2xl px-4 py-3 text-sm appearance-none focus:ring-2 focus:ring-(--accent-2) outline-none cursor-pointer"
                                    value={newLink.url}
                                    onChange={(e) => {
                                        const selected = rawLinks.find(
                                            (l) => l.url === e.target.value,
                                        );
                                        setNewLink({
                                            ...newLink,
                                            url: e.target.value,
                                            title:
                                                newLink.title ||
                                                (selected
                                                    ? selected.title
                                                    : ""),
                                        });
                                    }}
                                >
                                    {rawLinks.map((link) => (
                                        <option key={link.id} value={link.url}>
                                            {link.title}
                                        </option>
                                    ))}
                                </select>
                                <div className="flex justify-between bg-(--surface-muted) p-2 rounded-2xl border border-(--border)">
                                    {[
                                        "text-(--accent)",
                                        "text-(--accent-2)",
                                        "text-(--ink)",
                                        "text-(--muted)",
                                    ].map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() =>
                                                setNewLink({
                                                    ...newLink,
                                                    color: c,
                                                })
                                            }
                                            className={`w-8 h-8 rounded-full border-2 border-white ${c.replace("text-", "bg-")} ${newLink.color === c ? "ring-2 ring-[color:var(--accent)]" : ""}`}
                                        />
                                    ))}
                                </div>
                                <button
                                    type="submit"
                                    className="w-full bg-(--accent) text-white font-bold text-xs uppercase tracking-widest py-3 rounded-2xl hover:bg-[#92400e] transition-all"
                                >
                                    Save
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuickActions;
