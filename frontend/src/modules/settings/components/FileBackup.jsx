import React, { useState } from "react";
import { FileSpreadsheet, FileText, ChevronDown, ChevronUp, Filter, Download, Calendar, Search, User, Package, ShoppingCart, Users, DollarSign, Trash2, CheckSquare, Square } from "lucide-react";
import { toast } from "sonner";
import { useExportFilteredDataMutation } from "../../backup/api/backup.api.js";
import { useSelector } from "react-redux";

const MODEL_CONFIG = [
    { id: 'orders', name: 'Orders', icon: ShoppingCart },
    { id: 'holdOrders', name: 'Hold Orders', icon: ShoppingCart },
    { id: 'products', name: 'Products', icon: Package },
    { id: 'categories', name: 'Categories', icon: Package },
    { id: 'brands', name: 'Brands', icon: Package },
    { id: 'wastage', name: 'Product Wastage', icon: Trash2 },
    { id: 'purchases', name: 'Purchases', icon: ShoppingCart },
    { id: 'purchaseReturns', name: 'Purchase Returns', icon: ShoppingCart },
    { id: 'customers', name: 'Customers', icon: Users },
    { id: 'suppliers', name: 'Suppliers', icon: Users },
    { id: 'qarzaAccounts', name: 'Credits & Debits Accounts', icon: DollarSign },
    { id: 'expenses', name: 'Expenses', icon: DollarSign },
    { id: 'staff', name: 'Staff', icon: User },
    { id: 'users', name: 'Users', icon: User },
];

const FILTER_CONFIG = {
    orders: [
        { id: 'dateRange', label: 'Date Range', type: 'dateRange', icon: Calendar },
        { id: 'customer', label: 'Customer', type: 'text', icon: User },
        { id: 'status', label: 'Status', type: 'select', options: ['All', 'Completed', 'Pending', 'Cancelled'], icon: Filter },
        { id: 'paymentMethod', label: 'Payment Method', type: 'select', options: ['All', 'Cash', 'Online', 'Credit', 'Hybrid'], icon: DollarSign },
    ],
    holdOrders: [
        { id: 'dateRange', label: 'Date Range', type: 'dateRange', icon: Calendar },
        { id: 'customer', label: 'Customer', type: 'text', icon: User },
    ],
    products: [
        { id: 'category', label: 'Category', type: 'select', options: ['All'], icon: Package },
        { id: 'subCategory', label: 'Sub Category', type: 'select', options: ['All'], icon: Package },
        { id: 'brand', label: 'Brand', type: 'select', options: ['All'], icon: Package },
        { id: 'stockStatus', label: 'Stock Status', type: 'select', options: ['All', 'In Stock', 'Out of Stock', 'Low Stock'], icon: Package },
        { id: 'search', label: 'Search', type: 'text', icon: Search },
    ],
    categories: [
        { id: 'search', label: 'Search', type: 'text', icon: Search },
    ],
    brands: [
        { id: 'search', label: 'Search', type: 'text', icon: Search },
    ],
    wastage: [
        { id: 'dateRange', label: 'Date Range', type: 'dateRange', icon: Calendar },
        { id: 'product', label: 'Product', type: 'text', icon: Package },
    ],
    purchases: [
        { id: 'dateRange', label: 'Date Range', type: 'dateRange', icon: Calendar },
        { id: 'supplier', label: 'Supplier', type: 'text', icon: Users },
        { id: 'status', label: 'Status', type: 'select', options: ['All', 'Ordered', 'Delivered', 'Cancelled'], icon: Filter },
    ],
    purchaseReturns: [
        { id: 'dateRange', label: 'Date Range', type: 'dateRange', icon: Calendar },
        { id: 'supplier', label: 'Supplier', type: 'text', icon: Users },
    ],
    customers: [
        { id: 'search', label: 'Search', type: 'text', icon: Search },
        { id: 'phone', label: 'Phone', type: 'text', icon: User },
    ],
    suppliers: [
        { id: 'search', label: 'Search', type: 'text', icon: Search },
    ],
    qarzaAccounts: [
        { id: 'type', label: 'Account Type', type: 'select', options: ['All', 'Credit', 'Debit'], icon: Filter },
        { id: 'search', label: 'Search', type: 'text', icon: Search },
    ],
    expenses: [
        { id: 'dateRange', label: 'Date Range', type: 'dateRange', icon: Calendar },
        { id: 'category', label: 'Category', type: 'select', options: ['All'], icon: Filter },
        { id: 'search', label: 'Search', type: 'text', icon: Search },
    ],
    staff: [
        { id: 'role', label: 'Role', type: 'select', options: ['All', 'Admin', 'Staff', 'Waiter'], icon: User },
        { id: 'status', label: 'Status', type: 'select', options: ['All', 'Active', 'Inactive'], icon: Filter },
        { id: 'search', label: 'Search', type: 'text', icon: Search },
    ],
    users: [
        { id: 'role', label: 'Role', type: 'select', options: ['All', 'Admin', 'Staff'], icon: User },
        { id: 'search', label: 'Search', type: 'text', icon: Search },
    ],
};

