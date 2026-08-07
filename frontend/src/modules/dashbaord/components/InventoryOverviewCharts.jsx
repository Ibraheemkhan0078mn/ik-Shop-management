import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getDashboardLabels } from '../labels/dashboardLabels.js';
import { useSettings } from '../../settings/hooks/useSettings.js';
import ChartCard from './ChartCard.jsx';
import { useGetStockLevelByCategoryQuery } from '../services/dashboard.service.js';

export default function InventoryOverviewCharts() {
  const { settings } = useSettings();
  const language = settings?.language || "en";
  const labels = getDashboardLabels(language);
  
  const { data: stockLevelData, isLoading: stockLevelLoading } = useGetStockLevelByCategoryQuery();

  const stockLevelChartData = stockLevelData?.map(d => ({
    name: d.name,
    stockLevel: d.stockLevel,
  })) || [];

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Stock Level by Category */}
      <ChartCard
        title={labels.stockLevelByCategory}
        loading={stockLevelLoading}
        height={300}
        showFilter={false}
        emptyMessage={labels.noDataAvailable}
        isEmpty={stockLevelChartData.length === 0}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stockLevelChartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis type="number" stroke="var(--muted)" />
            <YAxis dataKey="name" type="category" width={100} stroke="var(--muted)" />
            <Tooltip />
            <Legend />
            <Bar dataKey="stockLevel" fill="#10b981" name={labels.stockLevel} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
