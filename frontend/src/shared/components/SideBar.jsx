// src/components/Sidebar.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ChevronDown, ChevronRight, LogOut, Settings, Menu, X } from "lucide-react";
import { useSelector } from "react-redux";
import { useLogout } from "../../modules/auth/services/auth.service.js";
import { useSettings } from "../../modules/settings/hooks/useSettings.js";
import logo from "../assets/logo.png";
import { sidebarData } from "../data/sidebar.js";
import { useGetSettingsQuery } from "../../modules/settings/api/settings.api.js";
import { hasPermission } from "../utilities/permissions.js";

const PERMISSION_MAP = {
  Sale:            p => hasPermission(p, "pos.view"),
  "Menu Manager":  p => hasPermission(p, "products.view"),
  "Stock & Expenses": p => hasPermission(p, "expenses.view"),
  Staff:           p => hasPermission(p, "staff.view"),
  "Sales History": p => hasPermission(p, "reports.view"),
  "Business Qarza":p => hasPermission(p, "accounts.view"),
  "Personal Qarza":p => hasPermission(p, "accounts.view"),
  "Hostel Orders": p => hasPermission(p, "accounts.view"),
  Dashboard:       p => hasPermission(p, "dashboard.view"),
};

export default function Sidebar() {
  const location  = useLocation();
  const logoutUser = useLogout();
  const { settings } = useSettings();
  const language = settings?.language || "en";
  const { permissions = [], role, id: userId } = useSelector(s => s.auth) ?? {};
  // const { data: settingsData } = useGetSettingsQuery(userId);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // const settings = settingsData?.data || {};
  const shopName = "Shop Manager";
  const shopImageUrl = settings?.shop?.imageUrl || "";
  const moduleVisibility = settings?.modules || {};

  const navItems = useMemo(() => sidebarData(language).navMain, [language]);

  const canAccess = item => {
    const check = PERMISSION_MAP[item.permissions];
    if (check) return check(permissions);
    if (item.id === "users") return hasPermission(permissions, "users.manage") || role === "admin";
    return true;
  };

  const isModuleVisible = item => {
    // Map item IDs to module keys
    const moduleKeyMap = {
      dashboard: "dashboard",
      pos: "pos",
      products: "products",
      purchases: "purchases",
      sales: "sales",
      customers: "customers",
      suppliers: "suppliers",
      expenses: "expenses",
      reports: "reports",
      accounts: "accounts",
      qarza: "qarza",
      staff: "staff",
      wastage: "wastage",
    };
    
    const moduleKey = moduleKeyMap[item.id];
    if (moduleKey && moduleVisibility.hasOwnProperty(moduleKey)) {
      return moduleVisibility[moduleKey];
    }
    return true;
  };

  const resolveActiveParent = () => {
    const match = navItems.find(item => {
      if (item.id === "dashboard") return location.pathname === "/" || location.pathname.startsWith("/dashboard");
      return item.items?.some(s => location.pathname.startsWith(s.url))
        || item.allowedUrls?.some(u => location.pathname.startsWith(u));
    });
    return match?.id ?? null;
  };

  const [activeId,    setActiveId]    = useState(resolveActiveParent);
  const [openGroups,  setOpenGroups]  = useState(() => {
    const id = resolveActiveParent();
    return id ? { [id]: true } : {};
  });

  useEffect(() => {
    const id = resolveActiveParent();
    if (!id) return;
    setActiveId(id);
    setOpenGroups(prev => ({ ...prev, [id]: true }));
  }, [location.pathname]);

  const toggleGroup = (item) => {
    if (!item.items?.length) return;
    setActiveId(item.id);
    setOpenGroups(prev => ({ ...prev, [item.id]: !prev[item.id] }));
  };

  const isRtl = language === "ur" || language === "ur_en";

  return (
    <aside
      className={`flex flex-col h-screen sticky top-0 z-50 transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
      style={{
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        boxShadow: "4px 0 24px rgba(64,45,28,0.07)",
      }}
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center gap-3 px-4 py-4 relative"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`absolute ${isRtl ? "left-2" : "right-2"} p-1.5 rounded-lg transition-colors`}
          style={{ color: "var(--muted)", background: "var(--surface-muted)" }}
          onMouseEnter={e => e.currentTarget.style.color = "var(--accent)"}
          onMouseLeave={e => e.currentTarget.style.color = "var(--muted)"}
        >
          {isCollapsed ? <Menu size={16} /> : <X size={16} />}
        </button>
        
        <div
          className={`w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shrink-0 ${
            isCollapsed ? "mx-auto" : ""
          }`}
          style={{ background: "var(--surface-muted)", border: "1px solid var(--border)" }}
        >
          {shopImageUrl ? (
            <img src={shopImageUrl} alt="Shop" className="w-full h-full object-cover" />
          ) : (
            <img src={logo} alt="logo" className="w-full h-full object-contain" />
          )}
        </div>
        {!isCollapsed && (
          <div className="leading-tight min-w-0">
            <p className="font-display text-sm font-bold truncate" style={{ color: "var(--accent)" }}>
              {shopName}
            </p>
            <p className="text-[11px] truncate" style={{ color: "var(--muted)" }}>
              {language === "ur" ? "آرڈرز سے اکاؤنٹس" : "Orders to accounts"}
            </p>
          </div>
        )}
      </div>

      {/* ── Nav ── */}
      <nav className={`flex-1 overflow-y-auto custom-scrollbar ${
        isCollapsed ? "px-2 py-3" : "px-2.5 py-3"
      }`}>
        {!isCollapsed && (
          <p
            className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: "var(--muted)" }}
          >
            {language === "ur" ? "مینو" : "Menu"}
          </p>
        )}

        <ul className="space-y-0.5">
          {navItems.filter(canAccess).filter(isModuleVisible).map(item => {
            const Icon       = item.icon;
            const hasChildren = !!item.items?.length;
            const isActive   = activeId === item.id;
            const isOpen     = hasChildren && !!openGroups[item.id];

            return (
              <li key={item.id}>
                <div
                  className="rounded-xl overflow-hidden transition-all duration-200"
                  style={isActive ? {
                    background: "rgba(15,118,110,0.06)",
                    border: "1px solid rgba(15,118,110,0.18)",
                  } : { border: "1px solid transparent" }}
                >
                  {/* Parent row */}
                  <div className="flex items-center">
                    <NavLink
                      to={item.url}
                      onClick={() => {
                        setActiveId(item.id);
                        if (hasChildren) setOpenGroups(p => ({ ...p, [item.id]: true }));
                      }}
                      className={`sidebar-item flex-1 min-w-0 ${isActive ? "sidebar-item-active" : ""} ${
                        isCollapsed ? "justify-center" : ""
                      }`}
                      title={isCollapsed ? item.title : ""}
                    >
                      {Icon && <Icon className={`shrink-0 ${isCollapsed ? "w-5 h-5" : "w-4 h-4"}`} />}
                      {!isCollapsed && <span className="truncate">{item.title}</span>}
                    </NavLink>

                    {!isCollapsed && hasChildren && (
                      <button
                        type="button"
                        onClick={() => toggleGroup(item)}
                        className="mr-2 p-1 rounded-lg transition-colors"
                        style={{ color: isActive ? "var(--accent-2)" : "var(--muted)" }}
                      >
                        {isOpen
                          ? <ChevronDown className="w-3.5 h-3.5" />
                          : <ChevronRight className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>

                  {/* Children */}
                  {!isCollapsed && hasChildren && isOpen && (
                    <ul className="pb-1. py-3 space-y-0.5" style={{ paddingInlineStart: "2rem", paddingInlineEnd: "0.5rem" }}>
                      {item.items.map(sub => {
                        const SubIcon   = sub.icon;
                        const isSubActive = location.pathname.startsWith(sub.url);
                        return (
                          <li key={sub.id ?? sub.title}>
                            <NavLink
                              to={sub.url}
                              onClick={() => setActiveId(item.id)}
                              className={`sidebar-item py-1.5 text-xs ${isSubActive ? "sidebar-item-active" : ""}`}
                            >
                              {SubIcon && <SubIcon className="w-3.5 h-3.5 shrink-0" />}
                              <span className="truncate">{sub.title}</span>
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

      {/* ── Footer ── */}
      <div
        className={`px-3 py-3 pb-6 flex items-center gap-2 ${
          isCollapsed ? "justify-center" : "justify-between"
        }`}
        style={{ borderTop: "1px solid var(--border)", background: "var(--surface-muted)" }}
      >
        {/* Shop Info - Left Side */}
        <div className={`flex items-center gap-2.5 min-w-0 ${isCollapsed ? "" : "flex-1"}`}>
          <div
            className="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center shrink-0"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            {shopImageUrl ? (
              <img src={shopImageUrl} alt="Shop" className="w-full h-full object-cover" />
            ) : (
              <img src={logo} alt="logo" className="w-full h-full object-contain" />
            )}
          </div>
          {!isCollapsed && (
            <div className="leading-tight min-w-0 flex-1">
              <p className="text-xs font-semibold truncate" style={{ color: "var(--accent)" }} title={shopName}>
                {shopName}
              </p>
            </div>
          )}
        </div>

        {/* Action Icons - Right Side */}
        <div className={`flex items-center gap-1.5 shrink-0 ${isCollapsed ? "flex-col gap-2" : ""}`}>
          <Link
            to="/settings"
            className="p-2 rounded-lg transition-all duration-200"
            style={{ color: "var(--muted)", border: "1px solid var(--border)" }}
            onMouseEnter={e => { e.currentTarget.style.color = "var(--accent-2)"; e.currentTarget.style.background = "var(--surface)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.background = "transparent"; }}
            title={isCollapsed ? (language === "ur" ? "سیٹنگز" : "Settings") : ""}
          >
            <Settings className="w-4 h-4" />
          </Link>

          <button
            onClick={logoutUser}
            className="p-2 rounded-lg transition-all duration-200"
            style={{ color: "var(--muted)", border: "1px solid var(--border)" }}
            onMouseEnter={e => { e.currentTarget.style.color = "var(--accent)"; e.currentTarget.style.background = "var(--surface)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.background = "transparent"; }}
            title={isCollapsed ? (language === "ur" ? "لاگ آؤٹ" : "Logout") : ""}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}







// import React, { useEffect, useMemo, useState } from "react";
// import { Link, NavLink, useLocation } from "react-router-dom";
// import { sidebarData } from "../data/sidebar";
// import { ChevronDown, ChevronRight, LogOut, Wrench } from "lucide-react";
// import logo from "../assets/logo.png";
// import { useSelector } from "react-redux";

// export default function Sidebar() {
//     const location = useLocation();
//     const currentUser = useSelector((state) => state.auth);

//     const permissions = currentUser?.permissions || {};
//     const role = currentUser?.role || null;
//     const language = currentUser?.language || "en";
//     const sidebarList = useMemo(() => sidebarData(language), [language]);

//     const handleLogout = async () => {
//         // await logout();
//     };

//     const canAccess = (item) => {
//         switch (item.permissions) {
//             case "Sale":
//                 return permissions.pos;
//             case "Menu Manager":
//                 return permissions.menuItems;
//             case "Stock & Expenses":
//                 return permissions.foodExpenses || permissions.otherExpenses;
//             case "Staff":
//                 return permissions.staff;
//             case "Sales History":
//                 return permissions.ordersPage;
//             case "Business Qarza":
//                 return permissions.qarza;
//             case "Personal Qarza":
//                 return permissions.personalQarza;
//             case "Hostel Orders":
//                 return (
//                     permissions.hostelQarza ||
//                     permissions.hostelOrders ||
//                     permissions.hostelPos
//                 );
//             case "App Users":
//                 return permissions.manageUsers || role === "admin";
//             case "Dashboard":
//                 return permissions.dashboard;
//             default:
//                 return true;
//         }
//     };

//     const getActiveParentId = () => {
//         const current = sidebarList.navMain.find((item) => {
//             if (item.id === "Dashboard") return location.pathname === "/";
//             const hasActiveChild = item.items?.some((subItem) =>
//                 location.pathname.startsWith(subItem.url)
//             );
//             if (hasActiveChild) return true;
//             return item.allowedUrls?.some((url) =>
//                 location.pathname.startsWith(url)
//             );
//         });
//         return current?.id || "/";
//     };

//     const [selected, setSelected] = useState(getActiveParentId());
//     const [openGroups, setOpenGroups] = useState({});

//     useEffect(() => {
//         const activeParentId = getActiveParentId();
//         setSelected(activeParentId);

//         if (activeParentId && activeParentId !== "/") {
//             setOpenGroups((prev) => ({
//                 ...prev,
//                 [activeParentId]: true,
//             }));
//         }
//     }, [location.pathname, sidebarList.navMain]);

//     const toggleGroup = (item) => {
//         if (!item.items?.length) return;
//         setSelected(item.id);
//         setOpenGroups((prev) => {
//             const isOpen = !!prev[item.id];
//             const next = { ...prev };
//             next[item.id] = !isOpen;
//             return next;
//         });
//     };

//     return (
//         <aside className="flex flex-col w-64 h-screen sticky top-0 bg-(--surface) shadow-[0_18px_50px_rgba(64,45,28,0.12)] border-r border-(--border) z-50">
//             <div className="px-4 py-4 border-b border-(--border)">
//                 <div className="flex items-center gap-3">
//                     <img
//                         src={logo}
//                         alt="Shop Manager logo"
//                         className="h-14 w-14 rounded-full object-contain"
//                     />
//                     <div className="leading-tight">
//                         <h3 className="text-lg font-semibold text-(--accent) font-display">
//                             Shop-Manager
//                         </h3>
//                         <p className="text-xs text-(--muted)">
//                             Orders to accounts easy
//                         </p>
//                     </div>
//                 </div>
//             </div>

//             <nav className="flex-1 overflow-y-auto px-3 py-3">
//                 <ul className="space-y-1.5">
//                     {sidebarList.navMain.filter(canAccess).map((item) => {
//                         const Icon = item.icon;
//                         const hasChildren = item.items?.length > 0;
//                         const isActive = selected === item.id;
//                         const isExpanded = hasChildren ? Boolean(openGroups[item.id]) : false;

//                         return (
//                             <li key={item.id} className="mt-1">
//                                 <div className={`rounded-xl border transition-all ${isActive ? "border-(--accent-2)/30 bg-(--surface-muted) shadow-sm" : "border-transparent hover:bg-(--surface-muted)"}`}>
//                                     <div className="flex items-center">
//                                         <NavLink
//                                             to={item.url}
//                                             onClick={() => {
//                                                 setSelected(item.id);
//                                                 if (hasChildren) {
//                                                     setOpenGroups((prev) => ({
//                                                         ...prev,
//                                                         [item.id]: true,
//                                                     }));
//                                                 }
//                                             }}
//                                             className={`sidebar-item flex-1 ${isActive ? "sidebar-item-active" : ""}`}
//                                         >
//                                             {Icon && <Icon />}
//                                             <span>{item.title}</span>
//                                         </NavLink>

//                                         {hasChildren && (
//                                             <button
//                                                 type="button"
//                                                 onClick={() => toggleGroup(item)}
//                                                 className="mr-2 rounded-md p-1.5 text-(--muted) transition hover:bg-(--accent-2)/10 hover:text-(--accent-2)"
//                                             >
//                                                 {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
//                                             </button>
//                                         )}
//                                     </div>

//                                     {hasChildren && isExpanded && (
//                                         <ul className="pb-2 pl-8 pr-2 space-y-1">
//                                             {item.items.map((sub) => {
//                                                 const SubIcon = sub.icon;
//                                                 const isSubActive = location.pathname.startsWith(sub.url);

//                                                 return (
//                                                     <li key={sub.id || sub.title}>
//                                                         <NavLink
//                                                             to={sub.url}
//                                                             className={`sidebar-item py-1.5 ${isSubActive ? "sidebar-item-active" : ""}`}
//                                                             onClick={() => setSelected(item.id)}
//                                                         >
//                                                             {SubIcon && <SubIcon className="h-4 w-4" />}
//                                                             <span>{sub.title}</span>
//                                                         </NavLink>
//                                                     </li>
//                                                 );
//                                             })}
//                                         </ul>
//                                     )}
//                                 </div>
//                             </li>
//                         );
//                     })}
//                 </ul>
//             </nav>

//             <div className="border-t border-(--border) p-2 flex justify-between gap-2">
//                 <button
//                     onClick={handleLogout}
//                     className="flex items-center gap-2 px-3 py-2 text-(--ink) hover:text-(--accent) hover:bg-(--surface-muted) rounded-xl transition"
//                 >
//                     <LogOut className="w-4 h-4" />
//                     {language === "en" ? "Logout" : "لاگ آؤٹ"}
//                 </button>

//                 <Link
//                     to={"/settings/generals"}
//                     className="flex items-center gap-2 px-3 py-2 text-(--ink) hover:text-(--ink) hover:bg-(--surface-muted) rounded-xl transition"
//                 >
//                     <Wrench className="w-4 h-4" />
//                     {language === "en" ? "Settings" : "سیٹنگز"}
//                 </Link>
//             </div>
//         </aside>
//     );
// }
