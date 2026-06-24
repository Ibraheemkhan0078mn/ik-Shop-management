

// ============================================================
//  components/common/PaginatedTable.jsx
//
//  Reusable table system — ek hi component se pagination,
//  backend filtering, aur CRUD modals sab handle hota hai.
//
//  Props:
//    endpoint      → API path string, e.g. "/products/pagination"
//                    Component khud RTK Query se call karega
//    columns       → { "Label": "field.path" } — DataTable ke liye
//    limit         → rows per page (default: 20)
//    filterFields  → filter bar ke liye fields array:
//                    [{ name: "search", type: "text", placeholder: "Search..." },
//                     { name: "category", type: "select", options: [...] }]
//    isUpdate      → edit button dikhao?
//    isDelete      → delete button dikhao?
//    UpdateComp    → Update modal component
//    onDelete      → (id) => void — delete handler (mutation tumhare paas hai)
//    createButton  → { label: "Add Product", onClick: fn } — upar ka button
// ============================================================

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { baseApi } from "../../app/rtkBaseApi.js";
import DataTable from "./DataTable";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

// ── Filter bar field render ───────────────────────────────────
// filterFields array se inputs auto-generate karta hai
function FilterBar({ filterFields = [], filters, onFilterChange }) {
    if (!filterFields.length) return null;

    return (
        <div className="flex flex-wrap gap-3 items-center mb-4">
            {filterFields.map((field) => {
                if (field.type === "text") {
                    return (
                        <div key={field.name} className="relative flex-1 min-w-[200px] max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--muted) pointer-events-none" />
                            <input
                                type="text"
                                placeholder={field.placeholder || "Search..."}
                                value={filters[field.name] || ""}
                                onChange={(e) => onFilterChange(field.name, e.target.value)}
                                className="input-search pl-9 w-full"
                            />
                        </div>
                    );
                }

                if (field.type === "select") {
                    return (
                        <select
                            key={field.name}
                            value={filters[field.name] || ""}
                            onChange={(e) => onFilterChange(field.name, e.target.value)}
                            className="px-3 py-2 border border-(--border) rounded-lg bg-(--surface)
                                       text-(--ink) text-sm focus:outline-none focus:ring-2
                                       focus:ring-(--accent-2) min-w-[150px]"
                        >
                            <option value="">{field.placeholder || "Sab"}</option>
                            {(field.options || []).map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    );
                }

                return null;
            })}
        </div>
    );
}

// ── Pagination buttons ────────────────────────────────────────
function Pagination({ page, totalPages, totalRows, limit, onPageChange, loading }) {
    // Page numbers array banao — "..." bhi include karo
    const getPageNumbers = () => {
        const delta = 2;
        const range = [];
        const left = Math.max(1, page - delta);
        const right = Math.min(totalPages, page + delta);

        if (left > 1) { range.push(1); if (left > 2) range.push("..."); }
        for (let i = left; i <= right; i++) range.push(i);
        if (right < totalPages) { if (right < totalPages - 1) range.push("..."); range.push(totalPages); }

        return range;
    };

    return (
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3
                        border-t border-(--border) bg-(--surface-muted)">
            {/* Record count */}
            <span className="text-xs text-(--muted)">
                {loading
                    ? "Loading..."
                    : `${(page - 1) * limit + 1}–${Math.min(page * limit, totalRows)} of ${totalRows} records`
                }
            </span>

            {/* Page buttons */}
            <div className="flex items-center gap-1 flex-wrap">
                <button
                    onClick={() => onPageChange(page - 1)}
                    disabled={page === 1 || loading}
                    className="h-8 w-8 flex items-center justify-center rounded-lg border border-(--border)
                               bg-(--surface) text-(--muted) hover:bg-(--surface-muted)
                               disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                {getPageNumbers().map((p, i) =>
                    p === "..." ? (
                        <span key={`e-${i}`} className="px-1 text-(--muted) text-sm">…</span>
                    ) : (
                        <button
                            key={p}
                            onClick={() => onPageChange(p)}
                            disabled={loading}
                            className={`h-8 min-w-[32px] px-2 rounded-lg border text-sm transition-colors
                                ${p === page
                                    ? "bg-(--accent-2) border-(--accent-2) text-white font-semibold"
                                    : "bg-(--surface) border-(--border) text-(--muted) hover:bg-(--surface-muted)"
                                }`}
                        >
                            {p}
                        </button>
                    )
                )}

                <button
                    onClick={() => onPageChange(page + 1)}
                    disabled={page === totalPages || loading}
                    className="h-8 w-8 flex items-center justify-center rounded-lg border border-(--border)
                               bg-(--surface) text-(--muted) hover:bg-(--surface-muted)
                               disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
export default function PaginatedTable({
    endpoint,
    columns = {},
    limit = 20,
    data: externalData,
    isUpdate = false,
    isDelete = false,
    UpdateComp = null,
    onDelete,
    rtkGetDataQuery = null,
    onRowClick = () => { }
}) {
    const [page, setPage] = useState(1);
    const [updateModalOpen, setUpdateModalOpen] = useState(false);
    const [selectedId, setSelectedId] = useState(null);

    const shouldFetch = !externalData && !!endpoint;

    const { data: fetchedData, isLoading, isFetching } = rtkGetDataQuery(
        { endpoint, page, limit },
        { skip: !shouldFetch }
    );

    const resolvedData = externalData ?? fetchedData;

    const rows = resolvedData || [];
    const totalRows = resolvedData?.total || 0;
    const totalPages = Math.max(1, Math.ceil(totalRows / limit));

    const handleEdit = (row) => {
        setSelectedId(row._id ?? row.id);
        setUpdateModalOpen(true);
    };

    const handlePageChange = (newPage) => {
        if (newPage < 1 || newPage > totalPages || newPage === page) return;
        setPage(newPage);
    };

    const loading = shouldFetch ? (isLoading || isFetching) : false;

    return (
        <div className="w-full space-y-0">
            {/* {createButton && (
                <div className="flex flex-wrap items-center gap-3 mb-4">
                    <button onClick={createButton.onClick} className="btn-add">
                        {createButton.label}
                    </button>
                </div>
            )} */}

            <div className="border border-(--border) rounded-xl overflow-hidden shadow-sm w-full">
                <div className="overflow-x-auto w-full">
                    <DataTable
                        columns={columns}
                        data={rows}
                        loading={loading}
                        isUpdate={isUpdate}
                        isDelete={isDelete}
                        onEdit={handleEdit}
                        onDelete={onDelete}
                        onRowClick={onRowClick}
                    />
                </div>

                <Pagination
                    page={page}
                    totalPages={totalPages}
                    totalRows={totalRows}
                    limit={limit}
                    loading={loading}
                    onPageChange={handlePageChange}
                />
            </div>
            {updateModalOpen && UpdateComp && selectedId && (

                <div className="fixed inset-0 z-50 flex justify-center items-center bg-black/40 backdrop-blur-sm">
                    <UpdateComp
                        id={selectedId}
                        open={updateModalOpen}
                        setVisibility={setUpdateModalOpen}
                        onClose={() => {
                            setUpdateModalOpen(false);
                            setSelectedId(null);
                        }}
                        operation="update"
                    />
                </div>
            )}

        </div>
    );
}

// ============================================================
//  usePaginatedQuery — Generic RTK Query hook
//
//  Ye ek shared endpoint use karta hai jo baseApi mein inject hai.
//  Har module ka endpoint string pass karo — wahi query banegi.
//
//  Inject karo baseApi mein — neeche dekho.
// ============================================================

// Shared paginated endpoint — baseApi mein inject karo
const paginatedApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        // Generic paginated fetch — endpoint string runtime mein aati hai
        // { endpoint, page, limit, ...filters }
        paginatedFetch: build.query({
            query: ({ endpoint, page = 1, limit = 20, ...filters }) => {
                // Empty string filters hata do — backend ko clean params bhejo
                const cleanFilters = Object.fromEntries(
                    Object.entries(filters).filter(([, v]) => v !== "" && v !== null && v !== undefined)
                );
                return {
                    url: endpoint,
                    params: { page, limit, ...cleanFilters },
                };
            },

            // Tag: endpoint + filters — same query same cache se aayegi
            providesTags: (result, error, { endpoint }) => [
                { type: "Product", id: endpoint }, // Generic tag — invalidation ke liye
            ],
        }),
    }),
    overrideExisting: false,
});

const { usePaginatedFetchQuery } = paginatedApi;

// // Alias — PaginatedTable andar use hota hai
// function usePaginatedQuery(args) {
//     return usePaginatedFetchQuery(args);
// }