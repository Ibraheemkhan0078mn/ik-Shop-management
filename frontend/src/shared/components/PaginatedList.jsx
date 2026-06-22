import React, { useState, useRef, useCallback, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

// ─────────────────────────────────────────────────────────────────
//  usePaginatedFetch - RTK Query version
//  Uses RTK Query hook for auto-updating on CRUD operations
// ─────────────────────────────────────────────────────────────────
export const usePaginatedFetch = ({ rtkQuery, limit = 20, dataKey = null }) => {
    const [currentPage, setCurrentPage] = useState(1)
    const [filter, setFilter] = useState({})

    const { data, isLoading, isFetching, refetch } = rtkQuery({
        page: currentPage,
        limit,
        ...filter,
    })

    const extractData = (res) => {
        if (!res) return []
        if (dataKey) return res[dataKey] ?? []
        for (const key of ["data", "items", "results", "records", "students"]) {
            if (Array.isArray(res[key])) return res[key]
        }
        return Array.isArray(res) ? res : []
    }

    const items = extractData(data)
    const total = data?.total ?? data?.totalStudents ?? data?.count ?? 0
    const totalPages = total > 0 ? Math.ceil(total / limit) : 1

    const goToPage = useCallback((n) => {
        const clamped = Math.max(1, Math.min(n, totalPages))
        setCurrentPage(clamped)
    }, [totalPages])

    const resetWithFilter = useCallback((newFilter) => {
        setFilter(newFilter)
        setCurrentPage(1)
    }, [])

    return {
        data: items,
        total,
        totalPages,
        currentPage,
        isLoading: isLoading || isFetching,
        goToPage,
        resetWithFilter,
        refetch,
    }
}


// ─────────────────────────────────────────────────────────────────
//  PaginatedList — drop-in wrapper
//
//  Props:
//    rtkQuery        function   required  - RTK Query hook for fetching data
//    filter          object    optional  – changing this resets to page 1
//    renderItems     fn        required  (items: array) => JSX
//                              ↑ receives the FULL page array, not one item
//    renderEmpty     fn        optional  () => JSX
//    limit           number    optional  default 20
//    dataKey         string    optional
//    className       string    optional  scrollable area className
//    wrapperClassName string   optional
// ─────────────────────────────────────────────────────────────────
const PaginatedList = ({
    rtkQuery,
    filter = {},
    renderItems,
    renderEmpty,
    limit = 20,
    dataKey = null,
    className = "",
    wrapperClassName = "",
}) => {
    const { data, total, totalPages, currentPage, isLoading, goToPage, resetWithFilter } =
        usePaginatedFetch({ rtkQuery, limit, dataKey })

    const filterStr = JSON.stringify(filter)

    useEffect(() => {
        resetWithFilter(filter)
    }, [filterStr, resetWithFilter])

    const isEmpty = !isLoading && data.length === 0

    return (
        <div className={`flex flex-col h-full ${wrapperClassName}`}>

            {/* ── Content area ── */}
            <div className={`flex-1 overflow-y-auto relative ${className}`}>
                {/* Loading overlay — sits on top of old data so layout doesn't jump */}
                {isLoading && (
                    <div className="absolute inset-0 z-10 bg-(--surface)/60 backdrop-blur-[1px] flex items-center justify-center">
                        <div className="flex items-center gap-3 text-(--accent-2) bg-(--surface) border border-(--border) rounded-2xl px-6 py-3 shadow-md">
                            <div className="w-5 h-5 border-2 border-(--border) border-t-(--accent-2) rounded-full animate-spin" />
                            <span className="text-xs font-black uppercase tracking-widest">Loading…</span>
                        </div>
                    </div>
                )}

                {isEmpty && !isLoading
                    ? renderEmpty
                        ? renderEmpty()
                        : <DefaultEmpty />
                    : renderItems(data)
                }
            </div>

            {/* ── Pagination bar ── */}
            <PaginationBar
                currentPage={currentPage}
                totalPages={totalPages}
                total={total}
                limit={limit}
                isLoading={isLoading}
                onGoToPage={goToPage}
            />
        </div>
    )
}


// ─────────────────────────────────────────────────────────────────
//  PaginationBar
// ─────────────────────────────────────────────────────────────────
const PaginationBar = ({ currentPage, totalPages, total, limit, isLoading, onGoToPage }) => {
    const [inputVal, setInputVal] = useState(String(currentPage))

    // Keep input in sync when page changes externally (filter reset etc.)
    useEffect(() => {
        setInputVal(String(currentPage))
    }, [currentPage])

    const handleInputChange = (e) => {
        // Only allow digits
        const v = e.target.value.replace(/\D/g, "")
        setInputVal(v)
    }

    const commitInput = () => {
        const n = parseInt(inputVal, 10)
        if (!n || n < 1) {
            setInputVal(String(currentPage))
            return
        }
        // Clamp to max page — don't allow beyond totalPages
        if (n > totalPages) {
            setInputVal(String(totalPages))
            onGoToPage(totalPages)
            return
        }
        onGoToPage(n)
    }

    const handleKeyDown = (e) => {
        if (e.key === "Enter") commitInput()
        if (e.key === "Escape") setInputVal(String(currentPage))
    }

    // Range display: "1–20 of 143"
    const rangeStart = total === 0 ? 0 : (currentPage - 1) * limit + 1
    const rangeEnd   = Math.min(currentPage * limit, total)

    return (
        <div className="shrink-0 border-t border-(--border) bg-(--surface) px-6 py-3 flex items-center justify-between gap-4">

            {/* Left: record range */}
            <span className="text-[11px] font-black text-(--muted) uppercase tracking-widest whitespace-nowrap">
                {total > 0
                    ? <>{rangeStart}–{rangeEnd} <span className="text-(--muted)/60">of</span> {total}</>
                    : "No records"
                }
            </span>

            {/* Center: page controls */}
            <div className="flex items-center gap-2">
                {/* Prev */}
                <button
                    onClick={() => onGoToPage(currentPage - 1)}
                    disabled={currentPage <= 1 || isLoading}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border-2 border-(--border) bg-(--surface) text-(--muted) hover:border-(--accent-2) hover:text-(--accent-2) disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 active:scale-95"
                >
                    <ChevronLeft size={15} />
                </button>

                {/* Page number input */}
                <div className="flex items-center gap-1.5">
                    <input
                        type="text"
                        inputMode="numeric"
                        value={inputVal}
                        onChange={handleInputChange}
                        onBlur={commitInput}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading}
                        className="w-12 h-8 text-center text-sm font-black text-(--ink) bg-(--surface-muted) border-2 border-(--border) rounded-lg outline-none focus:border-(--accent-2) transition-all duration-150 disabled:opacity-50"
                    />
                    <span className="text-[11px] font-black text-(--muted) uppercase tracking-widest">/</span>
                    <span className="text-sm font-black text-(--ink) min-w-[1.5rem] text-center">{totalPages}</span>
                </div>

                {/* Next */}
                <button
                    onClick={() => onGoToPage(currentPage + 1)}
                    disabled={currentPage >= totalPages || isLoading}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border-2 border-(--border) bg-(--surface) text-(--muted) hover:border-(--accent-2) hover:text-(--accent-2) disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 active:scale-95"
                >
                    <ChevronRight size={15} />
                </button>
            </div>

            {/* Right: loading indicator */}
            <div className="w-20 flex justify-end">
                {isLoading
                    ? <div className="w-4 h-4 border-2 border-(--accent-2) border-t-(--accent-2) rounded-full animate-spin" />
                    : <span className="text-[11px] font-black text-(--muted)/50 uppercase tracking-widest">
                        pg {currentPage}
                      </span>
                }
            </div>
        </div>
    )
}

const DefaultEmpty = () => (
    <div className="h-[40vh] w-full flex justify-center items-center text-center text-(--muted)">
        No records found
    </div>
)

export default PaginatedList