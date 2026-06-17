import React, { useState, useRef, useCallback, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import api from "@shared/services/api.js"

// ─────────────────────────────────────────────────────────────────
//  usePaginatedFetch
//  Page-based. Fetches exactly one page at a time.
//  Returns:
//    data        – current page's records
//    total       – total record count from backend
//    totalPages  – Math.ceil(total / limit)
//    currentPage – active page number
//    isLoading   – fetch in progress
//    goToPage    – (n) => void  — the only way to change page
// ─────────────────────────────────────────────────────────────────
export const usePaginatedFetch = ({ endpoint, limit = 20, dataKey = null }) => {
    const [data, setData]           = useState([])
    const [total, setTotal]         = useState(0)
    const [currentPage, setCurrentPage] = useState(1)
    const [isLoading, setIsLoading] = useState(false)

    const isLoadingRef = useRef(false)
    const filterRef    = useRef({})

    const totalPages = total > 0 ? Math.ceil(total / limit) : 1

    const extractData = (res) => {
        if (dataKey) return res[dataKey] ?? []
        for (const key of ["students", "data", "items", "results", "records"]) {
            if (Array.isArray(res[key])) return res[key]
        }
        return []
    }

    const fetchPage = useCallback(async (page, filter) => {
        if (isLoadingRef.current) return
        isLoadingRef.current = true
        setIsLoading(true)

        if (filter !== undefined) filterRef.current = filter

        try {
            const params = new URLSearchParams({
                page,
                limit,
                ...filterRef.current,
            }).toString()

            const { data: res } = await api.get(`${endpoint}?${params}`)

            if (res.success) {
                // Replace — never append. No flicker because we set data atomically.
                setData(extractData(res))
                setTotal(res.totalStudents ?? res.total ?? 0)
                setCurrentPage(page)
            } else {
                setData([])
                setTotal(0)
                setCurrentPage(1)
            }
        } catch {
            setData([])
        } finally {
            isLoadingRef.current = false
            setIsLoading(false)
        }
    }, [endpoint, limit])

    // goToPage: clamps to valid range, then fetches
    const goToPage = useCallback((n) => {
        const clamped = Math.max(1, Math.min(n, totalPages))
        fetchPage(clamped)
    }, [fetchPage, totalPages])

    // Called when filter changes — reset to page 1
    const resetWithFilter = useCallback((filter) => {
        fetchPage(1, filter)
    }, [fetchPage])

    return { data, total, totalPages, currentPage, isLoading, goToPage, resetWithFilter }
}


// ─────────────────────────────────────────────────────────────────
//  PaginatedList — drop-in wrapper
//
//  Props:
//    endpoint        string    required
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
    endpoint,
    filter = {},
    renderItems,
    renderEmpty,
    limit = 20,
    dataKey = null,
    className = "",
    wrapperClassName = "",
}) => {
    const { data, total, totalPages, currentPage, isLoading, goToPage, resetWithFilter } =
        usePaginatedFetch({ endpoint, limit, dataKey })

    const filterStr = JSON.stringify(filter)

    useEffect(() => {
        resetWithFilter(filter)
    }, [filterStr])

    const isEmpty = !isLoading && data.length === 0

    return (
        <div className={`flex flex-col min-h-0 ${wrapperClassName}`}>

            {/* ── Content area ── */}
            <div className={`flex-1 overflow-y-auto relative ${className}`}>
                {/* Loading overlay — sits on top of old data so layout doesn't jump */}
                {isLoading && (
                    <div className="absolute inset-0 z-10 bg-surface/60 backdrop-blur-[1px] flex items-center justify-center">
                        <div className="flex items-center gap-3 text-primary bg-surface border border-edge rounded-2xl px-6 py-3 shadow-md">
                            <div className="w-5 h-5 border-2 border-edge-brand border-t-cyan-600 rounded-full animate-spin" />
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
        <div className="shrink-0 border-t border-edge bg-surface px-6 py-3 flex items-center justify-between gap-4">

            {/* Left: record range */}
            <span className="text-[11px] font-black text-ink-subtle uppercase tracking-widest whitespace-nowrap">
                {total > 0
                    ? <>{rangeStart}–{rangeEnd} <span className="text-ink-subtle/60">of</span> {total}</>
                    : "No records"
                }
            </span>

            {/* Center: page controls */}
            <div className="flex items-center gap-2">
                {/* Prev */}
                <button
                    onClick={() => onGoToPage(currentPage - 1)}
                    disabled={currentPage <= 1 || isLoading}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border-2 border-edge bg-surface text-ink-subtle hover:border-edge-brand hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 active:scale-95"
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
                        className="w-12 h-8 text-center text-sm font-black text-ink bg-surface-muted border-2 border-edge rounded-lg outline-none focus:border-edge-brand transition-all duration-150 disabled:opacity-50"
                    />
                    <span className="text-[11px] font-black text-ink-subtle uppercase tracking-widest">/</span>
                    <span className="text-sm font-black text-ink min-w-[1.5rem] text-center">{totalPages}</span>
                </div>

                {/* Next */}
                <button
                    onClick={() => onGoToPage(currentPage + 1)}
                    disabled={currentPage >= totalPages || isLoading}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border-2 border-edge bg-surface text-ink-subtle hover:border-edge-brand hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 active:scale-95"
                >
                    <ChevronRight size={15} />
                </button>
            </div>

            {/* Right: loading indicator */}
            <div className="w-20 flex justify-end">
                {isLoading
                    ? <div className="w-4 h-4 border-2 border-edge-brand border-t-cyan-600 rounded-full animate-spin" />
                    : <span className="text-[11px] font-black text-ink-subtle/50 uppercase tracking-widest">
                        pg {currentPage}
                      </span>
                }
            </div>
        </div>
    )
}

const DefaultEmpty = () => (
    <div className="h-[40vh] w-full flex justify-center items-center text-center text-ink-muted">
        No records found
    </div>
)

export default PaginatedList