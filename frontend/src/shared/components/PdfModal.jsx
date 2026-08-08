import React, { useRef, useState } from "react";
import { X, ZoomIn, ZoomOut, Download, Loader2 } from "lucide-react";
import { generatePdfFromElement } from "../services/pdfEngine.service.js";

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
            // Reset zoom to 1 for accurate PDF capture
            const originalZoom = zoom;
            setZoom(1);
            
            // Wait for zoom to apply
            await new Promise(resolve => setTimeout(resolve, 100));

            await generatePdfFromElement(previewRef.current, {
                fileName,
                scale: 2, // Reduced from 3 for faster generation
                pdfScale: 0.94,
                backgroundColor: '#ffffff',
                multiPage: true,
                download: true,
                useCORS: true,
                logging: false,
                ...pdfOptions,
            });

            // Restore zoom
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
