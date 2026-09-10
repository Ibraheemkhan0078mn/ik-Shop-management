import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardLabels } from '../labels/dashboardLabels.js';
import { useSettings } from '../../settings/hooks/useSettings.js';
import AlertBar from '../components/AlertBar.jsx';
import SalesRevenueKPIs from '../components/SalesRevenueKPIs.jsx';
import InventoryAlertKPIs from '../components/InventoryAlertKPIs.jsx';
import SalesCharts from '../components/SalesCharts.jsx';
import TopProductsByRevenue from '../components/TopProductsByRevenue.jsx';
import TopProductsByUnits from '../components/TopProductsByUnits.jsx';
import RetailWholesaleComparison from '../components/RetailWholesaleComparison.jsx';
import TimeRangeFilter from '../components/TimeRangeFilter.jsx';
import { useSelector } from 'react-redux';

export default function Dashboard() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const language = settings?.language || "en";
  const labels = getDashboardLabels(language);
  const role = useSelector(state => state.auth?.role);
  const isAdmin = role === 'admin';
  
  const [globalDateFilter, setGlobalDateFilter] = React.useState('30D');

  return (
    <div className="p-6 bg-(--app-bg) min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-(--ink) font-display">{labels.dashboard}</h1>
          <p className="text-sm text-(--muted)">{labels.businessOverview}</p>
        </div>
        <div className="flex gap-2 items-center">
          <TimeRangeFilter value={globalDateFilter} onChange={setGlobalDateFilter} size="default" />
        </div>
      </div>

      {/* Section 1: Alert Bar */}
      <AlertBar />

      {/* Inventory and expiry KPIs remain visible to non-admin users. */}
      <div className="mb-8">
        <InventoryAlertKPIs filter={globalDateFilter} />
      </div>

      {isAdmin && (
        <>
          <div className="mb-8">
            <SalesRevenueKPIs filter={globalDateFilter} />
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-semibold text-(--ink) mb-4">{labels.salesPerformance}</h2>
            <SalesCharts filter={globalDateFilter} />
          </div>

          <div className="mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TopProductsByRevenue filter={globalDateFilter} />
              <TopProductsByUnits filter={globalDateFilter} />
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-semibold text-(--ink) mb-4">{labels.retailVsWholesale}</h2>
            <RetailWholesaleComparison filter={globalDateFilter} />
          </div>
        </>
      )}
    </div>
  );
}