export default function FileBackup({ labels }) {
    const { id: userId } = useSelector(s => s.auth) || {};
    const [exportFilteredData] = useExportFilteredDataMutation();
    const [selectedModels, setSelectedModels] = useState([]);
    const [expandedFilters, setExpandedFilters] = useState({});
    const [filters, setFilters] = useState({});
    const [exportPath, setExportPath] = useState('./backups');
    const [isExporting, setIsExporting] = useState(false);
    const [showPathDialog, setShowPathDialog] = useState(false);
    const [exportType, setExportType] = useState(null);

    const toggleModelSelection = (modelId) => {
        setSelectedModels(prev => {
            const newSelection = prev.includes(modelId) 
                ? prev.filter(id => id !== modelId)
                : [...prev, modelId];
            
            // Initialize filters for newly selected model
            if (!prev.includes(modelId) && newSelection.includes(modelId)) {
                setFilters(prev => ({
                    ...prev,
                    [modelId]: {}
                }));
            }
            
            // Remove filters for deselected model
            if (prev.includes(modelId) && !newSelection.includes(modelId)) {
                setFilters(prev => {
                    const newFilters = { ...prev };
                    delete newFilters[modelId];
                    return newFilters;
                });
            }
            
            return newSelection;
        });
    };

    const selectAllModels = () => {
        const allModelIds = MODEL_CONFIG.map(m => m.id);
        setSelectedModels(allModelIds);
        const initialFilters = {};
        allModelIds.forEach(id => {
            initialFilters[id] = {};
        });
        setFilters(initialFilters);
    };

    const clearAllModels = () => {
        setSelectedModels([]);
        setFilters({});
    };

    const toggleFilterExpansion = (modelId) => {
        setExpandedFilters(prev => ({
            ...prev,
            [modelId]: !prev[modelId]
        }));
    };

    const updateFilter = (modelId, filterId, value) => {
        setFilters(prev => ({
            ...prev,
            [modelId]: {
                ...prev[modelId],
                [filterId]: value
            }
        }));
    };

    const handleExport = async (type) => {
        if (selectedModels.length === 0) {
            toast.error('Please select at least one model to export');
            return;
        }
        
        if (!exportPath || exportPath.trim() === '') {
            toast.error('Please provide an export path');
            return;
        }
        
        setExportType(type);
        setShowPathDialog(true);
    };

    const confirmExport = async () => {
        setShowPathDialog(false);
        setIsExporting(true);
        
        try {
            const exportData = {
                models: selectedModels,
                filters: filters,
                exportPath: exportPath,
                exportType: exportType,
                userId: userId || "global"
            };

            const result = await exportFilteredData(exportData).unwrap();
            
            toast.success(`${exportType === 'excel' ? 'Excel' : 'PDF'} export completed successfully`);
            console.log('Export result:', result);
        } catch (error) {
            console.error('Export failed:', error);
            toast.error(`${exportType === 'excel' ? 'Excel' : 'PDF'} export failed`);
        } finally {
            setIsExporting(false);
        }
    };

    const renderFilterInput = (modelId, filter) => {
        const currentValue = filters[modelId]?.[filter.id] || '';

        switch (filter.type) {
            case 'text':
                return (
                    <input
                        type="text"
                        value={currentValue}
                        onChange={(e) => updateFilter(modelId, filter.id, e.target.value)}
                        placeholder={`Enter ${filter.label.toLowerCase()}`}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]"
                    />
                );
            case 'select':
                return (
                    <select
                        value={currentValue}
                        onChange={(e) => updateFilter(modelId, filter.id, e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]"
                    >
                        {filter.options.map(option => (
                            <option key={option} value={option === 'All' ? '' : option.toLowerCase()}>
                                {option}
                            </option>
                        ))}
                    </select>
                );
            case 'dateRange':
                return (
                    <div className="flex gap-2">
                        <input
                            type="date"
                            value={currentValue.startDate || ''}
                            onChange={(e) => updateFilter(modelId, filter.id, { ...currentValue, startDate: e.target.value })}
                            className="flex-1 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]"
                        />
                        <input
                            type="date"
                            value={currentValue.endDate || ''}
                            onChange={(e) => updateFilter(modelId, filter.id, { ...currentValue, endDate: e.target.value })}
                            className="flex-1 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]"
                        />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-xl font-semibold text-[var(--ink)] mb-2">File Backup</h2>
                <p className="text-sm text-[var(--muted)]">Export your data to Excel or PDF with custom filters</p>
            </div>

            {/* Model Selection */}
            <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-[var(--ink)]">Select Data Models</h3>
                    <div className="flex gap-2">
                        <button
                            onClick={selectAllModels}
                            className="text-sm px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--app-bg)] transition-colors"
                        >
                            Select All
                        </button>
                        <button
                            onClick={clearAllModels}
                            className="text-sm px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--app-bg)] transition-colors"
                        >
                            Clear All
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {MODEL_CONFIG.map(model => {
                        const Icon = model.icon;
                        const isSelected = selectedModels.includes(model.id);
                        return (
                            <button
                                key={model.id}
                                onClick={() => toggleModelSelection(model.id)}
                                className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                                    isSelected 
                                        ? 'border-[var(--accent-2)] bg-[var(--accent-2)]/10 text-[var(--accent-2)]' 
                                        : 'border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--app-bg)]'
                                }`}
                            >
                                {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                                <Icon size={16} />
                                <span className="text-sm font-medium">{model.name}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Filters Section */}
            {selectedModels.length > 0 && (
                <div className="card p-6">
                    <h3 className="text-lg font-semibold text-[var(--ink)] mb-4">Apply Filters</h3>
                    
                    <div className="space-y-4">
                        {selectedModels.map(modelId => {
                            const modelConfig = MODEL_CONFIG.find(m => m.id === modelId);
                            const modelFilters = FILTER_CONFIG[modelId] || [];
                            const isExpanded = expandedFilters[modelId];
                            const ModelIcon = modelConfig.icon;

                            return (
                                <div key={modelId} className="border border-[var(--border)] rounded-lg overflow-hidden">
                                    <button
                                        onClick={() => toggleFilterExpansion(modelId)}
                                        className="w-full flex items-center justify-between p-4 bg-[var(--surface-muted)] hover:bg-[var(--surface)] transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <ModelIcon size={18} className="text-[var(--accent-2)]" />
                                            <span className="font-medium text-[var(--ink)]">{modelConfig.name}</span>
                                            <span className="text-xs text-[var(--muted)]">
                                                ({Object.keys(filters[modelId] || {}).length} filters applied)
                                            </span>
                                        </div>
                                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                    </button>

                                    {isExpanded && (
                                        <div className="p-4 space-y-4">
                                            {modelFilters.map(filter => {
                                                const FilterIcon = filter.icon;
                                                return (
                                                    <div key={filter.id} className="space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <FilterIcon size={16} className="text-[var(--muted)]" />
                                                            <label className="text-sm font-medium text-[var(--ink)]">{filter.label}</label>
                                                        </div>
                                                        {renderFilterInput(modelId, filter)}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Export Path */}
            <div className="card p-6">
                <h3 className="text-lg font-semibold text-[var(--ink)] mb-4">Export Settings</h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-[var(--ink)] mb-2 block">Export Path</label>
                        <input
                            type="text"
                            value={exportPath}
                            onChange={(e) => setExportPath(e.target.value)}
                            placeholder="./backups"
                            className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]"
                        />
                    </div>
                </div>
            </div>

            {/* Export Buttons */}
            <div className="card p-6">
                <div className="flex flex-wrap gap-4">
                    <button
                        onClick={() => handleExport('excel')}
                        disabled={isExporting || selectedModels.length === 0}
                        className="flex items-center gap-2 px-6 py-3 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FileSpreadsheet size={18} />
                        {isExporting && exportType === 'excel' ? 'Exporting...' : 'Export to Excel'}
                    </button>
                    <button
                        onClick={() => handleExport('pdf')}
                        disabled={isExporting || selectedModels.length === 0}
                        className="flex items-center gap-2 px-6 py-3 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FileText size={18} />
                        {isExporting && exportType === 'pdf' ? 'Exporting...' : 'Export to PDF'}
                    </button>
                </div>
            </div>

            {/* Path Confirmation Dialog */}
            {showPathDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[var(--surface)] rounded-xl p-6 max-w-md w-full border border-[var(--border)]">
                        <h3 className="text-lg font-semibold text-[var(--ink)] mb-4">Confirm Export</h3>
                        <p className="text-sm text-[var(--muted)] mb-4">
                            Export {selectedModels.length} model(s) to {exportType.toUpperCase()} at path:
                        </p>
                        <div className="bg-[var(--surface-muted)] p-3 rounded-lg mb-4">
                            <code className="text-sm text-[var(--accent-2)]">{exportPath}</code>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={confirmExport}
                                className="flex-1 px-4 py-2 rounded-lg bg-[var(--accent-2)] text-white hover:bg-[var(--accent-2)]/90 transition-colors"
                            >
                                Confirm
                            </button>
                            <button
                                onClick={() => setShowPathDialog(false)}
                                className="flex-1 px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--app-bg)] transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
