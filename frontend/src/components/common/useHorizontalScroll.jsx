import { useEffect, useRef } from "react";

export default function useHorizontalScroll(ref, enabled = true, speed = 6, friction = 0.92) {
    const velocityRef = useRef(0);

    useEffect(() => {
        const el = ref?.current;
        if (!el || !enabled) return;

        let animationFrame;

        const onWheel = (e) => {
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                e.preventDefault();
                velocityRef.current += e.deltaY * speed;
            }
        };

        const animate = () => {
            if (Math.abs(velocityRef.current) > 0.1) {
                el.scrollLeft += velocityRef.current;
                velocityRef.current *= friction; // slow down gradually
            }
            animationFrame = requestAnimationFrame(animate);
        };

        el.addEventListener("wheel", onWheel, { passive: false });
        animate();

        return () => {
            el.removeEventListener("wheel", onWheel);
            cancelAnimationFrame(animationFrame);
        };
    }, [ref, enabled, speed, friction]);
}
