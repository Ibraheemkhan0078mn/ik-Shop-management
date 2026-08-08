import React, { useRef, useState } from "react";
import { X, ZoomIn, ZoomOut, Download, Loader2 } from "lucide-react";
import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";

/**
 * ============================================================================
 *  PDF engine (inlined) — converts a DOM element into a pixel-perfect PDF.
 *  Uses html2canvas-pro (drop-in fork of html2canvas with oklch/oklab/
 *  color-mix/lab/lch support), so no CSS/color patching is needed anymore.
 * ============================================================================
 */

/**
 * Resolves the target DOM node from an id string, a ref object, or a
 * direct HTMLElement.
 */
function resolveElement(target) {
    if (target instanceof HTMLElement) return target;

    if (target && typeof target === "object" && "current" in target) {
        if (!target.current) {
            throw new Error("[pdfEngine] The ref you passed has no `current` element (is it mounted yet?).");
        }
        return target.current;
    }

    if (typeof target === "string") {
        const el = document.getElementById(target);
        if (!el) {
            throw new Error(`[pdfEngine] No element found with id "${target}".`);
        }
        return el;
    }

    throw new Error("[pdfEngine] Invalid target. Pass an element id, a ref, or an HTMLElement.");
}

/**
 * Temporarily strips scroll clipping / transforms that can cause
 * html2canvas to crop or misalign the captured image, then restores them.
 */
function withCleanCapture(el, callback) {
    const original = {
        overflow: el.style.overflow,
        height: el.style.height,
        maxHeight: el.style.maxHeight,
        transform: el.style.transform,
    };

    el.style.overflow = "visible";
    el.style.maxHeight = "none";
    el.style.height = "auto";
    el.style.transform = "none";

    try {
        return callback();
    } finally {
        el.style.overflow = original.overflow;
        el.style.height = original.height;
        el.style.maxHeight = original.maxHeight;
        el.style.transform = original.transform;
    }
}

/**
 * Converts a DOM element into a pixel-perfect, zero-margin PDF and
 * triggers a download (or returns the PDF instance).
 */
async function generatePdfFromElement(target, options = {}) {
    const {
        fileName = "document.pdf",
        scale = 3,
        backgroundColor = "#ffffff",
        multiPage = true,
        download = true,
    } = options;

    const element = resolveElement(target);

    // 1. Take a high-resolution screenshot of the element exactly as rendered.
    const canvas = await withCleanCapture(element, () =>
        html2canvas(element, {
            scale,
            useCORS: true,
            backgroundColor,
            logging: false,
            windowWidth: element.scrollWidth,
            windowHeight: element.scrollHeight,
        })
    );

    const canvasWidthPx = canvas.width;
    const canvasHeightPx = canvas.height;

    const pxToMm = (px) => (px / scale) * (25.4 / 96);

    const pdfWidthMm = pxToMm(canvasWidthPx);
    const pdfHeightMm = pxToMm(canvasHeightPx);

    const imgData = canvas.toDataURL("image/png", 1.0);

    let pdf;

    if (!multiPage) {
        pdf = new jsPDF({
            orientation: pdfWidthMm > pdfHeightMm ? "landscape" : "portrait",
            unit: "mm",
            format: [pdfWidthMm, pdfHeightMm],
        });
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidthMm, pdfHeightMm, undefined, "FAST");
    } else {
        const A4_WIDTH_MM = 210;
        const A4_HEIGHT_MM = 297;

        const scaledHeightMm = (canvasHeightPx * A4_WIDTH_MM) / canvasWidthPx;

        pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4",
        });

        if (scaledHeightMm <= A4_HEIGHT_MM) {
            pdf.addImage(imgData, "PNG", 0, 0, A4_WIDTH_MM, scaledHeightMm, undefined, "FAST");
        } else {
            const pageHeightPx = (A4_HEIGHT_MM * canvasWidthPx) / A4_WIDTH_MM;
            let renderedHeightPx = 0;
            let pageIndex = 0;

            const sliceCanvas = document.createElement("canvas");
            const sliceCtx = sliceCanvas.getContext("2d");
            sliceCanvas.width = canvasWidthPx;

            while (renderedHeightPx < canvasHeightPx) {
                const remaining = canvasHeightPx - renderedHeightPx;
                const thisSliceHeightPx = Math.min(pageHeightPx, remaining);

                sliceCanvas.height = thisSliceHeightPx;
                sliceCtx.clearRect(0, 0, sliceCanvas.width, sliceCanvas.height);
                sliceCtx.drawImage(
                    canvas,
                    0, renderedHeightPx, canvasWidthPx, thisSliceHeightPx,
                    0, 0, canvasWidthPx, thisSliceHeightPx
                );

                const sliceImgData = sliceCanvas.toDataURL("image/png", 1.0);
                const sliceHeightMm = (thisSliceHeightPx * A4_WIDTH_MM) / canvasWidthPx;

                if (pageIndex > 0) pdf.addPage();
                pdf.addImage(sliceImgData, "PNG", 0, 0, A4_WIDTH_MM, sliceHeightMm, undefined, "FAST");

                renderedHeightPx += thisSliceHeightPx;
                pageIndex += 1;
            }
        }
    }

    if (download) {
        pdf.save(fileName);
    }

    return pdf;
}

