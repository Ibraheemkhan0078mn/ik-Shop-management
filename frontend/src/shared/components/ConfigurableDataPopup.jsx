import React, { useRef } from 'react';
import { X, Printer } from 'lucide-react';
import { generatePdfFromElement } from '../services/pdfEngine.service.js';

/**
 * ConfigurableDataPopup - A reusable popup that displays data based on a configuration object
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the popup is open
 * @param {Function} props.onClose - Function to close the popup
 * @param {Object} props.data - The data object to display
 * @param {Object} props.config - Configuration object mapping field names to data paths
 *   Example: { name: "customer.name", amount: "order.total", date: "order.createdAt" }
 * @param {string} props.title - Optional title for the popup
 * @param {string} props.fileName - Optional filename for PDF download
 */
const ConfigurableDataPopup = ({
    isOpen,
    onClose,
    data,
    config,
    title = "Details",
    fileName = "document.pdf"
}) => {
    const contentRef = useRef(null);

    // Function to extract value from nested object using dot notation
    const getValueByPath = (obj, path) => {
        if (!obj || !path) return '-';
        
        const keys = path.split('.');
        let value = obj;
        
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return '-';
            }
        }
        
        // Handle null/undefined
        if (value === null || value === undefined) return '-';
        
        // Handle dates
        if (value instanceof Date) {
            return value.toLocaleDateString();
        }
        
        // Handle arrays
        if (Array.isArray(value)) {
            return value.length > 0 ? value.join(', ') : '-';
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
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
                        <table className="w-full">
                            <tbody>
                                {Object.entries(config).map(([fieldName, dataPath]) => {
                                    const value = getValueByPath(data, dataPath);
                                    const heading = formatHeading(fieldName);
                                    
                                    return (
                                        <tr key={fieldName} className="border-b border-gray-100">
                                            <td className="py-3 px-4 font-semibold text-gray-700 w-1/3 bg-gray-50">
                                                {heading}
                                            </td>
                                            <td className="py-3 px-4 text-gray-600">
                                                {value}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
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

export default ConfigurableDataPopup;
