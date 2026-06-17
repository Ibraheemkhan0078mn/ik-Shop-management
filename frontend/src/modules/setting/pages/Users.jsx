import React, { useEffect, useState } from "react";
import api from "@shared/services/api";
import {
    Pencil,
    Trash2,
    Plus,
    Search,
    User,
    Briefcase,
    CalendarDays,
    X,
} from "lucide-react";
import { useSelector } from "react-redux";
import { showError } from "@shared/utilities/toastHelpers";

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);

    const loggedInUser = useSelector((state) => state.auth.user);
    const language = useSelector((state) => state.auth.user?.language || "en");

    const permsList = [
        "dashboard",
        "pos",
        "ordersPage",
        "deleteOrders",
        "editOrders",

        // Menu
        "menuItems",
        "menuItemsEdit",
        "menuItemsDelete",

        // Food Expenses
        "foodExpenses",
        "foodExpensesEdit",
        "foodExpensesDelete",

        // Other Expenses
        "otherExpenses",
        "otherExpensesEdit",
        "otherExpensesDelete",

        // Staff
        "staff",
        "staffEdit",
        "staffDelete",
        "staffOrdersEdit", // added
        "staffOrdersDelete", // added

        // Staff Expenses
        "staffExpenses",
        "staffExpensesEdit",
        "staffExpensesDelete",

        // Staff Salaries
        "staffSalaries",
        "staffSalariesEdit",
        "staffSalariesDelete",

        // Business Qarza
        "qarza",
        "qarzaEdit",
        "qarzaDelete",

        // Personal Qarza
        "personalQarza",
        "personalQarzaEdit",
        "personalQarzaDelete",

        // Hostel Qarza
        "hostelQarza",
        "hostelQarzaEdit",
        "hostelQarzaDelete",

        // Hostel POS & Orders
        "hostelPos",
        "hostelOrders",
        "hostelOrdersEdit", // added
        "hostelOrdersDelete", // added

        // Gym
        "gymPos",
        "gymOrders",
        "gymOrdersEdit", // added
        "gymOrdersDelete", // added
        "gymQarza",
        "gymQarzaEdit",
        "gymQarzaDelete",
    ];

    const permLabels = {
        dashboard: language === "en" ? "Dashboard" : "ڈیش بورڈ",

        // POS & Sales
        pos: language === "en" ? "Sale Page" : "سیلز صفحہ",
        ordersPage:
            language === "en"
                ? "Sales History Page"
                : "فروخت کے ریکارڈ کا صفحہ",
        deleteOrders: language === "en" ? "Delete Orders" : "آرڈرز حذف کریں",
        editOrders: language === "en" ? "Edit Orders" : "آرڈرز میں ترمیم کریں",

        // Menu
        menuItems:
            language === "en" ? "Menu Manager Page" : "مینو آئٹمز مینیجر صفحہ",
        menuItemsEdit:
            language === "en" ? "Edit Menu Items" : "مینو آئٹمز میں ترمیم کریں",
        menuItemsDelete:
            language === "en" ? "Delete Menu Items" : "مینو آئٹمز حذف کریں",

        // Food Expenses
        foodExpenses: language === "en" ? "Food Expenses" : "خوراک کے اخراجات",
        foodExpensesEdit:
            language === "en"
                ? "Edit Food Expenses"
                : "خوراک کے اخراجات میں ترمیم",
        foodExpensesDelete:
            language === "en"
                ? "Delete Food Expenses"
                : "خوراک کے اخراجات حذف کریں",

        // Other Expenses
        otherExpenses: language === "en" ? "Other Expenses" : "دیگر اخراجات",
        otherExpensesEdit:
            language === "en"
                ? "Edit Other Expenses"
                : "دیگر اخراجات میں ترمیم",
        otherExpensesDelete:
            language === "en"
                ? "Delete Other Expenses"
                : "دیگر اخراجات حذف کریں",

        // Staff
        staff: language === "en" ? "Staff Page" : "سٹاف صفحہ",
        staffEdit: language === "en" ? "Edit Staff" : "سٹاف میں ترمیم کریں",
        staffDelete: language === "en" ? "Delete Staff" : "سٹاف حذف کریں",
        staffOrdersEdit:
            language === "en"
                ? "Edit Staff Orders"
                : "سٹاف آرڈرز میں ترمیم کریں",
        staffOrdersDelete:
            language === "en" ? "Delete Staff Orders" : "سٹاف آرڈرز حذف کریں",

        // Staff Expenses
        staffExpenses: language === "en" ? "Staff Expenses" : "سٹاف اخراجات",
        staffExpensesEdit:
            language === "en"
                ? "Edit Staff Expenses"
                : "سٹاف اخراجات میں ترمیم",
        staffExpensesDelete:
            language === "en"
                ? "Delete Staff Expenses"
                : "سٹاف اخراجات حذف کریں",

        // Staff Salaries
        staffSalaries: language === "en" ? "Staff Salaries" : "سٹاف تنخواہیں",
        staffSalariesEdit:
            language === "en" ? "Edit Salaries" : "تنخواہوں میں ترمیم کریں",
        staffSalariesDelete:
            language === "en" ? "Delete Salaries" : "تنخواہیں حذف کریں",

        // Business Qarza
        qarza: language === "en" ? "Business Qarza" : "کاروباری قرضہ",
        qarzaEdit:
            language === "en"
                ? "Edit Business Qarza"
                : "کاروباری قرضہ میں ترمیم",
        qarzaDelete:
            language === "en"
                ? "Delete Business Qarza"
                : "کاروباری قرضہ حذف کریں",

        // Personal Qarza
        personalQarza: language === "en" ? "Personal Qarza" : "ذاتی قرضہ",
        personalQarzaEdit:
            language === "en" ? "Edit Personal Qarza" : "ذاتی قرضہ میں ترمیم",
        personalQarzaDelete:
            language === "en" ? "Delete Personal Qarza" : "ذاتی قرضہ حذف کریں",

        // Hostel POS & Orders
        hostelPos: language === "en" ? "Hostel Sale Page" : "ہاسٹل سیلز صفحہ",
        hostelOrders:
            language === "en"
                ? "Hostel Sales History"
                : "ہاسٹل آرڈرز کا ریکارڈ",
        hostelOrdersEdit:
            language === "en"
                ? "Edit Hostel Orders"
                : "ہاسٹل آرڈرز میں ترمیم کریں",
        hostelOrdersDelete:
            language === "en" ? "Delete Hostel Orders" : "ہاسٹل آرڈرز حذف کریں",
        hostelQarza: language === "en" ? "Hostel Qarza" : "ہاسٹل قرضہ",
        hostelQarzaEdit:
            language === "en" ? "Edit Hostel Qarza" : "ہاسٹل قرضہ میں ترمیم",
        hostelQarzaDelete:
            language === "en" ? "Delete Hostel Qarza" : "ہاسٹل قرضہ حذف کریں",

        // Gym
        gymPos: language === "en" ? "Gym Sale Page" : "جم سیلز صفحہ",
        gymOrders:
            language === "en" ? "Gym Sales History" : "جم آرڈرز کا ریکارڈ",
        gymOrdersEdit:
            language === "en" ? "Edit Gym Orders" : "جم آرڈرز میں ترمیم کریں",
        gymOrdersDelete:
            language === "en" ? "Delete Gym Orders" : "جم آرڈرز حذف کریں",
        gymQarza: language === "en" ? "Gym Qarza" : "جم قرضہ",
        gymQarzaEdit:
            language === "en" ? "Edit Gym Qarza" : "جم قرضہ میں ترمیم",
        gymQarzaDelete:
            language === "en" ? "Delete Gym Qarza" : "جم قرضہ حذف کریں",
    };

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await api.get("/users");
            setUsers(res?.data?.data?.users || []);
        } catch (err) {
            console.error("fetchUsers error", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const openCreate = () => {
        setEditing(null);
        setModalOpen(true);
    };
    const openEdit = (u) => {
        setEditing(u);
        setModalOpen(true);
    };

    const handleDelete = async (u) => {
        if (!loggedInUser || loggedInUser.role !== "admin") return;

        try {
            await api.delete(`/users/${u._id}`);
            fetchUsers();
        } catch (err) {
            console.error("delete user error", err);
            showError(
                err?.response?.data?.message ||
                    (language === "en" ? "Delete failed" : "حذف ناکام"),
            );
        }
    };

    const handleSubmit = async (form) => {
        try {
            if (editing) {
                await api.put(`/users/${editing._id}`, form);
            } else {
                await api.post(`/users`, form);
            }
            setModalOpen(false);
            setEditing(null);
            fetchUsers();
            // window.location.reload();
        } catch (err) {
            console.error("save user error", err);
            showError(
                err?.response?.data?.message ||
                    (language === "en" ? "Save failed" : "محفوظ کرنا ناکام"),
            );
        }
    };

    const filtered = users.filter(
        (u) =>
            u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    return (
        <div className="space-y-6 bg-(--surface) rounded-3xl p-6 border border-(--border) shadow-[0_18px_50px_rgba(64,45,28,0.12)] max-h-[80vh] h-[80vh] overflow-y-auto">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 w-full ">
                <div className="flex flex-col gap-2 w-full">
                    <div className="flex gap-2 w-full items-center">
                        {/* Add Button */}
                        {loggedInUser?.role === "admin" && (
                            <button
                                onClick={openCreate}
                                className="btn-add shrink-0"
                                title={
                                    language === "en"
                                        ? "Add Account"
                                        : "اکاؤنٹ شامل کریں"
                                }
                            >
                                <Plus className="w-4 h-4" />{" "}
                                {language === "en"
                                    ? "Create User Account"
                                    : "صارف اکاؤنٹ بنائیں"}
                            </button>
                        )}

                        {/* Search Input - Full Width */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--muted) pointer-events-none" />
                            <input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder={
                                    language === "en"
                                        ? "Search users..."
                                        : "...صارف تلاش کریں"
                                }
                                className="input-search w-full"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-3">
                {loading ? (
                    <div>
                        {language === "en" ? "Loading..." : "لوڈ ہو رہا ہے..."}
                    </div>
                ) : filtered.length > 0 ? (
                    filtered.map((u) => (
                        <div
                            key={u._id}
                            className="bg-(--surface) rounded-3xl shadow-[0_14px_30px_rgba(64,45,28,0.10)] p-5 flex flex-col hover:shadow-[0_18px_40px_rgba(64,45,28,0.16)] transition w-full sm:w-[300px] md:w-[320px] overflow-hidden"
                        >
                            <div className="flex items-center justify-between gap-2 mb-3">
                                <h2 className="text-lg font-semibold text-(--ink) wrap-break-word capitalize">
                                    {u.name}
                                </h2>

                                <div className="flex flex-col gap-1">
                                    {/* Role badge */}
                                    <span
                                        className={`text-xs font-medium px-2.5 py-1 rounded-full
      ${
          u.role === "admin"
              ? "bg-(--surface-muted) text-(--accent-2) border border-(--border)"
              : u.role === "manager"
                ? "bg-violet-50 text-violet-700 border border-violet-200"
                : u.role === "staff"
                  ? "bg-(--accent-2)/12 text-(--accent-2) border border-(--accent-2)/30"
                  : "bg-(--surface-muted) text-(--ink) border border-(--border)"
      }
    `}
                                    >
                                        {u.role?.toUpperCase()}
                                    </span>

                                    {/* Disabled badge */}
                                    {!u.isActive && (
                                        <span className="text-xs px-2 py-1 bg-rose-100 text-rose-700 rounded-full border border-rose-200">
                                            {language === "en"
                                                ? "Disabled"
                                                : "غیر فعال"}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3 text-(--muted) text-sm flex-1">
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-(--muted)" />
                                    <span className="font-medium text-(--ink)">
                                        {language === "en"
                                            ? "Email:"
                                            : "ای میل:"}
                                    </span>
                                    <span className="wrap-break-word">
                                        {u.email}
                                    </span>
                                </div>

                                <div>
                                    <div className="font-medium text-(--ink) mb-1 flex items-center gap-2">
                                        <Briefcase className="w-4 h-4 text-(--muted)" />{" "}
                                        {language === "en"
                                            ? "Permissions:"
                                            : "اجازتیں:"}
                                    </div>

                                    <div className="flex flex-wrap gap-1">
                                        {u.permissions &&
                                            Object.keys(u.permissions).map(
                                                (key) =>
                                                    u.permissions[key] ? (
                                                        <span
                                                            key={key}
                                                            className="text-xs p-1 bg-(--surface-muted) rounded"
                                                        >
                                                            {permLabels[key] ||
                                                                key}
                                                        </span>
                                                    ) : null,
                                            )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 flex justify-between gap-2 border-t border-(--border) pt-2 text-xs">
                                <div className="flex items-center gap-2 text-xs">
                                    <CalendarDays className="w-4 h-4 text-(--muted)" />
                                    <span>
                                        {new Date(u.date).toLocaleString()}
                                    </span>
                                </div>

                                {loggedInUser?.role === "admin" && (
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => openEdit(u)}
                                            className="flex items-center gap-1 px-2 py-0.5 rounded-xl text-xs text-(--ink) border border-(--border) hover:text-(--accent-2) hover:border-(--accent-2) transition"
                                        >
                                            <Pencil className="w-3 h-3" />
                                            {language === "en"
                                                ? "Edit"
                                                : "بدلیں"}
                                        </button>

                                        <button
                                            onClick={() => handleDelete(u)}
                                            className="flex items-center gap-1 px-2 py-0.5 rounded-xl text-xs text-(--ink) border border-(--border) hover:text-rose-600 hover:border-rose-300 transition"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                            {language === "en"
                                                ? "Delete"
                                                : "مٹا دیں"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-(--muted) text-center col-span-full py-8">
                        {language === "en"
                            ? "No Users found."
                            : "کوئی صارف نہیں ملا۔"}
                    </p>
                )}
            </div>

            {modalOpen && (
                <UserModal
                    close={() => {
                        setModalOpen(false);
                        setEditing(null);
                    }}
                    onSubmit={handleSubmit}
                    initial={editing}
                    permsList={permsList}
                    permLabels={permLabels}
                    language={language}
                />
            )}
        </div>
    );
}

function UserModal({
    close,
    onSubmit,
    initial = null,
    permsList = [],
    permLabels = {},
    language = "en",
}) {
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        role: "staff",
        permissions: {},
        isActive: true,
    });

    useEffect(() => {
        if (initial) {
            setForm({
                name: initial.name || "",
                email: initial.email || "",
                password: "",
                role: initial.role || "staff",
                isActive:
                    typeof initial.isActive !== "undefined"
                        ? initial.isActive
                        : true,
                permissions: initial.permissions || {},
            });
        }
    }, [initial]);

    const handleChange = (k, v) => setForm((f) => ({ ...f, [k]: v }));
    const togglePerm = (p) =>
        setForm((f) => ({
            ...f,
            permissions: { ...f.permissions, [p]: !f.permissions[p] },
        }));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-(--surface) shadow-xl rounded-2xl w-full max-w-4xl max-h-[90vh]  overflow-y-auto p-6 border border-(--border)">
                <div className="flex justify-between items-center mb-5">
                    <h3 className="text-xl font-semibold text-(--ink)">
                        {initial
                            ? language === "en"
                                ? "Edit User"
                                : "صارف کو تبدیل کریں"
                            : language === "en"
                              ? "Create User"
                              : "صارف تخلیق کریں"}
                    </h3>
                    <button
                        onClick={close}
                        className="btn-close flex items-center gap-1 px-3 py-2"
                        title={language === "en" ? "Close" : "بند کریں"}
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-(--muted)">
                            {language === "en" ? "Name" : "نام"}
                        </label>
                        <input
                            value={form.name}
                            onChange={(e) =>
                                handleChange("name", e.target.value)
                            }
                            className="w-full border border-(--border) rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-(--accent-2) focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-(--muted)">
                            {language === "en" ? "Email" : "ای میل"}
                        </label>
                        <input
                            value={form.email}
                            onChange={(e) =>
                                handleChange("email", e.target.value)
                            }
                            className="w-full border border-(--border) rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-(--accent-2) focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-(--muted)">
                            {language === "en" ? "Password" : "پاسورڈ"}{" "}
                            {initial
                                ? `(${language === "en" ? "leave blank" : "خالی چھوڑیں"})`
                                : ""}
                        </label>
                        <input
                            value={form.password}
                            type="password"
                            onChange={(e) =>
                                handleChange("password", e.target.value)
                            }
                            className="w-full border border-(--border) rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-(--accent-2) focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-(--muted)">
                            {language === "en" ? "Role" : "کردار"}
                        </label>
                        <select
                            value={form.role}
                            onChange={(e) =>
                                handleChange("role", e.target.value)
                            }
                            className="w-full border border-(--border) rounded-xl px-3 py-2 text-sm bg-(--surface) focus:ring-2 focus:ring-(--accent-2) focus:outline-none"
                        >
                            {/* <option value="admin">{language === "en" ? "Admin" : "ایڈمن"}</option> */}
                            <option value="staff">
                                {language === "en" ? "Staff" : "سٹاف"}
                            </option>
                            <option value="manager">
                                {language === "en" ? "Manager" : "منیجر"}
                            </option>
                        </select>
                    </div>
                </div>

                <div className="mt-5 ">
                    <label className="text-sm font-medium text-(--ink)">
                        {language === "en" ? "Permissions" : "اجازتیں"}
                    </label>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {permsList.map((p) => (
                            <label
                                key={p}
                                className="
                                    flex items-center justify-between 
                                    gap-2 text-sm 
                                    bg-(--surface-muted) 
                                    px-3 py-2 
                                    rounded-xl 
                                    border border-(--border) 
                                    hover:bg-(--surface-muted) 
                                    cursor-pointer 
                                    transition
                                    min-w-[200px] 
                                    max-w-[200px]
                                    overflow-hidden 
                                    whitespace-nowrap 
                                    text-ellipsis
                                "
                            >
                                <span className="text-(--ink)">
                                    {permLabels[p]}
                                </span>
                                <input
                                    type="checkbox"
                                    checked={!!form.permissions[p]}
                                    onChange={() => togglePerm(p)}
                                />
                            </label>
                        ))}
                    </div>
                    <div className="mt-4">
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={form.isActive}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        isActive: e.target.checked,
                                    }))
                                }
                                className="w-4 h-4"
                            />
                            <span className="text-sm text-(--ink)">
                                {language === "en"
                                    ? "Active Account"
                                    : "فعال اکاؤنٹ"}
                            </span>
                        </label>
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        onClick={close}
                        className="px-4 py-2 border border-(--border) rounded-xl text-(--muted) hover:bg-(--surface-muted) transition"
                    >
                        {language === "en" ? "Cancel" : "منسوخ کریں"}
                    </button>

                    <button
                        onClick={() => onSubmit(form)}
                        className="px-4 py-2 bg-(--accent-2) hover:bg-[#0b5f59] text-white rounded-xl shadow-[0_14px_30px_rgba(64,45,28,0.10)] transition"
                    >
                        {language === "en" ? "Save" : "محفوظ کریں"}
                    </button>
                </div>
            </div>
        </div>
    );
}

