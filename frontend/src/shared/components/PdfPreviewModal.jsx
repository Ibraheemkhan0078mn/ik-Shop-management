import React, { useState } from "react";
import { X, Printer, Download } from "lucide-react";
import { usePDF } from "react-to-pdf";

/**
 * PdfPreviewModal - A modal component that displays content for PDF preview and export
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - The content to display and export
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Callback when modal is closed
 * @param {string} props.fileName - Name of the PDF file to download
 * @param {Function} props.onBeforeExport - Optional callback before export (e.g., expand all)
 * @param {Function} props.onAfterExport - Optional callback after export (e.g., collapse all)
 */
const PdfPreviewModal = ({ 
    children, 
    isOpen, 
    onClose, 
    fileName = "document.pdf",
    onBeforeExport = null,
    onAfterExport = null
}) => {
    const { toPDF, targetRef } = usePDF({ 
        filename: fileName,
        scale: 0.8
    });
    const [isExporting, setIsExporting] = useState(false);

    const handleExportPDF = async () => {
        if (isExporting) return;
        
        setIsExporting(true);
        try {
            // Run pre-export callback
            if (onBeforeExport) {
                await onBeforeExport();
            }
            
            // Wait for DOM to update
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Generate PDF
            await toPDF();
            
            // Run post-export callback
            if (onAfterExport) {
                await onAfterExport();
            }
        } catch (error) {
            console.error("PDF export failed:", error);
        } finally {
            setIsExporting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop with blur */}
            <div 
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />
            
            {/* Modal Content */}
            <div className="relative bg-white rounded-xl shadow-2xl w-[90vw] h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">PDF Preview</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100 transition"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>
                
                {/* Content Area - Scrollable */}
                <div className="flex-1 overflow-auto p-6 bg-gray-50">
                    <div ref={targetRef} className="bg-white p-6 rounded-lg shadow-sm min-h-full">
                        {children}
                    </div>
                </div>
                
                {/* Footer - Print Button */}
                <div className="flex items-center justify-end p-4 border-t border-gray-200 bg-white">
                    <button
                        onClick={handleExportPDF}
                        disabled={isExporting}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        {isExporting ? (
                            <>
                                <Download size={18} className="animate-spin" />
                                <span>Exporting...</span>
                            </>
                        ) : (
                            <>
                                <Printer size={18} />
                                <span>Export PDF</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PdfPreviewModal;
