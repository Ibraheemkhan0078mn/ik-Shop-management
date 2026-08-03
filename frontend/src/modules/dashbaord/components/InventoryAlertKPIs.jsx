import React, { useState } from 'react';
import { AlertTriangle, PackageMinus, PackageX } from 'lucide-react';
import { getDashboardLabels } from '../labels/dashboardLabels.js';
import { useSettings } from '../../settings/hooks/useSettings.js';
import KPICard from './KPICard.jsx';
import PaginatedTableModal from './PaginatedTableModal.jsx';
import { useGetInventoryAlertKPIsQuery } from '../services/dashboard.service.js';
import { useGetExpiryProductsQuery, useGetLowStockProductsQuery, useGetOutOfStockProductsQuery } from '../services/dashboard.service.js';

export default function InventoryAlertKPIs() {
  const { settings } = useSettings();
  const language = settings?.language || "en";
  const labels = getDashboardLabels(language);
  
  const { data: alerts, isLoading } = useGetInventoryAlertKPIsQuery();
  
  // Modal states
  const [expiryModalOpen, setExpiryModalOpen] = useState(false);
  const [lowStockModalOpen, setLowStockModalOpen] = useState(false);
  const [outOfStockModalOpen, setOutOfStockModalOpen] = useState(false);
  
  // Pagination states
  const [expiryPage, setExpiryPage] = useState(1);
  const [lowStockPage, setLowStockPage] = useState(1);
  const [outOfStockPage, setOutOfStockPage] = useState(1);
  
  // Filter states
  const [expiryFilter, setExpiryFilter] = useState('30D');

  // Queries for modals
  const { data: expiryData, isLoading: expiryLoading } = useGetExpiryProductsQuery({ range: expiryFilter, page: expiryPage, limit: 10 });
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
    { header: labels.expiryDate, key: 'expiryDate', render: (row) => new Date(row.expiryDate).toLocaleDateString() },
    { header: labels.daysRemaining, key: 'daysRemaining' },
    { header: labels.stockQty, key: 'stockQty' },
  ];

  const lowStockColumns = [
    { header: labels.productName, key: 'productName' },
    { header: labels.sku, key: 'sku' },
    { header: labels.batchNumber, key: 'batchNumber' },
    { header: labels.currentStock, key: 'currentStock' },
    { header: labels.minStock, key: 'minStock' },
    { header: labels.maxStock, key: 'maxStock' },
    { header: labels.shortage, key: 'shortage' },
  ];

  const outOfStockColumns = [
    { header: labels.productName, key: 'productName' },
    { header: labels.sku, key: 'sku' },
    { header: labels.batchNumber, key: 'batchNumber' },
    { header: labels.lastStockDate, key: 'lastStockDate', render: (row) => new Date(row.lastStockDate).toLocaleDateString() },
    { header: labels.minStock, key: 'minStock' },
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
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          label={labels.lowStock}
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
            <select
              value={expiryFilter}
              onChange={(e) => {
                setExpiryFilter(e.target.value);
                setExpiryPage(1);
              }}
              className="px-3 py-1.5 border border-[var(--border)] rounded-lg text-sm bg-[var(--app-bg)]"
            >
              <option value="7D">{labels.expiringIn7Days}</option>
              <option value="30D">{labels.expiringIn30Days}</option>
            </select>
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
