import React,{ useEffect, useRef, useState } from "react"

const EASINGS = {
    easeOut:   t => 1 - Math.pow(1 - t, 3),
    easeInOut: t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2,
    linear:    t => t,
    spring:    t => {
        if (t === 0) return 0
        if (t === 1) return 1
        const c4 = (2 * Math.PI) / 3
        return Math.pow(2, -10*t) * Math.sin((t * 10 - 0.75) * c4) + 1
    },
}

/**
 * AnimatedNumber
 *
 * Props:
 *   value     {number}  — target number to count to
 *   duration  {number}  — animation duration in ms (default: 1200)
 *   easing    {string}  — "easeOut" | "easeInOut" | "linear" | "spring" (default: "easeOut")
 *   decimals  {number}  — decimal places to show (default: 0)
 *   prefix    {string}  — e.g. "Rs. "
 *   suffix    {string}  — e.g. "%"
 *   className {string}  — extra class on the span
 *
 * Usage:
 *   <AnimatedNumber value={125000} prefix="Rs. " duration={1000} easing="spring" />
 */
const AnimatedNumber = ({
    value    = 0,
    duration = 1200,
    easing   = "easeOut",
    decimals = 0,
    prefix   = "",
    suffix   = "",
    className = "",
}) => {
    const spanRef   = useRef(null)
    const rafRef    = useRef(null)
    const fromRef   = useRef(0)          // current displayed value when new animation starts

    useEffect(() => {
        const easeFn = EASINGS[easing] ?? EASINGS.easeOut
        const from   = fromRef.current
        const to     = value
        let   start  = null

        // Cancel any in-progress animation
        if (rafRef.current) cancelAnimationFrame(rafRef.current)

        function step(ts) {
            if (!start) start = ts
            const elapsed = ts - start
            const t       = Math.min(elapsed / duration, 1)
            const current = from + (to - from) * easeFn(t)

            // Write directly to DOM — no React setState, zero re-renders
            if (spanRef.current) {
                spanRef.current.textContent =
                    prefix + current.toFixed(decimals) + suffix
            }

            if (t < 1) {
                rafRef.current = requestAnimationFrame(step)
            } else {
                fromRef.current = to
                rafRef.current  = null
            }
        }

        rafRef.current = requestAnimationFrame(step)

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
        }
    }, [value, duration, easing, decimals, prefix, suffix])

    // Initial render — show 0 (or prefix/suffix around it)
    return (
        <span ref={spanRef} className={className}>
            {prefix}{(0).toFixed(decimals)}{suffix}
        </span>
    )
}

export default AnimatedNumber