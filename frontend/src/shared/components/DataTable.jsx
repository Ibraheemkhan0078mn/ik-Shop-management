// import { Edit, Trash2 } from "lucide-react";
// import { useState } from "react";
// import UpdateProduct from "../../modules/productsModule/components/UpdateProduct";

// export default function DataTable({ fetchPage, page, columns, data, loading, isUpdate, isDelete, updateComp, onDelete }) {
//     const [sortKey, setSortKey] = useState(null);
//     const [sortDir, setSortDir] = useState("asc");
//     const [updateCompVisibility, setUpdateCompVisibility] = useState(false);
//     const [toUpdateDocumentId, setToUpdateDocumentId] = useState(false);

//     const colEntries = Object.entries(columns);
//     const hasActions = isUpdate || isDelete;

//     const handleSort = (field) => {
//         if (sortKey === field) setSortDir(d => d === "asc" ? "desc" : "asc");
//         else { setSortKey(field); setSortDir("asc"); }
//     };

//     const sorted = sortKey
//         ? [...data].sort((a, b) => {
//             const av = a[sortKey] ?? "", bv = b[sortKey] ?? "";
//             return sortDir === "asc"
//                 ? String(av).localeCompare(String(bv))
//                 : String(bv).localeCompare(String(av));
//         })
//         : data;

//     const resolveValue = (row, field) => {
//         const val = field.split(".").reduce((acc, key) => acc?.[key], row);
//         if (val === null || val === undefined) return "—";
//         if (Array.isArray(val)) return val.length;
//         if (typeof val === "object") return val.name ?? val._id ?? "—";
//         if (typeof val === "boolean") return val ? "Yes" : "No";
//         return val;
//     };

//     // Dynamic grid: data columns + optional fixed actions column
//     const gridStyle = {
//         gridTemplateColumns: hasActions
//             ? `repeat(${colEntries.length}, minmax(100px, 1fr)) auto`
//             : `repeat(${colEntries.length}, minmax(100px, 1fr))`,
//     };

//     return (
//         <div className="w-full font-sans overflow-x-auto rounded-xl border border-gray-200">

//             {updateCompVisibility && <UpdateProduct fetchPage={fetchPage} page={page} productId={toUpdateDocumentId} open={toUpdateDocumentId} onClose={() => setUpdateCompVisibility(false)} />}


//             <div className="min-w-max w-full">

//                 {/* ── Header ── */}
//                 <div
//                     className="grid sticky top-0 z-10 bg-gray-50 border-b-2 border-gray-200"
//                     style={gridStyle}
//                 >
//                     {colEntries.map(([label, field]) => (
//                         <div
//                             key={field}
//                             onClick={() => handleSort(field)}
//                             className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase
//                                        tracking-wide cursor-pointer select-none flex items-center
//                                        gap-1 hover:text-gray-900 whitespace-nowrap"
//                         >
//                             {label}
//                             <span className={`text-[10px] transition-colors ${sortKey === field ? "text-indigo-500" : "text-gray-300"}`}>
//                                 {sortKey === field ? (sortDir === "asc" ? "▲" : "▼") : "⇅"}
//                             </span>
//                         </div>
//                     ))}

//                     {hasActions && (
//                         <div className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase
//                                         tracking-wide select-none text-center whitespace-nowrap">
//                             Actions
//                         </div>
//                     )}
//                 </div>

//                 {/* ── Empty state ── */}
//                 {sorted.length === 0 && !loading && (
//                     <div className="text-center py-12 text-sm text-gray-400">
//                         No records found
//                     </div>
//                 )}

//                 {/* ── Rows ── */}
//                 {sorted.map((row, i) => {
//                     const id = row._id ?? row.id;
//                     return (
//                         <div
//                             key={id ?? i}
//                             className={`grid border-b border-gray-100 transition-colors
//                                         hover:bg-blue-50/60
//                                         ${i % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}
//                             style={gridStyle}
//                         >
//                             {colEntries.map(([label, field]) => (
//                                 <div
//                                     key={field}
//                                     data-label={label}
//                                     className="px-4 py-3 text-sm text-gray-700 overflow-hidden
//                                                text-ellipsis whitespace-nowrap"
//                                 >
//                                     {resolveValue(row, field)}
//                                 </div>
//                             ))}

