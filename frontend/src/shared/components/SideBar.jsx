import React, { useState, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { sidebarData } from "../data/sidebar";
import { LogOut, Wrench } from "lucide-react";
import logo from "@shared/assets/logo.png";
import { useSelector } from "react-redux";

export default function Sidebar() {
    const location = useLocation();
    const [openSetting, setOpenSetting] = useState(false);

    const currentUser = useSelector(state => state.auth);
    // const { mutateAsync: logout } = useLogout();

    const permissions = currentUser?.permissions || {};
    const role = currentUser?.role || null;
    const language = currentUser?.language || "en";
    const sidebarList = sidebarData(language);

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
            return item.allowedUrls?.some((url) =>
                location.pathname.startsWith(url)
            );
        });
        return current?.id || "/";
    };

    const [selected, setSelected] = useState(getActiveParentId());

    useEffect(() => {
        setSelected(getActiveParentId());
    }, [location.pathname]);

    return (
        <>
            <aside className="flex flex-col w-64 justify-center items-center h-screen sticky top-0 bg-(--surface) shadow-[0_18px_50px_rgba(64,45,28,0.12)] border-r border-(--border) z-50">
                <div className="relative mt-5 flex flex-row  gap-3 px-4 py-3 ">
                    <img
                        src={logo}
                        alt="Chai Fi logo"
                        className="absolute -top-0 left-0 h-19 w-19 rounded-full object-contain"
                    />
                    <div className="leading-tight ml-12">
                        <h3 className="text-lg font-semibold text-(--accent) font-display">
                            Shop-Manager
                        </h3>
                        <p className="text-xs text-(--muted)">
                            Orders to accounts easy
                        </p>
                    </div>
                </div>
                <nav className="flex-1 overflow-y-auto p-4">
                    <ul className="space-y-2">
                        {sidebarList.navMain.filter(canAccess).map((item) => {
                            const Icon = item.icon;
                            const isActive = selected === item.id;

                            return (
                                <li key={item.id}>
                                    <NavLink
                                        to={item.url}
                                        onClick={() => setSelected(item.id)}
                                        className={`sidebar-item ${isActive ? "sidebar-item-active" : ""}`}
                                    >
                                        {Icon && <Icon />}
                                        <span>{item.title}</span>
                                    </NavLink>

                                    {item.items?.length > 0 && (
                                        <ul className="mt-0.6 ml-6 space-y-1">
                                            {item.items.map((sub) => {
                                                const SubIcon = sub.icon;
                                                const isSubActive =
                                                    location.pathname.startsWith(
                                                        sub.url
                                                    );


                                                return (
                                                    <li
                                                        key={
                                                            sub.id || sub.title
                                                        }
                                                    >
                                                        <NavLink
                                                            to={sub.url}
                                                            className={`sidebar-item  ${isSubActive ? "sidebar-item-active" : ""}`}
                                                            onClick={() =>
                                                                setSelected(
                                                                    item.id
                                                                )
                                                            }
                                                        >
                                                            {SubIcon && (
                                                                <SubIcon className="w-4 h-4 " />
                                                            )}
                                                            <span>
                                                                {sub.title}
                                                            </span>
                                                        </NavLink>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <div className="p-2 border-t border-(--border) flex justify-between gap-2">
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

            {openSetting && (
                <SettingsModel onClose={() => setOpenSetting(false)} />
            )}
        </>
    );
}
