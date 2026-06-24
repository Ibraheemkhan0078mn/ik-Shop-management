import React, { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { sidebarData } from "../data/sidebar";
import { ChevronDown, ChevronRight, LogOut, Wrench } from "lucide-react";
import logo from "../assets/logo.png";
import { useSelector } from "react-redux";

export default function Sidebar() {
    const location = useLocation();
    const currentUser = useSelector((state) => state.auth);

    const permissions = currentUser?.permissions || {};
    const role = currentUser?.role || null;
    const language = currentUser?.language || "en";
    const sidebarList = useMemo(() => sidebarData(language), [language]);

    const handleLogout = async () => {
        // await logout();
    };

    const canAccess = (item) => {
        switch (item.permissions) {
            case "Sale":
                return permissions.pos;
            case "Menu Manager":
                return permissions.menuItems;
            case "Stock & Expenses":
                return permissions.foodExpenses || permissions.otherExpenses;
            case "Staff":
                return permissions.staff;
            case "Sales History":
                return permissions.ordersPage;
            case "Business Qarza":
                return permissions.qarza;
            case "Personal Qarza":
                return permissions.personalQarza;
            case "Hostel Orders":
                return (
                    permissions.hostelQarza ||
                    permissions.hostelOrders ||
                    permissions.hostelPos
                );
            case "App Users":
                return permissions.manageUsers || role === "admin";
            case "Dashboard":
                return permissions.dashboard;
            default:
                return true;
        }
    };

    const getActiveParentId = () => {
        const current = sidebarList.navMain.find((item) => {
            if (item.id === "Dashboard") return location.pathname === "/";
            const hasActiveChild = item.items?.some((subItem) =>
                location.pathname.startsWith(subItem.url)
            );
            if (hasActiveChild) return true;
            return item.allowedUrls?.some((url) =>
                location.pathname.startsWith(url)
            );
        });
        return current?.id || "/";
    };

    const [selected, setSelected] = useState(getActiveParentId());
    const [openGroups, setOpenGroups] = useState({});

    useEffect(() => {
        const activeParentId = getActiveParentId();
        setSelected(activeParentId);

        if (activeParentId && activeParentId !== "/") {
            setOpenGroups((prev) => ({
                ...prev,
                [activeParentId]: true,
            }));
        }
    }, [location.pathname, sidebarList.navMain]);

    const toggleGroup = (item) => {
        if (!item.items?.length) return;
        setSelected(item.id);
        setOpenGroups((prev) => {
            const isOpen = !!prev[item.id];
            const next = { ...prev };
            next[item.id] = !isOpen;
            return next;
        });
    };

    return (
        <aside className="flex flex-col w-64 h-screen sticky top-0 bg-(--surface) shadow-[0_18px_50px_rgba(64,45,28,0.12)] border-r border-(--border) z-50">
            <div className="px-4 py-4 border-b border-(--border)">
                <div className="flex items-center gap-3">
                    <img
                        src={logo}
                        alt="Shop Manager logo"
                        className="h-14 w-14 rounded-full object-contain"
                    />
                    <div className="leading-tight">
                        <h3 className="text-lg font-semibold text-(--accent) font-display">
                            Shop-Manager
                        </h3>
                        <p className="text-xs text-(--muted)">
                            Orders to accounts easy
                        </p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-3">
                <ul className="space-y-1.5">
                    {sidebarList.navMain.filter(canAccess).map((item) => {
                        const Icon = item.icon;
                        const hasChildren = item.items?.length > 0;
                        const isActive = selected === item.id;
                        const isExpanded = hasChildren ? Boolean(openGroups[item.id]) : false;

                        return (
                            <li key={item.id} className="mt-1">
                                <div className={`rounded-xl border transition-all ${isActive ? "border-(--accent-2)/30 bg-(--surface-muted) shadow-sm" : "border-transparent hover:bg-(--surface-muted)"}`}>
                                    <div className="flex items-center">
                                        <NavLink
                                            to={item.url}
                                            onClick={() => {
                                                setSelected(item.id);
                                                if (hasChildren) {
                                                    setOpenGroups((prev) => ({
                                                        ...prev,
                                                        [item.id]: true,
                                                    }));
                                                }
                                            }}
                                            className={`sidebar-item flex-1 ${isActive ? "sidebar-item-active" : ""}`}
                                        >
                                            {Icon && <Icon />}
                                            <span>{item.title}</span>
                                        </NavLink>

                                        {hasChildren && (
                                            <button
                                                type="button"
                                                onClick={() => toggleGroup(item)}
                                                className="mr-2 rounded-md p-1.5 text-(--muted) transition hover:bg-(--accent-2)/10 hover:text-(--accent-2)"
                                            >
                                                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                            </button>
                                        )}
                                    </div>

                                    {hasChildren && isExpanded && (
                                        <ul className="pb-2 pl-8 pr-2 space-y-1">
                                            {item.items.map((sub) => {
                                                const SubIcon = sub.icon;
                                                const isSubActive = location.pathname.startsWith(sub.url);

                                                return (
                                                    <li key={sub.id || sub.title}>
                                                        <NavLink
                                                            to={sub.url}
                                                            className={`sidebar-item py-1.5 ${isSubActive ? "sidebar-item-active" : ""}`}
                                                            onClick={() => setSelected(item.id)}
                                                        >
                                                            {SubIcon && <SubIcon className="h-4 w-4" />}
                                                            <span>{sub.title}</span>
                                                        </NavLink>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <div className="border-t border-(--border) p-2 flex justify-between gap-2">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-2 text-(--ink) hover:text-(--accent) hover:bg-(--surface-muted) rounded-xl transition"
                >
                    <LogOut className="w-4 h-4" />
                    {language === "en" ? "Logout" : "لاگ آؤٹ"}
                </button>

                <Link
                    to={"/settings/generals"}
                    className="flex items-center gap-2 px-3 py-2 text-(--ink) hover:text-(--ink) hover:bg-(--surface-muted) rounded-xl transition"
                >
                    <Wrench className="w-4 h-4" />
                    {language === "en" ? "Settings" : "سیٹنگز"}
                </Link>
            </div>
        </aside>
    );
}