//                             {hasActions && (
//                                 <div className="px-4 py-2 flex items-center justify-center gap-1.5">
//                                     {isUpdate && (
//                                         <button
//                                             type="button"
//                                             onClick={async () => { setUpdateCompVisibility(true); setToUpdateDocumentId(id); }}
//                                             className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600
//                                                        hover:bg-indigo-50 transition-colors cursor-pointer"
//                                             title="Edit"
//                                         >
//                                             <Edit className="w-4 h-4" />
//                                         </button>
//                                     )}
//                                     {isDelete && (
//                                         <button
//                                             type="button"
//                                             onClick={async () => { await onDelete?.(id); fetchPage(page) }}
//                                             className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600
//                                                        hover:bg-rose-50 transition-colors cursor-pointer"
//                                             title="Delete"
//                                         >
//                                             <Trash2 className="w-4 h-4" />
//                                         </button>
//                                     )}
//                                 </div>
//                             )}
//                         </div>
//                     );
//                 })}

//                 {/* ── Skeleton loader ── */}
//                 {loading && (
//                     <>
//                         {[...Array(5)].map((_, i) => (
//                             <div
//                                 key={`skel-${i}`}
//                                 className="grid border-b border-gray-100"
//                                 style={gridStyle}
//                             >
//                                 {colEntries.map(([, field]) => (
//                                     <div key={field} className="px-4 py-3">
//                                         <div className="h-3 rounded-full bg-gradient-to-r from-gray-100
//                                                         via-gray-200 to-gray-100 animate-pulse" />
//                                     </div>
//                                 ))}
//                                 {hasActions && (
//                                     <div className="px-4 py-3 flex items-center justify-center gap-2">
//                                         <div className="w-6 h-6 rounded-lg bg-gray-100 animate-pulse" />
//                                         <div className="w-6 h-6 rounded-lg bg-gray-100 animate-pulse" />
//                                     </div>
//                                 )}
//                             </div>
//                         ))}
//                     </>
//                 )}

//             </div>
//         </div>
//     );
// }





















































// ============================================================
//  components/common/DataTable.jsx
//
//  Reusable table — sirf data render karta hai.
//  API calls, pagination — kuch nahi. Sirf display.
//
//  Props:
//    columns     → { "Label": "field.path" }
//                  Nested path bhi kaam karega: "category.name"
//                  Array bhi: "batches.length" → length dikhayega
//    data        → rows ka array
//    loading     → skeleton dikhao?
//    isUpdate    → edit button dikhao?
//    isDelete    → delete button dikhao?
//    onEdit      → (row) => void — edit click par
//    onDelete    → (id) => void — delete click par
// ============================================================

import { useState } from "react";
import { Edit, Trash2 } from "lucide-react";

// ── Nested field resolver ─────────────────────────────────────
// "category.name" → row.category.name
// "batches.length" → row.batches.length (array count)
function resolveValue(row, fieldPath) {
    const value = fieldPath.split(".").reduce((obj, key) => obj?.[key], row);

    if (value === null || value === undefined) return "—";
    if (Array.isArray(value)) return value.length;
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "object") return value.name ?? value._id ?? "—";
    return value;
}

