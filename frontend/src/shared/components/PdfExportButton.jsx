import React, { useRef } from 'react';
import { Printer } from 'lucide-react';
import { generatePdfFromElement } from '../services/pdfEngine.service.js';

/**
 * PdfExportButton - A reusable button to export content as PDF
 * 
 * @param {Object} props
 * @param {React.RefObject} props.contentRef - Ref to the content element to export
 * @param {string} props.fileName - Name of the PDF file to download
 * @param {string} props.className - Optional CSS classes
 * @param {boolean} props.disabled - Whether the button is disabled
 */
const PdfExportButton = ({ 
    contentRef, 
    fileName = "report.pdf", 
    className = "",
    disabled = false 
}) => {
    const [isExporting, setIsExporting] = React.useState(false);

    const handleExport = async () => {
        if (!contentRef?.current || isExporting) return;
        
        setIsExporting(true);
        try {
            await generatePdfFromElement(contentRef.current, {
                fileName,
                scale: 3,
                backgroundColor: "#ffffff",
                multiPage: true,
                download: true
            });
        } catch (error) {
            console.error("PDF export failed:", error);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <button
            onClick={handleExport}
            disabled={disabled || isExporting}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                disabled || isExporting 
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
            } ${className}`}
            title={isExporting ? "Exporting..." : "Export as PDF"}
        >
            <Printer className="w-4 h-4" />
            {isExporting ? "Exporting..." : "Export PDF"}
        </button>
    );
};

export default PdfExportButton;
