import React, { useState } from 'react';
import { AlertTriangle, PackageMinus, PackageX } from 'lucide-react';
import KPICard from './KPICard.jsx';
import PaginatedTableModal from './PaginatedTableModal.jsx';
import { useGetInventoryAlertKPIsQuery } from '../services/dashboard.service.js';
import { useGetExpiryProductsQuery, useGetLowStockProductsQuery, useGetOutOfStockProductsQuery } from '../services/dashboard.service.js';

export default function InventoryAlertKPIs() {
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
    { header: 'Product Name', key: 'productName' },
    { header: 'SKU', key: 'sku' },
    { header: 'Batch Number', key: 'batchNumber' },
    { header: 'Expiry Date', key: 'expiryDate', render: (row) => new Date(row.expiryDate).toLocaleDateString() },
    { header: 'Days Remaining', key: 'daysRemaining' },
    { header: 'Stock Qty', key: 'stockQty' },
  ];

  const lowStockColumns = [
    { header: 'Product Name', key: 'productName' },
    { header: 'SKU', key: 'sku' },
    { header: 'Batch Number', key: 'batchNumber' },
    { header: 'Current Stock', key: 'currentStock' },
    { header: 'Min Stock', key: 'minStock' },
    { header: 'Max Stock', key: 'maxStock' },
    { header: 'Shortage', key: 'shortage' },
  ];

  const outOfStockColumns = [
    { header: 'Product Name', key: 'productName' },
    { header: 'SKU', key: 'sku' },
    { header: 'Batch Number', key: 'batchNumber' },
    { header: 'Last Stock Date', key: 'lastStockDate', render: (row) => new Date(row.lastStockDate).toLocaleDateString() },
    { header: 'Min Stock', key: 'minStock' },
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
      <h2 className="text-lg font-semibold text-[var(--ink)]">Inventory Alerts</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          label="Expiring Soon"
          value={alerts?.expiringSoon}
          subLabel="Batches expiring within 30 days"
          icon={AlertTriangle}
          color="bg-amber-500"
          borderColor={getExpiryBorderColor()}
          loading={isLoading}
          onClick={() => setExpiryModalOpen(true)}
        />

        <KPICard
          label="Low Stock"
          value={alerts?.lowStock}
          subLabel="Batches below minimum stock"
          icon={PackageMinus}
          color="bg-amber-500"
          borderColor="border-amber-500"
          loading={isLoading}
          onClick={() => setLowStockModalOpen(true)}
        />

        <KPICard
          label="Out of Stock"
          value={alerts?.outOfStock}
          subLabel="Batches with zero stock"
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
        title="Expiring Products — Batch Detail"
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
              <option value="7D">Expiring in 7 days</option>
              <option value="30D">Expiring in 30 days</option>
            </select>
          </div>
        }
      />

      {/* Low Stock Modal */}
      <PaginatedTableModal
        isOpen={lowStockModalOpen}
        onClose={() => setLowStockModalOpen(false)}
        title="Low Stock — Batch Detail"
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
        title="Out of Stock — Batch Detail"
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
