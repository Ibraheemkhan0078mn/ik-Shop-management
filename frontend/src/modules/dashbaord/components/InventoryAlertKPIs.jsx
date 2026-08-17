import React, { useState } from 'react';
import { AlertTriangle, PackageMinus, PackageX, Package, Box } from 'lucide-react';
import { getDashboardLabels } from '../labels/dashboardLabels.js';
import { useSettings } from '../../settings/hooks/useSettings.js';
import KPICard from './KPICard.jsx';
import PaginatedTableModal from './PaginatedTableModal.jsx';
import { useGetInventoryAlertKPIsQuery } from '../services/dashboard.service.js';
import { useGetExpiryProductsQuery, useGetLowStockProductsQuery, useGetOutOfStockProductsQuery } from '../services/dashboard.service.js';

export default function InventoryAlertKPIs({ filter = '30D' }) {
  const { settings } = useSettings();
  const language = settings?.language || "en";
  const labels = getDashboardLabels(language);
  
  const { data: alerts, isLoading } = useGetInventoryAlertKPIsQuery(filter);
  
  // Modal states
  const [expiryModalOpen, setExpiryModalOpen] = useState(false);
  const [lowStockModalOpen, setLowStockModalOpen] = useState(false);
  const [outOfStockModalOpen, setOutOfStockModalOpen] = useState(false);
  
  // Pagination states
  const [expiryPage, setExpiryPage] = useState(1);
  const [lowStockPage, setLowStockPage] = useState(1);
  const [outOfStockPage, setOutOfStockPage] = useState(1);
  
  // Queries for modals
  const { data: expiryData, isLoading: expiryLoading } = useGetExpiryProductsQuery({ range: filter, page: expiryPage, limit: 10 });
  const { data: lowStockData, isLoading: lowStockLoading } = useGetLowStockProductsQuery({ page: lowStockPage, limit: 10 });
  const { data: outOfStockData, isLoading: outOfStockLoading } = useGetOutOfStockProductsQuery({ page: outOfStockPage, limit: 10 });

  // Determine border colors
  const getExpiryBorderColor = () => {
    if (alerts?.hasCriticalExpiry) return 'border-red-500';
    return 'border-amber-500';
  };

  const expiryColumns = [
    { header: labels.productName, key: 'productName' },
    { header: labels.sku, key: 'sku' },
    { header: labels.batchNumber, key: 'batchNumber' },
    { header: labels.category, key: 'category' },
    { header: labels.expiryDate, key: 'expiryDate', render: (row) => new Date(row.expiryDate).toLocaleDateString() },
    { header: labels.daysRemaining, key: 'daysRemaining' },
    { header: labels.stockQty, key: 'stockQty' },
    { header: labels.costPrice, key: 'costPrice', render: (row) => `Rs ${row.costPrice.toLocaleString()}` },
    { header: labels.sellingPrice, key: 'sellingPrice', render: (row) => `Rs ${row.sellingPrice.toLocaleString()}` },
    { header: labels.supplier, key: 'supplier' },
    { header: labels.mfgDate, key: 'mfgDate', render: (row) => row.mfgDate !== 'N/A' ? new Date(row.mfgDate).toLocaleDateString() : 'N/A' },
    { header: labels.discount, key: 'discount', render: (row) => `${row.discount}${row.discountType === 'percentage' ? '%' : ''}` },
  ];

  const lowStockColumns = [
    { header: labels.productName, key: 'productName' },
    { header: labels.sku, key: 'sku' },
    { header: labels.batchNumber, key: 'batchNumber' },
    { header: labels.category, key: 'category' },
    { header: labels.currentStock, key: 'currentStock' },
    { header: labels.minStock, key: 'minStock' },
    { header: labels.maxStock, key: 'maxStock' },
    { header: labels.shortage, key: 'shortage' },
    { header: labels.costPrice, key: 'costPrice', render: (row) => `Rs ${row.costPrice.toLocaleString()}` },
    { header: labels.sellingPrice, key: 'sellingPrice', render: (row) => `Rs ${row.sellingPrice.toLocaleString()}` },
    { header: labels.supplier, key: 'supplier' },
    { header: labels.expiryDate, key: 'expiryDate', render: (row) => row.expiryDate !== 'N/A' ? new Date(row.expiryDate).toLocaleDateString() : 'N/A' },
    { header: labels.discount, key: 'discount', render: (row) => `${row.discount}${row.discountType === 'percentage' ? '%' : ''}` },
  ];

  const outOfStockColumns = [
    { header: labels.productName, key: 'productName' },
    { header: labels.sku, key: 'sku' },
    { header: labels.batchNumber, key: 'batchNumber' },
    { header: labels.category, key: 'category' },
    { header: labels.lastStockDate, key: 'lastStockDate', render: (row) => row.lastStockDate !== 'N/A' ? new Date(row.lastStockDate).toLocaleDateString() : 'N/A' },
    { header: labels.minStock, key: 'minStock' },
    { header: labels.costPrice, key: 'costPrice', render: (row) => `Rs ${row.costPrice.toLocaleString()}` },
    { header: labels.sellingPrice, key: 'sellingPrice', render: (row) => `Rs ${row.sellingPrice.toLocaleString()}` },
    { header: labels.supplier, key: 'supplier' },
    { header: labels.expiryDate, key: 'expiryDate', render: (row) => row.expiryDate !== 'N/A' ? new Date(row.expiryDate).toLocaleDateString() : 'N/A' },
    { header: labels.discount, key: 'discount', render: (row) => `${row.discount}${row.discountType === 'percentage' ? '%' : ''}` },
  ];

  const expiryRowColors = (row) => {
    if (row.daysRemaining <= 7) {
      return { borderColor: 'border-l-red-500', backgroundColor: 'bg-red-50/50' };
    }
    return { borderColor: 'border-l-amber-500' };
  };

  const lowStockRowColors = () => ({ borderColor: 'border-l-amber-500' });
  const outOfStockRowColors = () => ({ borderColor: 'border-l-red-500' });

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[var(--ink)]">{labels.inventoryOverview}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KPICard
          label={labels.totalProducts || "Total Products"}
          value={alerts?.totalProducts}
          subLabel={labels.activeProducts || "Active in inventory"}
          icon={Package}
          color="bg-blue-500"
          loading={isLoading}
        />

        <KPICard
          label={labels.totalBatches || "Total Batches"}
          value={alerts?.totalBatches}
          subLabel={labels.allBatches || "All active batches"}
          icon={Box}
          color="bg-purple-500"
          loading={isLoading}
        />

        <KPICard
          label={labels.expiringSoon || "Expiring Soon"}
          value={alerts?.expiringSoon}
          subLabel={labels.batchesExpiring}
          icon={AlertTriangle}
          color="bg-amber-500"
          borderColor={getExpiryBorderColor()}
          loading={isLoading}
          onClick={() => setExpiryModalOpen(true)}
        />

        <KPICard
          label={labels.lowStock}
          value={alerts?.lowStock}
          subLabel={labels.batchesBelowMin}
          icon={PackageMinus}
          color="bg-amber-500"
          borderColor="border-amber-500"
          loading={isLoading}
          onClick={() => setLowStockModalOpen(true)}
        />

        <KPICard
          label={labels.outOfStock}
          value={alerts?.outOfStock}
          subLabel={labels.batchesZeroStock}
          icon={PackageX}
          color="bg-red-500"
          borderColor="border-red-500"
          loading={isLoading}
          onClick={() => setOutOfStockModalOpen(true)}
        />
      </div>

      {/* Expiry Modal */}
      <PaginatedTableModal
        isOpen={expiryModalOpen}
        onClose={() => setExpiryModalOpen(false)}
        title={labels.expiringProducts}
        columns={expiryColumns}
        data={expiryData?.data}
        loading={expiryLoading}
        pagination={expiryData?.pagination}
        onPageChange={setExpiryPage}
        rowColors={expiryRowColors}
        filterSlot={
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--muted)]">{labels.dateRange}:</span>
            <span className="text-xs font-medium text-[var(--ink)]">{filter}</span>
          </div>
        }
      />

      {/* Low Stock Modal */}
      <PaginatedTableModal
        isOpen={lowStockModalOpen}
        onClose={() => setLowStockModalOpen(false)}
        title={labels.lowStockDetail}
        columns={lowStockColumns}
        data={lowStockData?.data}
        loading={lowStockLoading}
        pagination={lowStockData?.pagination}
        onPageChange={setLowStockPage}
        rowColors={lowStockRowColors}
      />

      {/* Out of Stock Modal */}
      <PaginatedTableModal
        isOpen={outOfStockModalOpen}
        onClose={() => setOutOfStockModalOpen(false)}
        title={labels.outOfStockDetail}
        columns={outOfStockColumns}
        data={outOfStockData?.data}
        loading={outOfStockLoading}
        pagination={outOfStockData?.pagination}
        onPageChange={setOutOfStockPage}
        rowColors={outOfStockRowColors}
      />
    </div>
  );
}
