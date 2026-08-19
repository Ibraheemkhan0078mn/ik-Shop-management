import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Edit2, Trash2, Eye, Calendar, User, Briefcase, Filter } from "lucide-react";
import { toast } from "sonner";
import { useGetStaffListQuery, useDeleteStaffMutation, useGetStaffRolesQuery } from "../api/staff.api.js";
import { getStaffLabels } from "../labels/staffLabels.js";
import { useSettings } from "../../settings/hooks/useSettings.js";
import PaginatedList from "../../../shared/components/PaginatedList.jsx";
import PageHeading from "../../../shared/components/PageHeading.jsx";
import ScreenTabButton from "../../../shared/components/ScreenTabButton.jsx";
import { toImageUrl } from "../../../shared/utilities/image.utility.js";
import PermissionGuard from "../../../shared/components/PermissionGuard.jsx";
import StaffModal from "../components/StaffModal.jsx";
import BigViewImage from "../../../shared/components/BigViewImage.jsx";
import ConfirmDialog from "../../../shared/components/ConfirmationDialog.jsx";

const PlaceholderImg = ({ size = 9 }) => (
    <div className={`w-${size} h-${size} rounded-lg bg-(--surface-muted) flex items-center justify-center`}>
        <User className="w-4 h-4 text-(--muted)" strokeWidth={1.5} />
    </div>
);

