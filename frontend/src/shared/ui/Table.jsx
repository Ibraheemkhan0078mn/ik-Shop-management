import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    useReactTable,
} from "@tanstack/react-table";

import { Search, Download, ChevronLeft, ChevronRight } from "lucide-react";

import { useState } from "react";

/* =========================
   EXPORT HELPERS (INTERNAL)
   ========================= */

const exportToCSV = (rows, columns, filename = "report.csv") => {
    const headers = columns
        .map((col) => (typeof col.header === "string" ? col.header : col.id))
        .join(",");

    const csvRows = rows.map((row) =>
        columns
            .map((col) => {
                const value = row.original[col.accessorKey];
                return `"${String(value ?? "").replace(/"/g, '""')}"`;
            })
            .join(","),
    );

    const csvContent = [headers, ...csvRows].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
};

const exportToJSON = (rows, filename = "report.json") => {
    const json = JSON.stringify(
        rows.map((r) => r.original),
        null,
        2,
    );

    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
};

/* =========================
   MAIN COMPONENT
   ========================= */

const IMSReportTable = ({
    columns,
    data,
    language = "en",
    pageSize = 10,
    enableSearch = true,
    enableExport = true,
    exportFilename = "ims-report",
}) => {
    const [globalFilter, setGlobalFilter] = useState("");
    const [sorting, setSorting] = useState([]);

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            globalFilter,
        },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: {
            pagination: {
                pageSize,
            },
        },
    });

    const visibleRows = table.getFilteredRowModel().rows;

    return (
        <div className="w-full animate-in fade-in duration-500">
            {/* Header */}
            <div className="bg-(--surface) p-4 rounded-t-2xl border-x border-t border-(--border) flex flex-col md:flex-row justify-between items-center gap-4">
                {enableSearch && (
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--muted)" />
                        <input
                            value={globalFilter ?? ""}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                            placeholder={
                                language === "en"
                                    ? "Search records..."
                                    : "تلاش کریں..."
                            }
                            className="w-full pl-10 pr-4 py-2 bg-(--surface-muted) border border-(--border) rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-(--accent-2)/20 focus:border-(--accent-2) transition"
                        />
                    </div>
                )}

                {enableExport && (
                    <div className="flex gap-2">
                        <button
                            onClick={() =>
                                exportToCSV(
                                    visibleRows,
                                    table.getAllLeafColumns(),
                                    `${exportFilename}.csv`,
                                )
                            }
                            className="flex items-center gap-2 px-4 py-2 bg-(--surface) border border-(--border) rounded-xl text-sm font-medium text-(--muted) hover:bg-(--surface-muted) transition"
                        >
                            <Download className="w-4 h-4" />
                            CSV
                        </button>

                        <button
                            onClick={() =>
                                exportToJSON(
                                    visibleRows,
                                    `${exportFilename}.json`,
                                )
                            }
                            className="flex items-center gap-2 px-4 py-2 bg-(--surface) border border-(--border) rounded-xl text-sm font-medium text-(--muted) hover:bg-(--surface-muted) transition"
                        >
                            JSON
                        </button>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="bg-(--surface) border border-(--border) shadow-sm overflow-hidden rounded-b-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr
                                    key={headerGroup.id}
                                    className="bg-(--surface-muted) border-b border-(--border)"
                                >
                                    {headerGroup.headers.map((header) => (
                                        <th
                                            key={header.id}
                                            onClick={header.column.getToggleSortingHandler()}
                                            className="px-6 py-4 text-xs font-bold text-(--muted) uppercase tracking-wider cursor-pointer select-none hover:bg-(--surface-muted) transition"
                                        >
                                            <div className="flex items-center gap-2">
                                                {flexRender(
                                                    header.column.columnDef
                                                        .header,
                                                    header.getContext(),
                                                )}
                                                {{
                                                    asc: "▲",
                                                    desc: "▼",
                                                }[
                                                    header.column.getIsSorted()
                                                ] ?? null}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>

                        <tbody className="divide-y divide-(--border)">
                            {table.getRowModel().rows.map((row) => (
                                <tr
                                    key={row.id}
                                    className="hover:bg-(--surface-muted) transition"
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <td
                                            key={cell.id}
                                            className="px-6 py-4 text-sm text-(--ink)"
                                        >
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext(),
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}

                            {table.getRowModel().rows.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={columns.length}
                                        className="px-6 py-12 text-center text-(--muted) italic"
                                    >
                                        {language === "en"
                                            ? "No records found."
                                            : "کوئی ریکارڈ موجود نہیں"}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-(--surface-muted) border-t border-(--border) flex items-center justify-between">
                    <p className="text-xs text-(--muted)">
                        Showing {table.getRowModel().rows.length} of{" "}
                        {table.getFilteredRowModel().rows.length} entries
                    </p>

                    <div className="flex gap-2">
                        <button
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                            className="p-2 bg-(--surface) border border-(--border) rounded-lg hover:bg-(--surface-muted) disabled:opacity-50 transition"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        <button
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                            className="p-2 bg-(--surface) border border-(--border) rounded-lg hover:bg-(--surface-muted) disabled:opacity-50 transition"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IMSReportTable;