export default function DataTable({
    columns = {},
    data = [],
    loading = false,
    isUpdate = false,
    isDelete = false,
    onEdit,
    onDelete,
    onRowClick = () => { }
}) {
    // Client-side sort — sirf current page ke rows sort honge
    const [sortKey, setSortKey] = useState(null);
    const [sortDir, setSortDir] = useState("asc");

    const colEntries = Object.entries(columns);
    const hasActions = isUpdate || isDelete;

    // Column header click — sort toggle
    const handleSort = (field) => {
        if (sortKey === field) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortKey(field);
            setSortDir("asc");
        }
    };

    // Sort current page ka data
    const sortedData = sortKey
        ? [...data].sort((a, b) => {
            const av = resolveValue(a, sortKey);
            const bv = resolveValue(b, sortKey);
            return sortDir === "asc"
                ? String(av).localeCompare(String(bv))
                : String(bv).localeCompare(String(av));
        })
        : data;

    // Grid: data columns + optional actions column
    const gridCols = hasActions
        ? `repeat(${colEntries.length}, minmax(100px, 1fr)) 90px`
        : `repeat(${colEntries.length}, minmax(100px, 1fr))`;

    return (
        <div className="w-full font-sans overflow-x-auto rounded-xl border border-(--border)">
            <div className="min-w-max w-full">

                {/* ── Header ── */}
                <div
                    className="grid sticky top-0 z-10 bg-(--surface-muted) border-b-2 border-(--border)"
                    style={{ gridTemplateColumns: gridCols }}
                >
                    {colEntries.map(([label, field]) => (
                        <div
                            key={field}
                            onClick={() => handleSort(field)}
                            className="px-4 py-3 text-xs font-semibold text-(--muted) uppercase
                                       tracking-wide cursor-pointer select-none flex items-center
                                       gap-1 hover:text-(--ink) whitespace-nowrap transition-colors"
                        >
                            {label}
                            <span className={`text-[10px] transition-colors ${sortKey === field ? "text-(--accent-2)" : "text-(--border)"}`}>
                                {sortKey === field ? (sortDir === "asc" ? "▲" : "▼") : "⇅"}
                            </span>
                        </div>
                    ))}

                    {hasActions && (
                        <div className="px-4 py-3 text-xs font-semibold text-(--muted) uppercase tracking-wide text-center">
                            Actions
                        </div>
                    )}
                </div>

                {/* ── Empty state ── */}
                {!loading && sortedData.length === 0 && (
                    <div className="text-center py-12 text-sm text-(--muted)">
                        Koi record nahi mila
                    </div>
                )}

                {/* ── Data Rows ── */}
                {sortedData?.map((row, i) => {
                    const id = row._id || row.id;
                    return (
                        <div
                            onClick={() => onRowClick(row)}
                            key={id || i}
                            className={`grid border-b border-(--border) transition-colors hover:bg-(--surface-muted)/60
                                        ${i % 2 === 0 ? "bg-(--surface)" : "bg-(--surface-muted)/30"}`}
                            style={{ gridTemplateColumns: gridCols }}
                        >
                            {colEntries.map(([label, field]) => (
                                <div
                                    key={field}
                                    data-label={label}
                                    className="px-4 py-3 text-sm text-(--ink) overflow-hidden text-ellipsis whitespace-nowrap"
                                >
                                    {resolveValue(row, field)}
                                </div>
                            ))}

                            {hasActions && (
                                <div className="px-4 py-2 flex items-center justify-center gap-1.5">
                                    {isUpdate && (
                                        <button

                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); return onEdit?.(row) }}
                                            className="p-1.5 rounded-lg text-(--muted) hover:text-(--accent-2)
                                                       hover:bg-(--surface-muted) transition-colors cursor-pointer"
                                            title="Edit"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                    )}
                                    {isDelete && (
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); return onDelete?.(id) }}
                                            className="p-1.5 rounded-lg text-(--muted) hover:text-rose-600
                                                       hover:bg-rose-50 transition-colors cursor-pointer"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* ── Skeleton loader — jab data load ho raha ho ── */}
                {loading && (
                    <>
                        {[...Array(5)].map((_, i) => (
                            <div
                                key={`skel-${i}`}
                                className="grid border-b border-(--border)"
                                style={{ gridTemplateColumns: gridCols }}
                            >
                                {colEntries.map(([, field]) => (
                                    <div key={field} className="px-4 py-3">
                                        <div className="h-3 rounded-full bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-pulse" />
                                    </div>
                                ))}
                                {hasActions && (
                                    <div className="px-4 py-3 flex items-center justify-center gap-2">
                                        <div className="w-6 h-6 rounded-lg bg-(--border) animate-pulse" />
                                        <div className="w-6 h-6 rounded-lg bg-(--border) animate-pulse" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </>
                )}
            </div>
        </div>
    );
}