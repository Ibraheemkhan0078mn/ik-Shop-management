import React from 'react';
import { DollarSign, TrendingUp, ShoppingCart, Package } from 'lucide-react';
import { getDashboardLabels } from '../labels/dashboardLabels.js';
import { useSettings } from '../../settings/hooks/useSettings.js';
import KPICard from './KPICard.jsx';
import { useGetSalesRevenueKPIsQuery } from '../services/dashboard.service.js';

export default function SalesRevenueKPIs({ filter = '30D' }) {
  const { settings } = useSettings();
  const language = settings?.language || "en";
  const labels = getDashboardLabels(language);
  
  const { data: kpis, isLoading } = useGetSalesRevenueKPIsQuery(filter);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[var(--ink)]">{labels.revenueOverview || "Revenue Overview"}</h2>
      
      {/* KPI Grid - 4 cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label={labels.totalRevenue || "Total"}
          value={kpis?.totalRevenue}
          subLabel={`${labels.wholesale || "Wholesale"}: Rs ${(kpis?.wholesaleRevenue || 0).toLocaleString()} | ${labels.retail || "Retail"}: Rs ${(kpis?.retailRevenue || 0).toLocaleString()}`}
          icon={DollarSign}
          color="bg-green-500"
          loading={isLoading}
        />

        <KPICard
          label={labels.wholesaleRevenue || "Wholesale"}
          value={kpis?.wholesaleRevenue}
          subLabel={`${kpis?.wholesaleOrders || 0} ${labels.orders || "Orders"} | ${kpis?.wholesaleReviewPercentage || 0}% ${labels.review || "Review"}`}
          icon={Package}
          color="bg-purple-500"
          loading={isLoading}
        />

        <KPICard
          label={labels.retailRevenue || "Retail"}
          value={kpis?.retailRevenue}
          subLabel={`${kpis?.retailOrders || 0} ${labels.orders || "Orders"} | ${kpis?.retailReviewPercentage || 0}% ${labels.review || "Review"}`}
          icon={ShoppingCart}
          color="bg-blue-500"
          loading={isLoading}
        />

        <KPICard
          label={labels.totalProfit || "Total Profit"}
          value={kpis?.totalProfit}
          subLabel={`${labels.retail || "Retail"}: Rs ${(kpis?.retailProfit || 0).toLocaleString()} (${kpis?.retailProfitPercentage || 0}%) | ${labels.wholesale || "Wholesale"}: Rs ${(kpis?.wholesaleProfit || 0).toLocaleString()} (${kpis?.wholesaleProfitPercentage || 0}%)`}
          icon={TrendingUp}
          color="bg-emerald-500"
          loading={isLoading}
          isProfit={true}
        />
      </div>
    </div>
  );
}
