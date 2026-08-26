import React, { useEffect, useMemo, useState } from "react";
import { Filter, Package, RefreshCw, Search, TrendingUp, RotateCcw, Trash2, Receipt, DollarSign } from "lucide-react";
import { useGetCategoriesQuery } from "../../productsModule/services/category.service.js";
import { useGetInventoryKPIReportQuery, useGetInventoryReportQuery } from "../services/reports.service.js";
import { useSettings } from "../../settings/hooks/useSettings.js";
import { getReportsLabels } from "../labels/reportsLabels.js";
import { toImageUrl } from "../../../shared/utilities/image.utility.js";
import PdfModal from "../../../shared/components/PdfModal.jsx";
import InventoryReportPdfTemplate from "../components/InventoryReportPdfTemplate.jsx";

const getDatesFromPeriod = (period) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (period === "today") return { from: today, to: today };
    if (period === "month") return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: new Date(now.getFullYear(), now.getMonth() + 1, 0) };
    if (period === "3month") return { from: new Date(now.getFullYear(), now.getMonth() - 3, 1), to: new Date(now.getFullYear(), now.getMonth() + 1, 0) };
    if (period === "year") return { from: new Date(now.getFullYear(), 0, 1), to: new Date(now.getFullYear(), 11, 31) };
    return { from: null, to: null };
};
const dateValue = (date) => date ? date.toISOString().slice(0, 10) : "";