export default function PdfModal({
    isOpen,
    onClose,
    fileName = "document.pdf",
    labels = {},
    children,
    pdfOptions = {},
}) {
    const [zoom, setZoom] = useState(1);
    const [isExporting, setIsExporting] = useState(false);
    const previewRef = useRef(null);

    if (!isOpen) return null;

    const increaseZoom = () => setZoom((prev) => Math.min(prev + 0.1, 1.4));
    const decreaseZoom = () => setZoom((prev) => Math.max(prev - 0.1, 0.6));
    const resetZoom = () => setZoom(1);

    const handleExportPdf = async () => {
        if (!previewRef.current || isExporting) return;

        setIsExporting(true);
        try {
            const originalZoom = zoom;
            setZoom(1);

            await new Promise(resolve => setTimeout(resolve, 100));

            await generatePdfFromElement(previewRef.current, {
                fileName,
                scale: 2,
                pdfScale: 0.94,
                backgroundColor: '#ffffff',
                multiPage: true,
                download: true,
                useCORS: true,
                logging: false,
                ...pdfOptions,
            });

            setZoom(originalZoom);
        } catch (error) {
            console.error("PDF export failed:", error);
            alert('Failed to export PDF. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/50 p-4">
            <div className="relative w-full min-h-[80vh] overflow-hidden rounded-3xl bg-white shadow-2xl" style={{ maxWidth: 1400 }}>
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900">{labels.previewReport || 'Report Preview'}</h2>
                        <p className="text-sm text-slate-500">{labels.viewAndExportReport || 'Use zoom controls to preview before exporting'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={decreaseZoom}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                            title="Zoom out"
                        >
                            <ZoomOut size={18} />
                        </button>
                        <button
                            type="button"
                            onClick={resetZoom}
                            className="inline-flex h-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 px-3"
                            style={{ minWidth: 72 }}
                            title="Reset zoom"
                        >
                            {Math.round(zoom * 100)}%
                        </button>
                        <button
                            type="button"
                            onClick={increaseZoom}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                            title="Zoom in"
                        >
                            <ZoomIn size={18} />
                        </button>
                        <button
                            type="button"
                            onClick={handleExportPdf}
                            disabled={isExporting}
                            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isExporting ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    {labels.exporting || 'Exporting...'}
                                </>
                            ) : (
                                <>
                                    <Download size={16} />
                                    {labels.exportPdf || 'Export PDF'}
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                            title="Close"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                <div className="h-[calc(100vh-104px)] overflow-auto p-6 bg-slate-100">
                    <div
                        ref={previewRef}
                        className="mx-auto bg-white shadow-xl"
                        style={{
                            transform: `scale(${zoom})`,
                            transformOrigin: 'top center',
                            width: `${100 / zoom}%`,
                            maxWidth: '1400px',
                        }}
                    >
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}