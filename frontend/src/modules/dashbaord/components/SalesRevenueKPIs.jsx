import React from 'react';
import { DollarSign, TrendingUp, ShoppingCart, Package } from 'lucide-react';
import { getDashboardLabels } from '../labels/dashboardLabels.js';
import { useSettings } from '../../settings/hooks/useSettings.js';
import KPICard from './KPICard.jsx';
import TimeRangeFilter from './TimeRangeFilter.jsx';
import { useGetSalesRevenueKPIsQuery } from '../services/dashboard.service.js';

export default function SalesRevenueKPIs() {
  const { settings } = useSettings();
  const language = settings?.language || "en";
  const labels = getDashboardLabels(language);
  
  const [filter, setFilter] = React.useState('30D');
  const { data: kpis, isLoading } = useGetSalesRevenueKPIsQuery(filter);

  return (
    <div className="space-y-4">
      {/* Shared Filter */}
      <div className="flex justify-end">
        <TimeRangeFilter value={filter} onChange={setFilter} />
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard
          label={labels.totalRevenue}
          value={kpis?.totalRevenue}
          subLabel={`${labels.retail} + ${labels.wholesale} combined`}
          secondary={{
            [labels.retail]: kpis?.retailRevenue,
            [labels.wholesale]: kpis?.wholesaleRevenue,
          }}
          icon={DollarSign}
          color="bg-green-500"
          loading={isLoading}
        />

        <KPICard
          label={labels.retailRevenue}
          value={kpis?.retailRevenue}
          subLabel={`(${kpis?.retailOrders} ${labels.orders})`}
          icon={ShoppingCart}
          color="bg-blue-500"
          loading={isLoading}
        />

        <KPICard
          label={labels.wholesaleRevenue}
          value={kpis?.wholesaleRevenue}
          subLabel={`(${kpis?.wholesaleOrders} ${labels.orders})`}
          icon={Package}
          color="bg-purple-500"
          loading={isLoading}
        />

        <KPICard
          label={labels.totalOrders}
          value={kpis?.totalOrders}
          subLabel={`${labels.retail}: ${kpis?.retailOrders} | ${labels.wholesale}: ${kpis?.wholesaleOrders}`}
          icon={ShoppingCart}
          color="bg-cyan-500"
          loading={isLoading}
        />

        <KPICard
          label={labels.averageOrderValue}
          value={kpis?.avgOrderValue}
          secondary={{
            [labels.retailAOV]: kpis?.retailAvgOrderValue,
            [labels.wholesaleAOV]: kpis?.wholesaleAvgOrderValue,
          }}
          icon={TrendingUp}
          color="bg-orange-500"
          loading={isLoading}
        />

        <KPICard
          label={labels.grossProfit}
          value={kpis?.grossProfit}
          subLabel={`${kpis?.grossMargin}% ${labels.margin}`}
          icon={TrendingUp}
          color="bg-emerald-500"
          loading={isLoading}
        />
      </div>
    </div>
  );
}
