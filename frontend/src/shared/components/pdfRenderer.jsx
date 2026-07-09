import React, { useRef, useEffect } from 'react';
import { X, Printer } from 'lucide-react';
import { generatePdfFromElement } from '../services/pdfEngine.service.js';

/**
 * PdfRenderer - A component that displays data in a table format and prints it cleanly
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the renderer is open
 * @param {Function} props.onClose - Function to close the renderer
 * @param {Array} props.data - Array of data objects to display
 * @param {Object} props.config - Configuration object mapping field names to data paths
 *   Example: { name: "customer.name", amount: "order.total", date: "order.createdAt" }
 * @param {string} props.title - Optional title for the document
 * @param {string} props.fileName - Optional filename for PDF download
 */
const PdfRenderer = ({
    isOpen,
    onClose,
    data = [],
    config = {},
    title = "Document",
    fileName = "document.pdf"
}) => {
    const contentRef = useRef(null);

    // Function to extract value from nested object using dot notation
    const getValueByPath = (obj, path) => {
        if (!obj || !path) return '';
        
        const keys = path.split('.');
        let value = obj;
        
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return '';
            }
        }
        
        // Handle null/undefined
        if (value === null || value === undefined) return '';
        
        // Handle dates
        if (value instanceof Date) {
            return value.toLocaleDateString();
        }
        
        // Handle arrays
        if (Array.isArray(value)) {
            return value.length > 0 ? value.join(', ') : '';
        }
        
        return value;
    };

    // Convert field name to readable heading
    const formatHeading = (fieldName) => {
        return fieldName
            .replace(/([A-Z])/g, ' $1') // Add space before capital letters
            .replace(/_/g, ' ') // Replace underscores with spaces
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    // Handle print functionality
    const handlePrint = async () => {
        if (contentRef.current) {
            try {
                await generatePdfFromElement(contentRef.current, {
                    fileName: fileName,
                    scale: 3,
                    backgroundColor: "#ffffff",
                    multiPage: true,
                    download: true
                });
            } catch (error) {
                console.error("PDF generation failed:", error);
            }
        }
    };

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrint}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            title="Print"
                        >
                            <Printer className="w-5 h-5 text-gray-600" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            title="Close"
                        >
                            <X className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div ref={contentRef} className="bg-white">
                        {data.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No data to display</p>
                        ) : (
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-gray-100">
                                        {Object.keys(config).map((fieldName) => (
                                            <th 
                                                key={fieldName} 
                                                className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700"
                                            >
                                                {formatHeading(fieldName)}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((item, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            {Object.entries(config).map(([fieldName, dataPath]) => {
                                                const value = getValueByPath(item, dataPath);
                                                return (
                                                    <td 
                                                        key={`${index}-${fieldName}`} 
                                                        className="border border-gray-300 px-4 py-2 text-sm text-gray-600"
                                                    >
                                                        {value}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
                    <button
                        onClick={handlePrint}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <Printer className="w-4 h-4" />
                        Print
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PdfRenderer;