function KpiCard({ label, value, icon: Icon, color = "var(--accent-2)", money = false }) {
    return (
        <div className="rounded-2xl border p-4 transition-shadow hover:shadow-sm" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}17` }}>
                    <Icon size={18} style={{ color }} />
                </div>
                <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wide truncate" style={{ color: 'var(--muted)' }}>{label}</p>
                    <p className="text-base font-bold tabular-nums truncate" style={{ color: 'var(--ink)' }}>{money ? "Rs " : ""}{Number(value || 0).toLocaleString()}</p>
                </div>
            </div>
        </div>
    );
}

export default function InventoryReport() {
    const { settings } = useSettings();
    const labels = getReportsLabels(settings?.language || "en");
    const [period, setPeriod] = useState("month");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [productName, setProductName] = useState("");
    const [productCode, setProductCode] = useState("");
    const [tag, setTag] = useState("");
    const [page, setPage] = useState(1);
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
    const limit = 20;
    const periodDates = useMemo(() => getDatesFromPeriod(period), [period]);
    const filters = useMemo(() => ({ fromDate: period === "custom" ? fromDate : dateValue(periodDates.from), toDate: period === "custom" ? toDate : dateValue(periodDates.to), categoryId, productName, productCode, tag, page, limit }), [period, fromDate, toDate, periodDates, categoryId, productName, productCode, tag, page]);
    const kpiFilters = useMemo(() => ({ ...filters, page: undefined, limit: undefined }), [filters]);
    const { data: rowsResponse, isLoading: rowsLoading, isFetching: rowsFetching, refetch: refetchRows } = useGetInventoryReportQuery(filters);
    const { data: kpiResponse, isLoading: kpiLoading, isFetching: kpiFetching, refetch: refetchKpi } = useGetInventoryKPIReportQuery(kpiFilters);
    const { data: categoriesResponse } = useGetCategoriesQuery();
    const rows = rowsResponse?.data || [];
    const summary = kpiResponse?.data || {};
    const total = rowsResponse?.total || 0;
    const totalPages = Math.max(1, rowsResponse?.totalPages || Math.ceil(total / limit));
    const loading = rowsLoading || rowsFetching || kpiLoading || kpiFetching;

    useEffect(() => setPage(1), [period, fromDate, toDate, categoryId, productName, productCode, tag]);
    const refresh = () => { refetchRows(); refetchKpi(); };
    const reportData = { data: rows, summary };
    const tagOptions = ["dead_stock", "low_stock", "fast_selling", "overstock", "expired", "near_expiry", "high_return"];
    const columns = [
        ["Product", product => <div className="flex items-center gap-2 min-w-[180px]"><img src={toImageUrl(product.image) || ""} alt="" className="w-9 h-9 rounded-lg object-cover" style={{ background: 'var(--surface-muted)' }} onError={e => { e.currentTarget.style.display = "none" }} /><span className="font-medium">{product.name || "—"}</span></div>],
        ["Code", product => product.productCode || product.hotKeySku || product.barcode || "—"],
        ["Current Stock", product => product.currentStock], ["Purchased Qty", product => product.totalPurchased], ["Purchase Frequency", product => product.purchaseFrequency], ["Purchase Return Qty", product => product.purchaseReturnQuantity], ["Purchase Return Frequency", product => product.purchaseReturnFrequency], ["Order Qty", product => product.orderQuantity], ["Order Frequency", product => product.orderFrequency], ["Order Return Qty", product => product.orderReturnQuantity], ["Order Return Frequency", product => product.orderReturnFrequency], ["Wastage Qty", product => product.wastageQuantity], ["Wastage Frequency", product => product.wastageFrequency], ["Revenue", product => `Rs ${Number(product.totalRevenue || 0).toLocaleString()}`],
    ];

    return (
        <div className="p-6 min-h-screen" style={{ background: 'var(--app-bg)' }}>
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold font-display" style={{ color: 'var(--ink)' }}>{labels.inventoryReport}</h1>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>{labels.inventoryAnalysis}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={refresh} className="px-4 py-2 rounded-xl border transition-colors flex items-center gap-2" style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--ink)' }}>
                        <RefreshCw size={16} className={loading ? "animate-spin" : ""} style={{ color: 'var(--accent-2)' }} />
                        {labels.refresh}
                    </button>
                    <button onClick={() => setIsPdfModalOpen(true)} className="px-4 py-2 rounded-xl text-white transition-opacity hover:opacity-90 flex items-center gap-2" style={{ background: 'var(--accent-2)' }}>
                        {labels.exportPdf}
                    </button>
                </div>
            </div>

            <div className="rounded-2xl border p-4 mb-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2 mb-3">
                    <Filter size={16} style={{ color: 'var(--accent-2)' }} />
                    <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{labels.filters}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <select value={period} onChange={e => setPeriod(e.target.value)} className="px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2" style={{ borderColor: 'var(--border)', background: 'var(--app-bg)', color: 'var(--ink)' }}>
                        <option value="today">{labels.today}</option><option value="month">{labels.thisMonth}</option><option value="3month">{labels.last3Months}</option><option value="year">{labels.thisYear}</option><option value="custom">{labels.customRange}</option>
                    </select>
                    {period === "custom" && <>
                        <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2" style={{ borderColor: 'var(--border)', background: 'var(--app-bg)', color: 'var(--ink)' }} />
                        <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2" style={{ borderColor: 'var(--border)', background: 'var(--app-bg)', color: 'var(--ink)' }} />
                    </>}
                    <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2" style={{ borderColor: 'var(--border)', background: 'var(--app-bg)', color: 'var(--ink)' }}>
                        <option value="">{labels.allCategories}</option>{(categoriesResponse?.data || categoriesResponse || []).map(category => <option key={category._id} value={category.name}>{category.name}</option>)}
                    </select>
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
                        <input value={productName} onChange={e => setProductName(e.target.value)} placeholder={labels.searchByName} className="w-full pl-10 pr-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2" style={{ borderColor: 'var(--border)', background: 'var(--app-bg)', color: 'var(--ink)' }} />
                    </div>
                    <input value={productCode} onChange={e => setProductCode(e.target.value)} placeholder={labels.searchByCode} className="px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2" style={{ borderColor: 'var(--border)', background: 'var(--app-bg)', color: 'var(--ink)' }} />
                    <select value={tag} onChange={e => setTag(e.target.value)} className="px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2" style={{ borderColor: 'var(--border)', background: 'var(--app-bg)', color: 'var(--ink)' }}>
                        <option value="">{labels.allTags}</option>{tagOptions.map(value => <option key={value} value={value}>{value}</option>)}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--accent-2)' }} />
                </div>
            ) : (
                <>
                    <div className="flex flex-wrap gap-3 mb-6">
                        <KpiCard label="Products" value={summary.totalProducts} icon={Package} color="#3b82f6" />
                        <KpiCard label="Current Stock" value={summary.currentStock} icon={Package} color="#0ea5e9" />
                        <KpiCard label="Purchased" value={summary.purchasedQuantity} icon={Receipt} color="#6366f1" />
                        <KpiCard label="Purchase Returns" value={summary.purchaseReturnQuantity} icon={RotateCcw} color="#06b6d4" />
                        <KpiCard label="Orders" value={summary.orderQuantity} icon={TrendingUp} color="#10b981" />
                        <KpiCard label="Wastage" value={summary.wastageQuantity} icon={Trash2} color="#dc2626" />
                        <KpiCard label="Revenue" value={summary.totalRevenue} icon={DollarSign} color="#f59e0b" money />
                    </div>

                    <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
                            <h2 className="text-lg font-semibold" style={{ color: 'var(--ink)' }}>{labels.inventoryReport}</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead style={{ background: 'var(--surface-muted)' }}>
                                    <tr>{columns.map(([heading]) => <th key={heading} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: 'var(--muted)' }}>{heading}</th>)}</tr>
                                </thead>
                                <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                                    {rows.length ? rows.map(product => (
                                        <tr key={product._id} className="transition-colors" style={{ background: 'transparent' }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-muted)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                            {columns.map(([heading, render]) => <td key={heading} className="px-4 py-3 text-sm whitespace-nowrap" style={{ color: 'var(--ink)' }}>{render(product)}</td>)}
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={columns.length} className="px-4 py-8 text-center" style={{ color: 'var(--muted)' }}>{labels.noDataFound}</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-4 py-3 flex items-center justify-between border-t" style={{ borderColor: 'var(--border)', background: 'var(--surface-muted)' }}>
                            <span className="text-xs" style={{ color: 'var(--muted)' }}>{total ? `${(page - 1) * limit + 1}–${Math.min(page * limit, total)} of ${total} products` : "0 products"}</span>
                            <div className="flex gap-2 items-center">
                                <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 text-xs rounded-lg border disabled:opacity-40 transition-colors" style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}>Previous</button>
                                <span className="px-3 py-1.5 text-xs" style={{ color: 'var(--muted)' }}>Page {page} of {totalPages}</span>
                                <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1.5 text-xs rounded-lg border disabled:opacity-40 transition-colors" style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}>Next</button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            <PdfModal isOpen={isPdfModalOpen} onClose={() => setIsPdfModalOpen(false)} fileName={`${labels.inventoryReport}.pdf`} labels={labels}>
                <InventoryReportPdfTemplate reportData={reportData} labels={labels} selectedPeriodLabel={period} />
            </PdfModal>
        </div>
    );
}