export default function StaffList() {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [salaryTypeFilter, setSalaryTypeFilter] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("create");
    const [staffId, setStaffId] = useState(null);
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const paginatedListRef = useRef(null);

    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getStaffLabels(language);

    const { data: rolesData } = useGetStaffRolesQuery();
    const roles = rolesData?.data || [];
    const [deleteStaff] = useDeleteStaffMutation();

    const handleDelete = async (id) => {
        try {
            await deleteStaff(id).unwrap();
            toast.success(labels.staffDeleted);
            if (paginatedListRef.current) {
                paginatedListRef.current.refetch();
            }
        } catch (error) {
            toast.error(labels.failedToDelete);
        }
    };

    const handleOpenCreateModal = () => {
        setModalMode("create");
        setStaffId(null);
        setModalOpen(true);
    };

    const handleOpenEditModal = (id) => {
        setModalMode("update");
        setStaffId(id);
        setModalOpen(true);
    };

    const handleModalClose = () => {
        setModalOpen(false);
        setModalMode("create");
        setStaffId(null);
        if (paginatedListRef.current) {
            paginatedListRef.current.refetch();
        }
    };

    const handleClearFilters = () => {
        setSearch("");
        setRoleFilter("");
        setStatusFilter("");
        setSalaryTypeFilter("");
    };

    // Build filter object for PaginatedList
    const filters = {};
    if (search) filters.search = search;
    if (roleFilter) filters.role = roleFilter;
    if (statusFilter) filters.status = statusFilter;
    if (salaryTypeFilter) filters.salaryType = salaryTypeFilter;

    const hasActiveFilters = search || roleFilter || statusFilter || salaryTypeFilter;

    return (
        <div className="h-screen flex flex-col">
            <div className="flex-none">
                <PageHeading
                    heading={labels.staffManagement}
                    subheading={labels.manageStaff}
                    leftActions={
                        <>
                            <PermissionGuard 
                                execute={handleOpenCreateModal} 
                                permission="staff.create" 
                                isConfirmation={false}
                            >
                                <div>
                                    <ScreenTabButton lucideIcon={Plus} text={labels.addStaff} />
                                </div>
                            </PermissionGuard>
                            <PermissionGuard 
                                execute={() => navigate("/staff/role")} 
                                permission="staff.create" 
                                isConfirmation={false}
                            >
                                <div>
                                    <ScreenTabButton lucideIcon={Briefcase} text={language === "en" ? "Roles" : "کردار"} />
                                </div>
                            </PermissionGuard>
                            <PermissionGuard 
                                execute={() => navigate("/staff/attendance")} 
                                permission="staff.attendance" 
                                isConfirmation={false}
                            >
                                <div>
                                    <ScreenTabButton lucideIcon={Calendar} text={labels.markAttendance} />
                                </div>
                            </PermissionGuard>
                        </>
                    }
                    rightActions={
                        <div className="relative">
                            <button
                                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all duration-150 ${
                                    hasActiveFilters
                                        ? "border-(--accent-2) text-(--accent-2) bg-(--accent-2)/10"
                                        : "border-(--border) text-(--muted) bg-(--surface-muted) hover:border-(--accent-2) hover:text-(--accent-2)"
                                }`}
                            >
                                <Filter size={16} />
                                <span className="text-xs font-bold uppercase tracking-wider">
                                    {language === "en" ? "Filter" : "فلٹر"}
                                </span>
                                {hasActiveFilters && (
                                    <div className="w-2 h-2 rounded-full bg-(--accent-2)" />
                                )}
                            </button>

                            {/* Filter Dropdown */}
                            {showFilterDropdown && (
                                <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-(--border) bg-(--surface) shadow-xl z-50 p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-bold uppercase tracking-wider text-(--muted)">
                                            {language === "en" ? "Filter Staff" : "اسٹاف فلٹر کریں"}
                                        </span>
                                        {hasActiveFilters && (
                                            <button
                                                onClick={handleClearFilters}
                                                className="flex items-center gap-1 text-xs text-(--accent-2) hover:underline"
                                            >
                                                <Search size={12} />
                                                {language === "en" ? "Clear" : "صاف"}
                                            </button>
                                        )}
                                    </div>

                                    {/* Search Filter */}
                                    <div className="mb-3">
                                        <label className="block text-xs font-semibold mb-1.5 text-(--muted)">
                                            {labels.searchPlaceholder}
                                        </label>
                                        <input
                                            type="text"
                                            placeholder={labels.searchPlaceholder}
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className="w-full px-3 py-2 text-sm rounded-xl border-2 border-(--border) bg-(--surface-muted) outline-none focus:border-(--accent-2) transition-all"
                                        />
                                    </div>

                                    {/* Role Filter */}
                                    <div className="mb-3">
                                        <label className="block text-xs font-semibold mb-1.5 text-(--muted)">
                                            {labels.role}
                                        </label>
                                        <select
                                            value={roleFilter}
                                            onChange={(e) => setRoleFilter(e.target.value)}
                                            className="w-full px-3 py-2 text-sm rounded-xl border-2 border-(--border) bg-(--surface-muted) outline-none focus:border-(--accent-2) transition-all"
                                        >
                                            <option value="">{labels.allRoles}</option>
                                            {roles.map((role) => (
                                                <option key={role._id} value={role.name}>
                                                    {role.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Status Filter */}
                                    <div className="mb-3">
                                        <label className="block text-xs font-semibold mb-1.5 text-(--muted)">
                                            {labels.status}
                                        </label>
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            className="w-full px-3 py-2 text-sm rounded-xl border-2 border-(--border) bg-(--surface-muted) outline-none focus:border-(--accent-2) transition-all"
                                        >
                                            <option value="">{labels.allStatus}</option>
                                            <option value="active">{labels.active}</option>
                                            <option value="inactive">{labels.inactive}</option>
                                        </select>
                                    </div>

                                    {/* Salary Type Filter */}
                                    <div>
                                        <label className="block text-xs font-semibold mb-1.5 text-(--muted)">
                                            {labels.salaryType}
                                        </label>
                                        <select
                                            value={salaryTypeFilter}
                                            onChange={(e) => setSalaryTypeFilter(e.target.value)}
                                            className="w-full px-3 py-2 text-sm rounded-xl border-2 border-(--border) bg-(--surface-muted) outline-none focus:border-(--accent-2) transition-all"
                                        >
                                            <option value="">{labels.allSalaryTypes}</option>
                                            <option value="fixed">{labels.fixed}</option>
                                            <option value="percentage">{labels.percentage}</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                    }
                />
            </div>
            <PaginatedList
                ref={paginatedListRef}
                rtkQuery={useGetStaffListQuery}
                limit={20}
                dataKey="data"
                queryArgs={filters}
                wrapperClassName="flex-1"
                renderItems={(staff) => (
                    <div className="flex flex-col gap-0">
                        {/* Desktop header */}
                        <div className="hidden lg:grid lg:grid-cols-12 gap-3 px-5 py-3 rounded-t-2xl text-xs font-bold uppercase tracking-wider"
                            style={{ background: "var(--surface-muted)", color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>
                            <div className="col-span-3">{labels.fullName || "Name"}</div>
                            <div className="col-span-2 hidden md:block">{labels.cnic || "CNIC"}</div>
                            <div className="col-span-2 hidden sm:block">{labels.phone || "Phone"}</div>
                            <div className="col-span-2 text-center">{labels.role || "Role"}</div>
                            <div className="col-span-1 hidden lg:block text-center">{labels.status || "Status"}</div>
                            <div className="col-span-2 text-center">{labels.actions || "Actions"}</div>
                        </div>

                        {/* Desktop rows */}
                        {staff.map((item, i) => (
                            <div key={item._id}
                                className="hidden lg:grid lg:grid-cols-12 gap-3 px-5 py-3.5 items-center transition-all duration-150 hover:bg-(--surface-muted) group"
                                style={{ background: i % 2 === 0 ? "var(--surface)" : "rgba(255,250,243,0.6)", borderBottom: "1px solid var(--border)" }}>
                                <div className="col-span-3 flex items-center gap-3 min-w-0">
                                    <div className="relative shrink-0">
                                        <div className="w-11 h-11 rounded-lg overflow-hidden bg-surface-muted shrink-0">
                                            {item.photo ? (
                                                <BigViewImage
                                                    src={toImageUrl(item.photo)}
                                                    alt={item.fullName}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <PlaceholderImg size={11} />
                                            )}
                                        </div>
                                        {item.status === "active" && <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[var(--surface)]"></div>}
                                    </div>
                                    <div className="font-semibold text-(--ink) truncate text-sm min-w-0">{item.fullName}</div>
                                </div>
                                <div className="col-span-2 text-sm text-(--muted) font-mono truncate hidden md:block">{item.cnic || "—"}</div>
                                <div className="col-span-2 text-sm text-(--muted) truncate hidden sm:block">{item.phone || "—"}</div>
                                <div className="col-span-2 text-center">
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-tight bg-primary-hover/50 text-primary">
                                        {item.role}
                                    </span>
                                </div>
                                <div className="col-span-1 text-center hidden lg:block">
                                    <div className="inline-flex items-center gap-1.5 text-xs font-medium">
                                        <span className={`w-1.5 h-1.5 rounded-full ${item.status === "active" ? "bg-primary" : "bg-red-400"}`} />
                                        <span className={item.status === "active" ? "text-ink" : "text-ink-muted"}>
                                            {item.status}
                                        </span>
                                    </div>
                                </div>
                                <div onClick={e => e.stopPropagation()} className="col-span-2 flex items-center gap-1.5 flex-wrap justify-center">
                                    <button
                                        onClick={() => navigate(`/staff/${item._id}`)}
                                        className="p-2 rounded-lg bg-(--surface-muted) border border-(--border) transition-all duration-150 hover:scale-105 hover:border-(--accent-2) hover:text-(--accent-2)"
                                    >
                                        <Eye size={15} />
                                    </button>
                                    <button
                                        onClick={() => handleOpenEditModal(item._id)}
                                        className="p-2 rounded-lg bg-(--surface-muted) border border-(--border) transition-all duration-150 hover:scale-105 hover:border-(--accent-2) hover:text-(--accent-2)"
                                    >
                                        <Edit2 size={15} />
                                    </button>
                                    <ConfirmDialog message={labels.deleteConfirm.replace("{name}", item.fullName)} onConfirm={() => handleDelete(item._id)}>
                                        <PermissionGuard permission="staff.delete">
                                            <button className="p-2 rounded-lg bg-(--surface-muted) border border-(--border) transition-all duration-150 hover:scale-105 hover:border-red-400 hover:text-red-500">
                                                <Trash2 size={15} />
                                            </button>
                                        </PermissionGuard>
                                    </ConfirmDialog>
                                </div>
                            </div>
                        ))}

                        {/* Mobile / Tablet cards */}
                        <div className="lg:hidden flex flex-col gap-3 pt-1">
                            {staff.map((item) => (
                                <div key={`m-${item._id}`} className="rounded-2xl p-4 border transition-all duration-150 hover:shadow-md"
                                    style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "0 2px 12px rgba(64,45,28,0.07)" }}>
                                    <div className="flex items-start gap-3">
                                        <div className="relative shrink-0">
                                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-muted">
                                                {item.photo ? (
                                                    <BigViewImage
                                                        src={toImageUrl(item.photo)}
                                                        alt={item.fullName}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <PlaceholderImg size={16} />
                                                )}
                                            </div>
                                            {item.status === "active" && <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[var(--surface)]"></div>}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-(--ink) text-sm leading-snug truncate">{item.fullName}</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-0.5 text-xs text-(--muted) mt-1">
                                                {item.cnic && <span className="truncate">CNIC: <span className="font-mono text-(--ink)">{item.cnic}</span></span>}
                                                {item.phone && <span className="truncate">Phone: <span className="font-mono text-(--ink)">{item.phone}</span></span>}
                                                <span>Role: <span className="font-semibold text-(--ink)">{item.role}</span></span>
                                                <span>Status: <span className={item.status === "active" ? "text-green-600" : "text-red-500"}>{item.status}</span></span>
                                            </div>
                                        </div>
                                    </div>
                                    <div onClick={e => e.stopPropagation()} className="flex gap-2 mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                                        <button
                                            onClick={() => navigate(`/staff/${item._id}`)}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-all border hover:border-(--accent-2) hover:text-(--accent-2)"
                                            style={{ background: "var(--surface-muted)", borderColor: "var(--border)", color: "var(--muted)" }}
                                        >
                                            <Eye size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleOpenEditModal(item._id)}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-all border hover:border-(--accent-2) hover:text-(--accent-2)"
                                            style={{ background: "var(--surface-muted)", borderColor: "var(--border)", color: "var(--muted)" }}
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <ConfirmDialog message={labels.deleteConfirm.replace("{name}", item.fullName)} onConfirm={() => handleDelete(item._id)}>
                                            <PermissionGuard permission="staff.delete">
                                                <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-all border hover:border-red-400 hover:text-red-500"
                                                    style={{ background: "var(--surface-muted)", borderColor: "var(--border)", color: "var(--muted)" }}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </PermissionGuard>
                                        </ConfirmDialog>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                renderEmpty={() => (
                    <div className="flex flex-col items-center justify-center gap-3 py-16 px-6">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-surface-muted">
                            <User className="w-7 h-7 text-ink-muted" />
                        </div>
                        <div className="text-center space-y-1">
                            <h3 className="text-sm font-semibold text-ink">{labels.noStaffFound}</h3>
                            <p className="text-xs text-ink-muted max-w-xs">
                                {hasActiveFilters
                                    ? "No staff members match your filters."
                                    : "You haven't added any staff members yet."}
                            </p>
                        </div>
                        {hasActiveFilters && (
                            <button
                                onClick={handleClearFilters}
                                className="px-4 py-2 text-xs rounded-xl border-edge text-ink-muted hover:text-primary hover:bg-primary-hover/80 font-medium transition"
                            >
                                Clear All Filters
                            </button>
                        )}
                    </div>
                )}
            />

            <StaffModal 
                mode={modalMode}
                staffId={staffId}
                open={modalOpen} 
                onClose={handleModalClose} 
            />
        </div>
    );
}










// import React, { useState, useRef } from "react";
// import { useNavigate } from "react-router-dom";
// import { Plus, Search, Edit, Trash2, Eye, Calendar, ArrowLeft, User, Phone, IdCard, Briefcase, Download, Printer } from "lucide-react";
// import { toast } from "sonner";
// import { useGetStaffListQuery, useDeleteStaffMutation } from "../api/staff.api.js";
// import { getStaffLabels } from "../labels/staffLabels.js";
// import { useSettings } from "../../settings/hooks/useSettings.js";
// import PaginatedList from "../../../shared/components/PaginatedList.jsx";
// import { toImageUrl } from "../../../shared/utilities/image.utility.js";

// export default function StaffList() {
//     const navigate = useNavigate();
//     const [search, setSearch] = useState("");
//     const [roleFilter, setRoleFilter] = useState("");
//     const [statusFilter, setStatusFilter] = useState("");
//     const [salaryTypeFilter, setSalaryTypeFilter] = useState("");
//     const paginatedListRef = useRef(null);

//     const { settings } = useSettings();
//     const language = settings?.language || "en";
//     const labels = getStaffLabels(language);

//     const [deleteStaff] = useDeleteStaffMutation();

//     const handleDelete = async (id, name) => {
//         if (window.confirm(labels.deleteConfirm.replace("{name}", name))) {
//             try {
//                 await deleteStaff(id).unwrap();
//                 toast.success(labels.staffDeleted);
//                 if (paginatedListRef.current) {
//                     paginatedListRef.current.refetch();
//                 }
//             } catch (error) {
//                 toast.error(labels.failedToDelete);
//             }
//         }
//     };

//     const handleClearFilters = () => {
//         setSearch("");
//         setRoleFilter("");
//         setStatusFilter("");
//         setSalaryTypeFilter("");
//     };

//     // Build filter object for PaginatedList
//     const filters = {};
//     if (search) filters.search = search;
//     if (roleFilter) filters.role = roleFilter;
//     if (statusFilter) filters.status = statusFilter;
//     if (salaryTypeFilter) filters.salaryType = salaryTypeFilter;

//     return (
//         <div className="h-screen flex flex-col bg-app-bg">
//             {/* ── Header ── */}
//             <div className="flex-none px-6 pt-6 pb-4">
//                 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
//                     <div className="flex items-center gap-4">
//                         <button
//                             onClick={() => navigate(-1)}
//                             title="Go Back"
//                             className="shrink-0 w-11 h-11 flex items-center justify-center rounded-2xl border-2 border-edge text-ink-subtle hover:text-primary hover:border-primary hover:bg-primary/10 transition-all hover:scale-105 active:scale-95"
//                         >
//                             <ArrowLeft className="w-5 h-5" />
//                         </button>
//                         <div>
//                             <h1 className="text-3xl font-black text-ink flex items-center gap-3">
//                                 <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-[#0d8a7e] flex items-center justify-center">
//                                     <User size={20} className="text-white" />
//                                 </div>
//                                 {labels.staffManagement}
//                             </h1>
//                             <p className="text-sm text-ink-subtle mt-1 font-medium">
//                                 {labels.manageStaff}
//                             </p>
//                         </div>
//                     </div>

//                     <div className="flex items-center gap-3 flex-wrap">
//                         <button
//                             onClick={() => navigate("/staff/attendance")}
//                             className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-(--surface) border-2 border-edge text-ink hover:border-primary hover:shadow-md transition-all"
//                         >
//                             <Calendar size={16} />
//                             <span>{labels.markAttendance}</span>
//                         </button>
//                         <button
//                             onClick={() => navigate("/staff/create")}
//                             className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-[#0d8a7e] text-white font-bold hover:shadow-lg hover:shadow-primary/30 transition-all hover:scale-105 active:scale-95"
//                         >
//                             <Plus size={18} />
//                             <span>{labels.addStaff}</span>
//                         </button>
//                     </div>
//                 </div>

//                 {/* Filters */}
//                 <div className="bg-(--surface) border-2 border-edge rounded-2xl p-4">
//                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
//                         <div className="relative">
//                             <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
//                             <input
//                                 type="text"
//                                 placeholder={labels.searchPlaceholder}
//                                 value={search}
//                                 onChange={(e) => setSearch(e.target.value)}
//                                 className="w-full pl-10 pr-4 py-2.5 border-2 border-edge rounded-xl focus:border-primary focus:outline-none transition-all text-ink font-medium bg-(--surface-muted)"
//                             />
//                         </div>
//                         <select
//                             value={roleFilter}
//                             onChange={(e) => setRoleFilter(e.target.value)}
//                             className="px-4 py-2.5 border-2 border-edge rounded-xl focus:border-primary focus:outline-none transition-all text-ink font-medium bg-(--surface-muted)"
//                         >
//                             <option value="">{labels.allRoles}</option>
//                             <option value="cashier">{labels.cashier}</option>
//                             <option value="tailor">{labels.tailor}</option>
//                             <option value="stockKeeper">{labels.stockKeeper}</option>
//                             <option value="other">{labels.other}</option>
//                         </select>
//                         <select
//                             value={statusFilter}
//                             onChange={(e) => setStatusFilter(e.target.value)}
//                             className="px-4 py-2.5 border-2 border-edge rounded-xl focus:border-primary focus:outline-none transition-all text-ink font-medium bg-(--surface-muted)"
//                         >
//                             <option value="">{labels.allStatus}</option>
//                             <option value="active">{labels.active}</option>
//                             <option value="inactive">{labels.inactive}</option>
//                         </select>
//                         <select
//                             value={salaryTypeFilter}
//                             onChange={(e) => setSalaryTypeFilter(e.target.value)}
//                             className="px-4 py-2.5 border-2 border-edge rounded-xl focus:border-primary focus:outline-none transition-all text-ink font-medium bg-(--surface-muted)"
//                         >
//                             <option value="">{labels.allSalaryTypes}</option>
//                             <option value="fixed">{labels.fixed}</option>
//                             <option value="percentage">{labels.percentage}</option>
//                         </select>
//                         {(search || roleFilter || statusFilter || salaryTypeFilter) && (
//                             <button
//                                 onClick={handleClearFilters}
//                                 className="px-4 py-2.5 rounded-xl border-2 border-edge text-ink-subtle hover:border-red-300 hover:text-red-600 hover:bg-red-50 font-semibold transition-all"
//                             >
//                                 Clear Filters
//                             </button>
//                         )}
//                     </div>
//                 </div>
//             </div>

//             {/* ── Table ── */}
//             <div className="flex-1 overflow-hidden px-6 pb-6">
//                 <PaginatedList
//                     ref={paginatedListRef}
//                     rtkQuery={useGetStaffListQuery}
//                     limit={20}
//                     dataKey="data"
//                     queryArgs={filters}
//                     wrapperClassName="h-full"
//                     className="p-0"
//                     renderEmpty={() => (
//                         <div className="flex flex-col items-center justify-center gap-5 py-20 px-6">
//                             <div className="relative">
//                                 <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
//                                     <User className="w-12 h-12 text-primary" />
//                                 </div>
//                             </div>
//                             <div className="text-center space-y-2">
//                                 <h3 className="text-xl font-bold text-ink">{labels.noStaffFound}</h3>
//                                 <p className="text-sm text-ink-subtle max-w-md">
//                                     {filters.search || filters.role || filters.status || filters.salaryType
//                                         ? "No staff members match your filters. Try adjusting them."
//                                         : "You haven't added any staff members yet. Click 'Add Staff' to get started."}
//                                 </p>
//                             </div>
//                             {(search || roleFilter || statusFilter || salaryTypeFilter) && (
//                                 <button
//                                     onClick={handleClearFilters}
//                                     className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-[#0d8a7e] text-white font-semibold hover:shadow-lg hover:shadow-primary/30 transition-all hover:scale-105 active:scale-95"
//                                 >
//                                     Clear All Filters
//                                 </button>
//                             )}
//                         </div>
//                     )}
//                     renderItems={(staff) => (
//                         <div className="overflow-x-auto">
//                             <table className="w-full text-sm">
//                                 <thead className="sticky top-0 z-10">
//                                     <tr className="bg-gradient-to-r from-(--surface-muted) to-(--surface)">
//                                         <th className="px-5 py-4 text-left">
//                                             <span className="text-xs font-black uppercase tracking-widest text-ink-subtle">Photo</span>
//                                         </th>
//                                         <th className="px-5 py-4 text-left">
//                                             <div className="flex items-center gap-2">
//                                                 <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
//                                                     <User size={14} className="text-primary" />
//                                                 </div>
//                                                 <span className="text-xs font-black uppercase tracking-widest text-ink-subtle">Name</span>
//                                             </div>
//                                         </th>
//                                         <th className="px-5 py-4 text-left hidden md:table-cell">
//                                             <div className="flex items-center gap-2">
//                                                 <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
//                                                     <IdCard size={14} className="text-primary" />
//                                                 </div>
//                                                 <span className="text-xs font-black uppercase tracking-widest text-ink-subtle">CNIC</span>
//                                             </div>
//                                         </th>
//                                         <th className="px-5 py-4 text-left hidden sm:table-cell">
//                                             <div className="flex items-center gap-2">
//                                                 <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
//                                                     <Phone size={14} className="text-primary" />
//                                                 </div>
//                                                 <span className="text-xs font-black uppercase tracking-widest text-ink-subtle">Phone</span>
//                                             </div>
//                                         </th>
//                                         <th className="px-5 py-4 text-center">
//                                             <div className="flex items-center justify-center gap-2">
//                                                 <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
//                                                     <Briefcase size={14} className="text-primary" />
//                                                 </div>
//                                                 <span className="text-xs font-black uppercase tracking-widest text-ink-subtle">Role</span>
//                                             </div>
//                                         </th>
//                                         <th className="px-5 py-4 text-center hidden lg:table-cell">
//                                             <span className="text-xs font-black uppercase tracking-widest text-ink-subtle">Salary Type</span>
//                                         </th>
//                                         <th className="px-5 py-4 text-center">
//                                             <span className="text-xs font-black uppercase tracking-widest text-ink-subtle">Status</span>
//                                         </th>
//                                         <th className="px-5 py-4 text-center">
//                                             <span className="text-xs font-black uppercase tracking-widest text-ink-subtle">Actions</span>
//                                         </th>
//                                     </tr>
//                                 </thead>
//                                 <tbody>
//                                     {staff.map((item, index) => (
//                                         <tr
//                                             key={item._id}
//                                             className="border-t-2 border-edge transition-all hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent group"
//                                         >
//                                             {/* Photo */}
//                                             <td className="px-5 py-4">
//                                                 <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-edge bg-(--surface-muted)">
//                                                     {item.photo ? (
//                                                         <img 
//                                                             src={toImageUrl(item.photo)} 
//                                                             alt={item.fullName}
//                                                             className="w-full h-full object-cover"
//                                                             onError={(e) => {
//                                                                 e.target.style.display = 'none';
//                                                                 e.target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-primary/10"><span class="text-primary font-bold text-sm">${item.fullName?.charAt(0) || 'S'}</span></div>`;
//                                                             }}
//                                                         />
//                                                     ) : (
//                                                         <div className="w-full h-full flex items-center justify-center bg-primary/10">
//                                                             <span className="text-primary font-bold text-sm">
//                                                                 {item.fullName?.charAt(0) || 'S'}
//                                                             </span>
//                                                         </div>
//                                                     )}
//                                                 </div>
//                                             </td>
                                            
//                                             {/* Name */}
//                                             <td className="px-5 py-4">
//                                                 <p className="font-bold text-ink">{item.fullName}</p>
//                                             </td>
                                            
//                                             {/* CNIC */}
//                                             <td className="px-5 py-4 hidden md:table-cell">
//                                                 <p className="text-ink-subtle font-medium">{item.cnic || "—"}</p>
//                                             </td>
                                            
//                                             {/* Phone */}
//                                             <td className="px-5 py-4 hidden sm:table-cell">
//                                                 <p className="text-ink-subtle font-medium">{item.phone || "—"}</p>
//                                             </td>
                                            
//                                             {/* Role */}
//                                             <td className="px-5 py-4 text-center">
//                                                 <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold border text-xs bg-primary/10 text-primary border-primary/30">
//                                                     {item.role}
//                                                 </span>
//                                             </td>
                                            
//                                             {/* Salary Type */}
//                                             <td className="px-5 py-4 text-center hidden lg:table-cell">
//                                                 <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold border text-xs ${
//                                                     item.salaryType === 'fixed' 
//                                                         ? 'bg-blue-50 text-blue-600 border-blue-200' 
//                                                         : 'bg-purple-50 text-purple-600 border-purple-200'
//                                                 }`}>
//                                                     {item.salaryType}
//                                                 </span>
//                                             </td>
                                            
//                                             {/* Status */}
//                                             <td className="px-5 py-4 text-center">
//                                                 <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold border text-xs ${
//                                                     item.status === 'active' 
//                                                         ? 'bg-green-50 text-green-600 border-green-200' 
//                                                         : 'bg-red-50 text-red-600 border-red-200'
//                                                 }`}>
//                                                     <span className={`w-2 h-2 rounded-full ${item.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></span>
//                                                     {item.status}
//                                                 </span>
//                                             </td>
                                            
//                                             {/* Actions */}
//                                             <td className="px-5 py-4">
//                                                 <div className="flex gap-2 justify-center">
//                                                     <button
//                                                         onClick={() => navigate(`/staff/${item._id}`)}
//                                                         title="View Details"
//                                                         className="w-9 h-9 rounded-xl transition-all flex items-center justify-center bg-(--surface-muted) border-2 border-edge hover:border-primary hover:bg-primary/10 text-ink-subtle hover:text-primary group-hover:scale-105"
//                                                     >
//                                                         <Eye size={16} />
//                                                     </button>
//                                                     <button
//                                                         onClick={() => navigate(`/staff/edit/${item._id}`)}
//                                                         title="Edit Staff"
//                                                         className="w-9 h-9 rounded-xl transition-all flex items-center justify-center bg-blue-50 border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-100 text-blue-500 hover:text-blue-700 group-hover:scale-105"
//                                                     >
//                                                         <Edit size={16} />
//                                                     </button>
//                                                     <button
//                                                         onClick={() => handleDelete(item._id, item.fullName)}
//                                                         title="Delete Staff"
//                                                         className="w-9 h-9 rounded-xl transition-all flex items-center justify-center bg-red-50 border-2 border-red-200 hover:border-red-400 hover:bg-red-100 text-red-500 hover:text-red-700 group-hover:scale-105"
//                                                     >
//                                                         <Trash2 size={16} />
//                                                     </button>
//                                                 </div>
//                                             </td>
//                                         </tr>
//                                     ))}
//                                 </tbody>
//                             </table>
//                         </div>
//                     )}
//                 />
//             </div>
//         </div>
//     );
// }
