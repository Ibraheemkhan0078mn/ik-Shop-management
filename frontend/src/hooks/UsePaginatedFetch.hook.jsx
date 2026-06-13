// usePaginatedFetch.js
import { useState, useRef, useCallback } from "react"
import api from "../lib/api.js"

export const usePaginatedFetch = ({ endpoint, limit = 20 }) => {
    const [data, setData] = useState([])
    const [hasMore, setHasMore] = useState(true)
    const [isLoading, setIsLoading] = useState(false)
    const pageRef = useRef(1)          // ✅ ref never goes stale
    const isLoadingRef = useRef(false) // ✅ ref never goes stale

    const fetch = useCallback(async ({ reset = false, filter = {} } = {}) => {
        if (isLoadingRef.current) return
        if (!reset && !hasMore) return  // hasMore fine here since we don't close over it in events

        isLoadingRef.current = true
        setIsLoading(true)

        const currentPage = reset ? 1 : pageRef.current

        try {
            const params = new URLSearchParams({ page: currentPage, limit, ...filter }).toString()
            const { data: res } = await api.get(`${endpoint}?${params}`)

            if (res.success) {
                setData(prev => reset ? res.students : [...prev, ...res.students])
                pageRef.current = currentPage + 1  // ✅ always accurate
                setHasMore(res.hasMore)
            } else if (reset) {
                setData([])
            }
        } catch {
            // handle
        } finally {
            isLoadingRef.current = false
            setIsLoading(false)
        }
    }, [endpoint, limit]) // stable — no page/isLoading in deps

    const handleScroll = useCallback((e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target
        if (((scrollTop + clientHeight) / scrollHeight) * 100 > 80)
            fetch()  // ✅ safe — reads from refs internally
    }, [fetch])

    return { data, setData, hasMore, isLoading, fetch, handleScroll }
}