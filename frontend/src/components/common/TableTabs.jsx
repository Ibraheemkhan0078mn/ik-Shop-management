import { useSelector } from "react-redux";
import { NavLink, useLocation } from "react-router-dom";

export default function TabsMenu({ tabs, matchPrefix }) {
    const { pathname } = useLocation();
    const currentUser = useSelector((state) => state.auth.user);
    const permissions = currentUser?.permissions || {};

    const filteredTabs = tabs.filter(
        (tab) => !tab.permission || permissions[tab.permission] === true,
    );

    return (
        <div className="flex flex-wrap gap-3">
            {filteredTabs.map((tab, idx) => {
                const isActive = matchPrefix
                    ? pathname.startsWith(tab.url)
                    : pathname === tab.url;

                return (
                    <NavLink
                        key={idx}
                        to={tab.url}
                        end={!matchPrefix}
                        className={`tab-item ${isActive ? "tab-active" : "tab-inactive"}`}
                    >
                        <span className="whitespace-nowrap">{tab.name}</span>

                        {tab.count > 0 && (
                            <span
                                className={`tab-count ${
                                    isActive
                                        ? "tab-count-active"
                                        : "tab-count-inactive"
                                }`}
                            >
                                {tab.count}
                            </span>
                        )}

                        {/* Active underline animation */}
                        {isActive && (
                            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-(--accent-2) rounded-full animate-slide-in"></span>
                        )}
                    </NavLink>
                );
            })}
        </div>
    );
}
