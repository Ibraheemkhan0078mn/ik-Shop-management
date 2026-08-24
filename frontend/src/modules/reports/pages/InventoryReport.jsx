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
    return <div className="card p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}><Icon size={20} style={{ color }} /></div><div><p className="text-xs text-[var(--muted)] uppercase font-bold">{label}</p><p className="font-semibold text-[var(--ink)]">{money ? "Rs " : ""}{Number(value || 0).toLocaleString()}</p></div></div></div>;
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
        ["Product", product => <div className="flex items-center gap-2 min-w-[180px]"><img src={toImageUrl(product.image) || ""} alt="" className="w-9 h-9 rounded object-cover bg-[var(--surface-muted)]" onError={e => { e.currentTarget.style.display = "none" }} /><span className="font-medium">{product.name || "—"}</span></div>],
        ["Code", product => product.productCode || product.hotKeySku || product.barcode || "—"],
        ["Current Stock", product => product.currentStock], ["Purchased Qty", product => product.totalPurchased], ["Purchase Frequency", product => product.purchaseFrequency], ["Purchase Return Qty", product => product.purchaseReturnQuantity], ["Purchase Return Frequency", product => product.purchaseReturnFrequency], ["Order Qty", product => product.orderQuantity], ["Order Frequency", product => product.orderFrequency], ["Order Return Qty", product => product.orderReturnQuantity], ["Order Return Frequency", product => product.orderReturnFrequency], ["Wastage Qty", product => product.wastageQuantity], ["Wastage Frequency", product => product.wastageFrequency], ["Revenue", product => `Rs ${Number(product.totalRevenue || 0).toLocaleString()}`],
    ];

    return <div className="p-6 min-h-screen bg-[var(--app-bg)]">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3"><div><h1 className="text-2xl font-bold text-[var(--ink)] font-display">{labels.inventoryReport}</h1><p className="text-sm text-[var(--muted)]">{labels.inventoryAnalysis}</p></div><div className="flex gap-2"><button onClick={refresh} className="px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] flex items-center gap-2"><RefreshCw size={16} className={loading ? "animate-spin" : ""} />{labels.refresh}</button><button onClick={() => setIsPdfModalOpen(true)} className="px-4 py-2 rounded-lg text-white flex items-center gap-2" style={{ background: "var(--accent-2)" }}>{labels.exportPdf}</button></div></div>
        <div className="card p-4 mb-6"><div className="flex items-center gap-2 mb-3"><Filter size={16} className="text-[var(--accent-2)]" /><span className="text-sm font-semibold text-[var(--ink)]">{labels.filters}</span></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <select value={period} onChange={e => setPeriod(e.target.value)} className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)]"><option value="today">{labels.today}</option><option value="month">{labels.thisMonth}</option><option value="3month">{labels.last3Months}</option><option value="year">{labels.thisYear}</option><option value="custom">{labels.customRange}</option></select>
            {period === "custom" && <><input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)]" /><input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)]" /></>}
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)]"><option value="">{labels.allCategories}</option>{(categoriesResponse?.data || categoriesResponse || []).map(category => <option key={category._id} value={category.name}>{category.name}</option>)}</select>
            <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" /><input value={productName} onChange={e => setProductName(e.target.value)} placeholder={labels.searchByName} className="w-full pl-10 pr-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)]" /></div>
            <input value={productCode} onChange={e => setProductCode(e.target.value)} placeholder={labels.searchByCode} className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)]" />
            <select value={tag} onChange={e => setTag(e.target.value)} className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)]"><option value="">{labels.allTags}</option>{tagOptions.map(value => <option key={value} value={value}>{value}</option>)}</select>
        </div></div>
        {loading ? <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-2)]" /></div> : <>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6"><KpiCard label="Products" value={summary.totalProducts} icon={Package} /><KpiCard label="Current Stock" value={summary.currentStock} icon={Package} /><KpiCard label="Purchased" value={summary.purchasedQuantity} icon={Receipt} /><KpiCard label="Purchase Returns" value={summary.purchaseReturnQuantity} icon={RotateCcw} /><KpiCard label="Orders" value={summary.orderQuantity} icon={TrendingUp} /><KpiCard label="Wastage" value={summary.wastageQuantity} icon={Trash2} /><KpiCard label="Revenue" value={summary.totalRevenue} icon={DollarSign} money /></div>
            <div className="card overflow-hidden"><div className="p-4 border-b border-[var(--border)]"><h2 className="text-lg font-semibold text-[var(--ink)]">{labels.inventoryReport}</h2></div><div className="overflow-x-auto"><table className="w-full"><thead className="bg-[var(--surface-muted)]"><tr>{columns.map(([heading]) => <th key={heading} className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)] whitespace-nowrap">{heading}</th>)}</tr></thead><tbody className="divide-y divide-[var(--border)]">{rows.length ? rows.map(product => <tr key={product._id} className="hover:bg-[var(--surface-muted)]">{columns.map(([heading, render]) => <td key={heading} className="px-4 py-3 text-sm text-[var(--ink)] whitespace-nowrap">{render(product)}</td>)}</tr>) : <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-[var(--muted)]">{labels.noDataFound}</td></tr>}</tbody></table></div><div className="px-4 py-3 flex items-center justify-between border-t border-[var(--border)] bg-[var(--surface-muted)]"><span className="text-xs text-[var(--muted)]">{total ? `${(page - 1) * limit + 1}–${Math.min(page * limit, total)} of ${total} products` : "0 products"}</span><div className="flex gap-2"><button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 text-xs rounded border border-[var(--border)] disabled:opacity-40">Previous</button><span className="px-3 py-1.5 text-xs">Page {page} of {totalPages}</span><button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1.5 text-xs rounded border border-[var(--border)] disabled:opacity-40">Next</button></div></div></div>
        </>}
        <PdfModal isOpen={isPdfModalOpen} onClose={() => setIsPdfModalOpen(false)} fileName={`${labels.inventoryReport}.pdf`} labels={labels}><InventoryReportPdfTemplate reportData={reportData} labels={labels} selectedPeriodLabel={period} /></PdfModal>
    </div>;
}
